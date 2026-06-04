import MenuItem from '../models/MenuItem.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listMenu = asyncHandler(async (req, res) => {
  const { category, q } = req.query;
  const filter = {};
  if (category && category !== 'Tất cả') filter.category = category;
  if (q) filter.name = { $regex: q, $options: 'i' };
  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
  res.json({ success: true, data: items });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const { name, category, price, description, imageUrl, isAvailable } = req.body;
  const item = await MenuItem.create({ name, category, price, description, imageUrl, isAvailable });
  res.status(201).json({ success: true, data: item });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy món' });
  res.json({ success: true, data: item });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy món' });
  res.json({ success: true, data: { id: req.params.id } });
});
