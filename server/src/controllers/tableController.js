import Table from '../models/Table.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listTables = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ createdAt: 1 });
  const activeOrders = await Order.find({
    tableId: { $in: tables.map((table) => table._id) },
    status: { $ne: 'hoantat' },
    'tableChangeRequest.status': 'pending',
  }).select('tableId tableChangeRequest');
  const requestByTableId = new Map(activeOrders.map((order) => [String(order.tableId), order]));
  const data = tables.map((table) => {
    const order = requestByTableId.get(String(table._id));
    const payload = table.toObject();
    if (order) {
      payload.tableChangeRequest = {
        orderId: order._id,
        status: order.tableChangeRequest.status,
        note: order.tableChangeRequest.note,
        requestedAt: order.tableChangeRequest.requestedAt,
      };
    }
    return payload;
  });
  res.json({ success: true, data });
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

export const transferTableOrder = asyncHandler(async (req, res) => {
  const { targetTableId } = req.body;
  const sourceTableId = req.params.id;

  if (!targetTableId) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn bàn cần chuyển đến' });
  }

  if (String(sourceTableId) === String(targetTableId)) {
    return res.status(400).json({ success: false, message: 'Bàn chuyển đến phải khác bàn hiện tại' });
  }

  const [sourceTable, targetTable] = await Promise.all([
    Table.findById(sourceTableId),
    Table.findById(targetTableId),
  ]);

  if (!sourceTable) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn hiện tại' });
  if (!targetTable) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn chuyển đến' });

  if (targetTable.status !== 'trong') {
    return res.status(400).json({ success: false, message: 'Chỉ có thể chuyển sang bàn đang trống' });
  }

  const activeTargetOrder = await Order.findOne({ tableId: targetTable._id, status: { $ne: 'hoantat' } });
  if (activeTargetOrder) {
    return res.status(400).json({ success: false, message: 'Bàn chuyển đến vẫn còn order đang xử lý' });
  }

  let order = null;
  if (sourceTable.currentOrderId) {
    order = await Order.findOne({ _id: sourceTable.currentOrderId, status: { $ne: 'hoantat' } });
  }
  if (!order) {
    order = await Order.findOne({ tableId: sourceTable._id, status: { $ne: 'hoantat' } }).sort({ createdAt: -1 });
  }

  if (!order) {
    return res.status(400).json({ success: false, message: 'Bàn này chưa có order đang xử lý' });
  }

  order.tableId = targetTable._id;
  if (order.tableChangeRequest?.status === 'pending') {
    order.tableChangeRequest.status = 'accepted';
    order.tableChangeRequest.handledAt = new Date();
    order.tableChangeRequest.handledBy = req.user._id;
  }
  targetTable.status = 'dangdung';
  targetTable.currentOrderId = order._id;
  targetTable.guests = sourceTable.guests || targetTable.guests || 1;
  targetTable.occupiedAt = sourceTable.occupiedAt || new Date();

  sourceTable.status = 'trong';
  sourceTable.currentOrderId = null;
  sourceTable.guests = 0;
  sourceTable.occupiedAt = null;

  await Promise.all([order.save(), sourceTable.save(), targetTable.save()]);

  res.json({
    success: true,
    data: {
      order,
      fromTable: sourceTable,
      toTable: targetTable,
    },
  });
});

export const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndDelete(req.params.id);
  if (!table) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
  res.json({ success: true, data: { id: req.params.id } });
});
