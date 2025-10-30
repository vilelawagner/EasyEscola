import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import {
  createGroupSchema,
  updateGroupSchema,
  createSchoolSchema,
  updateSchoolSchema,
  updatePaymentSchema,
  impersonateSchema,
} from '../schemas/adminSchemas';
import { getPaginationParams, getOffset, createPaginatedResponse } from '../utils/pagination';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-secret-key';

// ==================== GROUPS ====================

export const listGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { status, search } = req.query;

  let query = db('groups');

  // Filtros
  if (status) {
    query = query.where('status', status as string);
  }
  if (search) {
    query = query.where((builder) => {
      builder
        .where('name', 'like', `%${search}%`)
        .orWhere('email', 'like', `%${search}%`)
        .orWhere('doc_cnpj', 'like', `%${search}%`);
    });
  }

  // Count total
  const [{ total }] = await query.clone().count('* as total');

  // Paginação
  const groups = await query
    .select('*')
    .orderBy(sortBy || 'id', sortOrder || 'desc')
    .limit(limit)
    .offset(getOffset(page, limit));

  // Busca quantidade de escolas por grupo
  for (const group of groups) {
    const [{ count }] = await db('schools')
      .where('group_id', group.id)
      .count('* as count');
    group.schools_count = count;
  }

  res.json(createPaginatedResponse(groups, total as number, page, limit));
};

export const getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const group = await db('groups').where({ id }).first();

  if (!group) {
    throw new AppError('Grupo não encontrado', 404);
  }

  // Estatísticas
  const [{ schools_count }] = await db('schools')
    .where('group_id', id)
    .count('* as schools_count');

  res.json({ ...group, schools_count });
};

export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = createGroupSchema.parse(req.body);

  // Aceitar tanto 'cnpj' quanto 'doc_cnpj' do frontend
  const doc_cnpj = (req.body.cnpj || data.doc_cnpj) as string | undefined;

  const [id] = await db('groups').insert({
    name: data.name,
    doc_cnpj: doc_cnpj,
    email: data.email,
    phone: data.phone,
    billing_plan: data.billing_plan,
    status: data.status || 'active',
    created_at: new Date(),
    updated_at: new Date(),
  });

  const group = await db('groups').where({ id }).first();

  res.status(201).json(group);
};

export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const data = updateGroupSchema.parse(req.body);

  const group = await db('groups').where({ id }).first();
  if (!group) {
    throw new AppError('Grupo não encontrado', 404);
  }

  await db('groups').where({ id }).update(data);

  const updated = await db('groups').where({ id }).first();

  res.json(updated);
};

export const deleteGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const group = await db('groups').where({ id }).first();
  if (!group) {
    throw new AppError('Grupo não encontrado', 404);
  }

  await db('groups').where({ id }).delete();

  res.json({ message: 'Grupo excluído com sucesso' });
};

// ==================== SCHOOLS (GLOBAL) ====================

export const listAllSchools = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { groupId, status, search } = req.query;

  let query = db('schools');

  // Filtros
  if (groupId) {
    query = query.where('schools.group_id', groupId as string);
  }
  if (status) {
    query = query.where('schools.status', status as string);
  }
  if (search) {
    query = query.where((builder) => {
      builder
        .where('schools.name', 'like', `%${search}%`)
        .orWhere('schools.city', 'like', `%${search}%`);
    });
  }

  // Count total
  const [{ total }] = await query.clone().count('* as total');

  // Paginação com join
  const schools = await query
    .select('schools.*', 'groups.name as group_name')
    .leftJoin('groups', 'schools.group_id', 'groups.id')
    .orderBy(`schools.${sortBy || 'id'}`, sortOrder || 'desc')
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(schools, total as number, page, limit));
};

export const updateSchoolStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'requested'].includes(status)) {
    throw new AppError('Status inválido', 400);
  }

  const school = await db('schools').where({ id }).first();
  if (!school) {
    throw new AppError('Escola não encontrada', 404);
  }

  await db('schools').where({ id }).update({ status });

  const updated = await db('schools').where({ id }).first();

  res.json(updated);
};

// ==================== PAYMENTS (GLOBAL) ====================

