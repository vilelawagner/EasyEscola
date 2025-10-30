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
    .select('schools.*', 'groups.name as group_name', 'groups.doc_cnpj as group_cnpj')
    .leftJoin('groups', 'schools.group_id', 'groups.id')
    .orderBy(`schools.${sortBy || 'id'}`, sortOrder || 'desc')
    .limit(limit)
    .offset(getOffset(page, limit));

  // Para cada escola, buscar total de alunos e professores
  const schoolsWithCounts = await Promise.all(
    schools.map(async (school) => {
      const [{ students_count }] = await db('students')
        .where('school_id', school.id)
        .andWhere('status', 'active')
        .count('* as students_count');
      
      const [{ teachers_count }] = await db('teachers')
        .where('school_id', school.id)
        .andWhere('status', 'active')
        .count('* as teachers_count');
      
      return {
        ...school,
        students_count: students_count || 0,
        teachers_count: teachers_count || 0,
      };
    })
  );

  res.json(createPaginatedResponse(schoolsWithCounts, total as number, page, limit));
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

// ==================== USERS ====================

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { role, status, groupId, schoolId, search } = req.query;

  let query = db('users');

  if (role) query = query.where('role', role as string);
  if (status) query = query.where('status', status as string);
  if (groupId) query = query.where('group_id', groupId as string);
  if (schoolId) query = query.where('school_id', schoolId as string);
  if (search) {
    query = query.where((builder) => {
      builder
        .where('name', 'like', `%${search}%`)
        .orWhere('email', 'like', `%${search}%`);
    });
  }

  const [{ total }] = await query.clone().count('* as total');

  const users = await query
    .select(
      'users.*',
      'groups.name as group_name',
      'schools.name as school_name'
    )
    .leftJoin('groups', 'users.group_id', 'groups.id')
    .leftJoin('schools', 'users.school_id', 'schools.id')
    .orderBy(`users.${sortBy || 'id'}`, sortOrder || 'desc')
    .limit(limit)
    .offset(getOffset(page, limit));

  // Remove password dos resultados
  const usersWithoutPassword = users.map(({ password, ...user }) => user);

  res.json(createPaginatedResponse(usersWithoutPassword, Number(total), page, limit));
};

export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await db('users')
    .select(
      'users.*',
      'groups.name as group_name',
      'schools.name as school_name'
    )
    .leftJoin('groups', 'users.group_id', 'groups.id')
    .leftJoin('schools', 'users.school_id', 'schools.id')
    .where('users.id', id)
    .first();

  if (!user) throw new AppError('Usuário não encontrado', 404);

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role, groupId, schoolId, status } = req.body;

  if (!name || !email || !password || !role) {
    throw new AppError('Campos obrigatórios: name, email, password, role', 400);
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
    group_id: groupId || null,
    school_id: schoolId || null,
    status: status || 'active',
  });

  const newUser = await db('users')
    .select('id', 'name', 'email', 'role', 'group_id', 'school_id', 'status', 'created_at')
    .where('id', id)
    .first();

  res.status(201).json(newUser);
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, role, groupId, schoolId, status } = req.body;

  const user = await db('users').where('id', id).first();
  if (!user) throw new AppError('Usuário não encontrado', 404);

  // Se mudou email, verifica se não está em uso
  if (email && email !== user.email) {
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      throw new AppError('Email já está em uso', 400);
    }
  }

  const updateData: any = {
    updated_at: db.fn.now(),
  };

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (groupId !== undefined) updateData.group_id = groupId;
  if (schoolId !== undefined) updateData.school_id = schoolId;
  if (status) updateData.status = status;

  await db('users').where('id', id).update(updateData);

  const updatedUser = await db('users')
    .select('id', 'name', 'email', 'role', 'group_id', 'school_id', 'status', 'updated_at')
    .where('id', id)
    .first();

  res.json(updatedUser);
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await db('users').where('id', id).first();
  if (!user) throw new AppError('Usuário não encontrado', 404);

  // Não permite deletar o próprio usuário
  if (req.user && req.user.userId === parseInt(id)) {
    throw new AppError('Você não pode deletar sua própria conta', 400);
  }

  await db('users').where('id', id).delete();
  res.json({ message: 'Usuário removido com sucesso' });
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Campos obrigatórios: currentPassword, newPassword', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('A nova senha deve ter no mínimo 6 caracteres', 400);
  }

  const user = await db('users').where('id', req.user.userId).first();
  if (!user) throw new AppError('Usuário não encontrado', 404);

  const bcrypt = require('bcryptjs');
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new AppError('Senha atual incorreta', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db('users')
    .where('id', req.user.userId)
    .update({
      password: hashedPassword,
      updated_at: db.fn.now(),
    });

  res.json({ message: 'Senha alterada com sucesso' });
};
