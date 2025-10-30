import { z } from 'zod';
import { RequestType } from '../types/enums';

export const createRequestSchema = z.object({
  type: z.nativeEnum(RequestType),
  payload: z.record(z.any()).optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']),
  response: z.string().optional(),
});

export type CreateRequestDTO = z.infer<typeof createRequestSchema>;
export type UpdateRequestStatusDTO = z.infer<typeof updateRequestStatusSchema>;
