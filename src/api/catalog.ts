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

export const caseStudiesApi = {
  list: () => api.get('/admin/case-studies'),
  get: (id: number) => api.get(`/admin/case-studies/${id}`),
  create: (payload: unknown) => api.post('/admin/case-studies', payload),
  update: (id: number, payload: unknown) => api.put(`/admin/case-studies/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/case-studies/${id}`),
}

export const leadsApi = {
  list: (params?: Record<string, string>) => api.get('/admin/leads', { params }),
  updateStatus: (id: number, status: string) => api.patch(`/admin/leads/${id}`, { status }),
  addNote: (id: number, note: string) => api.post(`/admin/leads/${id}/notes`, { note }),
}
