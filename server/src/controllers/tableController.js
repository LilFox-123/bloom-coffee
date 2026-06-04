import Table from '../models/Table.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listTables = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ createdAt: 1 });
  res.json({ success: true, data: tables });
});

export const createTable = asyncHandler(async (req, res) => {
  const { name, capacity, zone } = req.body;
  const table = await Table.create({ name, capacity, zone });
  res.status(201).json({ success: true, data: table });
});

export const updateTable = asyncHandler(async (req, res) => {
  const { name, capacity, zone, status, guests } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (capacity !== undefined) update.capacity = capacity;
  if (zone !== undefined) update.zone = zone;
  if (guests !== undefined) update.guests = guests;
  if (status !== undefined) {
    update.status = status;
    if (status === 'dangdung') update.occupiedAt = new Date();
    if (status === 'trong') {
      update.occupiedAt = null;
      update.guests = 0;
      update.currentOrderId = null;
    }
  }
  const table = await Table.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!table) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
  res.json({ success: true, data: table });
});

// Nhận khách: chuyển bàn sang trạng thái đang dùng
export const seatTable = asyncHandler(async (req, res) => {
  const { guests } = req.body;
  const table = await Table.findByIdAndUpdate(
    req.params.id,
    { status: 'dangdung', guests: guests || 1, occupiedAt: new Date() },
    { new: true }
  );
  if (!table) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
  res.json({ success: true, data: table });
});

export const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndDelete(req.params.id);
  if (!table) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
  res.json({ success: true, data: { id: req.params.id } });
});
