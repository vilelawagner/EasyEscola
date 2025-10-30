import api from '@/lib/api';
import { Student, PaginatedResponse } from '@/types';

export const studentService = {
  // LIST
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Student>> => {
    const { data } = await api.get('/school/students', { params });
    return data;
  },

  // GET BY ID
  getById: async (id: number): Promise<Student> => {
    const { data } = await api.get(`/school/students/${id}`);
    return data;
  },

  // CREATE
  create: async (student: Partial<Student>): Promise<Student> => {
    const { data } = await api.post('/school/students', student);
    return data;
  },

  // UPDATE
  update: async (id: number, student: Partial<Student>): Promise<Student> => {
    const { data } = await api.put(`/school/students/${id}`, student);
    return data;
  },

  // DELETE
  delete: async (id: number): Promise<void> => {
    await api.delete(`/school/students/${id}`);
  },
};
