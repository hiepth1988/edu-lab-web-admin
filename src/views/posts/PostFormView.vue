<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsApi, categoriesApi, tagsApi, type PostTranslationPayload } from '@/api/posts'
import LocaleTabs from '@/components/LocaleTabs.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id !== undefined && route.params.id !== 'new')
const postId = computed(() => Number(route.params.id))

const locales = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
]
const activeLocale = ref('vi')

const categories = ref<{ id: number; translations: { locale: string; name: string }[] }[]>([])
const tags = ref<{ id: number; translations: { locale: string; name: string }[] }[]>([])

const form = reactive({
  category_id: null as number | null,
  status: 'draft' as 'draft' | 'published',
  is_featured: false,
  tag_ids: [] as number[],
  translations: {
    vi: { title: '', slug: '', excerpt: '', content: '', meta_title: '', meta_description: '' },
    en: { title: '', slug: '', excerpt: '', content: '', meta_title: '', meta_description: '' },
  } as Record<string, PostTranslationPayload>,
})

const completed = computed(() => ({
  vi: !!form.translations.vi.title,
  en: !!form.translations.en.title,
}))

function categoryName(cat: { translations: { locale: string; name: string }[] }) {
  return cat.translations.find((t) => t.locale === 'vi')?.name ?? cat.translations[0]?.name
}

function tagName(tag: { translations: { locale: string; name: string }[] }) {
  return tag.translations.find((t) => t.locale === 'vi')?.name ?? tag.translations[0]?.name
}

async function loadOptions() {
  const [cats, tgs] = await Promise.all([categoriesApi.list(), tagsApi.list()])
  categories.value = cats.data.data
  tags.value = tgs.data.data
}

async function loadPost() {
  if (!isEdit.value) return
  const { data } = await postsApi.get(postId.value)
  const post = data.data
  form.category_id = post.category_id
  form.status = post.status
  form.is_featured = post.is_featured
  form.tag_ids = post.tags.map((t: { id: number }) => t.id)
  for (const t of post.translations) {
    form.translations[t.locale] = {
      title: t.title,
      slug: t.slug,
      excerpt: t.excerpt ?? '',
      content: t.content ?? '',
      meta_title: t.meta_title ?? '',
      meta_description: t.meta_description ?? '',
    }
  }
}

const saving = ref(false)

async function onSubmit() {
  saving.value = true
  try {
    if (isEdit.value) {
      await postsApi.update(postId.value, form)
    } else {
      await postsApi.create(form)
    }
    router.push('/posts')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadPost()])
})
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900">
      {{ isEdit ? 'Chỉnh sửa bài viết' : 'Bài viết mới' }}
    </h1>

    <form class="mt-6 space-y-6" @submit.prevent="onSubmit">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-slate-700">Chuyên mục</label>
          <select
            v-model="form.category_id"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option :value="null">—</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ categoryName(cat) }}
            </option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">Trạng thái</label>
          <select
            v-model="form.status"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label class="text-sm font-medium text-slate-700 block mb-1">Tags</label>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="tag in tags"
            :key="tag.id"
            class="flex items-center gap-1.5 text-sm border border-slate-300 rounded-full px-3 py-1"
          >
            <input v-model="form.tag_ids" type="checkbox" :value="tag.id" />
            {{ tagName(tag) }}
          </label>
        </div>
      </div>

      <div>
        <LocaleTabs v-model:active="activeLocale" :locales="locales" :completed="completed" />

        <div v-for="locale in locales" :key="locale.code" v-show="activeLocale === locale.code" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-700">Tiêu đề</label>
            <input
              v-model="form.translations[locale.code].title"
              type="text"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Slug</label>
            <input
              v-model="form.translations[locale.code].slug"
              type="text"
              placeholder="Để trống sẽ tự sinh từ tiêu đề"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Tóm tắt</label>
            <textarea
              v-model="form.translations[locale.code].excerpt"
              rows="2"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Nội dung</label>
            <textarea
              v-model="form.translations[locale.code].content"
              rows="10"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-slate-700">Meta title</label>
              <input
                v-model="form.translations[locale.code].meta_title"
                type="text"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">Meta description</label>
              <input
                v-model="form.translations[locale.code].meta_description"
                type="text"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-slate-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-800 disabled:opacity-60"
        >
          {{ saving ? 'Đang lưu...' : 'Lưu' }}
        </button>
        <RouterLink
          to="/posts"
          class="rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 text-slate-700 hover:bg-slate-50"
        >
          Hủy
        </RouterLink>
      </div>
    </form>
  </div>
</template>
