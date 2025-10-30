import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserRole, AccessLevel } from '../types/enums';

/**
 * Middleware RBAC - Verifica se o usuário tem uma das roles permitidas
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado - permissões insuficientes' });
      return;
    }

    next();
  };
};

/**
 * Retorna o nível de acesso baseado na role
 */
export const getAccessLevel = (role: UserRole): AccessLevel => {
  switch (role) {
    case UserRole.SUPERADMIN:
      return AccessLevel.GLOBAL;
    case UserRole.GROUP_MANAGER:
      return AccessLevel.GROUP;
    case UserRole.SCHOOL_SECRETARY:
    case UserRole.TEACHER:
      return AccessLevel.SCHOOL;
    case UserRole.STUDENT:
      return AccessLevel.STUDENT;
    default:
      return AccessLevel.STUDENT;
  }
};

/**
 * Verifica se o usuário pode acessar um determinado recurso baseado em groupId
 */
export const canAccessGroup = (req: AuthRequest, targetGroupId: number): boolean => {
  if (!req.user) return false;

  const accessLevel = getAccessLevel(req.user.role);

  // Superadmin acessa tudo
  if (accessLevel === AccessLevel.GLOBAL) return true;

  // Outros níveis precisam ter groupId e ele deve corresponder
  return req.user.groupId === targetGroupId;
};

/**
 * Verifica se o usuário pode acessar um determinado recurso baseado em schoolId
 */
export const canAccessSchool = (req: AuthRequest, targetSchoolId: number): boolean => {
  if (!req.user) return false;

  const accessLevel = getAccessLevel(req.user.role);

  // Superadmin acessa tudo
  if (accessLevel === AccessLevel.GLOBAL) return true;

  // Precisa ter schoolId e ele deve corresponder
  return req.user.schoolId === targetSchoolId;
};

/**
 * Middleware que garante acesso apenas ao próprio aluno
 */
export const requireOwnStudent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  if (req.user.role !== UserRole.STUDENT) {
    res.status(403).json({ error: 'Acesso apenas para alunos' });
    return;
  }

  next();
};
