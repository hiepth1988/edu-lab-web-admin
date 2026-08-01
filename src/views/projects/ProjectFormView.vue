<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsApi } from '@/api/catalog'
import { categoriesApi } from '@/api/posts'
import ImageUploadField from '@/components/ImageUploadField.vue'
import LocaleTabs from '@/components/LocaleTabs.vue'
import RepeaterField from '@/components/RepeaterField.vue'
import SeoFields from '@/components/SeoFields.vue'

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://xotech.space').replace(/\/$/, '')

const colorOptions = [
  { value: 'primary', label: 'Primary (Navy)' },
  { value: 'secondary', label: 'Secondary (Green)' },
  { value: 'gold', label: 'Gold' },
]

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id !== undefined && route.params.id !== 'new')
const projectId = computed(() => Number(route.params.id))

const locales = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
]
const activeLocale = ref('vi')

const categories = ref<{ id: number; translations: { locale: string; name: string }[] }[]>([])
const otherProjects = ref<{ id: number; translations: { locale: string; title: string }[] }[]>([])

function categoryName(cat: { translations: { locale: string; name: string }[] }) {
  return cat.translations.find((t) => t.locale === 'vi')?.name ?? cat.translations[0]?.name
}

function projectTitle(p: { id: number; translations: { locale: string; title: string }[] }) {
  return p.translations.find((t) => t.locale === 'vi')?.title ?? p.translations[0]?.title ?? `#${p.id}`
}

async function loadCategories() {
  const { data } = await categoriesApi.list()
  categories.value = data.data
}

async function loadOtherProjects() {
  const { data } = await projectsApi.list()
  otherProjects.value = data.data.filter((p: { id: number }) => !isEdit.value || p.id !== projectId.value)
}

interface TranslationFields {
  title: string
  slug: string
  excerpt: string

  hero_eyebrow: string
  hero_cta_label: string
  hero_cta_url: string
  hero_badges: Record<string, unknown>[]
  hero_stats: Record<string, unknown>[]

  snapshot_items: Record<string, unknown>[]

  scale_heading: string
  scale_description: string
  scale_stats: Record<string, unknown>[]

  challenges_heading: string
  challenges_description: string
  challenges: Record<string, unknown>[]

  feature_map_heading: string
  feature_groups: Record<string, unknown>[]

  journey_heading: string
  journey_steps: Record<string, unknown>[]

  gallery_heading: string
  gallery_categories: Record<string, unknown>[]

  architecture_heading: string
  architecture_layers: Record<string, unknown>[]

  tech_stack_groups: Record<string, unknown>[]

  results_heading: string
  results: Record<string, unknown>[]

