import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/layouts/AdminLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import PostsListView from '@/views/posts/PostsListView.vue'
import PostFormView from '@/views/posts/PostFormView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import TagsView from '@/views/TagsView.vue'
import SolutionsListView from '@/views/solutions/SolutionsListView.vue'
import SolutionFormView from '@/views/solutions/SolutionFormView.vue'
import ProductsListView from '@/views/products/ProductsListView.vue'
import ProductFormView from '@/views/products/ProductFormView.vue'
import CaseStudiesListView from '@/views/case-studies/CaseStudiesListView.vue'
import CaseStudyFormView from '@/views/case-studies/CaseStudyFormView.vue'
import LeadsView from '@/views/LeadsView.vue'
import ResearchListView from '@/views/research/ResearchListView.vue'
import ResearchFormView from '@/views/research/ResearchFormView.vue'
import SubscribersView from '@/views/SubscribersView.vue'
import AuditLogView from '@/views/AuditLogView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', component: DashboardView },
        { path: 'posts', component: PostsListView },
        { path: 'posts/:id', component: PostFormView },
        { path: 'categories', component: CategoriesView },
        { path: 'tags', component: TagsView },
        { path: 'solutions', component: SolutionsListView },
        { path: 'solutions/:id', component: SolutionFormView },
        { path: 'products', component: ProductsListView },
        { path: 'products/:id', component: ProductFormView },
        { path: 'case-studies', component: CaseStudiesListView },
        { path: 'case-studies/:id', component: CaseStudyFormView },
        { path: 'research', component: ResearchListView },
        { path: 'research/:id', component: ResearchFormView },
        { path: 'leads', component: LeadsView },
        { path: 'subscribers', component: SubscribersView },
        { path: 'audit-log', component: AuditLogView, meta: { requiresAdmin: true } },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.fetchMe()
  }

  if (!to.meta.public && !auth.isAuthenticated) {
    return { path: '/login' }
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { path: '/' }
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return { path: '/' }
  }
})

export default router
