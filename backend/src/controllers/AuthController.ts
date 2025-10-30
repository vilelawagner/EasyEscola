import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { loginSchema, refreshTokenSchema } from '../schemas/authSchemas';
import { AuthRequest, JWTPayload } from '../types';
import { UserRole } from '../types/enums';
import { AppError } from '../middlewares/errorHandler';
import logger from '../utils/logger';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

/**
 * Login - Gera access token e refresh token
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  // Busca usuário
  const user = await db('users')
    .where({ email })
    .andWhere('is_active', true)
    .first();

  if (!user) {
    throw new AppError('Credenciais inválidas', 401);
  }

  // Valida senha
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Credenciais inválidas', 401);
  }

  // Busca student_id se for aluno
  let studentId = null;
  if (user.role === UserRole.STUDENT) {
    const student = await db('students')
      .where({ school_id: user.school_id })
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .first();
    studentId = student?.id || null;
  }

  // Gera tokens
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    groupId: user.group_id,
    schoolId: user.school_id,
    studentId,
  };

  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES,
  });

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES }
  );

  // Salva refresh token no banco
  await db('users')
    .where({ id: user.id })
    .update({
      refresh_token: refreshToken,
      last_login_at: new Date(),
    });

  logger.info(`Usuário ${user.email} fez login`);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      groupId: user.group_id,
      schoolId: user.school_id,
      studentId,
    },
  });
};

/**
 * Refresh - Gera novo access token usando refresh token
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);

  try {
    // Valida refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: number };

    // Busca usuário e valida refresh token
    const user = await db('users')
      .where({ id: decoded.userId })
      .andWhere('is_active', true)
      .first();

    if (!user || user.refresh_token !== refreshToken) {
      throw new AppError('Refresh token inválido', 403);
    }

    // Busca student_id se for aluno
    let studentId = null;
    if (user.role === UserRole.STUDENT) {
      const student = await db('students')
        .where({ school_id: user.school_id })
        .whereRaw('LOWER(email) = ?', [user.email.toLowerCase()])
        .first();
      studentId = student?.id || null;
    }

    // Gera novo access token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      groupId: user.group_id,
      schoolId: user.school_id,
      studentId,
    };

    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES,
    });

    res.json({ accessToken });
  } catch (error) {
    throw new AppError('Refresh token inválido ou expirado', 403);
  }
};

/**
 * Logout - Invalida refresh token
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  await db('users')
    .where({ id: req.user.userId })
    .update({ refresh_token: null });

  logger.info(`Usuário ${req.user.email} fez logout`);

  res.json({ message: 'Logout realizado com sucesso' });
};

/**
 * Me - Retorna dados do usuário autenticado
 */
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Não autenticado', 401);
  }

  const user = await db('users')
    .select('id', 'name', 'email', 'role', 'group_id', 'school_id', 'is_active', 'last_login_at')
    .where({ id: req.user.userId })
    .first();

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Busca informações adicionais baseado no role
  let additionalData = {};

  if (user.role === UserRole.GROUP_MANAGER && user.group_id) {
    const group = await db('groups')
      .select('id', 'name', 'status')
      .where({ id: user.group_id })
      .first();
    additionalData = { group };
  }

  if (user.school_id) {
    const school = await db('schools')
      .select('id', 'name', 'status')
      .where({ id: user.school_id })
      .first();
    additionalData = { ...additionalData, school };
  }

  if (user.role === UserRole.STUDENT && req.user.studentId) {
    const student = await db('students')
      .select('id', 'ra', 'name', 'status')
      .where({ id: req.user.studentId })
      .first();
    additionalData = { ...additionalData, student };
  }

  if (user.role === UserRole.TEACHER && user.school_id) {
    const teacher = await db('teachers')
      .select('id', 'name', 'register_code', 'status')
      .where({ school_id: user.school_id })
      .whereRaw('LOWER(email) = ?', [user.email.toLowerCase()])
      .first();
    additionalData = { ...additionalData, teacher };
  }

  res.json({
    ...user,
    ...additionalData,
  });
};

/**
 * Alterar senha do usuário autenticado
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Não autenticado', 401);

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Campos obrigatórios: currentPassword, newPassword', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('A nova senha deve ter no mínimo 6 caracteres', 400);
  }

  const user = await db('users').where('id', req.user.userId).first();
  if (!user) throw new AppError('Usuário não encontrado', 404);

  const bcrypt = require('bcryptjs');
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new AppError('Senha atual incorreta', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db('users')
    .where('id', req.user.userId)
    .update({
      password: hashedPassword,
      updated_at: db.fn.now(),
    });

  res.json({ message: 'Senha alterada com sucesso' });
};
