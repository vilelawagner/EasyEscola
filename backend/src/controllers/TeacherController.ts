import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import { getTenantFilters, applyTenantFilter } from '../middlewares/tenantMiddleware';
import {
  createGradeSchema,
  updateGradeSchema,
  createAbsenceSchema,
  updateAbsenceSchema,
  uploadMaterialSchema,
} from '../schemas/teacherSchemas';
import { getPaginationParams, getOffset, createPaginatedResponse } from '../utils/pagination';

// Configuração Multer para upload de materiais
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads/materials';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB padrão
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|zip|doc|docx|ppt|pptx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
});

// ==================== MATERIALS ====================

export const listMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
  const { classId, subjectId } = req.query;
  const filters = getTenantFilters(req);

  let query = db('materials')
    .select(
      'materials.*',
      'classes.name as class_name',
      'subjects.name as subject_name'
    )
    .leftJoin('classes', 'materials.class_id', 'classes.id')
    .leftJoin('subjects', 'materials.subject_id', 'subjects.id')
    .where(filters);

  if (classId) query = query.where('materials.class_id', classId as string);
  if (subjectId) query = query.where('materials.subject_id', subjectId as string);

  // Professor vê apenas seus materiais
  const teacher = await db('teachers')
    .where({ school_id: filters.schoolId })
    .whereRaw('LOWER(email) = ?', [req.user.email.toLowerCase()])
    .first();

  if (teacher) {
    query = query.where('materials.teacher_id', teacher.id);
  }

  const [{ total }] = await query.clone().count('* as total');
  const materials = await query
    .orderBy(`materials.${sortBy || 'published_at'}`, sortOrder)
    .limit(limit)
    .offset(getOffset(page, limit));

  res.json(createPaginatedResponse(materials, total as number, page, limit));
};

export const createMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const file = req.file;
  if (!file) throw new AppError('Arquivo é obrigatório', 400);

  const data = uploadMaterialSchema.parse({
    classId: Number(req.body.classId),
    subjectId: Number(req.body.subjectId),
    title: req.body.title,
    description: req.body.description,
    visibility: req.body.visibility,
  });

  const filters = getTenantFilters(req);

  // Busca o professor
  const teacher = await db('teachers')
    .where({ school_id: filters.schoolId })
    .whereRaw('LOWER(email) = ?', [req.user.email.toLowerCase()])
    .first();

  if (!teacher) throw new AppError('Professor não encontrado', 404);

  const [id] = await db('materials').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    class_id: data.classId,
    subject_id: data.subjectId,
    teacher_id: teacher.id,
    title: data.title,
    description: data.description,
    file_path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    visibility: data.visibility,
  });

  const material = await db('materials').where({ id }).first();
  res.status(201).json(material);
};

export const deleteMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const material = await db('materials').where({ id, ...filters }).first();
  if (!material) throw new AppError('Material não encontrado', 404);

  // Verifica se é o professor dono do material
  const teacher = await db('teachers')
    .where({ school_id: filters.schoolId })
    .whereRaw('LOWER(email) = ?', [req.user.email.toLowerCase()])
    .first();

  if (teacher && material.teacher_id !== teacher.id) {
    throw new AppError('Você só pode excluir seus próprios materiais', 403);
  }

  // Remove arquivo físico
  if (fs.existsSync(material.file_path)) {
    fs.unlinkSync(material.file_path);
  }

  await db('materials').where({ id }).delete();
  res.json({ message: 'Material excluído com sucesso' });
};

export const downloadMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const material = await db('materials').where({ id }).first();
  if (!material) throw new AppError('Material não encontrado', 404);

  if (!fs.existsSync(material.file_path)) {
    throw new AppError('Arquivo não encontrado no servidor', 404);
  }

  res.download(material.file_path, path.basename(material.file_path));
};

// ==================== GRADES ====================

export const listGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { classId, subjectId, term } = req.query;
  const filters = getTenantFilters(req);

  let query = db('grades')
    .select(
      'grades.*',
      'students.ra',
      'students.name as student_name'
    )
    .leftJoin('students', 'grades.student_id', 'students.id')
    .where(filters);

  if (classId) query = query.where('grades.class_id', classId as string);
  if (subjectId) query = query.where('grades.subject_id', subjectId as string);
  if (term) query = query.where('grades.term', term as string);

  const grades = await query.orderBy('students.name');

  res.json(grades);
};

export const createGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const data = createGradeSchema.parse(req.body);
  const filters = getTenantFilters(req);

  // Busca o professor
  const teacher = await db('teachers')
    .where({ school_id: filters.schoolId })
    .whereRaw('LOWER(email) = ?', [req.user.email.toLowerCase()])
    .first();

  if (!teacher) throw new AppError('Professor não encontrado', 404);

  // Verifica se já existe nota
  const existing = await db('grades')
    .where({
      class_id: data.classId,
      subject_id: data.subjectId,
      student_id: data.studentId,
      term: data.term,
      ...filters,
    })
    .first();

  if (existing) {
    throw new AppError('Nota já lançada para este aluno/disciplina/termo', 400);
  }

  const [id] = await db('grades').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    class_id: data.classId,
    subject_id: data.subjectId,
    student_id: data.studentId,
    teacher_id: teacher.id,
    term: data.term,
    grade: data.grade,
    comments: data.comments,
  });

  const grade = await db('grades').where({ id }).first();
  res.status(201).json(grade);
};

