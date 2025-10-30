import { Router } from 'express';
import * as TeacherController from '../controllers/TeacherController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/rbacMiddleware';
import { auditLog } from '../middlewares/auditMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

// Todas as rotas exigem autenticação e role TEACHER
router.use(authenticateToken);
router.use(requireRole(UserRole.TEACHER));

// ==================== MATERIALS ====================
router.get('/materials', TeacherController.listMaterials);
router.post(
  '/materials',
  TeacherController.upload.single('file'),
  auditLog('upload_material'),
  TeacherController.createMaterial
);
router.delete('/materials/:id', auditLog('delete_material'), TeacherController.deleteMaterial);
router.get('/materials/:id/download', TeacherController.downloadMaterial);

// ==================== GRADES ====================
router.get('/grades', TeacherController.listGrades);
router.post('/grades', auditLog('create_grade'), TeacherController.createGrade);
router.put('/grades/:id', auditLog('update_grade'), TeacherController.updateGrade);

// ==================== ABSENCES ====================
router.get('/absences', TeacherController.listAbsences);
router.post('/absences', auditLog('create_absence'), TeacherController.createAbsence);
router.put('/absences/:id', auditLog('update_absence'), TeacherController.updateAbsence);
router.delete('/absences/:id', auditLog('delete_absence'), TeacherController.deleteAbsence);

// ==================== DASHBOARD ====================
router.get('/dashboard', TeacherController.getDashboard);

export default router;
