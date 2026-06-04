import { Router } from 'express';
import { body } from 'express-validator';
import {
  listMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/', listMenu);
router.post(
  '/',
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Vui lòng nhập tên món'),
    body('category').notEmpty().withMessage('Vui lòng chọn danh mục'),
    body('price').isInt({ min: 0 }).withMessage('Giá phải là số nguyên không âm'),
  ],
  validate,
  createMenuItem
);
router.patch('/:id', requireAdmin, updateMenuItem);
router.delete('/:id', requireAdmin, deleteMenuItem);

export default router;
