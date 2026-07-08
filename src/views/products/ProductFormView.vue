<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productsApi } from '@/api/catalog'
import LocaleTabs from '@/components/LocaleTabs.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id !== undefined && route.params.id !== 'new')
const productId = computed(() => Number(route.params.id))

const locales = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
]
const activeLocale = ref('vi')

interface TranslationFields {
  name: string
  slug: string
  role_summary: string
  description: string
}

function emptyTranslation(): TranslationFields {
  return { name: '', slug: '', role_summary: '', description: '' }
}

const form = reactive({
  status: 'draft' as 'draft' | 'published',
  stage: '',
  sort_order: 0,
  translations: { vi: emptyTranslation(), en: emptyTranslation() } as Record<string, TranslationFields>,
  features: [] as { vi: { title: string; description: string }; en: { title: string; description: string } }[],
})

const completed = computed(() => ({
  vi: !!form.translations.vi.name,
  en: !!form.translations.en.name,
}))

function addFeature() {
  form.features.push({ vi: { title: '', description: '' }, en: { title: '', description: '' } })
}
function removeFeature(i: number) {
  form.features.splice(i, 1)
}

async function loadProduct() {
  if (!isEdit.value) return
  const { data } = await productsApi.get(productId.value)
  const p = data.data
  form.status = p.status
  form.stage = p.stage ?? ''
  form.sort_order = p.sort_order
  for (const t of p.translations) {
    form.translations[t.locale] = {
      name: t.name,
      slug: t.slug,
      role_summary: t.role_summary ?? '',
      description: t.description ?? '',
    }
  }
  form.features = p.features.map((f: { translations: { locale: string; title: string; description: string | null }[] }) => ({
    vi: {
      title: f.translations.find((t) => t.locale === 'vi')?.title ?? '',
      description: f.translations.find((t) => t.locale === 'vi')?.description ?? '',
    },
    en: {
      title: f.translations.find((t) => t.locale === 'en')?.title ?? '',
      description: f.translations.find((t) => t.locale === 'en')?.description ?? '',
    },
  }))
}

const saving = ref(false)

async function onSubmit() {
  saving.value = true
  const payload = {
    status: form.status,
    stage: form.stage,
    sort_order: form.sort_order,
    translations: form.translations,
    features: form.features.map((f) => ({ translations: f })),
  }
  try {
    if (isEdit.value) {
      await productsApi.update(productId.value, payload)
    } else {
      await productsApi.create(payload)
    }
    router.push('/products')
  } finally {
    saving.value = false
  }
}

onMounted(loadProduct)
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900">
      {{ isEdit ? 'Chỉnh sửa Product' : 'Product mới' }}
    </h1>

    <form class="mt-6 space-y-8" @submit.prevent="onSubmit">
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-medium text-slate-700">Trạng thái</label>
          <select v-model="form.status" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">Stage</label>
          <input v-model="form.stage" type="text" placeholder="live, mvp-3-6-months, ..." class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">Thứ tự</label>
          <input v-model.number="form.sort_order" type="number" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <LocaleTabs v-model:active="activeLocale" :locales="locales" :completed="completed" />
        <div v-for="locale in locales" :key="locale.code" v-show="activeLocale === locale.code" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-700">Tên</label>
            <input v-model="form.translations[locale.code].name" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Slug</label>
            <input v-model="form.translations[locale.code].slug" type="text" placeholder="Để trống sẽ tự sinh" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Vai trò (role summary)</label>
            <input v-model="form.translations[locale.code].role_summary" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Mô tả</label>
            <textarea v-model="form.translations[locale.code].description" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
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

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="rounded-lg bg-slate-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-800 disabled:opacity-60">
          {{ saving ? 'Đang lưu...' : 'Lưu' }}
        </button>
        <RouterLink to="/products" class="rounded-lg border border-slate-300 text-sm font-medium px-5 py-2.5 text-slate-700 hover:bg-slate-50">Hủy</RouterLink>
      </div>
    </form>
  </div>
</template>