  lessons_quote: string
  lessons_citation: string

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
    hero_eyebrow: '',
    hero_cta_label: '',
    hero_cta_url: '',
    hero_badges: [],
    hero_stats: [],
    snapshot_items: [],
    scale_heading: '',
    scale_description: '',
    scale_stats: [],
    challenges_heading: '',
    challenges_description: '',
    challenges: [],
    feature_map_heading: '',
    feature_groups: [],
    journey_heading: '',
    journey_steps: [],
    gallery_heading: '',
    gallery_categories: [],
    architecture_heading: '',
    architecture_layers: [],
    tech_stack_groups: [],
    results_heading: '',
    results: [],
    lessons_quote: '',
    lessons_citation: '',
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

interface SolutionModuleLocaleFields {
  title: string
  description: string
  technical_note: string
  features: string
}

function emptySolutionModuleLocale(): SolutionModuleLocaleFields {
  return { title: '', description: '', technical_note: '', features: '' }
}

const form = reactive({
  category_id: null as number | null,
  status: 'draft' as 'draft' | 'published',
  featured_image: '',
  is_featured: false,
  translations: { vi: emptyTranslation(), en: emptyTranslation() } as Record<string, TranslationFields>,
  metrics: [] as { value: string; vi: { label: string }; en: { label: string } }[],
  solutionModules: [] as { image: string; vi: SolutionModuleLocaleFields; en: SolutionModuleLocaleFields }[],
  galleryImages: [] as { image_url: string; category_key: string }[],
  relatedProjectIds: [] as number[],
})

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

function moduleLocaleFields(module: { vi: SolutionModuleLocaleFields; en: SolutionModuleLocaleFields }): SolutionModuleLocaleFields {
  return module[activeLocale.value as 'vi' | 'en']
}

function addSolutionModule() {
  form.solutionModules.push({ image: '', vi: emptySolutionModuleLocale(), en: emptySolutionModuleLocale() })
}
function removeSolutionModule(i: number) {
  form.solutionModules.splice(i, 1)
}

function addGalleryImage() {
  form.galleryImages.push({ image_url: '', category_key: '' })
}
function removeGalleryImage(i: number) {
  form.galleryImages.splice(i, 1)
}

function addRelatedProject() {
  form.relatedProjectIds.push(otherProjects.value[0]?.id ?? 0)
}
function removeRelatedProject(i: number) {
  form.relatedProjectIds.splice(i, 1)
}

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function arrayToLines(value: unknown): string {
  return Array.isArray(value) ? value.join('\n') : ''
}

async function loadProject() {
  if (!isEdit.value) return
  const { data } = await projectsApi.get(projectId.value)
  const p = data.data
  form.category_id = p.category_id
  form.status = p.status
  form.featured_image = p.featured_image ?? ''
  form.is_featured = p.is_featured

  for (const t of p.translations) {
    form.translations[t.locale] = {
      title: t.title,
      slug: t.slug,
      excerpt: t.excerpt ?? '',
      hero_eyebrow: t.hero_eyebrow ?? '',
      hero_cta_label: t.hero_cta_label ?? '',
      hero_cta_url: t.hero_cta_url ?? '',
      hero_badges: t.hero_badges ?? [],
      hero_stats: t.hero_stats ?? [],
      snapshot_items: t.snapshot_items ?? [],
      scale_heading: t.scale_heading ?? '',
      scale_description: t.scale_description ?? '',
      scale_stats: t.scale_stats ?? [],
      challenges_heading: t.challenges_heading ?? '',
      challenges_description: t.challenges_description ?? '',
      challenges: t.challenges ?? [],
      feature_map_heading: t.feature_map_heading ?? '',
      feature_groups: (t.feature_groups ?? []).map((g: Record<string, unknown>) => ({
        ...g,
        features: arrayToLines(g.features),
      })),
      journey_heading: t.journey_heading ?? '',
      journey_steps: t.journey_steps ?? [],
      gallery_heading: t.gallery_heading ?? '',
      gallery_categories: t.gallery_categories ?? [],
      architecture_heading: t.architecture_heading ?? '',
      architecture_layers: t.architecture_layers ?? [],
      tech_stack_groups: (t.tech_stack_groups ?? []).map((g: Record<string, unknown>) => ({
        ...g,
        items: arrayToLines(g.items),
      })),
      results_heading: t.results_heading ?? '',
      results: t.results ?? [],
      lessons_quote: t.lessons_quote ?? '',
      lessons_citation: t.lessons_citation ?? '',
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

  form.solutionModules = (p.solution_modules ?? []).map(
    (m: { image: string | null; translations: { locale: string; title: string; description: string | null; technical_note: string | null; features: string[] }[] }) => {
      const vi = m.translations.find((t) => t.locale === 'vi')
      const en = m.translations.find((t) => t.locale === 'en')
      return {
        image: m.image ?? '',
        vi: {
          title: vi?.title ?? '',
          description: vi?.description ?? '',
          technical_note: vi?.technical_note ?? '',
          features: arrayToLines(vi?.features ?? []),
        },
        en: {
          title: en?.title ?? '',
          description: en?.description ?? '',
          technical_note: en?.technical_note ?? '',
          features: arrayToLines(en?.features ?? []),
        },
      }
    }
  )

  form.galleryImages = (p.gallery_images ?? []).map((g: { image_url: string; category_key: string | null }) => ({
    image_url: g.image_url,
    category_key: g.category_key ?? '',
  }))

  form.relatedProjectIds = (p.related_projects ?? []).map((r: { id: number }) => r.id)
}

const saving = ref(false)

async function onSubmit() {
  saving.value = true

  const translations: Record<string, Record<string, unknown>> = {}
  for (const [locale, t] of Object.entries(form.translations)) {
    translations[locale] = {
      ...t,
      feature_groups: t.feature_groups.map((g) => ({ ...g, features: linesToArray((g.features as string) ?? '') })),
      tech_stack_groups: t.tech_stack_groups.map((g) => ({ ...g, items: linesToArray((g.items as string) ?? '') })),
    }
  }

  const payload = {
    category_id: form.category_id,
    status: form.status,
    featured_image: form.featured_image || null,
    is_featured: form.is_featured,
    translations,
    metrics: form.metrics.map((m) => ({ value: m.value, translations: { vi: m.vi, en: m.en } })),
    solution_modules: form.solutionModules.map((m) => ({
      image: m.image || null,
      translations: {
        vi: { ...m.vi, features: linesToArray(m.vi.features) },
        en: { ...m.en, features: linesToArray(m.en.features) },
      },
    })),
    gallery_images: form.galleryImages
      .filter((g) => g.image_url)
      .map((g) => ({ image_url: g.image_url, category_key: g.category_key || null })),
    related_project_ids: form.relatedProjectIds.filter(Boolean),
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

onMounted(async () => {
  await Promise.all([loadCategories(), loadOtherProjects(), loadProject()])
})
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900">
      {{ isEdit ? 'Chỉnh sửa dự án' : 'Dự án mới' }}
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
          <label class="text-sm font-medium text-slate-700">Chuyên mục</label>
          <select v-model="form.category_id" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option :value="null">—</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ categoryName(cat) }}
            </option>
          </select>
        </div>
      </div>

      <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input v-model="form.is_featured" type="checkbox" class="rounded border-slate-300" />
        Dự án nổi bật (hiển thị ở khối đầu trang danh sách dự án)
      </label>

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

          <details class="group border border-slate-200 rounded-xl p-4" open>
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Hero</summary>
            <div class="mt-3 space-y-3">
              <input v-model="form.translations[locale.code].hero_eyebrow" type="text" placeholder="Nhãn nhỏ phía trên tiêu đề (vd: EdTech / Learning Platform)" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <div class="grid grid-cols-2 gap-3">
                <input v-model="form.translations[locale.code].hero_cta_label" type="text" placeholder="Nhãn nút CTA (vd: Dùng thử demo)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input v-model="form.translations[locale.code].hero_cta_url" type="text" placeholder="Link CTA" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <p class="text-xs font-medium text-slate-600 mb-1">Badges (chip công nghệ dưới tiêu đề)</p>
                <RepeaterField
                  v-model="form.translations[locale.code].hero_badges"
                  add-label="+ Thêm badge"
                  :fields="[
                    { key: 'icon', label: 'Icon (Material Symbols)', placeholder: 'vd: school' },
                    { key: 'label', label: 'Nhãn', placeholder: 'vd: LMS' },
                  ]"
                />
              </div>
              <div>
                <p class="text-xs font-medium text-slate-600 mb-1">Số liệu nổi bật (4 ô dưới hero)</p>
                <RepeaterField
                  v-model="form.translations[locale.code].hero_stats"
                  add-label="+ Thêm số liệu"
                  :fields="[
                    { key: 'value', label: 'Giá trị', placeholder: 'vd: 50,000+' },
                    { key: 'label', label: 'Nhãn', placeholder: 'vd: Learners' },
                  ]"
                />
              </div>
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Project Snapshot</summary>
            <div class="mt-3">
              <RepeaterField
                v-model="form.translations[locale.code].snapshot_items"
                add-label="+ Thêm mục"
                :fields="[
                  { key: 'icon', label: 'Icon', placeholder: 'vd: category' },
                  { key: 'label', label: 'Nhãn', placeholder: 'vd: Industry' },
                  { key: 'value', label: 'Giá trị', placeholder: 'vd: EdTech' },
                ]"
              />
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Project Scale (Quy mô hệ thống)</summary>
            <div class="mt-3 space-y-3">
              <input v-model="form.translations[locale.code].scale_heading" type="text" placeholder="Tiêu đề section" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <textarea v-model="form.translations[locale.code].scale_description" rows="2" placeholder="Mô tả ngắn" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <RepeaterField
                v-model="form.translations[locale.code].scale_stats"
                add-label="+ Thêm số liệu"
                :fields="[
                  { key: 'value', label: 'Giá trị', placeholder: 'vd: 42' },
                  { key: 'label', label: 'Nhãn', placeholder: 'vd: Advanced Features' },
                ]"
              />
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">The Challenge (Thách thức)</summary>
            <div class="mt-3 space-y-3">
              <input v-model="form.translations[locale.code].challenges_heading" type="text" placeholder="Tiêu đề section" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <textarea v-model="form.translations[locale.code].challenges_description" rows="2" placeholder="Mô tả ngắn" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <RepeaterField
                v-model="form.translations[locale.code].challenges"
                add-label="+ Thêm thách thức"
                :fields="[
                  { key: 'icon', label: 'Icon', placeholder: 'vd: trending_up' },
                  { key: 'color', label: 'Màu', type: 'select', options: colorOptions },
                  { key: 'title', label: 'Tiêu đề' },
                  { key: 'description', label: 'Mô tả', type: 'textarea' },
                  { key: 'wide', label: '', type: 'checkbox', placeholder: 'Ô rộng (chiếm 2 cột)' },
                ]"
              />
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Feature Map (Bản đồ chức năng)</summary>
            <div class="mt-3 space-y-3">
              <input v-model="form.translations[locale.code].feature_map_heading" type="text" placeholder="Tiêu đề section" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <RepeaterField
                v-model="form.translations[locale.code].feature_groups"
                add-label="+ Thêm nhóm tính năng"
                :fields="[
                  { key: 'title', label: 'Tên nhóm', placeholder: 'vd: Learning' },
                  { key: 'badge_label', label: 'Nhãn số lượng', placeholder: 'vd: 12 FEATURES' },
                  { key: 'features', label: 'Danh sách tính năng (mỗi dòng 1 mục)', type: 'textarea' },
                ]"
              />
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Product Journey (Hành trình người học)</summary>
            <div class="mt-3 space-y-3">
              <input v-model="form.translations[locale.code].journey_heading" type="text" placeholder="Tiêu đề section" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <RepeaterField
                v-model="form.translations[locale.code].journey_steps"
                add-label="+ Thêm bước"
                :fields="[
                  { key: 'title', label: 'Tên bước', placeholder: 'vd: Khám phá' },
                  { key: 'description', label: 'Mô tả', type: 'textarea' },
                ]"
              />
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Product Gallery (Danh mục ảnh)</summary>
            <div class="mt-3 space-y-3">
              <input v-model="form.translations[locale.code].gallery_heading" type="text" placeholder="Tiêu đề section" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <p class="text-xs text-slate-500">Khai báo các tab lọc ảnh. "Key" phải khớp với "Category key" của ảnh khai báo ở khối "Ảnh Gallery" phía dưới.</p>
              <RepeaterField
                v-model="form.translations[locale.code].gallery_categories"
                add-label="+ Thêm tab"
                :fields="[
                  { key: 'key', label: 'Key', placeholder: 'vd: learning' },
                  { key: 'label', label: 'Nhãn hiển thị', placeholder: 'vd: Learning' },
                ]"
              />
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Technical Architecture (Kiến trúc kỹ thuật)</summary>
            <div class="mt-3 space-y-3">
              <input v-model="form.translations[locale.code].architecture_heading" type="text" placeholder="Tiêu đề section" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <RepeaterField
                v-model="form.translations[locale.code].architecture_layers"
                add-label="+ Thêm lớp kiến trúc"
                :fields="[
                  { key: 'icon', label: 'Icon', placeholder: 'vd: smartphone' },
                  { key: 'title', label: 'Tên lớp', placeholder: 'vd: Frontend' },
                  { key: 'subtitle', label: 'Công nghệ', placeholder: 'vd: Nuxt.js / Vue' },
                ]"
              />
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Technology Stack</summary>
            <div class="mt-3">
              <RepeaterField
                v-model="form.translations[locale.code].tech_stack_groups"
                add-label="+ Thêm nhóm công nghệ"
                :fields="[
                  { key: 'title', label: 'Tên nhóm', placeholder: 'vd: Backend' },
                  { key: 'items', label: 'Công nghệ (mỗi dòng 1 mục)', type: 'textarea' },
                ]"
              />
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Results & Impact (Kết quả & Tác động)</summary>
            <div class="mt-3 space-y-3">
              <input v-model="form.translations[locale.code].results_heading" type="text" placeholder="Tiêu đề section" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <RepeaterField
                v-model="form.translations[locale.code].results"
                add-label="+ Thêm kết quả"
                :fields="[
                  { key: 'icon', label: 'Icon', placeholder: 'vd: bolt' },
                  { key: 'color', label: 'Màu', type: 'select', options: colorOptions },
                  { key: 'value', label: 'Giá trị', placeholder: 'vd: 100%' },
                  { key: 'label', label: 'Nhãn', placeholder: 'vd: Automatic Grading' },
                ]"
              />
            </div>
          </details>

          <details class="group border border-slate-200 rounded-xl p-4">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">Lessons Learned (Trích dẫn)</summary>
            <div class="mt-3 space-y-3">
              <textarea v-model="form.translations[locale.code].lessons_quote" rows="3" placeholder="Nội dung trích dẫn" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input v-model="form.translations[locale.code].lessons_citation" type="text" placeholder="Nguồn trích dẫn (vd: — Đội ngũ Thiết kế & Kỹ thuật XO)" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </details>

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

      <div class="rounded-xl border border-slate-200 p-4 space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Solution Modules</h3>
          <p class="text-xs text-slate-500">Các khối ảnh + mô tả giải pháp xen kẽ trái/phải trên trang dự án. Dùng chung ảnh cho cả hai ngôn ngữ, nội dung nhập riêng theo ngôn ngữ đang chọn ở tab phía trên ({{ activeLocale }}).</p>
        </div>
        <div v-for="(module, i) in form.solutionModules" :key="i" class="rounded-lg border border-slate-200 p-4 space-y-3">
          <ImageUploadField v-model="module.image" label="Ảnh minh họa" />
          <div class="grid grid-cols-1 gap-2">
            <input v-model="moduleLocaleFields(module).title" type="text" placeholder="Tiêu đề module" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <textarea v-model="moduleLocaleFields(module).description" rows="2" placeholder="Mô tả" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <textarea v-model="moduleLocaleFields(module).features" rows="3" placeholder="Danh sách gạch đầu dòng (mỗi dòng 1 mục)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <textarea v-model="moduleLocaleFields(module).technical_note" rows="2" placeholder="Technical Notes (tùy chọn)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button type="button" class="text-xs text-red-600 hover:text-red-800" @click="removeSolutionModule(i)">Xóa module</button>
        </div>
        <button type="button" class="text-sm text-slate-600 hover:text-slate-900" @click="addSolutionModule">+ Thêm module</button>
      </div>

      <div class="rounded-xl border border-slate-200 p-4 space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Ảnh Gallery</h3>
          <p class="text-xs text-slate-500">Dùng chung cho cả hai ngôn ngữ. "Category key" dùng để lọc theo tab đã khai báo ở mục Product Gallery phía trên.</p>
        </div>
        <div v-for="(image, i) in form.galleryImages" :key="i" class="rounded-lg border border-slate-200 p-4 space-y-2">
          <ImageUploadField v-model="image.image_url" />
          <input v-model="image.category_key" type="text" placeholder="Category key (vd: learning)" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" class="text-xs text-red-600 hover:text-red-800" @click="removeGalleryImage(i)">Xóa ảnh</button>
        </div>
        <button type="button" class="text-sm text-slate-600 hover:text-slate-900" @click="addGalleryImage">+ Thêm ảnh</button>
      </div>

      <div class="rounded-xl border border-slate-200 p-4 space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Dự án liên quan</h3>
          <p class="text-xs text-slate-500">Nếu để trống, trang dự án sẽ tự động hiển thị các dự án khác cùng chuyên mục.</p>
        </div>
        <div v-for="(_, i) in form.relatedProjectIds" :key="i" class="flex items-center gap-2">
          <select v-model="form.relatedProjectIds[i]" class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option v-for="p in otherProjects" :key="p.id" :value="p.id">{{ projectTitle(p) }}</option>
          </select>
          <button type="button" class="text-xs text-red-600 hover:text-red-800" @click="removeRelatedProject(i)">Xóa</button>
        </div>
        <button type="button" class="text-sm text-slate-600 hover:text-slate-900" @click="addRelatedProject">+ Thêm dự án liên quan</button>
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
