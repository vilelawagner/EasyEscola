import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

/**
 * Middleware de auditoria - registra ações importantes em audit_logs
 */
export const auditLog = (action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.json;
    const startTime = Date.now();

    // Captura o payload de entrada
    const requestPayload = {
      method: req.method,
      path: req.path,
      query: req.query,
      body: sanitizePayload(req.body),
      params: req.params,
    };

    // Intercepta a resposta
    res.json = function (data: any): Response {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Registra no banco de forma assíncrona
      setImmediate(async () => {
        try {
          await db('audit_logs').insert({
            user_id: req.user?.userId || null,
            action,
            resource: req.path,
            method: req.method,
            payload_before: JSON.stringify(requestPayload),
            payload_after: statusCode >= 200 && statusCode < 300 ? JSON.stringify(sanitizePayload(data)) : null,
            status_code: statusCode,
            ip_address: getClientIp(req),
            user_agent: req.headers['user-agent'] || null,
            duration_ms: duration,
            created_at: new Date(),
          });
        } catch (error) {
          logger.error('Erro ao registrar auditoria:', error);
        }
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Remove campos sensíveis do payload antes de salvar
 */
const sanitizePayload = (payload: any): any => {
  if (!payload) return payload;

  const sensitive = ['password', 'password_hash', 'token', 'refresh_token', 'secret'];
  const sanitized = { ...payload };

  for (const key of sensitive) {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Obtém o IP real do cliente (considerando proxies)
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};
