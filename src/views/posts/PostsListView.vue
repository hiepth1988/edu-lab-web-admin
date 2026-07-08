<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { postsApi } from '@/api/posts'

interface PostRow {
  id: number
  status: string
  translations: { locale: string; title: string }[]
}

const posts = ref<PostRow[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  const { data } = await postsApi.list()
  posts.value = data.data
  loading.value = false
}

function title(post: PostRow) {
  return (
    post.translations.find((t) => t.locale === 'vi')?.title ??
    post.translations[0]?.title ??
    '(chưa có tiêu đề)'
  )
}

async function remove(id: number) {
  if (!confirm('Xóa bài viết này?')) return
  await postsApi.remove(id)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Bài viết</h1>
      <RouterLink
        to="/posts/new"
        class="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
      >
        + Bài viết mới
      </RouterLink>
    </div>

    <div class="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th class="px-4 py-3">Tiêu đề</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3">Ngôn ngữ</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-400" colspan="4">Đang tải...</td>
          </tr>
          <tr v-for="post in posts" v-else :key="post.id">
            <td class="px-4 py-3 font-medium text-slate-800">{{ title(post) }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="
                  post.status === 'published'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                "
              >
                {{ post.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500">
              {{ post.translations.map((t) => t.locale.toUpperCase()).join(', ') }}
            </td>
            <td class="px-4 py-3 text-right space-x-3">
              <RouterLink :to="`/posts/${post.id}`" class="text-slate-600 hover:text-slate-900">
                Sửa
              </RouterLink>
              <button class="text-red-600 hover:text-red-800" @click="remove(post.id)">
                Xóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
