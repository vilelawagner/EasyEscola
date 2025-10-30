// ==================== USER & AUTH ====================

export enum UserRole {
  ROLE_SUPERADMIN = 'ROLE_SUPERADMIN',
  ROLE_GROUP_MANAGER = 'ROLE_GROUP_MANAGER',
  ROLE_SCHOOL_SECRETARY = 'ROLE_SCHOOL_SECRETARY',
  ROLE_TEACHER = 'ROLE_TEACHER',
  ROLE_STUDENT = 'ROLE_STUDENT',
}

export interface User {
  id: number;
  group_id: number | null;
  school_id: number | null;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  studentId?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ==================== GROUP ====================

export interface Group {
  id: number;
  name: string;
  cnpj: string;
  phone: string | null;
  email: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

// ==================== SCHOOL ====================

export interface School {
  id: number;
  group_id: number;
  name: string;
  cnpj?: string;
  doc_cnpj?: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city?: string;
  state?: string;
  zip?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

// ==================== STUDENT ====================

export interface Student {
  id: number;
  group_id: number;
  school_id: number;
  name: string;
  cpf: string;
  ra: string;
  birthdate: string;
  gender: 'M' | 'F' | 'other';
  phone: string | null;
  email: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_cpf: string;
  address: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

// ==================== TEACHER ====================

export interface Teacher {
  id: number;
  group_id: number;
  school_id: number;
  name: string;
  cpf: string;
  birthdate: string;
  gender: 'M' | 'F' | 'other';
  phone: string | null;
  email: string | null;
  specialization: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

// ==================== SUBJECT ====================

export interface Subject {
  id: number;
  group_id: number;
  school_id: number;
  name: string;
  code: string;
  description: string | null;
  workload: number | null;
  created_at: string;
}

// ==================== CLASS ====================

export interface Class {
  id: number;
  group_id: number;
  school_id: number;
  name: string;
  year: number;
  semester: number;
  shift: 'morning' | 'afternoon' | 'night';
  capacity: number;
  status: 'active' | 'inactive';
  created_at: string;
}

// ==================== ENROLLMENT ====================

export interface Enrollment {
  id: number;
  group_id: number;
  school_id: number;
  student_id: number;
  class_id: number;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  created_at: string;
}

// ==================== GRADE ====================

export interface Grade {
  id: number;
  group_id: number;
  school_id: number;
  student_id: number;
  class_id: number;
  subject_id: number;
  term: 1 | 2 | 3 | 4 | 'final' | 'recovery';
  grade: number;
  comments: string | null;
  recorded_at: string;
  created_at: string;
}

// ==================== ABSENCE ====================

export interface Absence {
  id: number;
  group_id: number;
  school_id: number;
  student_id: number;
  subject_id: number;
  date: string;
  periods: number;
  reason: string | null;
  created_at: string;
}

// ==================== MATERIAL ====================

export interface Material {
  id: number;
  group_id: number;
  school_id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  title: string;
  description: string | null;
  file_path: string;
  filename: string;
  file_type: string;
  file_size: number;
  visibility: 'class' | 'school' | 'group';
  published_at: string;
  uploaded_at: string;
  created_at: string;
}

// ==================== PAYMENT ====================

export interface Payment {
  id: number;
  group_id: number;
  school_id: number;
  student_id: number;
  reference_month: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

// ==================== REQUEST ====================

export interface Request {
  id: number;
  group_id: number;
  school_id: number;
  student_id: number;
  type: 'certificate' | 'declaration' | 'transcript' | 'other';
  payload: Record<string, any>;
  status: 'open' | 'in_progress' | 'completed' | 'rejected';
  response: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== NOTIFICATION ====================

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== API ERROR ====================

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
