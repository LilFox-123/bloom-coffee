import InventoryItem from '../models/InventoryItem.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listInventory = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find().sort({ name: 1 });
  res.json({ success: true, data: items });
});

export const createInventory = asyncHandler(async (req, res) => {
  const { name, unit, quantity, minThreshold } = req.body;
  const item = await InventoryItem.create({ name, unit, quantity, minThreshold });
  res.status(201).json({ success: true, data: item });
});

export const updateInventory = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy nguyên liệu' });
  res.json({ success: true, data: item });
});

export const deleteInventory = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy nguyên liệu' });
  res.json({ success: true, data: { id: req.params.id } });
});

export const listTransactions = asyncHandler(async (req, res) => {
  const txns = await InventoryTransaction.find().sort({ date: -1 }).limit(100);
  res.json({ success: true, data: txns });
});

export const createTransaction = asyncHandler(async (req, res) => {
  const { type, itemId, quantity, note } = req.body;
  const item = await InventoryItem.findById(itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy nguyên liệu' });

  const qty = Number(quantity);
  if (type === 'xuat' && qty > item.quantity) {
    return res.status(400).json({ success: false, message: 'Số lượng xuất vượt quá tồn kho' });
  }
  item.quantity += type === 'nhap' ? qty : -qty;
  await item.save();

  const txn = await InventoryTransaction.create({
    type,
    itemId: item._id,
    itemName: item.name,
    quantity: qty,
    staffId: req.user._id,
    staffName: req.user.name,
    note: note || '',
    date: new Date(),
  });

  res.status(201).json({ success: true, data: { transaction: txn, item } });
});
