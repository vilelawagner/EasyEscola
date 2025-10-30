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

  let query = db('students').select('*');
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

  let query = db('teachers').select('*');
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

  let query = db('subjects').select('*');
  applyTenantFilter(query, req);

  const [{ total }] = await query.clone().count('* as total');
  const subjects = await query
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

  let query = db('classes').select('*');
  applyTenantFilter(query, req);

  if (year) query = query.where('year', year as string);
  if (semester) query = query.where('semester', semester as string);

  const [{ total }] = await query.clone().count('* as total');
  const classes = await query
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
      'students.email as student_email'
    )
    .leftJoin('students', 'enrollments.student_id', 'students.id')
    .where(filters);

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
