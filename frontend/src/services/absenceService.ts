import api from '../lib/api'
import { Absence } from '../types'

export interface ListAbsencesParams {
  student_id?: number
  subject_id?: number
  date?: string
}

export interface ListAbsencesResponse {
  data: AbsenceWithDetails[]
}

export interface AbsenceWithDetails extends Absence {
  student_name?: string
  subject_name?: string
}

export interface CreateAbsenceData {
  student_id: number
  subject_id: number
  date: string
  periods: number
  reason?: string
}

export interface UpdateAbsenceData extends Partial<CreateAbsenceData> {}

export const absenceService = {
  list: async (params: ListAbsencesParams = {}): Promise<ListAbsencesResponse> => {
    const { data } = await api.get('/teacher/absences', { params })
    return data
  },

  getById: async (id: number): Promise<AbsenceWithDetails> => {
    const { data } = await api.get(`/teacher/absences/${id}`)
    return data
  },

  create: async (absence: CreateAbsenceData): Promise<Absence> => {
    const { data } = await api.post('/teacher/absences', absence)
    return data
  },

  update: async (id: number, absence: UpdateAbsenceData): Promise<Absence> => {
    const { data } = await api.put(`/teacher/absences/${id}`, absence)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teacher/absences/${id}`)
  },

  // Buscar faltas de um estudante específico
  getByStudent: async (studentId: number): Promise<AbsenceWithDetails[]> => {
    const { data } = await api.get('/teacher/absences', {
      params: { student_id: studentId }
    })
    return data.data
  }
}
