import api from '../lib/api';
import { Group } from '../types';

export interface ListGroupsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
}

export interface ListGroupsResponse {
  data: Group[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateGroupData {
  name: string;
  cnpj: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
}

export interface UpdateGroupData {
  name?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export const groupService = {
  list: async (params: ListGroupsParams = {}): Promise<ListGroupsResponse> => {
    const { data } = await api.get('/admin/groups', { params });
    return data;
  },

  getById: async (id: number): Promise<Group> => {
    const { data } = await api.get(`/admin/groups/${id}`);
    return data;
  },

  create: async (groupData: CreateGroupData): Promise<Group> => {
    const { data } = await api.post('/admin/groups', groupData);
    return data;
  },

  update: async (id: number, groupData: UpdateGroupData): Promise<Group> => {
    const { data } = await api.put(`/admin/groups/${id}`, groupData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/groups/${id}`);
  },
};
