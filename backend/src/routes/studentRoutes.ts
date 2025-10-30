import { Router } from 'express';
import * as StudentController from '../controllers/StudentController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/rbacMiddleware';
import { auditLog } from '../middlewares/auditMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

// Todas as rotas exigem autenticação e role STUDENT
router.use(authenticateToken);
router.use(requireRole(UserRole.STUDENT));

// ==================== OVERVIEW ====================
router.get('/overview', StudentController.getOverview);

// ==================== SUBJECTS ====================
router.get('/subjects', StudentController.listMySubjects);

// ==================== MATERIALS ====================
router.get('/materials', StudentController.listMyMaterials);

// ==================== GRADES & ABSENCES ====================
router.get('/grades', StudentController.getMyGrades);
router.get('/absences', StudentController.getMyAbsences);

// ==================== HISTORY ====================
router.get('/history', StudentController.getMyHistory);

// ==================== SCHEDULE ====================
router.get('/schedule', StudentController.getMySchedule);

// ==================== REQUESTS ====================
router.get('/requests', StudentController.listMyRequests);
router.post('/requests', auditLog('create_request'), StudentController.createRequest);
router.get('/requests/:id', StudentController.getRequest);

// ==================== NOTIFICATIONS ====================
router.get('/notifications', StudentController.listMyNotifications);
router.put('/notifications/:id/read', StudentController.markNotificationAsRead);
router.put('/notifications/read-all', StudentController.markAllNotificationsAsRead);

// ==================== MY DATA ====================
router.get('/me', StudentController.getMyData);

export default router;
