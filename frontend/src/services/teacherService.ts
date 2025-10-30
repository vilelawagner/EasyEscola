import api from '../lib/api'
import { Teacher } from '../types'

export interface ListTeachersParams {
  page?: number
  limit?: number
  search?: string
}

export interface ListTeachersResponse {
  data: Teacher[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateTeacherData {
  name: string
  cpf: string
  birthdate: string
  gender: 'M' | 'F'
  phone: string
  email: string
  specialization?: string
  status: 'active' | 'inactive'
}

export interface UpdateTeacherData extends Partial<CreateTeacherData> {}

export const teacherService = {
  list: async (params: ListTeachersParams = {}): Promise<ListTeachersResponse> => {
    const { data } = await api.get('/school/teachers', { params })
    return data
  },

  getById: async (id: number): Promise<Teacher> => {
    const { data } = await api.get(`/school/teachers/${id}`)
    return data
  },

  create: async (teacher: CreateTeacherData): Promise<Teacher> => {
    const { data } = await api.post('/school/teachers', teacher)
    return data
  },

  update: async (id: number, teacher: UpdateTeacherData): Promise<Teacher> => {
    const { data } = await api.put(`/school/teachers/${id}`, teacher)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/school/teachers/${id}`)
  }
}
