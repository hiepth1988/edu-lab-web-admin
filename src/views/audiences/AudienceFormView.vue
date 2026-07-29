<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { audiencesApi, solutionsApi } from '@/api/catalog'
import ImageUploadField from '@/components/ImageUploadField.vue'
import LocaleTabs from '@/components/LocaleTabs.vue'
import SeoFields from '@/components/SeoFields.vue'

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://xotech.space').replace(/\/$/, '')

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id !== undefined && route.params.id !== 'new')
const audienceId = computed(() => Number(route.params.id))

const locales = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
]
const activeLocale = ref('vi')

interface TranslationFields {
  title: string
  slug: string
  subheading: string
  pain_points: string
  how_we_help: string
  meta_title: string
  meta_description: string
  og_image: string
  canonical_url: string
}

function emptyTranslation(): TranslationFields {
  return {
    title: '',
    slug: '',
    subheading: '',
    pain_points: '',
    how_we_help: '',
    meta_title: '',
    meta_description: '',
    og_image: '',
    canonical_url: '',
  }
}

const localePathPrefix: Record<string, string> = { vi: '', en: '/en' }

function previewUrl(localeCode: string) {
  const slug = form.translations[localeCode]?.slug || 'audience-cua-ban'
  return `${siteUrl}${localePathPrefix[localeCode] ?? ''}/who-we-help/${slug}`
}

const form = reactive({
  status: 'draft' as 'draft' | 'published',
  sort_order: 0,
  hero_image: '',
  translations: { vi: emptyTranslation(), en: emptyTranslation() } as Record<string, TranslationFields>,
  solutionIds: [] as number[],
})

const completed = computed(() => ({
  vi: !!form.translations.vi.title,
  en: !!form.translations.en.title,
}))

interface SolutionOption {
  id: number
  title: string
}

const solutionOptions = ref<SolutionOption[]>([])

function toggleSolution(id: number) {
  const i = form.solutionIds.indexOf(id)
  if (i === -1) {
    form.solutionIds.push(id)
  } else {
    form.solutionIds.splice(i, 1)
  }
}

async function loadSolutionOptions() {
  const { data } = await solutionsApi.list()
  solutionOptions.value = data.data.map((s: { id: number; translations: { locale: string; title: string }[] }) => ({
    id: s.id,
    title: s.translations.find((t) => t.locale === 'vi')?.title ?? s.translations[0]?.title ?? `#${s.id}`,
  }))
}

async function loadAudience() {
  if (!isEdit.value) return
  const { data } = await audiencesApi.get(audienceId.value)
  const a = data.data
  form.status = a.status
  form.sort_order = a.sort_order
  form.hero_image = a.hero_image ?? ''
  for (const t of a.translations) {
    form.translations[t.locale] = {
      title: t.title,
      slug: t.slug,
      subheading: t.subheading ?? '',
      pain_points: t.pain_points ?? '',
      how_we_help: t.how_we_help ?? '',
      meta_title: t.meta_title ?? '',
      meta_description: t.meta_description ?? '',
      og_image: t.og_image ?? '',
      canonical_url: t.canonical_url ?? '',
    }
  }
  form.solutionIds = (a.solutions ?? []).map((s: { id: number }) => s.id)
}

const saving = ref(false)

async function onSubmit() {
  saving.value = true
  const payload = {
    status: form.status,
    sort_order: form.sort_order,
    hero_image: form.hero_image || null,
    translations: form.translations,
    solution_ids: form.solutionIds,
  }
  try {
    if (isEdit.value) {
      await audiencesApi.update(audienceId.value, payload)
    } else {
      await audiencesApi.create(payload)
    }
    router.push('/audiences')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadSolutionOptions(), loadAudience()])
})
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900">
      {{ isEdit ? 'Chỉnh sửa Audience' : 'Audience mới' }}
    </h1>

    <form class="mt-6 space-y-8" @submit.prevent="onSubmit">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-slate-700">Trạng thái</label>
          <select v-model="form.status" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">Thứ tự hiển thị</label>
          <input v-model.number="form.sort_order" type="number" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <ImageUploadField
        v-model="form.hero_image"
        label="Ảnh đại diện (Hero image)"
        hint="Hiển thị ở đầu trang landing page của đối tượng này. Kích thước lý tưởng: 1600×900px."
      />

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
            <label class="text-sm font-medium text-slate-700">Subheading</label>
            <input v-model="form.translations[locale.code].subheading" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Pain points</label>
            <textarea v-model="form.translations[locale.code].pain_points" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">How XO helps</label>
            <textarea v-model="form.translations[locale.code].how_we_help" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <SeoFields
            v-model:meta-title="form.translations[locale.code].meta_title"
            v-model:meta-description="form.translations[locale.code].meta_description"
            v-model:canonical-url="form.translations[locale.code].canonical_url"
            v-model:og-image="form.translations[locale.code].og_image"
            :preview-url="previewUrl(locale.code)"
            :title-fallback="form.translations[locale.code].title || 'Tiêu đề Audience'"
            :description-fallback="form.translations[locale.code].subheading || ''"
          />
        </div>
      </div>

      <div>
        <label class="text-sm font-medium text-slate-700">Giải pháp gợi ý (Recommended Solutions)</label>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <label
            v-for="opt in solutionOptions"
            :key="opt.id"
            class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              :checked="form.solutionIds.includes(opt.id)"
              @change="toggleSolution(opt.id)"
            />
            {{ opt.title }}
          </label>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="rounded-lg bg-slate-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-800 disabled:opacity-60">
          {{ saving ? 'Đang lưu...' : 'Lưu' }}
        </button>
        <RouterLink to="/audiences" class="rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 text-slate-700 hover:bg-slate-50">Hủy</RouterLink>
      </div>
    </form>
  </div>
</template>
