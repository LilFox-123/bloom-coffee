import { Router } from 'express';
import { body } from 'express-validator';
import {
  createInvoice,
  listInvoices,
  getInvoice,
  deleteInvoice,
} from '../controllers/invoiceController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.post(
  '/',
  [
    body('orderId').notEmpty().withMessage('Thiếu mã đơn'),
    body('paymentMethod')
      .optional()
      .isIn(['tienmat', 'chuyenkhoan', 'vidientu'])
      .withMessage('Hình thức thanh toán không hợp lệ'),
  ],
  validate,
  createInvoice
);
router.delete('/:id', requireAdmin, deleteInvoice);

export default router;
