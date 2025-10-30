import api from '../lib/api'
import { Class } from '../types'

export interface ListClassesParams {
  page?: number
  limit?: number
  search?: string
}

export interface ListClassesResponse {
  data: Class[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateClassData {
  name: string
  year: number
  semester: number
  shift: 'morning' | 'afternoon' | 'night'
  capacity: number
  status: 'active' | 'inactive'
}

export interface UpdateClassData extends Partial<CreateClassData> {}

export const classService = {
  list: async (params: ListClassesParams = {}): Promise<ListClassesResponse> => {
    const { data } = await api.get('/school/classes', { params })
    return data
  },

  getById: async (id: number): Promise<Class> => {
    const { data } = await api.get(`/school/classes/${id}`)
    return data
  },

  create: async (classData: CreateClassData): Promise<Class> => {
    const { data } = await api.post('/school/classes', classData)
    return data
  },

  update: async (id: number, classData: UpdateClassData): Promise<Class> => {
    const { data } = await api.put(`/school/classes/${id}`, classData)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/school/classes/${id}`)
  }
}
