import { Router } from 'express';
import { body } from 'express-validator';
import {
  listCustomers,
  getCustomerHistory,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  sendPromo,
} from '../controllers/customerController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', listCustomers);
router.get('/:id/history', getCustomerHistory);
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Vui lòng nhập họ tên'),
    body('phone').notEmpty().withMessage('Vui lòng nhập số điện thoại'),
  ],
  validate,
  createCustomer
);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.post('/:id/promo', sendPromo);

export default router;
