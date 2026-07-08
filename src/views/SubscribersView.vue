<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { subscribersApi } from '@/api/research'

interface SubscriberRow {
  id: number
  email: string
  locale: string
  status: string
  created_at: string
}

const subscribers = ref<SubscriberRow[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  const { data } = await subscribersApi.list()
  subscribers.value = data.data
  loading.value = false
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-900">Subscribers</h1>

    <div class="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Locale</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3">Đăng ký lúc</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-400" colspan="4">Đang tải...</td>
          </tr>
          <tr v-for="row in subscribers" v-else :key="row.id">
            <td class="px-4 py-3 font-medium text-slate-800">{{ row.email }}</td>
            <td class="px-4 py-3 text-slate-500">{{ row.locale }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700">{{ row.status }}</span>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ new Date(row.created_at).toLocaleDateString() }}</td>
          </tr>
          <tr v-if="!loading && !subscribers.length">
            <td class="px-4 py-4 text-slate-400" colspan="4">Chưa có subscriber nào.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