export const updateGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const data = updateGradeSchema.parse(req.body);
  const filters = getTenantFilters(req);

  const grade = await db('grades').where({ id, ...filters }).first();
  if (!grade) throw new AppError('Nota não encontrada', 404);

  await db('grades').where({ id }).update({
    grade: data.grade,
    comments: data.comments,
    recorded_at: new Date(),
  });

  const updated = await db('grades').where({ id }).first();
  res.json(updated);
};

// ==================== ABSENCES ====================

export const listAbsences = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { classId, subjectId, studentId, date } = req.query;
  const filters = getTenantFilters(req);

  let query = db('absences')
    .select(
      'absences.*',
      'students.ra',
      'students.name as student_name'
    )
    .leftJoin('students', 'absences.student_id', 'students.id')
    .where(filters);

  if (classId) query = query.where('absences.class_id', classId as string);
  if (subjectId) query = query.where('absences.subject_id', subjectId as string);
  if (studentId) query = query.where('absences.student_id', studentId as string);
  if (date) query = query.where('absences.date', date as string);

  const absences = await query.orderBy('absences.date', 'desc');

  res.json(absences);
};

export const createAbsence = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const data = createAbsenceSchema.parse(req.body);
  const filters = getTenantFilters(req);

  // Busca o professor
  const teacher = await db('teachers')
    .where({ school_id: filters.schoolId })
    .whereRaw('LOWER(email) = ?', [req.user.email.toLowerCase()])
    .first();

  if (!teacher) throw new AppError('Professor não encontrado', 404);

  const [id] = await db('absences').insert({
    group_id: filters.groupId,
    school_id: filters.schoolId,
    class_id: data.classId,
    subject_id: data.subjectId,
    student_id: data.studentId,
    teacher_id: teacher.id,
    date: data.date,
    periods: data.periods,
    reason: data.reason,
  });

  const absence = await db('absences').where({ id }).first();
  res.status(201).json(absence);
};

export const updateAbsence = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const data = updateAbsenceSchema.parse(req.body);
  const filters = getTenantFilters(req);

  const absence = await db('absences').where({ id, ...filters }).first();
  if (!absence) throw new AppError('Falta não encontrada', 404);

  await db('absences').where({ id }).update(data);
  const updated = await db('absences').where({ id }).first();

  res.json(updated);
};

export const deleteAbsence = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { id } = req.params;
  const filters = getTenantFilters(req);

  const absence = await db('absences').where({ id, ...filters }).first();
  if (!absence) throw new AppError('Falta não encontrada', 404);

  await db('absences').where({ id }).delete();
  res.json({ message: 'Falta removida com sucesso' });
};

// ==================== DASHBOARD ====================

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const filters = getTenantFilters(req);

  // Busca o professor
  const teacher = await db('teachers')
    .where({ school_id: filters.schoolId })
    .whereRaw('LOWER(email) = ?', [req.user.email.toLowerCase()])
    .first();

  if (!teacher) throw new AppError('Professor não encontrado', 404);

  // Turmas que leciona
  const myClasses = await db('class_subjects')
    .select('classes.id', 'classes.name', 'classes.shift')
    .leftJoin('classes', 'class_subjects.class_id', 'classes.id')
    .where('class_subjects.teacher_id', teacher.id)
    .andWhere('class_subjects.school_id', filters.schoolId)
    .groupBy('classes.id', 'classes.name', 'classes.shift');

  // Próximas aulas (hoje)
  const today = new Date().getDay();
  const upcomingClasses = await db('class_schedules')
    .select(
      'class_schedules.*',
      'classes.name as class_name',
      'subjects.name as subject_name'
    )
    .leftJoin('classes', 'class_schedules.class_id', 'classes.id')
    .leftJoin('subjects', 'class_schedules.subject_id', 'subjects.id')
    .where('class_schedules.teacher_id', teacher.id)
    .andWhere('class_schedules.day_of_week', today)
    .andWhere('class_schedules.school_id', filters.schoolId)
    .orderBy('class_schedules.start_time');

  // Materiais recentes
  const recentMaterials = await db('materials')
    .select('materials.*', 'subjects.name as subject_name')
    .leftJoin('subjects', 'materials.subject_id', 'subjects.id')
    .where('materials.teacher_id', teacher.id)
    .andWhere('materials.school_id', filters.schoolId)
    .orderBy('materials.published_at', 'desc')
    .limit(5);

  res.json({
    my_classes: myClasses,
    upcoming_classes: upcomingClasses,
    recent_materials: recentMaterials,
  });
};
