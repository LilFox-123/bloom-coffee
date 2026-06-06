import { Router } from 'express';
import { body } from 'express-validator';
import {
  listStaff,
  createStaff,
  updateStaff,
  toggleStaff,
  deleteStaff,
} from '../controllers/staffController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', listStaff);
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Vui lòng nhập họ tên'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('role').isIn(['admin', 'nhanvien']).withMessage('Vai trò không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  ],
  validate,
  createStaff
);
router.patch(
  '/:id',
  [
    body('name').optional().isString().trim().notEmpty(),
    body('phone').optional().isMobilePhone('vi-VN'),
    body('role').optional().isIn(['admin', 'nhanvien']),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  updateStaff
);
router.patch('/:id/toggle', toggleStaff);
router.delete('/:id', deleteStaff);

export default router;
