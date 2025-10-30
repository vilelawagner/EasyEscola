import api from '../lib/api';
import { School } from '../types';

export interface SchoolWithGroup extends School {
  group_name?: string;
  total_students?: number;
  total_teachers?: number;
}

export interface ListAllSchoolsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  group_id?: number;
}

export interface ListAllSchoolsResponse {
  data: SchoolWithGroup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminSchoolService = {
  listAll: async (params: ListAllSchoolsParams = {}): Promise<ListAllSchoolsResponse> => {
    const { data } = await api.get('/admin/schools', { params });
    return data;
  },

  updateStatus: async (id: number, status: 'active' | 'inactive'): Promise<School> => {
    const { data } = await api.put(`/admin/schools/${id}/status`, { status });
    return data;
  },
};
