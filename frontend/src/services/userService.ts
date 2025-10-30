import api from '../lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  group_id?: number;
  school_id?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  // Join fields
  group_name?: string;
  school_name?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  groupId?: number;
  schoolId?: number;
  status?: 'active' | 'inactive';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  groupId?: number;
  schoolId?: number;
  status?: 'active' | 'inactive';
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Admin - todos os usuários
export const adminUserService = {
  async list(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    groupId?: number;
    schoolId?: number;
    search?: string;
  }) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async get(id: number): Promise<User> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  async create(data: CreateUserData): Promise<User> {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  async update(id: number, data: UpdateUserData): Promise<User> {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },
};

// Group - usuários do grupo
export const groupUserService = {
  async list(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    schoolId?: number;
    search?: string;
  }) {
    const response = await api.get('/group/users', { params });
    return response.data;
  },

  async create(data: Omit<CreateUserData, 'groupId'>): Promise<User> {
    const response = await api.post('/group/users', data);
    return response.data;
  },

  async update(id: number, data: UpdateUserData): Promise<User> {
    const response = await api.put(`/group/users/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/group/users/${id}`);
  },
};

// School - usuários da escola
export const schoolUserService = {
  async list(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const response = await api.get('/school/users', { params });
    return response.data;
  },

  async create(data: Omit<CreateUserData, 'groupId' | 'schoolId'>): Promise<User> {
    const response = await api.post('/school/users', data);
    return response.data;
  },

  async update(id: number, data: UpdateUserData): Promise<User> {
    const response = await api.put(`/school/users/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/school/users/${id}`);
  },
};

// Todos os usuários - alterar senha
export const authService = {
  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.post('/auth/change-password', data);
  },
};
