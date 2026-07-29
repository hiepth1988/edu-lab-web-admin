<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { researchApi, researchTopicsApi } from '@/api/research'
import LocaleTabs from '@/components/LocaleTabs.vue'
import HtmlEditor from '@/components/HtmlEditor.vue'
import SeoFields from '@/components/SeoFields.vue'

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://xotech.space').replace(/\/$/, '')

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id !== undefined && route.params.id !== 'new')
const postId = computed(() => Number(route.params.id))

const locales = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
]
const activeLocale = ref('vi')

const topics = ref<{ id: number; translations: { locale: string; name: string }[] }[]>([])

interface TranslationFields {
  title: string
  slug: string
  excerpt: string
  content: string
  meta_title: string
  meta_description: string
  og_image: string
  canonical_url: string
}

function emptyTranslation(): TranslationFields {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    meta_title: '',
    meta_description: '',
    og_image: '',
    canonical_url: '',
  }
}

const localePathPrefix: Record<string, string> = { vi: '', en: '/en' }

function previewUrl(localeCode: string) {
  const slug = form.translations[localeCode]?.slug || 'bai-research-cua-ban'
  return `${siteUrl}${localePathPrefix[localeCode] ?? ''}/research/${slug}`
}

const form = reactive({
  research_topic_id: null as number | null,
  status: 'draft' as 'draft' | 'published',
  translations: { vi: emptyTranslation(), en: emptyTranslation() } as Record<string, TranslationFields>,
})

const completed = computed(() => ({
  vi: !!form.translations.vi.title,
  en: !!form.translations.en.title,
}))

function topicName(topic: { translations: { locale: string; name: string }[] }) {
  return topic.translations.find((t) => t.locale === 'vi')?.name ?? topic.translations[0]?.name
}

async function loadTopics() {
  const { data } = await researchTopicsApi.list()
  topics.value = data.data
}

async function loadPost() {
  if (!isEdit.value) return
  const { data } = await researchApi.get(postId.value)
  const p = data.data
  form.research_topic_id = p.research_topic_id
  form.status = p.status
  for (const t of p.translations) {
    form.translations[t.locale] = {
      title: t.title,
      slug: t.slug,
      excerpt: t.excerpt ?? '',
      content: t.content ?? '',
      meta_title: t.meta_title ?? '',
      meta_description: t.meta_description ?? '',
      og_image: t.og_image ?? '',
      canonical_url: t.canonical_url ?? '',
    }
  }
}

const saving = ref(false)

async function onSubmit() {
  saving.value = true
  const payload = {
    research_topic_id: form.research_topic_id,
    status: form.status,
    translations: form.translations,
  }
  try {
    if (isEdit.value) {
      await researchApi.update(postId.value, payload)
    } else {
      await researchApi.create(payload)
    }
    router.push('/research')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadTopics(), loadPost()])
})
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900">
      {{ isEdit ? 'Chỉnh sửa bài Research' : 'Bài Research mới' }}
    </h1>

    <form class="mt-6 space-y-6" @submit.prevent="onSubmit">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-slate-700">Topic</label>
          <select v-model="form.research_topic_id" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option :value="null">—</option>
            <option v-for="topic in topics" :key="topic.id" :value="topic.id">{{ topicName(topic) }}</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">Trạng thái</label>
          <select v-model="form.status" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <LocaleTabs v-model:active="activeLocale" :locales="locales" :completed="completed" />
        <div v-for="locale in locales" :key="locale.code" v-show="activeLocale === locale.code" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-700">Tiêu đề</label>
            <input v-model="form.translations[locale.code].title" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Slug</label>
            <input v-model="form.translations[locale.code].slug" type="text" placeholder="Để trống sẽ tự sinh" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Tóm tắt</label>
            <textarea v-model="form.translations[locale.code].excerpt" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 block mb-1">Nội dung</label>
            <HtmlEditor v-model="form.translations[locale.code].content" />
          </div>

          <SeoFields
            v-model:meta-title="form.translations[locale.code].meta_title"
            v-model:meta-description="form.translations[locale.code].meta_description"
            v-model:canonical-url="form.translations[locale.code].canonical_url"
            v-model:og-image="form.translations[locale.code].og_image"
            :preview-url="previewUrl(locale.code)"
            :title-fallback="form.translations[locale.code].title || 'Tiêu đề bài Research'"
            :description-fallback="form.translations[locale.code].excerpt || ''"
          />
        </div>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="rounded-lg bg-slate-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-800 disabled:opacity-60">
          {{ saving ? 'Đang lưu...' : 'Lưu' }}
        </button>
        <RouterLink to="/research" class="rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 text-slate-700 hover:bg-slate-50">Hủy</RouterLink>
      </div>
    </form>
  </div>
</template>
