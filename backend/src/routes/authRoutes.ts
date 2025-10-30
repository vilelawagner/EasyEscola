import { Router } from 'express';
import * as AuthController from '../controllers/AuthController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login', AuthController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Renovar access token
 * @access  Public
 */
router.post('/refresh', AuthController.refresh);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout de usuário
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obter dados do usuário autenticado
 * @access  Private
 */
router.get('/me', authenticateToken, AuthController.me);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Alterar senha do usuário autenticado
 * @access  Private
 */
router.post('/change-password', authenticateToken, AuthController.changePassword);

export default router;
