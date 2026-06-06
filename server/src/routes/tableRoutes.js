import { Router } from 'express';
import { body } from 'express-validator';
import {
  listTables,
  createTable,
  updateTable,
  seatTable,
  transferTableOrder,
  deleteTable,
} from '../controllers/tableController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/', listTables);
router.post(
  '/',
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Vui lòng nhập tên bàn'),
    body('capacity').isInt({ min: 1 }).withMessage('Sức chứa phải là số dương'),
  ],
  validate,
  createTable
);
router.patch('/:id/seat', seatTable);
router.patch(
  '/:id/transfer',
  [body('targetTableId').isMongoId().withMessage('Bàn chuyển đến không hợp lệ')],
  validate,
  transferTableOrder
);
router.patch(
  '/:id',
  [
    body('status').optional().isIn(['trong', 'dangdung', 'ghepban']),
    body('capacity').optional().isInt({ min: 1, max: 50 }),
    body('name').optional().isString().trim().notEmpty(),
  ],
  validate,
  updateTable
);
router.delete('/:id', requireAdmin, deleteTable);

export default router;
