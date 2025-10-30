import { z } from 'zod';
import { Status, Shift } from '../types/enums';

export const createStudentSchema = z.object({
  ra: z.string().min(1, 'RA é obrigatório'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido').optional(),
  birthdate: z.string().optional(),
  cpf: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export const createTeacherSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido').optional(),
  register_code: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  code: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createClassSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  year: z.number().int().min(2020).max(2100),
  semester: z.number().int().min(1).max(2),
  shift: z.nativeEnum(Shift),
  status: z.nativeEnum(Status).optional(),
});

export const updateClassSchema = createClassSchema.partial();

export const createClassSubjectSchema = z.object({
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  teacherId: z.number().int().positive(),
});

export const createScheduleSchema = z.object({
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  teacherId: z.number().int().positive(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido (HH:MM)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido (HH:MM)'),
  room: z.string().optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export const createEnrollmentSchema = z.object({
  classId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  status: z.nativeEnum(Status).optional(),
});

export type CreateStudentDTO = z.infer<typeof createStudentSchema>;
export type UpdateStudentDTO = z.infer<typeof updateStudentSchema>;
export type CreateTeacherDTO = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherDTO = z.infer<typeof updateTeacherSchema>;
export type CreateSubjectDTO = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectDTO = z.infer<typeof updateSubjectSchema>;
export type CreateClassDTO = z.infer<typeof createClassSchema>;
export type UpdateClassDTO = z.infer<typeof updateClassSchema>;
export type CreateClassSubjectDTO = z.infer<typeof createClassSubjectSchema>;
export type CreateScheduleDTO = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleDTO = z.infer<typeof updateScheduleSchema>;
export type CreateEnrollmentDTO = z.infer<typeof createEnrollmentSchema>;
