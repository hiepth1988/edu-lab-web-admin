<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsApi } from '@/api/catalog'
import HtmlEditor from '@/components/HtmlEditor.vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import LocaleTabs from '@/components/LocaleTabs.vue'
import SeoFields from '@/components/SeoFields.vue'

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://xotech.space').replace(/\/$/, '')

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id !== undefined && route.params.id !== 'new')
const projectId = computed(() => Number(route.params.id))

const locales = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
]
const activeLocale = ref('vi')

interface TranslationFields {
  title: string
  slug: string
  excerpt: string
  problem: string
  solution_text: string
  result: string
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
    problem: '',
    solution_text: '',
    result: '',
    meta_title: '',
    meta_description: '',
    og_image: '',
    canonical_url: '',
  }
}

const localePathPrefix: Record<string, string> = { vi: '', en: '/en' }

function previewUrl(localeCode: string) {
  const slug = form.translations[localeCode]?.slug || 'du-an-cua-ban'
  return `${siteUrl}${localePathPrefix[localeCode] ?? ''}/our-work/${slug}`
}

type SectionKey = 'problem' | 'solution' | 'result'

const form = reactive({
  status: 'draft' as 'draft' | 'published',
  featured_image: '',
  translations: { vi: emptyTranslation(), en: emptyTranslation() } as Record<string, TranslationFields>,
  metrics: [] as { value: string; vi: { label: string }; en: { label: string } }[],
  sectionImages: { problem: [], solution: [], result: [] } as Record<SectionKey, string[]>,
})

function addSectionImage(section: SectionKey) {
  form.sectionImages[section].push('')
}
function removeSectionImage(section: SectionKey, i: number) {
  form.sectionImages[section].splice(i, 1)
}

const sectionKeys: SectionKey[] = ['problem', 'solution', 'result']
const sectionLabels: Record<SectionKey, string> = { problem: 'Vấn đề', solution: 'Giải pháp', result: 'Kết quả' }

const completed = computed(() => ({
  vi: !!form.translations.vi.title,
  en: !!form.translations.en.title,
}))

function addMetric() {
  form.metrics.push({ value: '', vi: { label: '' }, en: { label: '' } })
}
function removeMetric(i: number) {
  form.metrics.splice(i, 1)
}

async function loadProject() {
  if (!isEdit.value) return
  const { data } = await projectsApi.get(projectId.value)
  const p = data.data
  form.status = p.status
  form.featured_image = p.featured_image ?? ''
  for (const t of p.translations) {
    form.translations[t.locale] = {
      title: t.title,
      slug: t.slug,
      excerpt: t.excerpt ?? '',
      problem: t.problem ?? '',
      solution_text: t.solution_text ?? '',
      result: t.result ?? '',
      meta_title: t.meta_title ?? '',
      meta_description: t.meta_description ?? '',
      og_image: t.og_image ?? '',
      canonical_url: t.canonical_url ?? '',
    }
  }
  form.metrics = p.metrics.map((m: { value: string; translations: { locale: string; label: string }[] }) => ({
    value: m.value,
    vi: { label: m.translations.find((t) => t.locale === 'vi')?.label ?? '' },
    en: { label: m.translations.find((t) => t.locale === 'en')?.label ?? '' },
  }))
  form.sectionImages = { problem: [], solution: [], result: [] }
  for (const img of (p.section_images ?? []) as { section: SectionKey; image_url: string }[]) {
    form.sectionImages[img.section]?.push(img.image_url)
  }
}

const saving = ref(false)

async function onSubmit() {
  saving.value = true
  const sectionImages: { section: SectionKey; image_url: string; sort_order: number }[] = []
  for (const section of Object.keys(form.sectionImages) as SectionKey[]) {
    form.sectionImages[section].forEach((image_url, sort_order) => {
      if (image_url) sectionImages.push({ section, image_url, sort_order })
    })
  }
  const payload = {
    status: form.status,
    featured_image: form.featured_image || null,
    translations: form.translations,
    metrics: form.metrics.map((m) => ({ value: m.value, translations: { vi: m.vi, en: m.en } })),
    section_images: sectionImages,
  }
  try {
    if (isEdit.value) {
      await projectsApi.update(projectId.value, payload)
    } else {
      await projectsApi.create(payload)
    }
    router.push('/projects')
  } finally {
    saving.value = false
  }
}

onMounted(loadProject)
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900">
      {{ isEdit ? 'Chỉnh sửa dự án' : 'Dự án mới' }}
    </h1>

    <form class="mt-6 space-y-8" @submit.prevent="onSubmit">
      <div>
        <label class="text-sm font-medium text-slate-700">Trạng thái</label>
        <select v-model="form.status" class="mt-1 w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <ImageUploadField
        v-model="form.featured_image"
        label="Ảnh đại diện (Featured image)"
        hint="Hiển thị dạng banner lớn ở đầu trang dự án. Kích thước lý tưởng: 1600×900px."
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
            <label class="text-sm font-medium text-slate-700">Tóm tắt</label>
            <textarea v-model="form.translations[locale.code].excerpt" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 block mb-1">Problem</label>
            <HtmlEditor v-model="form.translations[locale.code].problem" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 block mb-1">Solution</label>
            <HtmlEditor v-model="form.translations[locale.code].solution_text" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 block mb-1">Result</label>
            <HtmlEditor v-model="form.translations[locale.code].result" />
          </div>

          <SeoFields
            v-model:meta-title="form.translations[locale.code].meta_title"
            v-model:meta-description="form.translations[locale.code].meta_description"
            v-model:canonical-url="form.translations[locale.code].canonical_url"
            v-model:og-image="form.translations[locale.code].og_image"
            :preview-url="previewUrl(locale.code)"
            :title-fallback="form.translations[locale.code].title || 'Tiêu đề dự án'"
            :description-fallback="form.translations[locale.code].excerpt || ''"
          />
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 p-4 space-y-6">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Ảnh minh họa theo mục</h3>
          <p class="text-xs text-slate-500">Hiển thị dưới dạng slider ở mỗi mục trên trang dự án. Dùng chung cho cả hai ngôn ngữ.</p>
        </div>

        <div v-for="section in sectionKeys" :key="section">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700">{{ sectionLabels[section] }}</label>
            <button type="button" class="text-sm text-slate-600 hover:text-slate-900" @click="addSectionImage(section)">+ Thêm ảnh</button>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-4">
            <div v-for="(_, i) in form.sectionImages[section]" :key="i" class="space-y-1">
              <ImageUploadField v-model="form.sectionImages[section][i]" />
              <button type="button" class="text-xs text-red-600 hover:text-red-800" @click="removeSectionImage(section, i)">Xóa ảnh</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-slate-700">Metrics</label>
          <button type="button" class="text-sm text-slate-600 hover:text-slate-900" @click="addMetric">+ Thêm metric</button>
        </div>
        <div v-for="(metric, i) in form.metrics" :key="i" class="mt-3 rounded-lg border border-slate-200 p-4 grid grid-cols-3 gap-4 items-start">
          <input v-model="metric.value" placeholder="Giá trị (vd: 40%)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="metric.vi.label" placeholder="Label (VI)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="metric.en.label" placeholder="Label (EN)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" class="col-span-3 text-left text-xs text-red-600 hover:text-red-800" @click="removeMetric(i)">Xóa metric</button>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="rounded-lg bg-slate-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-800 disabled:opacity-60">
          {{ saving ? 'Đang lưu...' : 'Lưu' }}
        </button>
        <RouterLink to="/projects" class="rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 text-slate-700 hover:bg-slate-50">Hủy</RouterLink>
      </div>
    </form>
  </div>
</template>
