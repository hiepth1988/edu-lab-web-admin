<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsApi, postTypes, type PostType } from '@/api/posts'

interface PostRow {
  id: number
  type: PostType
  status: string
  translations: { locale: string; title: string; is_hidden?: boolean }[]
}

const route = useRoute()
const router = useRouter()

// Filter tab, kept in the URL (?type=research) so links and reloads keep it.
const activeType = computed<PostType | ''>(() =>
  postTypes.some((t) => t.value === route.query.type) ? (route.query.type as PostType) : '',
)
const tabs = [{ value: '' as const, label: 'Tất cả' }, ...postTypes]

function typeLabel(type: PostType) {
  return postTypes.find((t) => t.value === type)?.label ?? type
}

const newLink = computed(() => (activeType.value === 'research' ? '/posts/new?type=research' : '/posts/new'))

const posts = ref<PostRow[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  const { data } = await postsApi.list({ per_page: 200, type: activeType.value || undefined })
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

watch(activeType, load, { immediate: true })
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Bài viết</h1>
      <RouterLink
        :to="newLink"
        class="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
      >
        + Bài viết mới
      </RouterLink>
    </div>

    <div class="mt-6 flex gap-2 border-b border-slate-200">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="px-3 py-2 text-sm border-b-2 -mb-px"
        :class="activeType === tab.value ? 'border-slate-900 text-slate-900 font-medium' : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="router.replace({ query: tab.value ? { type: tab.value } : {} })"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th class="px-4 py-3">Tiêu đề</th>
            <th class="px-4 py-3">Loại</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3">Ngôn ngữ</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-400" colspan="5">Đang tải...</td>
          </tr>
          <tr v-for="post in posts" v-else :key="post.id">
            <td class="px-4 py-3 font-medium text-slate-800">{{ title(post) }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="post.type === 'research' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'"
              >
                {{ typeLabel(post.type) }}
              </span>
            </td>
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
              <span v-for="(t, i) in post.translations" :key="t.locale">
                <span v-if="i">, </span>
                <span :class="t.is_hidden ? 'line-through text-slate-400' : ''" :title="t.is_hidden ? 'Đang ẩn' : undefined">{{ t.locale.toUpperCase() }}</span>
              </span>
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
