import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import { getTenantFilters, applyTenantFilter } from '../middlewares/tenantMiddleware';
import {
  createStudentSchema,
  updateStudentSchema,
  createTeacherSchema,
  updateTeacherSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createClassSchema,
  updateClassSchema,
  createClassSubjectSchema,
  createScheduleSchema,
  updateScheduleSchema,
  createEnrollmentSchema,
} from '../schemas/schoolSchemas';
import { getPaginationParams, getOffset, createPaginatedResponse } from '../utils/pagination';

// ==================== DASHBOARD ====================

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const filters = getTenantFilters(req);

  // Total de alunos ativos
  const [{ total_students }] = await db('students')
    .where('school_id', filters.schoolId!)
    .andWhere('status', 'active')
    .count('* as total_students');

  // Total de professores ativos
  const [{ total_teachers }] = await db('teachers')
    .where('school_id', filters.schoolId!)
    .andWhere('status', 'active')
    .count('* as total_teachers');

  // Total de turmas ativas
  const [{ total_classes }] = await db('classes')
    .where('school_id', filters.schoolId!)
    .andWhere('status', 'active')
    .count('* as total_classes');

  // Total de disciplinas
  const [{ total_subjects }] = await db('subjects')
    .where('school_id', filters.schoolId!)
    .count('* as total_subjects');

  // Pagamentos pendentes
  const [{ pending_payments }] = await db('payments')
    .where('school_id', filters.schoolId!)
    .andWhere('status', 'pending')
    .count('* as pending_payments');

  // Receita do mês atual
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [{ monthly_revenue }] = await db('payments')
    .where('school_id', filters.schoolId!)
    .andWhere('status', 'paid')
    .andWhere('reference_month', currentMonth)
    .sum('amount as monthly_revenue');

  res.json({
    total_students: total_students || 0,
    total_teachers: total_teachers || 0,
    total_classes: total_classes || 0,
    total_subjects: total_subjects || 0,
    pending_payments: pending_payments || 0,
    monthly_revenue: parseFloat(monthly_revenue || '0'),
  });
};

// ==================== STUDENTS ====================

export const listStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { status, search } = req.query;

  let query = db('students');
  applyTenantFilter(query, req);

  if (status) query = query.where('status', status as string);
  if (search) {
    query = query.where((builder) => {
      builder
        .where('name', 'like', `%${search}%`)
        .orWhere('ra', 'like', `%${search}%`)
        .orWhere('email', 'like', `%${search}%`);
    });
  }

  const [{ total }] = await query.clone().count('* as total');
  const students = await query
    .select('*')
    .orderBy(sortBy || 'id', sortOrder)
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(students, total as number, page, limit));
};

export const getStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const student = await db('students')
    .where({ id, ...filters })
    .first();

  if (!student) throw new AppError('Aluno não encontrado', 404);

  res.json(student);
};

export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const data = createStudentSchema.parse(req.body);
  const filters = getTenantFilters(req);

  // Verifica RA duplicado
  const existing = await db('students')
    .where({ school_id: filters.schoolId, ra: data.ra })
    .first();

  if (existing) {
    throw new AppError('RA já cadastrado nesta escola', 400);
  }

  const [id] = await db('students').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    ...data,
  });

  const student = await db('students').where({ id }).first();
  res.status(201).json(student);
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const data = updateStudentSchema.parse(req.body);
  const filters = getTenantFilters(req);

  const student = await db('students').where({ id, ...filters }).first();
  if (!student) throw new AppError('Aluno não encontrado', 404);

  await db('students').where({ id }).update(data);
  const updated = await db('students').where({ id }).first();

  res.json(updated);
};

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const student = await db('students').where({ id, ...filters }).first();
  if (!student) throw new AppError('Aluno não encontrado', 404);

  await db('students').where({ id }).delete();
  res.json({ message: 'Aluno excluído com sucesso' });
};

// ==================== TEACHERS ====================

export const listTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { status, search } = req.query;

  let query = db('teachers');
  applyTenantFilter(query, req);

  if (status) query = query.where('status', status as string);
  if (search) {
    query = query.where((builder) => {
      builder
        .where('name', 'like', `%${search}%`)
        .orWhere('email', 'like', `%${search}%`);
    });
  }

  const [{ total }] = await query.clone().count('* as total');
  const teachers = await query
    .select('*')
    .orderBy(sortBy || 'id', sortOrder)
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(teachers, total as number, page, limit));
};

