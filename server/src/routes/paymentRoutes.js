import { Router } from 'express';
import { createMoMoPayment, createVNPayPayment } from '../controllers/paymentController.js';

// Public payment-gateway routes (customer self-order flow, no auth).
const router = Router();

router.post('/momo', createMoMoPayment);
router.post('/vnpay', createVNPayPayment);

export default router;
