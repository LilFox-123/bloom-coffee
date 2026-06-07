import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SHIFT_KEYS = ['morning', 'afternoon', 'evening'];

function normalizeWeeklySchedule(schedule = {}) {
  return WEEK_DAYS.reduce((acc, day) => {
    const shifts = Array.isArray(schedule?.[day]) ? schedule[day] : [];
    acc[day] = [...new Set(shifts.filter((shift) => SHIFT_KEYS.includes(shift)))];
    return acc;
  }, {});
}

export const listStaff = asyncHandler(async (req, res) => {
  const staff = await User.find().sort({ createdAt: 1 });
  res.json({ success: true, data: staff });
});

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, phone, role, password, weeklySchedule } = req.body;
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
  const user = await User.create({ name, email, phone, role, password, weeklySchedule: normalizeWeeklySchedule(weeklySchedule) });
  res.status(201).json({ success: true, data: user.toJSON() });
});

export const updateStaff = asyncHandler(async (req, res) => {
  const { name, email, phone, role, isActive, password, weeklySchedule } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = password; // re-hashed by pre-save hook
  if (weeklySchedule !== undefined) user.weeklySchedule = normalizeWeeklySchedule(weeklySchedule);
  await user.save();
  res.json({ success: true, data: user.toJSON() });
});

export const toggleStaff = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, data: user.toJSON() });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  if (String(req.user._id) === String(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Không thể xóa chính tài khoản của bạn' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
  res.json({ success: true, data: { id: req.params.id } });
});
