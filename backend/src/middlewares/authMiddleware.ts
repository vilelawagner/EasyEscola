import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types';
import logger from '../utils/logger';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET não configurado');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    logger.error('Erro na autenticação:', error);
    res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const secret = process.env.JWT_ACCESS_SECRET;
      if (secret) {
        const decoded = jwt.verify(token, secret) as JWTPayload;
        (req as AuthRequest).user = decoded;
      }
    }
    next();
  } catch (error) {
    // Token inválido mas não obrigatório
    next();
  }
};
