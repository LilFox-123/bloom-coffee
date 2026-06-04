import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPublicTable,
  getPublicMenu,
  createPublicOrder,
  getPublicOrderStatus,
} from '../controllers/publicController.js';
import { validate } from '../middleware/validate.js';

// Public (no-auth) routes for the customer self-order / QR kiosk flow.
const router = Router();

router.get('/table/:tableId', getPublicTable);
router.get('/menu', getPublicMenu);
router.post(
  '/order',
  [
    body('tableId').notEmpty().withMessage('Thiếu mã bàn'),
    body('items').isArray({ min: 1 }).withMessage('Giỏ hàng đang trống'),
    body('items.*.menuItemId').notEmpty().withMessage('Món không hợp lệ'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
  ],
  validate,
  createPublicOrder
);
router.get('/order/:orderId/status', getPublicOrderStatus);

export default router;
