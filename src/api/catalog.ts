import { api } from './client'

export const solutionsApi = {
  list: () => api.get('/admin/solutions'),
  get: (id: number) => api.get(`/admin/solutions/${id}`),
  create: (payload: unknown) => api.post('/admin/solutions', payload),
  update: (id: number, payload: unknown) => api.put(`/admin/solutions/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/solutions/${id}`),
}

export const productsApi = {
  list: () => api.get('/admin/products'),
  get: (id: number) => api.get(`/admin/products/${id}`),
  create: (payload: unknown) => api.post('/admin/products', payload),
  update: (id: number, payload: unknown) => api.put(`/admin/products/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/products/${id}`),
}

export const projectsApi = {
  list: () => api.get('/admin/projects'),
  get: (id: number) => api.get(`/admin/projects/${id}`),
  create: (payload: unknown) => api.post('/admin/projects', payload),
  update: (id: number, payload: unknown) => api.put(`/admin/projects/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/projects/${id}`),
}

export const audiencesApi = {
  list: () => api.get('/admin/audiences'),
  get: (id: number) => api.get(`/admin/audiences/${id}`),
  create: (payload: unknown) => api.post('/admin/audiences', payload),
  update: (id: number, payload: unknown) => api.put(`/admin/audiences/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/audiences/${id}`),
}

export const leadsApi = {
  list: (params?: Record<string, string>) => api.get('/admin/leads', { params }),
  updateStatus: (id: number, status: string) => api.patch(`/admin/leads/${id}`, { status }),
  addNote: (id: number, note: string) => api.post(`/admin/leads/${id}/notes`, { note }),
}
