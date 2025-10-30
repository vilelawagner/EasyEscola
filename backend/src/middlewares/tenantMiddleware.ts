import { Knex } from 'knex';
import { AuthRequest } from '../types';
import { UserRole, AccessLevel } from '../types/enums';
import { getAccessLevel } from './rbacMiddleware';

/**
 * TenantGuard - Injeta filtros automáticos nas queries baseado no nível de acesso
 * 
 * N1 (Superadmin): Acesso global, sem filtros
 * N2 (Gestor Grupo): Filtra por group_id
 * N3 (Secretaria/Professor): Filtra por group_id + school_id
 * N4 (Aluno): Filtra por group_id + school_id + student_id (onde aplicável)
 */

export interface TenantFilters {
  groupId?: number;
  schoolId?: number;
  studentId?: number;
}

/**
 * Aplica filtros de tenant em uma query Knex
 */
export const applyTenantFilter = (
  query: Knex.QueryBuilder,
  req: AuthRequest,
  tableName?: string
): Knex.QueryBuilder => {
  if (!req.user) {
    throw new Error('Usuário não autenticado');
  }

  const accessLevel = getAccessLevel(req.user.role);
  const prefix = tableName ? `${tableName}.` : '';

  switch (accessLevel) {
    case AccessLevel.GLOBAL:
      // Superadmin: sem filtros
      break;

    case AccessLevel.GROUP:
      // Gestor do Grupo: filtra por group_id
      if (req.user.groupId) {
        query.where(`${prefix}group_id`, req.user.groupId);
      }
      break;

    case AccessLevel.SCHOOL:
      // Secretaria/Professor: filtra por group_id + school_id
      if (req.user.groupId) {
        query.where(`${prefix}group_id`, req.user.groupId);
      }
      if (req.user.schoolId) {
        query.where(`${prefix}school_id`, req.user.schoolId);
      }
      break;

    case AccessLevel.STUDENT:
      // Aluno: filtra por group_id + school_id
      if (req.user.groupId) {
        query.where(`${prefix}group_id`, req.user.groupId);
      }
      if (req.user.schoolId) {
        query.where(`${prefix}school_id`, req.user.schoolId);
      }
      // Para tabelas específicas do aluno (notas, faltas, etc)
      // adicionar filtro de student_id onde apropriado
      break;
  }

  return query;
};

/**
 * Retorna os filtros de tenant para uso em queries
 */
export const getTenantFilters = (req: AuthRequest): TenantFilters => {
  if (!req.user) {
    throw new Error('Usuário não autenticado');
  }

  const accessLevel = getAccessLevel(req.user.role);
  const filters: TenantFilters = {};

  switch (accessLevel) {
    case AccessLevel.GLOBAL:
      // Sem filtros
      break;

    case AccessLevel.GROUP:
      if (req.user.groupId) {
        filters.groupId = req.user.groupId;
      }
      break;

    case AccessLevel.SCHOOL:
      if (req.user.groupId) {
        filters.groupId = req.user.groupId;
      }
      if (req.user.schoolId) {
        filters.schoolId = req.user.schoolId;
      }
      break;

    case AccessLevel.STUDENT:
      if (req.user.groupId) {
        filters.groupId = req.user.groupId;
      }
      if (req.user.schoolId) {
        filters.schoolId = req.user.schoolId;
      }
      if (req.user.studentId) {
        filters.studentId = req.user.studentId;
      }
      break;
  }

  return filters;
};

/**
 * Valida se os dados fornecidos respeitam o tenant do usuário
 */
export const validateTenantData = (
  req: AuthRequest,
  data: Partial<TenantFilters>
): boolean => {
  if (!req.user) return false;

  const accessLevel = getAccessLevel(req.user.role);

  // Superadmin pode criar em qualquer tenant
  if (accessLevel === AccessLevel.GLOBAL) return true;

  // Gestor do Grupo só pode criar no seu grupo
  if (accessLevel === AccessLevel.GROUP) {
    if (data.groupId && data.groupId !== req.user.groupId) {
      return false;
    }
  }

  // Secretaria/Professor só pode criar no seu grupo e escola
  if (accessLevel === AccessLevel.SCHOOL) {
    if (data.groupId && data.groupId !== req.user.groupId) {
      return false;
    }
    if (data.schoolId && data.schoolId !== req.user.schoolId) {
      return false;
    }
  }

  // Aluno não pode criar
  if (accessLevel === AccessLevel.STUDENT) {
    return false;
  }

  return true;
};
