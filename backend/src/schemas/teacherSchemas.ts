import { z } from 'zod';
import { Term } from '../types/enums';

export const createGradeSchema = z.object({
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  term: z.nativeEnum(Term),
  grade: z.number().min(0).max(10),
  comments: z.string().optional(),
});

export const updateGradeSchema = z.object({
  grade: z.number().min(0).max(10),
  comments: z.string().optional(),
});

export const createAbsenceSchema = z.object({
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  date: z.string(), // YYYY-MM-DD
  periods: z.number().int().min(1).default(1),
  reason: z.string().optional(),
});

export const updateAbsenceSchema = createAbsenceSchema.partial();

export const uploadMaterialSchema = z.object({
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  visibility: z.enum(['class', 'school', 'group']).default('class'),
});

export type CreateGradeDTO = z.infer<typeof createGradeSchema>;
export type UpdateGradeDTO = z.infer<typeof updateGradeSchema>;
export type CreateAbsenceDTO = z.infer<typeof createAbsenceSchema>;
export type UpdateAbsenceDTO = z.infer<typeof updateAbsenceSchema>;
export type UploadMaterialDTO = z.infer<typeof uploadMaterialSchema>;
