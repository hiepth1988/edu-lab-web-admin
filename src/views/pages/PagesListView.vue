<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { pagesApi } from '@/api/pages'
import { PAGE_LABELS } from '@/utils/pageLabels'

interface PageRow {
  id: number
  key: string
  status: string
  sections_count: number
  updated_at: string
  translations: { locale: string; slug: string; title: string }[]
}

const pages = ref<PageRow[]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await pagesApi.list()
  pages.value = data.data
  loading.value = false
})

function title(row: PageRow) {
  return PAGE_LABELS[row.key] ?? row.translations.find((t) => t.locale === 'vi')?.title ?? row.key
}

function slugs(row: PageRow) {
  return row.translations.map((t) => `${t.locale}: /${row.key === 'home' ? '' : t.slug}`).join(' · ')
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-900">Trang</h1>
    <p class="mt-1 text-sm text-slate-500">Nội dung các trang cố định của website. Mỗi trang gồm nhiều section có thể sửa chữ, bật/tắt và đổi thứ tự.</p>

    <div class="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th class="px-4 py-3">Trang</th>
            <th class="px-4 py-3">Đường dẫn</th>
            <th class="px-4 py-3">Section</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3">Cập nhật</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-400" colspan="6">Đang tải...</td>
          </tr>
          <tr v-for="row in pages" v-else :key="row.id" class="hover:bg-slate-50/60">
            <td class="px-4 py-3 font-medium text-slate-800">
              <RouterLink :to="`/pages/${row.id}`" class="hover:underline">{{ title(row) }}</RouterLink>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ slugs(row) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ row.sections_count || '—' }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
              >
                {{ row.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ formatDate(row.updated_at) }}</td>
            <td class="px-4 py-3 text-right">
              <RouterLink :to="`/pages/${row.id}`" class="text-slate-600 hover:text-slate-900">Sửa</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
