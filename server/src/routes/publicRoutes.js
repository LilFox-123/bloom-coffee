import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPublicTable,
  getPublicTableOrders,
  getPublicMenu,
  upsertPublicMember,
  createPublicOrder,
  createOnlineOrder,
  getPublicOrderStatus,
} from '../controllers/publicController.js';
import { validate } from '../middleware/validate.js';

// Public (no-auth) routes for the customer self-order / QR kiosk flow.
const router = Router();

router.get('/table/:tableId', getPublicTable);
router.get('/table/:tableId/orders', getPublicTableOrders);
router.get('/menu', getPublicMenu);
router.post(
  '/member',
  [
    body('phone').notEmpty().withMessage('Vui lòng nhập số điện thoại'),
  ],
  validate,
  upsertPublicMember
);
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
router.post(
  '/online-order',
  [
    body('customerName').notEmpty().withMessage('Vui lòng nhập tên của bạn'),
    body('items').isArray({ min: 1 }).withMessage('Giỏ hàng đang trống'),
    body('items.*.menuItemId').notEmpty().withMessage('Món không hợp lệ'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
  ],
  validate,
  createOnlineOrder
);
router.get('/order/:orderId/status', getPublicOrderStatus);

export default router;
