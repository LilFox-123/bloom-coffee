import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import Customer from '../models/Customer.js';
import asyncHandler from '../utils/asyncHandler.js';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseVietnamDate(value, endOfDay = false) {
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  const start = new Date(Date.UTC(year, month - 1, day) - VN_OFFSET_MS);
  return endOfDay ? new Date(start.getTime() + DAY_MS - 1) : start;
}

function genCode() {
  const d = new Date(Date.now() + VN_OFFSET_MS);
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
    d.getUTCDate()
  ).padStart(2, '0')}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `HD${ymd}-${rnd}`;
}

export const createInvoice = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod = 'tienmat', customerId = null } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
  if (!order.items.length) {
    return res.status(400).json({ success: false, message: 'Đơn hàng trống, không thể tạo hóa đơn' });
  }

  const table = await Table.findById(order.tableId);
  const staffName = req.user.name;

  const items = order.items.map((i) => ({
    menuItemId: i.menuItemId,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    customizations: i.customizations || {},
  }));
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const vat = Math.round(subtotal * 0.1);
  const total = subtotal + vat;
  const resolvedCustomerId = customerId || order.customerId || null;

  const invoice = await Invoice.create({
    code: genCode(),
    orderId: order._id,
    tableId: order.tableId,
    tableName: table?.name || '',
    staffId: req.user._id,
    staffName,
    customerId: resolvedCustomerId,
    items,
    subtotal,
    vat,
    total,
    paymentMethod,
    source: order.source || 'staff',
  });

  // hoàn tất đơn + giải phóng bàn
  order.paymentStatus = 'paid';
  order.status = 'hoantat';
  await order.save();
  if (table) {
    table.status = 'trong';
    table.guests = 0;
    table.occupiedAt = null;
    table.currentOrderId = null;
    await table.save();
  }

  // cộng điểm khách hàng (1 điểm / 10.000đ)
  if (resolvedCustomerId) {
    const earned = Math.floor(total / 10000);
    await Customer.findByIdAndUpdate(resolvedCustomerId, {
      $inc: { points: earned, totalSpent: total },
    });
  }

  res.status(201).json({ success: true, data: invoice });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const { from, to, q } = req.query;
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = parseVietnamDate(from);
    if (to) filter.createdAt.$lte = parseVietnamDate(to, true);
  }
  if (q) {
    filter.$or = [
      { code: { $regex: q, $options: 'i' } },
      { tableName: { $regex: q, $options: 'i' } },
    ];
  }
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json({ success: true, data: invoices });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
  res.json({ success: true, data: invoice });
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
  res.json({ success: true, data: { id: req.params.id } });
});