export const createTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const data = createTeacherSchema.parse(req.body);
  const filters = getTenantFilters(req);

  const [id] = await db('teachers').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    ...data,
  });

  const teacher = await db('teachers').where({ id }).first();
  res.status(201).json(teacher);
};

export const updateTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const data = updateTeacherSchema.parse(req.body);
  const filters = getTenantFilters(req);

  const teacher = await db('teachers').where({ id, ...filters }).first();
  if (!teacher) throw new AppError('Professor não encontrado', 404);

  await db('teachers').where({ id }).update(data);
  const updated = await db('teachers').where({ id }).first();

  res.json(updated);
};

export const deleteTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const teacher = await db('teachers').where({ id, ...filters }).first();
  if (!teacher) throw new AppError('Professor não encontrado', 404);

  await db('teachers').where({ id }).delete();
  res.json({ message: 'Professor excluído com sucesso' });
};

// ==================== SUBJECTS ====================

export const listSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);

  let query = db('subjects');
  applyTenantFilter(query, req);

  const [{ total }] = await query.clone().count('* as total');
  const subjects = await query
    .select('*')
    .orderBy(sortBy || 'id', sortOrder)
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(subjects, total as number, page, limit));
};

export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const data = createSubjectSchema.parse(req.body);
  const filters = getTenantFilters(req);

  const [id] = await db('subjects').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    ...data,
  });

  const subject = await db('subjects').where({ id }).first();
  res.status(201).json(subject);
};

export const updateSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const data = updateSubjectSchema.parse(req.body);
  const filters = getTenantFilters(req);

  const subject = await db('subjects').where({ id, ...filters }).first();
  if (!subject) throw new AppError('Disciplina não encontrada', 404);

  await db('subjects').where({ id }).update(data);
  const updated = await db('subjects').where({ id }).first();

  res.json(updated);
};

export const deleteSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const subject = await db('subjects').where({ id, ...filters }).first();
  if (!subject) throw new AppError('Disciplina não encontrada', 404);

  await db('subjects').where({ id }).delete();
  res.json({ message: 'Disciplina excluída com sucesso' });
};

// ==================== CLASSES ====================

export const listClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { year, semester } = req.query;

  let query = db('classes');
  applyTenantFilter(query, req);

  if (year) query = query.where('year', year as string);
  if (semester) query = query.where('semester', semester as string);

  const [{ total }] = await query.clone().count('* as total');
  const classes = await query
    .select('*')
    .orderBy(sortBy || 'id', sortOrder)
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(classes, total as number, page, limit));
};

export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const data = createClassSchema.parse(req.body);
  const filters = getTenantFilters(req);

  const [id] = await db('classes').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    ...data,
  });

  const classData = await db('classes').where({ id }).first();
  res.status(201).json(classData);
};

export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const data = updateClassSchema.parse(req.body);
  const filters = getTenantFilters(req);

  const classData = await db('classes').where({ id, ...filters }).first();
  if (!classData) throw new AppError('Turma não encontrada', 404);

  await db('classes').where({ id }).update(data);
  const updated = await db('classes').where({ id }).first();

  res.json(updated);
};

export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const classData = await db('classes').where({ id, ...filters }).first();
  if (!classData) throw new AppError('Turma não encontrada', 404);

  await db('classes').where({ id }).delete();
  res.json({ message: 'Turma excluída com sucesso' });
};

// ==================== CLASS SUBJECTS ====================

export const linkClassSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const data = createClassSubjectSchema.parse(req.body);
  const filters = getTenantFilters(req);

  // Verifica se já existe
  const existing = await db('class_subjects')
    .where({
      class_id: data.classId,
      subject_id: data.subjectId,
      ...filters,
    })
    .first();

  if (existing) {
    throw new AppError('Disciplina já vinculada a esta turma', 400);
  }

  const [id] = await db('class_subjects').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    class_id: data.classId,
    subject_id: data.subjectId,
    teacher_id: data.teacherId,
  });

  const link = await db('class_subjects').where({ id }).first();
  res.status(201).json(link);
};

export const unlinkClassSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const link = await db('class_subjects').where({ id, ...filters }).first();
  if (!link) throw new AppError('Vínculo não encontrado', 404);

  await db('class_subjects').where({ id }).delete();
  res.json({ message: 'Vínculo removido com sucesso' });
};

// ==================== SCHEDULES ====================

