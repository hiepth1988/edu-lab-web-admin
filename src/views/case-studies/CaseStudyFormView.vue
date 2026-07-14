<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { caseStudiesApi } from '@/api/catalog'
import HtmlEditor from '@/components/HtmlEditor.vue'
import LocaleTabs from '@/components/LocaleTabs.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id !== undefined && route.params.id !== 'new')
const caseId = computed(() => Number(route.params.id))

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
}

function emptyTranslation(): TranslationFields {
  return { title: '', slug: '', excerpt: '', problem: '', solution_text: '', result: '' }
}

const form = reactive({
  status: 'draft' as 'draft' | 'published',
  featured_image: '',
  translations: { vi: emptyTranslation(), en: emptyTranslation() } as Record<string, TranslationFields>,
  metrics: [] as { value: string; vi: { label: string }; en: { label: string } }[],
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

async function loadCase() {
  if (!isEdit.value) return
  const { data } = await caseStudiesApi.get(caseId.value)
  const c = data.data
  form.status = c.status
  form.featured_image = c.featured_image ?? ''
  for (const t of c.translations) {
    form.translations[t.locale] = {
      title: t.title,
      slug: t.slug,
      excerpt: t.excerpt ?? '',
      problem: t.problem ?? '',
      solution_text: t.solution_text ?? '',
      result: t.result ?? '',
    }
  }
  form.metrics = c.metrics.map((m: { value: string; translations: { locale: string; label: string }[] }) => ({
    value: m.value,
    vi: { label: m.translations.find((t) => t.locale === 'vi')?.label ?? '' },
    en: { label: m.translations.find((t) => t.locale === 'en')?.label ?? '' },
  }))
}

const saving = ref(false)

async function onSubmit() {
  saving.value = true
  const payload = {
    status: form.status,
    featured_image: form.featured_image || null,
    translations: form.translations,
    metrics: form.metrics.map((m) => ({ value: m.value, translations: { vi: m.vi, en: m.en } })),
  }
  try {
    if (isEdit.value) {
      await caseStudiesApi.update(caseId.value, payload)
    } else {
      await caseStudiesApi.create(payload)
    }
    router.push('/case-studies')
  } finally {
    saving.value = false
  }
}

onMounted(loadCase)
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900">
      {{ isEdit ? 'Chỉnh sửa Case Study' : 'Case Study mới' }}
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
          <label class="text-sm font-medium text-slate-700">Featured image URL</label>
          <input v-model="form.featured_image" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
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
        <RouterLink to="/case-studies" class="rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 text-slate-700 hover:bg-slate-50">Hủy</RouterLink>
      </div>
    </form>
  </div>
</template>
