import { z } from 'zod';
import { Status } from '../types/enums';

export const createGroupSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  doc_cnpj: z.string().optional(),
  cnpj: z.string().optional(), // Aceitar ambos formatos
  email: z.string().email('E-mail inválido').optional(),
  phone: z.string().optional(),
  billing_plan: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const createSchoolSchema = z.object({
  groupId: z.number().int().positive(),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  doc_cnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  zip: z.string().optional(),
  email: z.string().email('E-mail inválido').optional(),
  phone: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
});

export const updateSchoolSchema = createSchoolSchema.partial().omit({ groupId: true });

export const updatePaymentSchema = z.object({
  paid_date: z.string().optional(),
  method: z.enum(['pix', 'boleto', 'cartao', 'transferencia']).optional(),
  status: z.enum(['paid', 'pending', 'late']).optional(),
  notes: z.string().optional(),
});

export const impersonateSchema = z.object({
  userId: z.number().int().positive('ID do usuário é obrigatório'),
});

export type CreateGroupDTO = z.infer<typeof createGroupSchema>;
export type UpdateGroupDTO = z.infer<typeof updateGroupSchema>;
export type CreateSchoolDTO = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolDTO = z.infer<typeof updateSchoolSchema>;
export type UpdatePaymentDTO = z.infer<typeof updatePaymentSchema>;
export type ImpersonateDTO = z.infer<typeof impersonateSchema>;
