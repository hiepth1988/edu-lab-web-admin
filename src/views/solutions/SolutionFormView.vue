<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { solutionsApi } from '@/api/catalog'
import LocaleTabs from '@/components/LocaleTabs.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id !== undefined && route.params.id !== 'new')
const solutionId = computed(() => Number(route.params.id))

const locales = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
]
const activeLocale = ref('vi')

interface TranslationFields {
  title: string
  slug: string
  subheading: string
  problem: string
  solution_overview: string
  architecture_note: string
  use_cases: string
}

function emptyTranslation(): TranslationFields {
  return {
    title: '',
    slug: '',
    subheading: '',
    problem: '',
    solution_overview: '',
    architecture_note: '',
    use_cases: '',
  }
}

const form = reactive({
  status: 'draft' as 'draft' | 'published',
  sort_order: 0,
  translations: { vi: emptyTranslation(), en: emptyTranslation() } as Record<string, TranslationFields>,
  features: [] as { vi: { title: string; description: string }; en: { title: string; description: string } }[],
  faqs: [] as { vi: { question: string; answer: string }; en: { question: string; answer: string } }[],
})

const completed = computed(() => ({
  vi: !!form.translations.vi.title,
  en: !!form.translations.en.title,
}))

function addFeature() {
  form.features.push({ vi: { title: '', description: '' }, en: { title: '', description: '' } })
}
function removeFeature(i: number) {
  form.features.splice(i, 1)
}

function addFaq() {
  form.faqs.push({ vi: { question: '', answer: '' }, en: { question: '', answer: '' } })
}
function removeFaq(i: number) {
  form.faqs.splice(i, 1)
}

async function loadSolution() {
  if (!isEdit.value) return
  const { data } = await solutionsApi.get(solutionId.value)
  const s = data.data
  form.status = s.status
  form.sort_order = s.sort_order
  for (const t of s.translations) {
    form.translations[t.locale] = {
      title: t.title,
      slug: t.slug,
      subheading: t.subheading ?? '',
      problem: t.problem ?? '',
      solution_overview: t.solution_overview ?? '',
      architecture_note: t.architecture_note ?? '',
      use_cases: t.use_cases ?? '',
    }
  }
  form.features = s.features.map((f: { translations: { locale: string; title: string; description: string | null }[] }) => ({
    vi: {
      title: f.translations.find((t) => t.locale === 'vi')?.title ?? '',
      description: f.translations.find((t) => t.locale === 'vi')?.description ?? '',
    },
    en: {
      title: f.translations.find((t) => t.locale === 'en')?.title ?? '',
      description: f.translations.find((t) => t.locale === 'en')?.description ?? '',
    },
  }))
  form.faqs = s.faqs.map((f: { translations: { locale: string; question: string; answer: string | null }[] }) => ({
    vi: {
      question: f.translations.find((t) => t.locale === 'vi')?.question ?? '',
      answer: f.translations.find((t) => t.locale === 'vi')?.answer ?? '',
    },
    en: {
      question: f.translations.find((t) => t.locale === 'en')?.question ?? '',
      answer: f.translations.find((t) => t.locale === 'en')?.answer ?? '',
    },
  }))
}

const saving = ref(false)

async function onSubmit() {
  saving.value = true
  const payload = {
    status: form.status,
    sort_order: form.sort_order,
    translations: form.translations,
    features: form.features.map((f) => ({ translations: f })),
    faqs: form.faqs.map((f) => ({ translations: f })),
  }
  try {
    if (isEdit.value) {
      await solutionsApi.update(solutionId.value, payload)
    } else {
      await solutionsApi.create(payload)
    }
    router.push('/solutions')
  } finally {
    saving.value = false
  }
}

onMounted(loadSolution)
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900">
      {{ isEdit ? 'Chỉnh sửa Solution' : 'Solution mới' }}
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
            <label class="text-sm font-medium text-slate-700">Problem</label>
            <textarea v-model="form.translations[locale.code].problem" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Solution Overview</label>
            <textarea v-model="form.translations[locale.code].solution_overview" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Architecture Note</label>
            <textarea v-model="form.translations[locale.code].architecture_note" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Use Cases</label>
            <textarea v-model="form.translations[locale.code].use_cases" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-slate-700">Core Features</label>
          <button type="button" class="text-sm text-slate-600 hover:text-slate-900" @click="addFeature">+ Thêm feature</button>
        </div>
        <div v-for="(feature, i) in form.features" :key="i" class="mt-3 rounded-lg border border-slate-200 p-4 grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">VI</p>
            <input v-model="feature.vi.title" placeholder="Title" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2" />
            <textarea v-model="feature.vi.description" placeholder="Description" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">EN</p>
            <input v-model="feature.en.title" placeholder="Title" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2" />
            <textarea v-model="feature.en.description" placeholder="Description" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button type="button" class="col-span-2 text-left text-xs text-red-600 hover:text-red-800" @click="removeFeature(i)">Xóa feature</button>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-slate-700">FAQ</label>
          <button type="button" class="text-sm text-slate-600 hover:text-slate-900" @click="addFaq">+ Thêm FAQ</button>
        </div>
        <div v-for="(faq, i) in form.faqs" :key="i" class="mt-3 rounded-lg border border-slate-200 p-4 grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">VI</p>
            <input v-model="faq.vi.question" placeholder="Question" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2" />
            <textarea v-model="faq.vi.answer" placeholder="Answer" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">EN</p>
            <input v-model="faq.en.question" placeholder="Question" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2" />
            <textarea v-model="faq.en.answer" placeholder="Answer" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button type="button" class="col-span-2 text-left text-xs text-red-600 hover:text-red-800" @click="removeFaq(i)">Xóa FAQ</button>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="rounded-lg bg-slate-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-800 disabled:opacity-60">
          {{ saving ? 'Đang lưu...' : 'Lưu' }}
        </button>
        <RouterLink to="/solutions" class="rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 text-slate-700 hover:bg-slate-50">Hủy</RouterLink>
      </div>
    </form>
  </div>
</template>
