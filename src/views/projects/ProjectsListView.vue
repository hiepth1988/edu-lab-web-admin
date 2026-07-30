<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { projectsApi } from '@/api/catalog'

interface ProjectRow {
  id: number
  status: string
  is_featured: boolean
  translations: { locale: string; title: string }[]
  category: { translations: { locale: string; name: string }[] } | null
}

const items = ref<ProjectRow[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  const { data } = await projectsApi.list()
  items.value = data.data
  loading.value = false
}

function title(row: ProjectRow) {
  return row.translations.find((t) => t.locale === 'vi')?.title ?? row.translations[0]?.title ?? '—'
}

function categoryName(row: ProjectRow) {
  if (!row.category) return '—'
  return row.category.translations.find((t) => t.locale === 'vi')?.name ?? row.category.translations[0]?.name ?? '—'
}

async function remove(id: number) {
  if (!confirm('Xóa dự án này?')) return
  await projectsApi.remove(id)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Our Work</h1>
      <RouterLink to="/projects/new" class="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
        + Dự án mới
      </RouterLink>
    </div>

    <div class="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th class="px-4 py-3">Tiêu đề</th>
            <th class="px-4 py-3">Chuyên mục</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-400" colspan="4">Đang tải...</td>
          </tr>
          <tr v-for="row in items" v-else :key="row.id">
            <td class="px-4 py-3 font-medium text-slate-800">
              {{ title(row) }}
              <span v-if="row.is_featured" class="ml-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs align-middle">Nổi bật</span>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ categoryName(row) }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-xs" :class="row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                {{ row.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-right space-x-3">
              <RouterLink :to="`/projects/${row.id}`" class="text-slate-600 hover:text-slate-900">Sửa</RouterLink>
              <button class="text-red-600 hover:text-red-800" @click="remove(row.id)">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
