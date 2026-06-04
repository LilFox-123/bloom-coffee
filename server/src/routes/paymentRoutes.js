import { Router } from 'express';
import {
  createMoMoPayment,
  createVNPayPayment,
  handleMoMoIpn,
  handleVNPayReturn,
} from '../controllers/paymentController.js';

// Public payment-gateway routes (customer self-order flow, no auth).
const router = Router();

router.post('/momo', createMoMoPayment);
router.post('/momo/ipn', handleMoMoIpn);
router.post('/vnpay', createVNPayPayment);
router.get('/vnpay/return', handleVNPayReturn);

export default router;
