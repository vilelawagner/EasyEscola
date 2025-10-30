import { Router } from 'express';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import adminFinanceRoutes from './adminFinanceRoutes';
import groupRoutes from './groupRoutes';
import schoolRoutes from './schoolRoutes';
import teacherRoutes from './teacherRoutes';
import studentRoutes from './studentRoutes';

const router = Router();

// ==================== PUBLIC ROUTES ====================
router.use('/auth', authRoutes);

// ==================== LEVEL 1: SUPERADMIN ====================
router.use('/admin', adminRoutes);
router.use('/admin/finance', adminFinanceRoutes);

// ==================== LEVEL 2: GROUP MANAGER ====================
router.use('/group', groupRoutes);

// ==================== LEVEL 3: SCHOOL SECRETARY ====================
router.use('/school', schoolRoutes);

// ==================== LEVEL 3: TEACHER ====================
router.use('/teacher', teacherRoutes);

// ==================== LEVEL 4: STUDENT ====================
router.use('/student', studentRoutes);

export default router;
