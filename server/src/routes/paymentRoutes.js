import { Router } from 'express';
import { body } from 'express-validator';
import {
  createMoMoPayment,
  createVNPayPayment,
  handleMoMoIpn,
  handleMoMoReturn,
  handleVNPayReturn,
} from '../controllers/paymentController.js';
import { validate } from '../middleware/validate.js';

// Public payment-gateway routes (customer self-order flow, no auth).
const router = Router();

router.post(
  '/momo',
  [
    body('amount').isInt({ min: 1000 }),
    body('orderId').isMongoId(),
    body('orderInfo').isString().trim().notEmpty().isLength({ max: 200 }),
  ],
  validate,
  createMoMoPayment
);
router.post('/momo/ipn', handleMoMoIpn);
router.get('/momo/return', handleMoMoReturn);
router.post(
  '/vnpay',
  [
    body('amount').isInt({ min: 1000 }),
    body('orderId').isMongoId(),
    body('orderInfo').isString().trim().notEmpty().isLength({ max: 200 }),
  ],
  validate,
  createVNPayPayment
);
router.get('/vnpay/return', handleVNPayReturn);

export default router;
