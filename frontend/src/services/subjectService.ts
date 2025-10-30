import api from '../lib/api'
import { Subject } from '../types'

export interface ListSubjectsParams {
  page?: number
  limit?: number
  search?: string
}

export interface ListSubjectsResponse {
  data: Subject[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateSubjectData {
  name: string
  code: string
  description?: string
  workload?: number
}

export interface UpdateSubjectData extends Partial<CreateSubjectData> {}

export const subjectService = {
  list: async (params: ListSubjectsParams = {}): Promise<ListSubjectsResponse> => {
    const { data } = await api.get('/school/subjects', { params })
    return data
  },

  getById: async (id: number): Promise<Subject> => {
    const { data } = await api.get(`/school/subjects/${id}`)
    return data
  },

  create: async (subject: CreateSubjectData): Promise<Subject> => {
    const { data } = await api.post('/school/subjects', subject)
    return data
  },

  update: async (id: number, subject: UpdateSubjectData): Promise<Subject> => {
    const { data } = await api.put(`/school/subjects/${id}`, subject)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/school/subjects/${id}`)
  }
}
