import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import { createRequestSchema, updateRequestStatusSchema } from '../schemas/studentSchemas';

// ==================== OVERVIEW ====================

export const getOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const studentId = req.user.studentId;

  // Dados do aluno
  const student = await db('students').where({ id: studentId }).first();
  if (!student) throw new AppError('Aluno não encontrado', 404);

  // Turma atual
  const enrollment = await db('enrollments')
    .select('classes.name as class_name', 'classes.shift')
    .leftJoin('classes', 'enrollments.class_id', 'classes.id')
    .where('enrollments.student_id', studentId)
    .andWhere('enrollments.status', 'active')
    .first();

  // Média geral
  const [{ avg_grade }] = await db('grades')
    .where({ student_id: studentId })
    .avg('grade as avg_grade');

  // Total de faltas no semestre
  const [{ total_absences }] = await db('absences')
    .where({ student_id: studentId })
    .sum('periods as total_absences');

  res.json({
    student,
    enrollment,
    avg_grade: avg_grade ? parseFloat(avg_grade).toFixed(2) : null,
    total_absences: total_absences || 0,
  });
};

// ==================== SUBJECTS ====================

export const listMySubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const studentId = req.user.studentId;

  // Busca turma do aluno
  const enrollment = await db('enrollments')
    .where('student_id', studentId)
    .andWhere('status', 'active')
    .first();

  if (!enrollment) {
    return res.json([]);
  }

  // Disciplinas da turma
  const subjects = await db('class_subjects')
    .select(
      'subjects.id',
      'subjects.name',
      'subjects.code',
      'subjects.description',
      'teachers.name as teacher_name'
    )
    .leftJoin('subjects', 'class_subjects.subject_id', 'subjects.id')
    .leftJoin('teachers', 'class_subjects.teacher_id', 'teachers.id')
    .where('class_subjects.class_id', enrollment.class_id);

  res.json(subjects);
};

// ==================== MATERIALS ====================

export const listMyMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const { subjectId } = req.query;
  const studentId = req.user.studentId;

  // Busca turma do aluno
  const enrollment = await db('enrollments')
    .where('student_id', studentId)
    .andWhere('status', 'active')
    .first();

  if (!enrollment) {
    return res.json([]);
  }

  let query = db('materials')
    .select(
      'materials.*',
      'subjects.name as subject_name',
      'teachers.name as teacher_name'
    )
    .leftJoin('subjects', 'materials.subject_id', 'subjects.id')
    .leftJoin('teachers', 'materials.teacher_id', 'teachers.id')
    .where('materials.class_id', enrollment.class_id)
    .where((builder) => {
      builder
        .where('materials.visibility', 'class')
        .orWhere('materials.visibility', 'school')
        .orWhere('materials.visibility', 'group');
    });

  if (subjectId) {
    query = query.where('materials.subject_id', subjectId as string);
  }

  const materials = await query.orderBy('materials.published_at', 'desc');

  res.json(materials);
};

// ==================== GRADES & ABSENCES ====================

export const getMyGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const studentId = req.user.studentId;

  const grades = await db('grades')
    .select(
      'grades.*',
      'subjects.name as subject_name',
      'subjects.code as subject_code'
    )
    .leftJoin('subjects', 'grades.subject_id', 'subjects.id')
    .where('grades.student_id', studentId)
    .orderBy('subjects.name')
    .orderBy('grades.term');

  // Agrupa por disciplina
  const gradesBySubject: Record<string, any> = {};

  for (const grade of grades) {
    const key = `${grade.subject_id}`;
    if (!gradesBySubject[key]) {
      gradesBySubject[key] = {
        subject_id: grade.subject_id,
        subject_name: grade.subject_name,
        subject_code: grade.subject_code,
        grades: [],
      };
    }
    gradesBySubject[key].grades.push({
      term: grade.term,
      grade: grade.grade,
      comments: grade.comments,
      recorded_at: grade.recorded_at,
    });
  }

  res.json(Object.values(gradesBySubject));
};

export const getMyAbsences = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const studentId = req.user.studentId;

  const absences = await db('absences')
    .select(
      'absences.*',
      'subjects.name as subject_name'
    )
    .leftJoin('subjects', 'absences.subject_id', 'subjects.id')
    .where('absences.student_id', studentId)
    .orderBy('absences.date', 'desc');

  // Agrupa por disciplina
  const absencesBySubject: Record<string, any> = {};

  for (const absence of absences) {
    const key = `${absence.subject_id}`;
    if (!absencesBySubject[key]) {
      absencesBySubject[key] = {
        subject_id: absence.subject_id,
        subject_name: absence.subject_name,
        total_periods: 0,
        absences: [],
      };
    }
    absencesBySubject[key].total_periods += absence.periods;
    absencesBySubject[key].absences.push({
      date: absence.date,
      periods: absence.periods,
      reason: absence.reason,
    });
  }

  res.json(Object.values(absencesBySubject));
};

