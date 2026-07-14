import { api } from './client'

export const mediaApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ data: { url: string } }>('/admin/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
