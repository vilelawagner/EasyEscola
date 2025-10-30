import api from '../lib/api'
import { Material } from '../types'

export interface ListMaterialsParams {
  page?: number
  limit?: number
  class_id?: number
  subject_id?: number
}

export interface ListMaterialsResponse {
  data: MaterialWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface MaterialWithDetails extends Material {
  class_name?: string
  subject_name?: string
  teacher_name?: string
}

export interface CreateMaterialData {
  class_id: number
  subject_id: number
  title: string
  description?: string
  visibility: 'class' | 'school' | 'group'
  file: File
}

export interface UpdateMaterialData {
  class_id?: number
  subject_id?: number
  title?: string
  description?: string
  visibility?: 'class' | 'school' | 'group'
}

export const materialService = {
  list: async (params: ListMaterialsParams = {}): Promise<ListMaterialsResponse> => {
    const { data } = await api.get('/teacher/materials', { params })
    return data
  },

  getById: async (id: number): Promise<MaterialWithDetails> => {
    const { data } = await api.get(`/teacher/materials/${id}`)
    return data
  },

  upload: async (materialData: CreateMaterialData): Promise<Material> => {
    const formData = new FormData()
    formData.append('file', materialData.file)
    formData.append('class_id', materialData.class_id.toString())
    formData.append('subject_id', materialData.subject_id.toString())
    formData.append('title', materialData.title)
    formData.append('visibility', materialData.visibility)
    if (materialData.description) {
      formData.append('description', materialData.description)
    }

    const { data } = await api.post('/teacher/materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  update: async (id: number, materialData: UpdateMaterialData): Promise<Material> => {
    const { data } = await api.put(`/teacher/materials/${id}`, materialData)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teacher/materials/${id}`)
  },

  download: async (id: number): Promise<void> => {
    const response = await api.get(`/teacher/materials/${id}/download`, {
      responseType: 'blob',
    })
    
    // Extrair nome do arquivo do header ou usar um padrão
    const contentDisposition = response.headers['content-disposition']
    let filename = `material-${id}`
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
      if (filenameMatch) filename = filenameMatch[1]
    }

    // Criar link temporário e fazer download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }
}
