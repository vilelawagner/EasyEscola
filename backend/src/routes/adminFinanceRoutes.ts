import { Router } from 'express';
import { AdminFinanceController } from '../controllers/AdminFinanceController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/rbacMiddleware';
import { UserRole } from '../types/enums';

const router = Router();
const adminFinanceController = new AdminFinanceController();

// Todas as rotas exigem autenticação e role SUPERADMIN
router.use(authenticateToken);
router.use(requireRole(UserRole.SUPERADMIN));

// Dashboard financeiro
router.get('/dashboard', adminFinanceController.getDashboard);

// Listar cobranças
router.get('/billings', adminFinanceController.listBillings);

// Criar cobrança manual
router.post('/billings', adminFinanceController.createBilling);

// Gerar cobranças mensais para todos os grupos
router.post('/billings/generate', adminFinanceController.generateMonthlyBillings);

// Marcar cobrança como paga
router.patch('/billings/:id/pay', adminFinanceController.markAsPaid);

// Cancelar cobrança
router.patch('/billings/:id/cancel', adminFinanceController.cancelBilling);

// Configuração financeira de um grupo
router.get('/config/:groupId', adminFinanceController.getConfig);
router.put('/config/:groupId', adminFinanceController.updateConfig);

export default router;
