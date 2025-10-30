import { Request } from 'express';
import { PaginationParams } from '../types';

/**
 * Extrai parâmetros de paginação da query string
 */
export const getPaginationParams = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const sortBy = (req.query.sortBy as string) || 'id';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

  return {
    page,
    limit,
    sortBy,
    sortOrder,
  };
};

/**
 * Calcula o offset para queries SQL
 */
export const getOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Gera objeto de resposta paginada
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
