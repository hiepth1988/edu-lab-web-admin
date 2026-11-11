<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { categoriesApi, postTypes, type PostType } from '@/api/posts'

interface CategoryRow {
  id: number
  translations: { locale: string; name: string; slug: string }[]
}

// Article categories and research topics are kept as separate lists.
const activeType = ref<PostType>('post')
const categories = ref<CategoryRow[]>([])
const form = reactive({ vi: '', en: '' })

async function load() {
  const { data } = await categoriesApi.list({ type: activeType.value })
  categories.value = data.data
}

function name(cat: CategoryRow, locale: string) {
  return cat.translations.find((t) => t.locale === locale)?.name ?? '—'
}

async function onCreate() {
  if (!form.vi) return
  await categoriesApi.create({
    type: activeType.value,
    translations: {
      vi: { name: form.vi },
      en: { name: form.en || form.vi },
    },
  })
  form.vi = ''
  form.en = ''
  await load()
}

async function remove(id: number) {
  if (!confirm('Xóa chuyên mục này?')) return
  await categoriesApi.remove(id)
  await load()
}

watch(activeType, load, { immediate: true })
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-xl font-semibold text-slate-900">Chuyên mục</h1>

    <div class="mt-6 flex gap-2 border-b border-slate-200">
      <button
        v-for="t in postTypes"
        :key="t.value"
        type="button"
        class="px-3 py-2 text-sm border-b-2 -mb-px"
        :class="activeType === t.value ? 'border-slate-900 text-slate-900 font-medium' : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="activeType = t.value"
      >
        {{ t.value === 'research' ? 'Chủ đề Research' : 'Chuyên mục bài viết' }}
      </button>
    </div>

    <form class="mt-4 flex gap-3" @submit.prevent="onCreate">
      <input
        v-model="form.vi"
        placeholder="Tên (Tiếng Việt)"
        class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        v-model="form.en"
        placeholder="Name (English)"
        class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        class="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
      >
        Thêm
      </button>
    </form>

    <ul class="mt-6 divide-y divide-slate-100 bg-white rounded-xl border border-slate-200">
      <li
        v-for="cat in categories"
        :key="cat.id"
        class="flex items-center justify-between px-4 py-3 text-sm"
      >
        <span>{{ name(cat, 'vi') }} <span class="text-slate-400">/ {{ name(cat, 'en') }}</span></span>
        <button class="text-red-600 hover:text-red-800" @click="remove(cat.id)">Xóa</button>
      </li>
    </ul>
  </div>
</template>
