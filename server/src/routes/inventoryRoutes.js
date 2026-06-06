import { Router } from 'express';
import { body } from 'express-validator';
import {
  listInventory,
  createInventory,
  updateInventory,
  deleteInventory,
  listTransactions,
  createTransaction,
} from '../controllers/inventoryController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', listInventory);
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Vui lòng nhập tên nguyên liệu'),
    body('unit').notEmpty().withMessage('Vui lòng nhập đơn vị'),
    body('quantity').isInt({ min: 0 }).withMessage('Tồn kho phải là số nguyên không âm'),
    body('minThreshold').isInt({ min: 0 }).withMessage('Ngưỡng phải là số nguyên không âm'),
  ],
  validate,
  createInventory
);
router.patch(
  '/:id',
  [
    body('quantity').optional().isInt({ min: 0 }),
    body('minThreshold').optional().isInt({ min: 0 }),
    body('name').optional().isString().trim().notEmpty(),
  ],
  validate,
  updateInventory
);
router.delete('/:id', deleteInventory);

router.get('/transactions/all', listTransactions);
router.post(
  '/transactions',
  [
    body('type').isIn(['nhap', 'xuat']).withMessage('Loại phiếu không hợp lệ'),
    body('itemId').notEmpty().withMessage('Vui lòng chọn nguyên liệu'),
    body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
  ],
  validate,
  createTransaction
);

export default router;
