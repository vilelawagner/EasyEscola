import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import { getTenantFilters, applyTenantFilter } from '../middlewares/tenantMiddleware';
import {
  createSchoolSchema,
  updateSchoolSchema,
} from '../schemas/adminSchemas';
import { getPaginationParams, getOffset, createPaginatedResponse } from '../utils/pagination';

// ==================== SCHOOLS ====================

export const listSchools = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { status, city, state } = req.query;

  let query = db('schools').select('*');

  // Aplica filtro de tenant
  applyTenantFilter(query, req);

  // Filtros adicionais
  if (status) {
    query = query.where('status', status as string);
  }
  if (city) {
    query = query.where('city', 'like', `%${city}%`);
  }
  if (state) {
    query = query.where('state', state as string);
  }

  // Count total
  const [{ total }] = await query.clone().count('* as total');

  // Paginação
  const schools = await query
    .orderBy(sortBy || 'id', sortOrder)
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(schools, total as number, page, limit));
};

export const getSchool = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const { id } = req.params;
  const filters = getTenantFilters(req);

  let query = db('schools').where({ id });

  if (filters.groupId) {
    query = query.andWhere('group_id', filters.groupId);
  }

  const school = await query.first();

  if (!school) {
    throw new AppError('Escola não encontrada', 404);
  }

  res.json(school);
};

export const createSchool = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const data = createSchoolSchema.parse(req.body);
  const filters = getTenantFilters(req);

  // Valida se está criando no próprio grupo
  if (filters.groupId && data.groupId !== filters.groupId) {
    throw new AppError('Você só pode criar escolas no seu próprio grupo', 403);
  }

  const [id] = await db('schools').insert({
    group_id: data.groupId,
    name: data.name,
    doc_cnpj: data.doc_cnpj,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    email: data.email,
    phone: data.phone,
    status: data.status || 'active',
  });

  const school = await db('schools').where({ id }).first();

  res.status(201).json(school);
};

export const updateSchool = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const { id } = req.params;
  const data = updateSchoolSchema.parse(req.body);
  const filters = getTenantFilters(req);

  let query = db('schools').where({ id });

  if (filters.groupId) {
    query = query.andWhere('group_id', filters.groupId);
  }

  const school = await query.first();

  if (!school) {
    throw new AppError('Escola não encontrada', 404);
  }

  await db('schools').where({ id }).update(data);

  const updated = await db('schools').where({ id }).first();

  res.json(updated);
};

export const updateSchoolStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'requested'].includes(status)) {
    throw new AppError('Status inválido', 400);
  }

  const filters = getTenantFilters(req);

  let query = db('schools').where({ id });

  if (filters.groupId) {
    query = query.andWhere('group_id', filters.groupId);
  }

  const school = await query.first();

  if (!school) {
    throw new AppError('Escola não encontrada', 404);
  }

  await db('schools').where({ id }).update({ status });

  const updated = await db('schools').where({ id }).first();

  res.json(updated);
};

// ==================== PAYMENTS ====================

export const listPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { schoolId, status, month } = req.query;

  let query = db('payments')
    .select('payments.*', 'schools.name as school_name')
    .leftJoin('schools', 'payments.school_id', 'schools.id');

  // Aplica filtro de tenant
  applyTenantFilter(query, req, 'payments');

  // Filtros adicionais
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

  // Paginação
  const payments = await query
    .orderBy(`payments.${sortBy || 'id'}`, sortOrder)
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(payments, total as number, page, limit));
};

export const getPaymentsSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const { month } = req.query;
  const filters = getTenantFilters(req);

  let query = db('payments');

  if (filters.groupId) {
    query = query.where('group_id', filters.groupId);
  }

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

// ==================== DASHBOARD ====================

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const filters = getTenantFilters(req);

  // Escolas ativas
  const [{ schools_count }] = await db('schools')
    .where('group_id', filters.groupId!)
    .andWhere('status', 'active')
    .count('* as schools_count');

  // Total de alunos
  const [{ students_count }] = await db('students')
    .where('group_id', filters.groupId!)
    .andWhere('status', 'active')
    .count('* as students_count');

  // Total de professores
  const [{ teachers_count }] = await db('teachers')
    .where('group_id', filters.groupId!)
    .andWhere('status', 'active')
    .count('* as teachers_count');

  // Pagamentos pendentes
  const [{ pending_count }] = await db('payments')
    .where('group_id', filters.groupId!)
    .andWhere('status', 'pending')
    .count('* as pending_count');

  // Receita mensal (mês atual)
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [{ monthly_revenue }] = await db('payments')
    .where('group_id', filters.groupId!)
    .andWhere('status', 'paid')
    .andWhere('reference_month', currentMonth)
    .sum('amount as monthly_revenue');

  // Lista de escolas com total de alunos
  const schools = await db('schools')
    .select('schools.*')
    .where('schools.group_id', filters.groupId!)
    .orderBy('schools.created_at', 'desc')
    .limit(5);

  // Para cada escola, buscar total de alunos
  const schoolsWithStudents = await Promise.all(
    schools.map(async (school) => {
      const [{ total }] = await db('students')
        .where('school_id', school.id)
        .andWhere('status', 'active')
        .count('* as total');
      return { ...school, total_students: total };
    })
  );

  // Pagamentos recentes
  const recentPayments = await db('payments')
    .select('payments.*', 'schools.name as school_name')
    .leftJoin('schools', 'payments.school_id', 'schools.id')
    .where('payments.group_id', filters.groupId!)
    .orderBy('payments.created_at', 'desc')
    .limit(5);

  res.json({
    total_schools: schools_count,
    total_students: students_count,
    total_teachers: teachers_count,
    pending_payments: pending_count,
    monthly_revenue: parseFloat(monthly_revenue || '0'),
    schools: schoolsWithStudents,
    recent_payments: recentPayments,
    upcoming_payments: [], // Mantido para compatibilidade
  });
};
