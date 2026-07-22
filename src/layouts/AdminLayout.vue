<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const navItems = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Bài viết', to: '/posts' },
  { label: 'Chuyên mục', to: '/categories' },
  { label: 'Tags', to: '/tags' },
  { label: 'Solutions', to: '/solutions' },
  { label: 'Products', to: '/products' },
  { label: 'Our Work', to: '/projects' },
  { label: 'Who We Help', to: '/audiences' },
  { label: 'Research', to: '/research' },
  { label: 'Leads', to: '/leads' },
  { label: 'Subscribers', to: '/subscribers' },
  ...(auth.isAdmin ? [{ label: 'Audit Log', to: '/audit-log' }] : []),
])

async function onLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex bg-slate-50">
    <aside class="w-60 bg-slate-900 text-slate-200 flex flex-col">
      <div class="px-5 py-5 text-white font-semibold border-b border-slate-800">
        XO EdTech Lab
      </div>
      <nav class="flex-1 py-4 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="block px-5 py-2 text-sm rounded-lg mx-2 hover:bg-slate-800"
          active-class="bg-slate-800 text-white"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="px-5 py-4 border-t border-slate-800 text-sm">
        <p class="text-slate-400">{{ auth.user?.email }}</p>
        <button class="mt-2 text-slate-300 hover:text-white" @click="onLogout">
          Đăng xuất
        </button>
      </div>
    </aside>

    <main class="flex-1 p-8">
      <RouterView />
    </main>
  </div>
</template>
