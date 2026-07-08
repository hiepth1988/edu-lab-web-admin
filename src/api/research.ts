import { api } from './client'

export const researchTopicsApi = {
  list: () => api.get('/admin/research-topics'),
  create: (payload: unknown) => api.post('/admin/research-topics', payload),
  remove: (id: number) => api.delete(`/admin/research-topics/${id}`),
}

export const researchApi = {
  list: () => api.get('/admin/research'),
  get: (id: number) => api.get(`/admin/research/${id}`),
  create: (payload: unknown) => api.post('/admin/research', payload),
  update: (id: number, payload: unknown) => api.put(`/admin/research/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/research/${id}`),
}

export const subscribersApi = {
  list: () => api.get('/admin/subscribers'),
}
