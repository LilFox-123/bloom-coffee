import { Router } from 'express';
import {
  dashboard,
  revenueReport,
  topItemsReport,
  inventoryReport,
} from '../controllers/reportController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/dashboard', dashboard);
router.get('/revenue', revenueReport);
router.get('/top-items', topItemsReport);
router.get('/inventory', inventoryReport);

export default router;
