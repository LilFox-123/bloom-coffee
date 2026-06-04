import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, me } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
  ],
  validate,
  login
);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
