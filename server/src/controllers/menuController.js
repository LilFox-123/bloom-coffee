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

const toBool = (v) => v === true || v === 'true' || v === 'on' || v === '1';

export const createMenuItem = asyncHandler(async (req, res) => {
  const { name, category, price, description, imageUrl, isAvailable } = req.body;
  // Uploaded file takes priority over a pasted URL.
  const finalImage = req.file ? req.file.path : imageUrl || '';
  const item = await MenuItem.create({
    name,
    category,
    price: Number(price),
    description: description || '',
    imageUrl: finalImage,
    isAvailable: isAvailable === undefined ? true : toBool(isAvailable),
  });
  res.status(201).json({ success: true, data: item });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const { name, category, price, description, imageUrl, isAvailable } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (category !== undefined) update.category = category;
  if (price !== undefined) update.price = Number(price);
  if (description !== undefined) update.description = description;
  if (imageUrl !== undefined) update.imageUrl = imageUrl;
  if (isAvailable !== undefined) update.isAvailable = toBool(isAvailable);
  // A freshly uploaded file overrides any imageUrl value.
  if (req.file) update.imageUrl = req.file.path;

  const item = await MenuItem.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy món' });
  res.json({ success: true, data: item });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy món' });
  res.json({ success: true, data: { id: req.params.id } });
});
