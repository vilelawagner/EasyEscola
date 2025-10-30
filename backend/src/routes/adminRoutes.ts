import { Router } from 'express';
import * as AdminController from '../controllers/AdminController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/rbacMiddleware';
import { auditLog } from '../middlewares/auditMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

// Todas as rotas exigem autenticação e role SUPERADMIN
router.use(authenticateToken);
router.use(requireRole(UserRole.SUPERADMIN));

// ==================== GROUPS ====================
router.get('/groups', AdminController.listGroups);
router.post('/groups', auditLog('create_group'), AdminController.createGroup);
router.get('/groups/:id', AdminController.getGroup);
router.put('/groups/:id', auditLog('update_group'), AdminController.updateGroup);
router.delete('/groups/:id', auditLog('delete_group'), AdminController.deleteGroup);

// ==================== SCHOOLS (Global) ====================
router.get('/schools', AdminController.listAllSchools);
router.put('/schools/:id/status', auditLog('update_school_status'), AdminController.updateSchoolStatus);

// ==================== PAYMENTS (Global) ====================
router.get('/payments', AdminController.listAllPayments);
router.put('/payments/:id/status', auditLog('update_payment_status'), AdminController.updatePaymentStatus);
router.get('/payments/summary', AdminController.getPaymentsSummary);

// ==================== IMPERSONATE ====================
router.post('/impersonate', auditLog('impersonate'), AdminController.impersonate);

// ==================== DASHBOARD ====================
router.get('/dashboard', AdminController.getDashboard);

export default router;