export const listSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { classId } = req.query;
  const filters = getTenantFilters(req);

  let query = db('class_schedules')
    .select(
      'class_schedules.*',
      'subjects.name as subject_name',
      'teachers.name as teacher_name'
    )
    .leftJoin('subjects', 'class_schedules.subject_id', 'subjects.id')
    .leftJoin('teachers', 'class_schedules.teacher_id', 'teachers.id')
    .where(filters);

  if (classId) {
    query = query.where('class_schedules.class_id', classId as string);
  }

  const schedules = await query.orderBy('class_schedules.day_of_week').orderBy('class_schedules.start_time');

  res.json(schedules);
};

export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const data = createScheduleSchema.parse(req.body);
  const filters = getTenantFilters(req);

  // Verifica conflito de horário
  const conflict = await db('class_schedules')
    .where({
      class_id: data.classId,
      day_of_week: data.day_of_week,
      ...filters,
    })
    .where(function () {
      this.whereBetween('start_time', [data.start_time, data.end_time])
        .orWhereBetween('end_time', [data.start_time, data.end_time])
        .orWhere(function () {
          this.where('start_time', '<=', data.start_time).andWhere('end_time', '>=', data.end_time);
        });
    })
    .first();

  if (conflict) {
    throw new AppError('Conflito de horário detectado', 400);
  }

  const [id] = await db('class_schedules').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    ...data,
  });

  const schedule = await db('class_schedules').where({ id }).first();
  res.status(201).json(schedule);
};

export const deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const schedule = await db('class_schedules').where({ id, ...filters }).first();
  if (!schedule) throw new AppError('Aula não encontrada', 404);

  await db('class_schedules').where({ id }).delete();
  res.json({ message: 'Aula removida da agenda' });
};

// ==================== ENROLLMENTS ====================

export const listEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { classId } = req.query;
  const filters = getTenantFilters(req);

  let query = db('enrollments')
    .select(
      'enrollments.*',
      'students.ra',
      'students.name as student_name',
      'students.email as student_email',
      'classes.name as class_name'
    )
    .leftJoin('students', 'enrollments.student_id', 'students.id')
    .leftJoin('classes', 'enrollments.class_id', 'classes.id');

  // Aplica filtros de tenant nas tabelas corretas
  if (filters.groupId) {
    query = query.where('enrollments.group_id', filters.groupId);
  }
  if (filters.schoolId) {
    query = query.where('enrollments.school_id', filters.schoolId);
  }

  if (classId) {
    query = query.where('enrollments.class_id', classId as string);
  }

  const enrollments = await query.orderBy('students.name');

  res.json(enrollments);
};

export const createEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const data = createEnrollmentSchema.parse(req.body);
  const filters = getTenantFilters(req);

  // Verifica se já está matriculado
  const existing = await db('enrollments')
    .where({
      class_id: data.classId,
      student_id: data.studentId,
      ...filters,
    })
    .first();

  if (existing) {
    throw new AppError('Aluno já matriculado nesta turma', 400);
  }

  const [id] = await db('enrollments').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    class_id: data.classId,
    student_id: data.studentId,
    status: data.status || 'active',
  });

  const enrollment = await db('enrollments').where({ id }).first();
  res.status(201).json(enrollment);
};

export const deleteEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const enrollment = await db('enrollments').where({ id, ...filters }).first();
  if (!enrollment) throw new AppError('Matrícula não encontrada', 404);

  await db('enrollments').where({ id }).delete();
  res.json({ message: 'Matrícula removida com sucesso' });
};

// ==================== FINANCEIRO (STUDENT PAYMENTS) ====================

export const getFinanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const filters = getTenantFilters(req);
  const { month } = req.query;

  let query = db('student_payments');
  if (filters.groupId) query = query.where('student_payments.group_id', filters.groupId);
  if (filters.schoolId) query = query.where('student_payments.school_id', filters.schoolId);

  if (month) {
    query = query.where('reference_month', month as string);
  }

  // Total esperado
  const [{ total_expected }] = await query.clone().sum('amount as total_expected');

  // Total recebido
  const [{ total_received }] = await query.clone()
    .where('status', 'paid')
    .sum('amount_paid as total_received');

  // Total pendente
  const [{ total_pending }] = await query.clone()
    .where('status', 'pending')
    .sum('amount as total_pending');

  // Total atrasado
  const [{ total_late }] = await query.clone()
    .where('status', 'late')
    .sum('amount as total_late');

  // Quantidade de pagamentos atrasados
  const [{ late_count }] = await query.clone()
    .where('status', 'late')
    .count('* as late_count');

  // Quantidade de alunos inadimplentes
  const [{ defaulters_count }] = await query.clone()
    .where('status', 'late')
    .countDistinct('student_id as defaulters_count');

  res.json({
    total_expected: parseFloat(total_expected || '0'),
    total_received: parseFloat(total_received || '0'),
    total_pending: parseFloat(total_pending || '0'),
    total_late: parseFloat(total_late || '0'),
    late_count: Number(late_count || 0),
    defaulters_count: Number(defaulters_count || 0),
  });
};

