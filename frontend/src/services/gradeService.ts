import api from '../lib/api'
import { Grade } from '../types'

export interface ListGradesParams {
  class_id?: number
  subject_id?: number
  student_id?: number
  term?: string
}

export interface ListGradesResponse {
  data: GradeWithDetails[]
}

export interface GradeWithDetails extends Grade {
  student_name?: string
  subject_name?: string
  class_name?: string
}

export interface CreateGradeData {
  student_id: number
  class_id: number
  subject_id: number
  term: 1 | 2 | 3 | 4 | 'final' | 'recovery'
  grade: number
  comments?: string
}

export interface UpdateGradeData extends Partial<CreateGradeData> {}

export const gradeService = {
  list: async (params: ListGradesParams = {}): Promise<ListGradesResponse> => {
    const { data } = await api.get('/teacher/grades', { params })
    return data
  },

  getById: async (id: number): Promise<GradeWithDetails> => {
    const { data } = await api.get(`/teacher/grades/${id}`)
    return data
  },

  create: async (grade: CreateGradeData): Promise<Grade> => {
    const { data } = await api.post('/teacher/grades', grade)
    return data
  },

  update: async (id: number, grade: UpdateGradeData): Promise<Grade> => {
    const { data } = await api.put(`/teacher/grades/${id}`, grade)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teacher/grades/${id}`)
  },

  // Buscar notas de uma turma/disciplina específica
  getByClassAndSubject: async (classId: number, subjectId: number, term?: string): Promise<GradeWithDetails[]> => {
    const { data } = await api.get('/teacher/grades', {
      params: { class_id: classId, subject_id: subjectId, term }
    })
    return data.data
  }
}
