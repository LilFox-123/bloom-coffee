import { Router } from 'express';
import { body } from 'express-validator';
import {
  getOrCreateOrderByTable,
  getOrder,
  addItem,
  updateItem,
  removeItem,
  saveOrder,
  updateOrderStatus,
  handleTableChangeRequest,
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/table/:tableId', getOrCreateOrderByTable);
router.get('/:id', getOrder);
router.post(
  '/:id/items',
  [body('menuItemId').notEmpty().withMessage('Thiếu món')],
  validate,
  addItem
);
router.patch(
  '/:id/items/:itemId',
  [
    body('quantity').optional().isInt({ min: 0 }),
    body('status').optional().isIn(['dangphache', 'chuanbiphucvu', 'daphucvu']),
  ],
  validate,
  updateItem
);
router.delete('/:id/items/:itemId', removeItem);
router.patch('/:id/status', updateOrderStatus);
router.patch(
  '/:id/table-change-request',
  [body('status').optional().isIn(['accepted'])],
  validate,
  handleTableChangeRequest
);
router.patch('/:id/save', saveOrder);

export default router;
