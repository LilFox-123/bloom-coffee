import mongoose from 'mongoose';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import asyncHandler from '../utils/asyncHandler.js';

const CATEGORY_ORDER = ['Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];

const ORDER_STATUS_LABELS = {
  moi: 'Chờ xác nhận',
  daxacnhan: 'Đã xác nhận đơn',
  dathanhtoan: 'Đã thanh toán',
  danglam: 'Đang chuẩn bị',
  dangphache: 'Đang pha chế',
  chuanbiphucvu: 'Chuẩn bị phục vụ',
  daphucvu: 'Đã phục vụ',
  hoantat: 'Hoàn tất',
};

const PAYMENT_STATUS_LABELS = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
};

const PAYMENT_METHODS = ['tienmat', 'chuyenkhoan', 'momo', 'vnpay'];
const MEMBER_DRINK_DISCOUNT = 3000;
const MEMBER_DISCOUNT_CATEGORIES = ['Cà phê', 'Trà', 'Nước ép'];
const PROMO_CODES = {
  BLOOM10: { type: 'percent', value: 0.1, max: 30000 },
  COMBO15: { type: 'fixed', value: 15000 },
  CROISSANT: { type: 'percent', value: 0.05, max: 20000 },
};
const POINT_REDEMPTIONS = {
  50: 5000,
  100: 12000,
  200: 30000,
  300: 45000,
};

function normalizePhone(phone) {
  return String(phone || '').replace(/\s+/g, '').trim();
}

function memberTier(points = 0) {
  if (points >= 1000) return 'Diamond';
  if (points >= 500) return 'Gold';
  if (points >= 200) return 'Silver';
  return 'Member';
}

function memberTierRate(tier) {
  if (tier === 'Diamond') return 0.15;
  if (tier === 'Gold') return 0.1;
  if (tier === 'Silver') return 0.05;
  return 0;
}

function clampDiscount(value, max) {
  return Math.min(Math.max(Math.round(Number(value) || 0), 0), Math.max(Math.round(Number(max) || 0), 0));
}

function promoDiscount(code, total) {
  const promo = PROMO_CODES[String(code || '').trim().toUpperCase()];
  if (!promo) return 0;
  if (promo.type === 'fixed') return clampDiscount(promo.value, total);
  return clampDiscount(total * promo.value, Math.min(promo.max || total, total));
}

function isMemberDrink(menuItem) {
  return MEMBER_DISCOUNT_CATEGORIES.includes(menuItem?.category);
}

function memberPayload(customer) {
  return {
    _id: customer._id,
    name: customer.name,
    phone: customer.phone,
    points: customer.points,
    totalSpent: customer.totalSpent,
    tier: memberTier(customer.points),
    joinedAt: customer.joinedAt,
  };
}

