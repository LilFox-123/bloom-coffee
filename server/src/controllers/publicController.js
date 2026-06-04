import mongoose from 'mongoose';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import asyncHandler from '../utils/asyncHandler.js';

const CATEGORY_ORDER = ['Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];

function normalizePhone(phone) {
  return String(phone || '').replace(/\s+/g, '').trim();
}

function memberTier(points = 0) {
  if (points >= 1000) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Member';
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
  const { tableId, items, customerId, customerName, notes, note } = req.body;

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

  // merge incoming items into the order
  for (const incoming of orderItems) {
    const existing = order.items.find((i) => String(i.menuItemId) === String(incoming.menuItemId));
    if (existing) {
      existing.quantity += incoming.quantity;
    } else {
      order.items.push(incoming);
    }
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
      estimatedWait: 15,
    },
  });
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
  res.json({
    success: true,
    data: {
      orderId: order._id,
      tableName: table?.name || '',
      status: order.status,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        status: i.status,
      })),
      createdAt: order.createdAt,
    },
  });
});