export const listAllPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { groupId, schoolId, status, month } = req.query;

  let query = db('payments');

  // Filtros
  if (groupId) {
    query = query.where('payments.group_id', groupId as string);
  }
  if (schoolId) {
    query = query.where('payments.school_id', schoolId as string);
  }
  if (status) {
    query = query.where('payments.status', status as string);
  }
  if (month) {
    query = query.where('payments.reference_month', month as string);
  }

  // Count total
  const [{ total }] = await query.clone().count('* as total');

  // Paginação com joins
  const payments = await query
    .select(
      'payments.*',
      'groups.name as group_name',
      'schools.name as school_name'
    )
    .leftJoin('groups', 'payments.group_id', 'groups.id')
    .leftJoin('schools', 'payments.school_id', 'schools.id')
    .orderBy(`payments.${sortBy || 'id'}`, sortOrder || 'desc')
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(payments, total as number, page, limit));
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const data = updatePaymentSchema.parse(req.body);

  const payment = await db('payments').where({ id }).first();
  if (!payment) {
    throw new AppError('Pagamento não encontrado', 404);
  }

  await db('payments').where({ id }).update(data);

  const updated = await db('payments').where({ id }).first();

  res.json(updated);
};

export const getPaymentsSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const { month } = req.query;

  let query = db('payments');

  if (month) {
    query = query.where('reference_month', month as string);
  }

  const [summary] = await query
    .select(
      db.raw('COUNT(*) as total_count'),
      db.raw('SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid_count'),
      db.raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_count'),
      db.raw('SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late_count'),
      db.raw('SUM(CASE WHEN status = "paid" THEN amount ELSE 0 END) as total_paid'),
      db.raw('SUM(CASE WHEN status != "paid" THEN amount ELSE 0 END) as total_pending')
    );

  res.json(summary);
};

// ==================== IMPERSONATE ====================

export const impersonate = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const { userId } = impersonateSchema.parse(req.body);

  const targetUser = await db('users')
    .where({ id: userId })
    .andWhere('is_active', true)
    .first();

  if (!targetUser) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Busca student_id se for aluno
  let studentId = null;
  if (targetUser.role === 'ROLE_STUDENT') {
    const student = await db('students')
      .where({ school_id: targetUser.school_id })
      .whereRaw('LOWER(email) = ?', [targetUser.email.toLowerCase()])
      .first();
    studentId = student?.id || null;
  }

  // Gera token de impersonação
  const payload: JWTPayload = {
    userId: targetUser.id,
    email: targetUser.email,
    role: targetUser.role,
    groupId: targetUser.group_id,
    schoolId: targetUser.school_id,
    studentId,
    isImpersonated: true,
    originalUserId: req.user.userId,
  };

  const accessToken = jwt.sign(
    payload, 
    JWT_ACCESS_SECRET as jwt.Secret,
    { expiresIn: '15m' }
  );

  res.json({
    accessToken,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isImpersonated: true,
    },
  });
};

// ==================== DASHBOARD ====================

export const getDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  // Grupos ativos
  const [{ groups_count }] = await db('groups')
    .where('status', 'active')
    .count('* as groups_count');

  // Escolas ativas
  const [{ schools_count }] = await db('schools')
    .where('status', 'active')
    .count('* as schools_count');

  // Pagamentos pendentes
  const [{ pending_count }] = await db('payments')
    .where('status', 'pending')
    .count('* as pending_count');

  // Pagamentos atrasados
  const [{ late_count }] = await db('payments')
    .where('status', 'late')
    .count('* as late_count');

  // Solicitações de escola
  const [{ requested_schools }] = await db('schools')
    .where('status', 'requested')
    .count('* as requested_schools');

  // Total de alunos
  const [{ students_count }] = await db('students')
    .count('* as students_count');

  // Grupos recentes
  const recent_groups = await db('groups')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(5);

  // Escolas recentes
  const recent_schools = await db('schools')
    .select('schools.*', 'groups.name as group_name')
    .leftJoin('groups', 'schools.group_id', 'groups.id')
    .orderBy('schools.created_at', 'desc')
    .limit(5);

  // Calcular receita total dos pagamentos
  const [{ total_revenue }] = await db('payments')
    .where('status', 'paid')
    .sum('amount as total_revenue');

  res.json({
    total_groups: Number(groups_count) || 0,
    total_schools: Number(schools_count) || 0,
    total_students: Number(students_count) || 0,
    pending_payments: Number(pending_count) || 0,
    late_payments: Number(late_count) || 0,
    requested_schools: Number(requested_schools) || 0,
    total_revenue: Number(total_revenue) || 0,
    recent_groups,
    recent_schools,
  });
};