function publicOrderPayload(order, table) {
  return {
    orderId: order._id,
    tableName: table?.name || '',
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status] || 'Đang xử lý',
    paymentStatus: order.paymentStatus,
    paymentStatusLabel: PAYMENT_STATUS_LABELS[order.paymentStatus] || 'Chờ thanh toán',
    paymentMethod: order.paymentMethod || 'tienmat',
    cashAmountDue: order.cashAmountDue || 0,
    cashTenderedAmount: order.cashTenderedAmount || 0,
    cashChangeAmount: order.cashChangeAmount || 0,
    subtotalAmount: order.subtotalAmount || 0,
    discountAmount: order.discountAmount || 0,
    promoDiscountAmount: order.promoDiscountAmount || 0,
    memberDrinkDiscountAmount: order.memberDrinkDiscountAmount || 0,
    memberTierDiscountAmount: order.memberTierDiscountAmount || 0,
    pointDiscountAmount: order.pointDiscountAmount || 0,
    pointsRedeemed: order.pointsRedeemed || 0,
    memberTier: order.memberTier || '',
    totalAmount: order.totalAmount || 0,
    tableChangeRequest: {
      status: order.tableChangeRequest?.status || 'none',
      note: order.tableChangeRequest?.note || '',
      requestedAt: order.tableChangeRequest?.requestedAt || null,
      handledAt: order.tableChangeRequest?.handledAt || null,
    },
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      customizations: i.customizations || {},
      status: i.status,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function orderTotalAmount(order) {
  const storedTotal = Number(order.totalAmount);
  if (Number.isFinite(storedTotal) && storedTotal > 0) return storedTotal;
  return order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function cleanCustomizations(customizations = {}) {
  const allowed = ['ice', 'sugar', 'sweetness', 'note'];
  return allowed.reduce((clean, key) => {
    const value = String(customizations[key] || '').trim();
    if (value) clean[key] = value.slice(0, 120);
    return clean;
  }, {});
}

function customizationSignature(customizations = {}) {
  return ['ice', 'sugar', 'sweetness', 'note']
    .map((key) => `${key}:${customizations[key] || ''}`)
    .join('|');
}

async function calculateOrderPricing(orderItems, customerId, promoCode, pointsRedeemed) {
  const subtotalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let customer = null;
  if (mongoose.isValidObjectId(customerId)) {
    customer = await Customer.findById(customerId);
  }

  const menuIds = orderItems.map((item) => item.menuItemId).filter(Boolean);
  const menuDocs = await MenuItem.find({ _id: { $in: menuIds } }).select('category');
  const menuMap = new Map(menuDocs.map((item) => [String(item._id), item]));

  const promoDiscountAmount = promoDiscount(promoCode, subtotalAmount);
  let remaining = subtotalAmount - promoDiscountAmount;

  const memberDrinkDiscountAmount = customer
    ? clampDiscount(
        orderItems.reduce((sum, item) => {
          const menuItem = menuMap.get(String(item.menuItemId));
          return sum + (isMemberDrink(menuItem) ? item.quantity * MEMBER_DRINK_DISCOUNT : 0);
        }, 0),
        remaining
      )
    : 0;
  remaining -= memberDrinkDiscountAmount;

  const tier = customer ? memberTier(customer.points || 0) : '';
  const tierRate = subtotalAmount >= 50000 ? memberTierRate(tier) : 0;
  const memberTierDiscountAmount = customer ? clampDiscount(remaining * tierRate, remaining) : 0;
  remaining -= memberTierDiscountAmount;

  const normalizedPointsRedeemed = Number(pointsRedeemed) || 0;
  if (normalizedPointsRedeemed && !POINT_REDEMPTIONS[normalizedPointsRedeemed]) {
    throw Object.assign(new Error('Mốc đổi điểm không hợp lệ'), { statusCode: 400 });
  }
  if (customer && normalizedPointsRedeemed > (customer.points || 0)) {
    throw Object.assign(new Error('Điểm thành viên không đủ để đổi ưu đãi'), { statusCode: 400 });
  }

  const pointsToRedeem = customer ? normalizedPointsRedeemed : 0;
  const pointDiscountAmount = clampDiscount(POINT_REDEMPTIONS[pointsToRedeem] || 0, remaining);
  remaining -= pointDiscountAmount;

  const discountAmount =
    promoDiscountAmount + memberDrinkDiscountAmount + memberTierDiscountAmount + pointDiscountAmount;

  return {
    subtotalAmount,
    discountAmount,
    promoDiscountAmount,
    memberDrinkDiscountAmount,
    memberTierDiscountAmount,
    pointDiscountAmount,
    pointsRedeemed: pointsToRedeem,
    memberTier: tier,
    totalAmount: Math.max(remaining, 0),
  };
}

// GET /api/public/table/:tableId
export const getPublicTable = asyncHandler(async (req, res) => {
  const { tableId } = req.params;
  if (!mongoose.isValidObjectId(tableId)) {
    return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
  }
  const table = await Table.findById(tableId);
  if (!table) {
    return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
  }
  res.json({
    success: true,
    data: {
      tableId: table._id,
      tableName: table.name,
      zone: table.zone,
      capacity: table.capacity,
      status: table.status,
    },
  });
});

// GET /api/public/table/:tableId/orders
export const getPublicTableOrders = asyncHandler(async (req, res) => {
  const { tableId } = req.params;
  if (!mongoose.isValidObjectId(tableId)) {
    return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
  }

  const table = await Table.findById(tableId);
  if (!table) {
    return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
  }

  const orders = await Order.find({
    tableId,
    status: { $ne: 'hoantat' },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      tableName: table.name,
      orders: orders.map((order) => publicOrderPayload(order, table)),
    },
  });
});

// GET /api/public/menu
export const getPublicMenu = asyncHandler(async (req, res) => {
  const items = await MenuItem.find({ isAvailable: true }).sort({ category: 1, name: 1 });
  const grouped = new Map();
  for (const it of items) {
    if (!grouped.has(it.category)) grouped.set(it.category, []);
    grouped.get(it.category).push({
      _id: it._id,
      name: it.name,
      price: it.price,
      description: it.description,
      imageUrl: it.imageUrl,
      category: it.category,
    });
  }
  // ordered categories first, then any extra
  const names = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];
  const categories = names.map((name) => ({ name, items: grouped.get(name) }));
  res.json({ success: true, data: { categories } });
});

