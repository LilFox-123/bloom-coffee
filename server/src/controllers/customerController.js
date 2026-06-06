import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listCustomers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  const customers = await Customer.find(filter).sort({ points: -1 });
  res.json({ success: true, data: customers });
});

export const getCustomerHistory = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ customerId: req.params.id })
    .sort({ createdAt: -1 })
    .limit(3);
  res.json({ success: true, data: invoices });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email } = req.body;
  const customer = await Customer.create({ name, phone, email, joinedAt: new Date() });
  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
  res.json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
  res.json({ success: true, data: { id: req.params.id } });
});

// Giả lập gửi khuyến mãi
export const sendPromo = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
  return res.json({ success: true, message: 'Đã gửi thông báo' });
});
