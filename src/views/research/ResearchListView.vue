<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { researchApi, researchTopicsApi } from '@/api/research'

interface ResearchRow {
  id: number
  status: string
  translations: { locale: string; title: string }[]
}

interface TopicRow {
  id: number
  translations: { locale: string; name: string }[]
}

const posts = ref<ResearchRow[]>([])
const topics = ref<TopicRow[]>([])
const loading = ref(true)
const topicForm = reactive({ vi: '', en: '' })

async function load() {
  loading.value = true
  const [postsRes, topicsRes] = await Promise.all([researchApi.list(), researchTopicsApi.list()])
  posts.value = postsRes.data.data
  topics.value = topicsRes.data.data
  loading.value = false
}

function title(row: ResearchRow) {
  return row.translations.find((t) => t.locale === 'vi')?.title ?? row.translations[0]?.title ?? '—'
}

function topicName(row: TopicRow) {
  return row.translations.find((t) => t.locale === 'vi')?.name ?? row.translations[0]?.name ?? '—'
}

async function removePost(id: number) {
  if (!confirm('Xóa bài research này?')) return
  await researchApi.remove(id)
  await load()
}

async function createTopic() {
  if (!topicForm.vi) return
  await researchTopicsApi.create({
    translations: { vi: { name: topicForm.vi }, en: { name: topicForm.en || topicForm.vi } },
  })
  topicForm.vi = ''
  topicForm.en = ''
  await load()
}

async function removeTopic(id: number) {
  if (!confirm('Xóa topic này?')) return
  await researchTopicsApi.remove(id)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-10">
    <div>
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-slate-900">Research</h1>
        <RouterLink to="/research/new" class="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
          + Bài research mới
        </RouterLink>
      </div>

      <div class="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th class="px-4 py-3">Tiêu đề</th>
              <th class="px-4 py-3">Trạng thái</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td class="px-4 py-4 text-slate-400" colspan="3">Đang tải...</td>
            </tr>
            <tr v-for="row in posts" v-else :key="row.id">
              <td class="px-4 py-3 font-medium text-slate-800">{{ title(row) }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-0.5 text-xs" :class="row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                  {{ row.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-right space-x-3">
                <RouterLink :to="`/research/${row.id}`" class="text-slate-600 hover:text-slate-900">Sửa</RouterLink>
                <button class="text-red-600 hover:text-red-800" @click="removePost(row.id)">Xóa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h2 class="text-lg font-semibold text-slate-900">Research Topics</h2>
      <form class="mt-3 flex gap-3" @submit.prevent="createTopic">
        <input v-model="topicForm.vi" placeholder="Tên (Tiếng Việt)" class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="topicForm.en" placeholder="Name (English)" class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" class="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">Thêm</button>
      </form>
      <ul class="mt-4 divide-y divide-slate-100 bg-white rounded-xl border border-slate-200">
        <li v-for="topic in topics" :key="topic.id" class="flex items-center justify-between px-4 py-3 text-sm">
          <span>{{ topicName(topic) }}</span>
          <button class="text-red-600 hover:text-red-800" @click="removeTopic(topic.id)">Xóa</button>
        </li>
      </ul>
    </div>
  </div>
</template>
