<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { leadsApi } from '@/api/catalog'

interface LeadNote {
  id: number
  note: string
  user?: { name: string }
}

interface LeadRow {
  id: number
  name: string
  email: string
  phone: string | null
  company: string | null
  need: string | null
  message: string | null
  locale: string
  status: string
  notes: LeadNote[]
}

const leads = ref<LeadRow[]>([])
const loading = ref(true)
const statusFilter = ref('')
const noteDrafts = reactive<Record<number, string>>({})

const statuses = ['new', 'contacted', 'qualified', 'closed']

async function load() {
  loading.value = true
  const { data } = await leadsApi.list(statusFilter.value ? { status: statusFilter.value } : undefined)
  leads.value = data.data
  loading.value = false
}

async function changeStatus(lead: LeadRow, status: string) {
  await leadsApi.updateStatus(lead.id, status)
  lead.status = status
}

async function submitNote(lead: LeadRow) {
  const note = noteDrafts[lead.id]
  if (!note) return
  const { data } = await leadsApi.addNote(lead.id, note)
  lead.notes.unshift(data.data)
  noteDrafts[lead.id] = ''
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Leads</h1>
      <select v-model="statusFilter" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" @change="load">
        <option value="">Tất cả trạng thái</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div v-if="loading" class="mt-6 text-slate-400">Đang tải...</div>

    <div v-else class="mt-6 space-y-4">
      <div v-for="lead in leads" :key="lead.id" class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-semibold text-slate-900">{{ lead.name }} <span class="text-slate-400 font-normal">· {{ lead.email }}</span></p>
            <p class="text-sm text-slate-500 mt-0.5">
              {{ lead.company }} · {{ lead.phone }} · nhu cầu: {{ lead.need ?? '—' }} · locale: {{ lead.locale }}
            </p>
            <p v-if="lead.message" class="mt-2 text-sm text-slate-700">{{ lead.message }}</p>
          </div>
          <select
            :value="lead.status"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            @change="changeStatus(lead, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="mt-4 border-t border-slate-100 pt-4">
          <p class="text-xs font-medium text-slate-500 mb-2">Ghi chú follow-up</p>
          <ul class="space-y-1 mb-3">
            <li v-for="note in lead.notes" :key="note.id" class="text-sm text-slate-600">
              {{ note.note }} <span class="text-slate-400">— {{ note.user?.name }}</span>
            </li>
          </ul>
          <div class="flex gap-2">
            <input
              v-model="noteDrafts[lead.id]"
              type="text"
              placeholder="Thêm ghi chú..."
              class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              @keyup.enter="submitNote(lead)"
            />
            <button class="rounded-lg bg-slate-900 text-white text-sm px-4 py-2 hover:bg-slate-800" @click="submitNote(lead)">
              Gửi
            </button>
          </div>
        </div>
      </div>

      <p v-if="!leads.length" class="text-slate-400">Chưa có lead nào.</p>
    </div>
  </div>
</template>