// ==================== HISTORY ====================

export const getMyHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const studentId = req.user.studentId;

  // Busca todas as matrículas do aluno
  const enrollments = await db('enrollments')
    .select(
      'enrollments.*',
      'classes.name as class_name',
      'classes.year',
      'classes.semester'
    )
    .leftJoin('classes', 'enrollments.class_id', 'classes.id')
    .where('enrollments.student_id', studentId)
    .orderBy('classes.year', 'desc')
    .orderBy('classes.semester', 'desc');

  // Para cada matrícula, busca as notas
  for (const enrollment of enrollments) {
    const grades = await db('grades')
      .select(
        'grades.term',
        'grades.grade',
        'subjects.name as subject_name'
      )
      .leftJoin('subjects', 'grades.subject_id', 'subjects.id')
      .where('grades.student_id', studentId)
      .andWhere('grades.class_id', enrollment.class_id)
      .orderBy('subjects.name');

    enrollment.grades = grades;
  }

  res.json(enrollments);
};

// ==================== SCHEDULE ====================

export const getMySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const studentId = req.user.studentId;

  // Busca turma do aluno
  const enrollment = await db('enrollments')
    .where('student_id', studentId)
    .andWhere('status', 'active')
    .first();

  if (!enrollment) {
    return res.json([]);
  }

  // Agenda da turma
  const schedule = await db('class_schedules')
    .select(
      'class_schedules.*',
      'subjects.name as subject_name',
      'teachers.name as teacher_name'
    )
    .leftJoin('subjects', 'class_schedules.subject_id', 'subjects.id')
    .leftJoin('teachers', 'class_schedules.teacher_id', 'teachers.id')
    .where('class_schedules.class_id', enrollment.class_id)
    .orderBy('class_schedules.day_of_week')
    .orderBy('class_schedules.start_time');

  res.json(schedule);
};

// ==================== REQUESTS ====================

export const listMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const studentId = req.user.studentId;

  const requests = await db('requests')
    .where('student_id', studentId)
    .orderBy('created_at', 'desc');

  res.json(requests);
};

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const data = createRequestSchema.parse(req.body);
  const studentId = req.user.studentId;

  // Busca dados do aluno
  const student = await db('students').where({ id: studentId }).first();
  if (!student) throw new AppError('Aluno não encontrado', 404);

  const [id] = await db('requests').insert({
    group_id: student.group_id,
    school_id: student.school_id,
    student_id: studentId,
    type: data.type,
    payload: JSON.stringify(data.payload || {}),
    status: 'open',
  });

  const request = await db('requests').where({ id }).first();
  res.status(201).json(request);
};

export const getRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const { id } = req.params;
  const studentId = req.user.studentId;

  const request = await db('requests')
    .where({ id, student_id: studentId })
    .first();

  if (!request) throw new AppError('Solicitação não encontrada', 404);

  res.json(request);
};

// ==================== NOTIFICATIONS ====================

export const listMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const userId = req.user.userId;

  const notifications = await db('notifications')
    .where('user_id', userId)
    .orderBy('created_at', 'desc')
    .limit(50);

  res.json(notifications);
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const userId = req.user.userId;

  const notification = await db('notifications')
    .where({ id, user_id: userId })
    .first();

  if (!notification) throw new AppError('Notificação não encontrada', 404);

  await db('notifications')
    .where({ id })
    .update({
      is_read: true,
      read_at: new Date(),
    });

  const updated = await db('notifications').where({ id }).first();
  res.json(updated);
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const userId = req.user.userId;

  await db('notifications')
    .where({ user_id: userId, is_read: false })
    .update({
      is_read: true,
      read_at: new Date(),
    });

  res.json({ message: 'Todas as notificações foram marcadas como lidas' });
};

// ==================== MY DATA ====================

export const getMyData = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.studentId) {
    throw new AppError('Aluno não identificado', 401);
  }

  const studentId = req.user.studentId;

  const student = await db('students')
    .select('students.*', 'schools.name as school_name')
    .leftJoin('schools', 'students.school_id', 'schools.id')
    .where('students.id', studentId)
    .first();

  if (!student) throw new AppError('Aluno não encontrado', 404);

  res.json(student);
};
