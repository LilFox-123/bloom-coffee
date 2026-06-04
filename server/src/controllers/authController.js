import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 8 * 60 * 60 * 1000, // 8h
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa' });
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
  }

  user.lastLogin = [new Date(), ...(user.lastLogin || [])].slice(0, 10);
  await user.save();

  const token = signToken(user);
  res.cookie('token', token, cookieOptions());
  res.json({ success: true, data: user.toJSON() });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: 0 });
  res.json({ success: true, data: { message: 'Đã đăng xuất' } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toJSON() });
});
