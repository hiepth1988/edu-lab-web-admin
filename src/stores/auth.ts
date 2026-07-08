import { defineStore } from 'pinia'
import { api, ensureCsrfCookie } from '@/api/client'

interface AdminUser {
  id: number
  name: string
  email: string
  roles: string[]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AdminUser | null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
    isAdmin: (state) => state.user?.roles.includes('admin') ?? false,
  },
  actions: {
    async login(email: string, password: string) {
      await ensureCsrfCookie()
      await api.post('/admin/login', { email, password })
      await this.fetchMe()
    },
    async logout() {
      await api.post('/admin/logout')
      this.user = null
    },
    async fetchMe() {
      try {
        const { data } = await api.get('/admin/me')
        this.user = data.user
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },
  },
})
