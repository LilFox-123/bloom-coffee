import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret';

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET(), { expiresIn: '8h' });
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }
    const payload = jwt.verify(token, JWT_SECRET());
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Phiên không hợp lệ' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng này' });
  }
  next();
}
