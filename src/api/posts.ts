import { api } from './client'

export interface PostTranslationPayload {
  title: string
  slug?: string
  excerpt?: string
  content?: string
  meta_title?: string
  meta_description?: string
}

export interface PostPayload {
  category_id: number | null
  status: 'draft' | 'published'
  is_featured: boolean
  tag_ids: number[]
  translations: Record<string, PostTranslationPayload>
}

export const postsApi = {
  list: () => api.get('/admin/posts'),
  get: (id: number) => api.get(`/admin/posts/${id}`),
  create: (payload: PostPayload) => api.post('/admin/posts', payload),
  update: (id: number, payload: PostPayload) => api.put(`/admin/posts/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/posts/${id}`),
}

export const categoriesApi = {
  list: () => api.get('/admin/categories'),
  create: (payload: unknown) => api.post('/admin/categories', payload),
  update: (id: number, payload: unknown) => api.put(`/admin/categories/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/categories/${id}`),
}

export const tagsApi = {
  list: () => api.get('/admin/tags'),
  create: (payload: unknown) => api.post('/admin/tags', payload),
  update: (id: number, payload: unknown) => api.put(`/admin/tags/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/tags/${id}`),
}
