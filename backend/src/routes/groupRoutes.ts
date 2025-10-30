import { Router } from 'express';
import * as GroupController from '../controllers/GroupController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/rbacMiddleware';
import { auditLog } from '../middlewares/auditMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

// Todas as rotas exigem autenticação e role GROUP_MANAGER
router.use(authenticateToken);
router.use(requireRole(UserRole.GROUP_MANAGER));

// ==================== SCHOOLS (Own Group) ====================
router.get('/schools', GroupController.listSchools);
router.post('/schools', auditLog('create_school'), GroupController.createSchool);
router.get('/schools/:id', GroupController.getSchool);
router.put('/schools/:id', auditLog('update_school'), GroupController.updateSchool);

// ==================== PAYMENTS (Own Group) ====================
router.get('/payments', GroupController.listPayments);
router.get('/payments/summary', GroupController.getPaymentsSummary);

// ==================== DASHBOARD ====================
router.get('/dashboard', GroupController.getDashboard);

// ==================== USERS ====================
router.get('/users', GroupController.listGroupUsers);
router.post('/users', auditLog('create_user'), GroupController.createGroupUser);
router.put('/users/:id', auditLog('update_user'), GroupController.updateGroupUser);
router.delete('/users/:id', auditLog('delete_user'), GroupController.deleteGroupUser);

export default router;
