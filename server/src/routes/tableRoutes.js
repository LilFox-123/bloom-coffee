import { Router } from 'express';
import { body } from 'express-validator';
import {
  listTables,
  createTable,
  updateTable,
  seatTable,
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
router.patch('/:id', updateTable);
router.delete('/:id', requireAdmin, deleteTable);

export default router;
