import { Request } from 'express';
import { UserRole } from './enums';

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  groupId: number | null;
  schoolId: number | null;
  studentId?: number | null;
  isImpersonated?: boolean;
  originalUserId?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface TenantContext {
  userId: number;
  role: UserRole;
  groupId: number | null;
  schoolId: number | null;
  studentId: number | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}
