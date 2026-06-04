import Order from '../models/Order.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import asyncHandler from '../utils/asyncHandler.js';

const ORDER_STATUSES = ['moi', 'daxacnhan', 'dathanhtoan', 'dangphache', 'chuanbiphucvu', 'daphucvu'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed'];

function syncItemStatus(order, status) {
  if (status === 'dangphache') {
    order.items.forEach((item) => {
      if (item.status !== 'daphucvu') item.status = 'dangphache';
    });
  }
  if (status === 'chuanbiphucvu') {
    order.items.forEach((item) => {
      if (item.status !== 'daphucvu') item.status = 'chuanbiphucvu';
    });
  }
  if (status === 'daphucvu') {
    order.items.forEach((item) => {
      item.status = 'daphucvu';
    });
  }
}

// Lấy đơn hiện tại của 1 bàn (chưa hoàn tất) hoặc tạo mới
export const getOrCreateOrderByTable = asyncHandler(async (req, res) => {
  const { tableId } = req.params;
  const table = await Table.findById(tableId);
  if (!table) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });

  let order = await Order.findOne({ tableId, status: { $ne: 'hoantat' } }).sort({ createdAt: -1 });
  if (!order) {
    order = await Order.create({ tableId, staffId: req.user._id, status: 'moi', items: [] });
    table.currentOrderId = order._id;
    if (table.status === 'trong') {
      table.status = 'dangdung';
      table.occupiedAt = new Date();
      if (!table.guests) table.guests = 1;
    }
    await table.save();
  }
  res.json({ success: true, data: order });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
  res.json({ success: true, data: order });
});

// Thêm món vào đơn
export const addItem = asyncHandler(async (req, res) => {
  const { menuItemId, quantity = 1 } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem || !menuItem.isAvailable) {
    return res.status(400).json({ success: false, message: 'Món không khả dụng' });
  }

  const existing = order.items.find((i) => String(i.menuItemId) === String(menuItemId));
  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    order.items.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: Number(quantity),
      status: 'dangphache',
    });
  }
  await order.save();
  res.json({ success: true, data: order });
});

// Cập nhật số lượng / trạng thái 1 dòng món
export const updateItem = asyncHandler(async (req, res) => {
  const { quantity, status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
  const item = order.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy món trong đơn' });
  if (quantity !== undefined) {
    if (quantity <= 0) {
      item.deleteOne();
    } else {
      item.quantity = quantity;
    }
  }
  if (status !== undefined) item.status = status;
  await order.save();
  res.json({ success: true, data: order });
});

export const removeItem = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
  const item = order.items.id(req.params.itemId);
  if (item) item.deleteOne();
  await order.save();
  res.json({ success: true, data: order });
});

export const saveOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: 'daxacnhan' },
    { new: true }
  );
  if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
  res.json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

  if (status !== undefined) {
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái đơn không hợp lệ' });
    }
    order.status = status;
    syncItemStatus(order, status);
  }

  if (paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Trạng thái thanh toán không hợp lệ' });
    }
    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid' && (!status || order.status === 'moi' || order.status === 'daxacnhan')) {
      order.status = 'dathanhtoan';
    }
  }

  await order.save();
  res.json({ success: true, data: order });
});