export const listStudentPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { status, month, studentId } = req.query;
  const filters = getTenantFilters(req);

  let query = db('student_payments');
  if (filters.groupId) query = query.where('student_payments.group_id', filters.groupId);
  if (filters.schoolId) query = query.where('student_payments.school_id', filters.schoolId);

  if (status) query = query.where('student_payments.status', status as string);
  if (month) query = query.where('reference_month', month as string);
  if (studentId) query = query.where('student_id', parseInt(studentId as string));

  const [{ total }] = await query.clone().count('* as total');

  const payments = await query
    .select(
      'student_payments.*',
      'students.name as student_name',
      'students.ra as student_ra'
    )
    .leftJoin('students', 'student_payments.student_id', 'students.id')
    .orderBy(sortBy || 'student_payments.due_date', sortOrder)
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(payments, Number(total), page, limit));
};

export const listDefaulters = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { page, limit } = getPaginationParams(req);
  const filters = getTenantFilters(req);

  let query = db('student_payments');
  if (filters.groupId) query = query.where('student_payments.group_id', filters.groupId);
  if (filters.schoolId) query = query.where('student_payments.school_id', filters.schoolId);

  query = query.where('status', 'late');

  const [{ total }] = await query.clone().countDistinct('student_id as total');

  const defaulters = await query
    .select(
      'students.id as student_id',
      'students.name as student_name',
      'students.ra as student_ra',
      'students.email as student_email',
      db.raw('COUNT(*) as late_payments_count'),
      db.raw('SUM(student_payments.amount) as total_debt')
    )
    .leftJoin('students', 'student_payments.student_id', 'students.id')
    .groupBy('students.id', 'students.name', 'students.ra', 'students.email')
    .orderBy('total_debt', 'desc')
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(defaulters, Number(total), page, limit));
};

export const generateBoleto = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const filters = getTenantFilters(req);
  const { studentId, referenceMonth, amount, dueDate, description } = req.body;

  if (!studentId || !referenceMonth || !amount || !dueDate) {
    throw new AppError('Dados obrigatórios: studentId, referenceMonth, amount, dueDate', 400);
  }

  // Verificar se já existe pagamento para este aluno neste mês
  const existing = await db('student_payments')
    .where({
      school_id: filters.schoolId,
      student_id: studentId,
      reference_month: referenceMonth,
    })
    .first();

  if (existing) {
    throw new AppError('Já existe um pagamento para este aluno neste mês', 400);
  }

  // Gerar código de barras fictício (em produção, integrar com API de boletos)
  const barcode = `${Math.random().toString().slice(2, 15)}${Date.now().toString().slice(-10)}`;
  
  // Gerar chave PIX fictícia (em produção, usar chave PIX real da escola)
  const pixKey = `escola${filters.schoolId}@easyescola.com`;

  const [id] = await db('student_payments').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    student_id: studentId,
    reference_month: referenceMonth,
    barcode,
    pix_key: pixKey,
    due_date: dueDate,
    amount,
    description: description || `Mensalidade ${referenceMonth}`,
    status: 'pending',
  });

  const payment = await db('student_payments').where({ id }).first();
  res.status(201).json(payment);
};

export const markPaymentAsPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const { paymentMethod, amountPaid, paidDate, notes } = req.body;
  const filters = getTenantFilters(req);

  const payment = await db('student_payments')
    .where('student_payments.id', id)
    .where('student_payments.school_id', filters.schoolId)
    .first();

  if (!payment) throw new AppError('Pagamento não encontrado', 404);

  if (payment.status === 'paid') {
    throw new AppError('Pagamento já foi marcado como pago', 400);
  }

  await db('student_payments')
    .where({ id })
    .update({
      status: 'paid',
      payment_method: paymentMethod || 'boleto',
      amount_paid: amountPaid || payment.amount,
      paid_date: paidDate || new Date().toISOString().split('T')[0],
      notes,
      updated_at: db.fn.now(),
    });

  const updatedPayment = await db('student_payments').where({ id }).first();
  res.json(updatedPayment);
};