// POST /api/public/member
export const upsertPublicMember = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const name = String(req.body.name || '').trim();

  if (!phone || phone.length < 8) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại hợp lệ' });
  }

  let customer = await Customer.findOne({ phone });
  const isNew = !customer;

  if (!customer) {
    customer = await Customer.create({
      name: name || `Khách ${phone.slice(-4)}`,
      phone,
      joinedAt: new Date(),
    });
  } else if (name && (!customer.name || customer.name.startsWith('Khách '))) {
    customer.name = name;
    await customer.save();
  }

  res.status(isNew ? 201 : 200).json({
    success: true,
    data: {
      customer: memberPayload(customer),
      isNew,
    },
  });
});

// POST /api/public/order
export const createPublicOrder = asyncHandler(async (req, res) => {
  const {
    tableId,
    items,
    customerId,
    customerName,
    notes,
    note,
    paymentMethod = 'tienmat',
    cashAmountDue = 0,
    cashTenderedAmount = 0,
    cashChangeAmount = 0,
    promoCode = '',
    pointsRedeemed = 0,
  } = req.body;

  if (!mongoose.isValidObjectId(tableId)) {
    return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
  }
  const table = await Table.findById(tableId);
  if (!table) {
    return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Giỏ hàng đang trống' });
  }

  // resolve & snapshot menu items
  const ids = items.map((i) => i.menuItemId).filter((id) => mongoose.isValidObjectId(id));
  const menuDocs = await MenuItem.find({ _id: { $in: ids } });
  const menuMap = new Map(menuDocs.map((m) => [String(m._id), m]));

  const orderItems = [];
  for (const line of items) {
    const m = menuMap.get(String(line.menuItemId));
    const qty = Number(line.quantity);
    if (!m) {
      return res.status(400).json({ success: false, message: 'Món không hợp lệ trong đơn hàng' });
    }
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' });
    }
    orderItems.push({
      menuItemId: m._id,
      name: m.name,
      price: m.price,
      quantity: qty,
      customizations: cleanCustomizations(line.customizations),
      status: 'dangphache',
    });
  }

  // The Order schema currently requires staffId. To avoid modifying the existing
  // model, kiosk orders are attributed to a fallback staff/admin account.
  const fallbackStaff = (await User.findOne({ role: 'admin' })) || (await User.findOne());
  if (!fallbackStaff) {
    return res.status(500).json({ success: false, message: 'Hệ thống chưa sẵn sàng nhận đơn' });
  }

  // Reuse the table's active order if one exists (staff system keeps one active
  // order per table); otherwise create a new one.
  let order = await Order.findOne({ tableId, status: { $ne: 'hoantat' } }).sort({ createdAt: -1 });
  if (!order) {
    order = new Order({
      tableId,
      staffId: fallbackStaff._id,
      status: 'moi',
      source: 'customer_kiosk', // persisted only if the schema supports it
      customerId: mongoose.isValidObjectId(customerId) ? customerId : null,
      customerName: customerName ? String(customerName).trim() : '',
      note: notes || note ? String(notes || note).trim() : '',
      items: [],
    });
  }

  if (mongoose.isValidObjectId(customerId)) order.customerId = customerId;
  if (customerName) order.customerName = String(customerName).trim();
  if (notes || note) order.note = String(notes || note).trim();
  order.paymentMethod = paymentMethod;

  // merge incoming items into the order
  for (const incoming of orderItems) {
    const incomingSignature = customizationSignature(incoming.customizations);
    const existing = order.items.find(
      (i) =>
        String(i.menuItemId) === String(incoming.menuItemId) &&
        customizationSignature(i.customizations) === incomingSignature
    );
    if (existing) {
      existing.quantity += incoming.quantity;
    } else {
      order.items.push(incoming);
    }
  }

  let pricing;
  try {
    pricing = await calculateOrderPricing(order.items, order.customerId, promoCode, pointsRedeemed);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }

  Object.assign(order, pricing);
  if (paymentMethod === 'tienmat') {
    const tendered = Number(cashTenderedAmount) || Number(cashAmountDue) || 0;
    if (tendered < pricing.totalAmount) {
      return res.status(400).json({ success: false, message: 'Số tiền khách chuẩn bị chưa đủ để thanh toán' });
    }
    order.cashAmountDue = pricing.totalAmount;
    order.cashTenderedAmount = tendered;
    order.cashChangeAmount = Math.max(tendered - pricing.totalAmount, 0);
  } else {
    order.cashAmountDue = 0;
    order.cashTenderedAmount = 0;
    order.cashChangeAmount = 0;
  }
  await order.save();

  // mark table as occupied
  table.status = 'dangdung';
  table.currentOrderId = order._id;
  if (!table.occupiedAt) table.occupiedAt = new Date();
  if (!table.guests) table.guests = 1;
  await table.save();

  res.status(201).json({
    success: true,
    data: {
      orderId: order._id,
      tableName: table.name,
      totalAmount: order.totalAmount,
      estimatedWait: 15,
    },
  });
});

