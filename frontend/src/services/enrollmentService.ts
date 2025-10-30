import api from '../lib/api'
import { Enrollment } from '../types'

export interface ListEnrollmentsParams {
  page?: number
  limit?: number
  search?: string
  class_id?: number
  student_id?: number
}

export interface ListEnrollmentsResponse {
  data: EnrollmentWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface EnrollmentWithDetails extends Enrollment {
  student_name?: string
  class_name?: string
}

export interface CreateEnrollmentData {
  student_id: number
  class_id: number
  enrollment_date: string
  status: 'active' | 'inactive' | 'transferred' | 'graduated'
}

export interface UpdateEnrollmentData extends Partial<CreateEnrollmentData> {}

export const enrollmentService = {
  list: async (params: ListEnrollmentsParams = {}): Promise<ListEnrollmentsResponse> => {
    const { data } = await api.get('/school/enrollments', { params })
    return data
  },

  getById: async (id: number): Promise<EnrollmentWithDetails> => {
    const { data } = await api.get(`/school/enrollments/${id}`)
    return data
  },

  create: async (enrollment: CreateEnrollmentData): Promise<Enrollment> => {
    const { data } = await api.post('/school/enrollments', enrollment)
    return data
  },

  update: async (id: number, enrollment: UpdateEnrollmentData): Promise<Enrollment> => {
    const { data } = await api.put(`/school/enrollments/${id}`, enrollment)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/school/enrollments/${id}`)
  }
}
