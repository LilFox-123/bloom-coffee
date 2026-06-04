import { Router } from 'express';
import authRoutes from './authRoutes.js';
import tableRoutes from './tableRoutes.js';
import menuRoutes from './menuRoutes.js';
import orderRoutes from './orderRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import customerRoutes from './customerRoutes.js';
import staffRoutes from './staffRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import reportRoutes from './reportRoutes.js';
import publicRoutes from './publicRoutes.js';
import paymentRoutes from './paymentRoutes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.use('/public', publicRoutes);
router.use('/payment', paymentRoutes);
router.use('/auth', authRoutes);
router.use('/tables', tableRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/customers', customerRoutes);
router.use('/staff', staffRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportRoutes);

export default router;
