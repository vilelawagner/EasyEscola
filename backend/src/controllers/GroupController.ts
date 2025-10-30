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

  let query = db('schools');

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

  // Count total (sem select)
  const [{ total }] = await query.clone().count('* as total');

  // Paginação com select
  const schools = await query
    .select('*')
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

  // Agora lista pagamentos de alunos agregados por escola
  let query = db('student_payments');

  // Aplica filtro de tenant
  applyTenantFilter(query, req, 'student_payments');

  // Filtros adicionais
  if (schoolId) {
    query = query.where('student_payments.school_id', schoolId as string);
  }
  if (status) {
    query = query.where('student_payments.status', status as string);
  }
  if (month) {
    query = query.where('student_payments.reference_month', month as string);
  }

  // Agrupa por escola para mostrar resumo consolidado
  const baseQuery = query.clone()
    .select(
      'student_payments.school_id',
      'schools.name as school_name',
      'student_payments.reference_month',
      db.raw('COUNT(*) as payments_count'),
      db.raw('SUM(CASE WHEN student_payments.status = "paid" THEN 1 ELSE 0 END) as paid_count'),
      db.raw('SUM(CASE WHEN student_payments.status = "pending" THEN 1 ELSE 0 END) as pending_count'),
      db.raw('SUM(CASE WHEN student_payments.status = "late" THEN 1 ELSE 0 END) as late_count'),
      db.raw('SUM(student_payments.amount) as total_amount'),
      db.raw('SUM(CASE WHEN student_payments.status = "paid" THEN student_payments.amount_paid ELSE 0 END) as total_received'),
      db.raw('SUM(CASE WHEN student_payments.status != "paid" THEN student_payments.amount ELSE 0 END) as total_pending')
    )
    .leftJoin('schools', 'student_payments.school_id', 'schools.id')
    .groupBy('student_payments.school_id', 'schools.name', 'student_payments.reference_month');

  // Count total de grupos
  const countResult = await db.raw(`
    SELECT COUNT(*) as total 
    FROM (${baseQuery.toQuery()}) as subquery
  `);
  const total = countResult[0][0].total;

  // Paginação
  const payments = await baseQuery
    .orderBy(sortBy || 'student_payments.reference_month', sortOrder)
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(payments, Number(total), page, limit));
};

export const getPaymentsSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const { month } = req.query;
  const filters = getTenantFilters(req);

  // Agora busca os pagamentos dos ALUNOS (student_payments) ao invés dos pagamentos das escolas
  let query = db('student_payments');

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
      db.raw('SUM(CASE WHEN status = "paid" THEN amount_paid ELSE 0 END) as total_paid'),
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

// ==================== USERS ====================

export const listGroupUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { role, status, schoolId, search } = req.query;
  const filters = getTenantFilters(req);

  let query = db('users').where('users.group_id', filters.groupId!);

  // Gestor vê: outros gestores do grupo + secretárias das escolas do grupo
  if (role) query = query.where('role', role as string);
  if (status) query = query.where('users.status', status as string);
  if (schoolId) query = query.where('school_id', schoolId as string);
  if (search) {
    query = query.where((builder) => {
      builder
        .where('users.name', 'like', `%${search}%`)
        .orWhere('users.email', 'like', `%${search}%`);
    });
  }

  const [{ total }] = await query.clone().count('* as total');

  const users = await query
    .select(
      'users.id',
      'users.name',
      'users.email',
      'users.role',
      'users.group_id',
      'users.school_id',
      'users.status',
      'users.created_at',
      'users.updated_at',
      'schools.name as school_name'
    )
    .leftJoin('schools', 'users.school_id', 'schools.id')
    .orderBy(`users.${sortBy || 'id'}`, sortOrder || 'desc')
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(users, Number(total), page, limit));
};

export const createGroupUser = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { name, email, password, role, schoolId } = req.body;
  const filters = getTenantFilters(req);

  if (!name || !email || !password || !role) {
    throw new AppError('Campos obrigatórios: name, email, password, role', 400);
  }

  // Gestor só pode criar GROUP_MANAGER e SCHOOL_SECRETARY
  if (role !== 'ROLE_GROUP_MANAGER' && role !== 'ROLE_SCHOOL_SECRETARY') {
    throw new AppError('Você só pode criar gestores ou secretárias', 403);
  }

  // Se for secretária, precisa de schoolId
  if (role === 'ROLE_SCHOOL_SECRETARY' && !schoolId) {
    throw new AppError('Secretária precisa estar vinculada a uma escola', 400);
  }

  // Verifica se email já existe
  const existingUser = await db('users').where('email', email).first();
  if (existingUser) {
    throw new AppError('Email já está em uso', 400);
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);

  const [id] = await db('users').insert({
    name,
    email,
    password: hashedPassword,
    role,
    group_id: filters.groupId,
    school_id: role === 'ROLE_SCHOOL_SECRETARY' ? schoolId : null,
    status: 'active',
  });

  const newUser = await db('users')
    .select('id', 'name', 'email', 'role', 'group_id', 'school_id', 'status', 'created_at')
    .where('id', id)
    .first();

  res.status(201).json(newUser);
};

export const updateGroupUser = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const { name, email, role, schoolId, status } = req.body;
  const filters = getTenantFilters(req);

  const user = await db('users')
    .where('id', id)
    .andWhere('group_id', filters.groupId!)
    .first();

  if (!user) throw new AppError('Usuário não encontrado', 404);

  // Se mudou email, verifica se não está em uso
  if (email && email !== user.email) {
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      throw new AppError('Email já está em uso', 400);
    }
  }

  const updateData: any = { updated_at: db.fn.now() };
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (schoolId !== undefined) updateData.school_id = schoolId;
  if (status) updateData.status = status;

  await db('users').where('id', id).update(updateData);

  const updatedUser = await db('users')
    .select('id', 'name', 'email', 'role', 'group_id', 'school_id', 'status', 'updated_at')
    .where('id', id)
    .first();

  res.json(updatedUser);
};

export const deleteGroupUser = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const user = await db('users')
    .where('id', id)
    .andWhere('group_id', filters.groupId!)
    .first();

  if (!user) throw new AppError('Usuário não encontrado', 404);

  if (req.user.userId === parseInt(id)) {
    throw new AppError('Você não pode deletar sua própria conta', 400);
  }

  await db('users').where('id', id).delete();
  res.json({ message: 'Usuário removido com sucesso' });
};
