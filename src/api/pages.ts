import { api } from './client'

export const pagesApi = {
  list: () => api.get('/admin/pages'),
  get: (id: number) => api.get(`/admin/pages/${id}`),
  update: (id: number, payload: unknown) => api.put(`/admin/pages/${id}`, payload),
}