// POST /api/public/order/:orderId/payment-method
export const updatePublicOrderPaymentMethod = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod, cashTenderedAmount = 0 } = req.body;

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Hình thức thanh toán không hợp lệ' });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }
  if (order.status === 'hoantat' || order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'Đơn hàng này không thể đổi thanh toán' });
  }

  const totalAmount = orderTotalAmount(order);
  if (!Number.isFinite(Number(order.totalAmount)) || Number(order.totalAmount) <= 0) {
    order.totalAmount = totalAmount;
  }
  order.paymentMethod = paymentMethod;
  order.paymentStatus = 'pending';
  if (paymentMethod === 'tienmat') {
    const tendered = Number(cashTenderedAmount) || totalAmount;
    if (tendered < totalAmount) {
      return res.status(400).json({ success: false, message: 'Số tiền khách chuẩn bị chưa đủ để thanh toán' });
    }
    order.cashAmountDue = totalAmount;
    order.cashTenderedAmount = tendered;
    order.cashChangeAmount = Math.max(tendered - totalAmount, 0);
  } else {
    order.cashAmountDue = 0;
    order.cashTenderedAmount = 0;
    order.cashChangeAmount = 0;
  }

  await order.save();
  const table = await Table.findById(order.tableId);
  res.json({ success: true, data: publicOrderPayload(order, table) });
});

// POST /api/public/online-order
// Single public link flow (no table required). Optional "số bàn" 1–20 maps to
// an existing "Bàn N" table when present.
export const createOnlineOrder = asyncHandler(async (req, res) => {
  const { customerName, tableNumber, note, items } = req.body;

  if (!customerName || !String(customerName).trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên của bạn' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Giỏ hàng đang trống' });
  }

  // snapshot menu items
  const ids = items.map((i) => i.menuItemId).filter((id) => mongoose.isValidObjectId(id));
  const menuDocs = await MenuItem.find({ _id: { $in: ids } });
  const menuMap = new Map(menuDocs.map((m) => [String(m._id), m]));

  const orderItems = [];
  for (const line of items) {
    const m = menuMap.get(String(line.menuItemId));
    const qty = Number(line.quantity);
    if (!m) return res.status(400).json({ success: false, message: 'Món không hợp lệ trong đơn hàng' });
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' });
    }
    orderItems.push({ menuItemId: m._id, name: m.name, price: m.price, quantity: qty, status: 'dangphache' });
  }

  // optional table mapping
  let table = null;
  if (tableNumber) {
    table = await Table.findOne({ name: `Bàn ${tableNumber}` });
  }

  const fallbackStaff = (await User.findOne({ role: 'admin' })) || (await User.findOne());
  if (!fallbackStaff) {
    return res.status(500).json({ success: false, message: 'Hệ thống chưa sẵn sàng nhận đơn' });
  }

  const order = await Order.create({
    tableId: table?._id || null,
    staffId: fallbackStaff._id,
    source: 'customer_online',
    status: 'moi',
    customerName: String(customerName).trim(),
    note: note ? String(note).trim() : '',
    items: orderItems,
  });

  // mark mapped table as occupied (if any)
  if (table && table.status === 'trong') {
    table.status = 'dangdung';
    table.currentOrderId = order._id;
    table.occupiedAt = new Date();
    table.guests = table.guests || 1;
    await table.save();
  }

  res.status(201).json({
    success: true,
    data: {
      orderId: order._id,
      tableName: table?.name || '',
      estimatedWait: 15,
    },
  });
});

// GET /api/public/order/:orderId/status
export const getPublicOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }
  const table = await Table.findById(order.tableId);
  res.json({ success: true, data: publicOrderPayload(order, table) });
});

// POST /api/public/order/:orderId/table-change-request
export const requestTableChange = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { note } = req.body;

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }

  order.tableChangeRequest = {
    status: 'pending',
    note: note ? String(note).trim().slice(0, 200) : 'Khách muốn đổi chỗ ngồi',
    requestedAt: order.tableChangeRequest?.requestedAt || new Date(),
    handledAt: null,
    handledBy: null,
  };

  await order.save();
  const table = await Table.findById(order.tableId);
  res.json({ success: true, data: publicOrderPayload(order, table) });
});
