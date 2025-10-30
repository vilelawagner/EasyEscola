import api from '../lib/api';
import { School } from '../types';

export interface ListSchoolsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
}

export interface ListSchoolsResponse {
  data: School[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateSchoolData {
  name: string;
  cnpj: string;
  phone?: string;
  email?: string;
  address?: string;
  status: 'active' | 'inactive';
}

export interface UpdateSchoolData {
  name?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'active' | 'inactive';
}

export const schoolService = {
  list: async (params: ListSchoolsParams = {}): Promise<ListSchoolsResponse> => {
    const { data } = await api.get('/group/schools', { params });
    return data;
  },

  getById: async (id: number): Promise<School> => {
    const { data } = await api.get(`/group/schools/${id}`);
    return data;
  },

  create: async (schoolData: CreateSchoolData): Promise<School> => {
    // Converte cnpj para doc_cnpj que o backend espera
    const { cnpj, ...rest } = schoolData;
    const payload = { ...rest, doc_cnpj: cnpj };
    const { data } = await api.post('/group/schools', payload);
    return data;
  },

  update: async (id: number, schoolData: UpdateSchoolData): Promise<School> => {
    // Converte cnpj para doc_cnpj que o backend espera
    const { cnpj, ...rest } = schoolData;
    const payload = cnpj ? { ...rest, doc_cnpj: cnpj } : rest;
    const { data } = await api.put(`/group/schools/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/group/schools/${id}`);
  },
};
