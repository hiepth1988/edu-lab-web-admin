<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/api/client'

interface AuditLogRow {
  id: number
  action: 'created' | 'updated' | 'deleted'
  auditable_type: string
  auditable_id: number
  changes: Record<string, unknown> | null
  created_at: string
  user: { name: string; email: string } | null
}

const logs = ref<AuditLogRow[]>([])
const loading = ref(true)

function modelName(type: string) {
  return type.split('\\').pop()
}

async function load() {
  loading.value = true
  const { data } = await api.get('/admin/audit-logs')
  logs.value = data.data
  loading.value = false
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-900">Audit Log</h1>
    <p class="mt-1 text-sm text-slate-500">Lịch sử tạo/sửa/xóa nội dung bởi các tài khoản admin/editor.</p>

    <div class="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th class="px-4 py-3">Thời gian</th>
            <th class="px-4 py-3">Người thực hiện</th>
            <th class="px-4 py-3">Hành động</th>
            <th class="px-4 py-3">Đối tượng</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-400" colspan="4">Đang tải...</td>
          </tr>
          <tr v-for="log in logs" v-else :key="log.id">
            <td class="px-4 py-3 text-slate-500">{{ new Date(log.created_at).toLocaleString() }}</td>
            <td class="px-4 py-3 text-slate-700">{{ log.user?.name ?? '—' }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="{
                  'bg-emerald-100 text-emerald-700': log.action === 'created',
                  'bg-amber-100 text-amber-700': log.action === 'updated',
                  'bg-red-100 text-red-700': log.action === 'deleted',
                }"
              >
                {{ log.action }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-700">{{ modelName(log.auditable_type) }} #{{ log.auditable_id }}</td>
          </tr>
          <tr v-if="!loading && !logs.length">
            <td class="px-4 py-4 text-slate-400" colspan="4">Chưa có hoạt động nào.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
