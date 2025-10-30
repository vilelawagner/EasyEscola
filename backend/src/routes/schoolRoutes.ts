import { Router } from 'express';
import * as SchoolController from '../controllers/SchoolController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/rbacMiddleware';
import { auditLog } from '../middlewares/auditMiddleware';
import { UserRole } from '../types/enums';

const router = Router();

// Todas as rotas exigem autenticação e role SCHOOL_SECRETARY
router.use(authenticateToken);
router.use(requireRole(UserRole.SCHOOL_SECRETARY));

// ==================== DASHBOARD ====================
router.get('/dashboard', SchoolController.getDashboard);

// ==================== STUDENTS ====================
router.get('/students', SchoolController.listStudents);
router.post('/students', auditLog('create_student'), SchoolController.createStudent);
router.get('/students/:id', SchoolController.getStudent);
router.put('/students/:id', auditLog('update_student'), SchoolController.updateStudent);
router.delete('/students/:id', auditLog('delete_student'), SchoolController.deleteStudent);

// ==================== TEACHERS ====================
router.get('/teachers', SchoolController.listTeachers);
router.post('/teachers', auditLog('create_teacher'), SchoolController.createTeacher);
router.put('/teachers/:id', auditLog('update_teacher'), SchoolController.updateTeacher);
router.delete('/teachers/:id', auditLog('delete_teacher'), SchoolController.deleteTeacher);

// ==================== SUBJECTS ====================
router.get('/subjects', SchoolController.listSubjects);
router.post('/subjects', auditLog('create_subject'), SchoolController.createSubject);
router.put('/subjects/:id', auditLog('update_subject'), SchoolController.updateSubject);
router.delete('/subjects/:id', auditLog('delete_subject'), SchoolController.deleteSubject);

// ==================== CLASSES ====================
router.get('/classes', SchoolController.listClasses);
router.post('/classes', auditLog('create_class'), SchoolController.createClass);
router.put('/classes/:id', auditLog('update_class'), SchoolController.updateClass);
router.delete('/classes/:id', auditLog('delete_class'), SchoolController.deleteClass);

// ==================== CLASS SUBJECTS ====================
router.post('/classes/:classId/subjects', auditLog('link_subject'), SchoolController.linkClassSubject);
router.delete('/classes/:classId/subjects/:subjectId', auditLog('unlink_subject'), SchoolController.unlinkClassSubject);

// ==================== SCHEDULES ====================
router.get('/classes/:classId/schedules', SchoolController.listSchedules);
router.post('/classes/:classId/schedules', auditLog('create_schedule'), SchoolController.createSchedule);
router.delete('/schedules/:id', auditLog('delete_schedule'), SchoolController.deleteSchedule);

// ==================== ENROLLMENTS ====================
router.get('/enrollments', SchoolController.listEnrollments);
router.post('/enrollments', auditLog('create_enrollment'), SchoolController.createEnrollment);
router.delete('/enrollments/:id', auditLog('delete_enrollment'), SchoolController.deleteEnrollment);

// ==================== FINANCEIRO (STUDENT PAYMENTS) ====================
router.get('/finance/summary', SchoolController.getFinanceSummary);
router.get('/finance/payments', SchoolController.listStudentPayments);
router.get('/finance/defaulters', SchoolController.listDefaulters);
router.post('/finance/boleto', auditLog('generate_boleto'), SchoolController.generateBoleto);
router.put('/finance/payments/:id/paid', auditLog('mark_payment_paid'), SchoolController.markPaymentAsPaid);

export default router;
