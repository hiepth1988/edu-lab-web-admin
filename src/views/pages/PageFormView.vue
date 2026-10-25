<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { pagesApi } from '@/api/pages'
import ImageUploadField from '@/components/ImageUploadField.vue'
import JsonFieldEditor from '@/components/JsonFieldEditor.vue'
import { PAGE_LABELS, SECTION_LABELS, blankLike } from '@/utils/pageLabels'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://edulab.xotech.space').replace(/\/$/, '')
const route = useRoute()
const pageId = computed(() => Number(route.params.id))

const locales = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
] as const
type LocaleCode = (typeof locales)[number]['code']
const activeLocale = ref<LocaleCode>('vi')

const TEXT_FIELDS = [
  { key: 'heading', label: 'Tiêu đề', long: false },
  { key: 'subheading', label: 'Tiêu đề phụ', long: true },
  { key: 'body', label: 'Nội dung', long: true },
  { key: 'cta_label', label: 'Chữ trên nút', long: false },
  { key: 'cta_url', label: 'Link nút', long: false },
] as const

interface PageTranslationForm {
  slug: string
  title: string
  excerpt: string
  content: string
  meta_title: string
  meta_description: string
  og_image: string
}

interface SectionTranslationForm {
  heading: string
  subheading: string
  body: string
  cta_label: string
  cta_url: string
  extra: Json
}

interface SectionForm {
  id: number
  section_key: string
  sort_order: number
  is_active: boolean
  translations: Record<string, SectionTranslationForm>
}

const loading = ref(true)
const loadError = ref('')
const pageKey = ref('')
const form = reactive({
  status: 'published' as 'draft' | 'published',
  translations: {} as Record<string, PageTranslationForm>,
  sections: [] as SectionForm[],
})

const expanded = ref<Set<number>>(new Set())
const showEmptyFields = ref<Set<number>>(new Set())

const pageTitle = computed(() => PAGE_LABELS[pageKey.value] ?? pageKey.value)
const hasContentField = computed(() =>
  locales.some((l) => !!form.translations[l.code]?.content) || form.sections.length === 0,
)

function pageUrl(locale: LocaleCode) {
  const prefix = locale === 'en' ? '/en' : ''
  if (pageKey.value === 'home') return `${siteUrl}${prefix || '/'}`
  return `${siteUrl}${prefix}/${form.translations[locale]?.slug ?? ''}`
}

function sectionLabel(key: string) {
  return SECTION_LABELS[key] ?? key
}

function otherLocale(locale: LocaleCode): LocaleCode {
  return locale === 'vi' ? 'en' : 'vi'
}

/** Text fields shown for a section: those with content in any language, or all when asked. */
function visibleTextFields(section: SectionForm) {
  if (showEmptyFields.value.has(section.id)) return TEXT_FIELDS
  return TEXT_FIELDS.filter((f) => locales.some((l) => !!section.translations[l.code]?.[f.key]))
}

function hasExtra(section: SectionForm, locale: LocaleCode) {
  const extra = section.translations[locale]?.extra
  return extra && typeof extra === 'object' && Object.keys(extra).length > 0
}

function toggle(set: Set<number>, id: number) {
  if (set.has(id)) set.delete(id)
  else set.add(id)
}

function sectionSummary(section: SectionForm) {
  const t = section.translations[activeLocale.value]
  return t?.heading || t?.extra?.eyebrow || ''
}

// --- loading -------------------------------------------------------------------

function toSectionTranslation(t: Json | undefined, other: Json | undefined): SectionTranslationForm {
  return {
    heading: t?.heading ?? '',
    subheading: t?.subheading ?? '',
    body: t?.body ?? '',
    cta_label: t?.cta_label ?? '',
    cta_url: t?.cta_url ?? '',
    // A missing language gets the other language's structure with empty values.
    extra: t ? (t.extra ?? null) : other?.extra ? blankLike(other.extra) : null,
  }
}

const savedSnapshot = ref('')
const snapshot = () => JSON.stringify(form)
const isDirty = computed(() => !loading.value && savedSnapshot.value !== snapshot())

function fill(page: Json) {
  pageKey.value = page.key
  form.status = page.status
  form.translations = {}
  for (const l of locales) {
    const t = page.translations.find((x: Json) => x.locale === l.code)
    if (!t) continue
    form.translations[l.code] = {
      slug: t.slug ?? '',
      title: t.title ?? '',
      excerpt: t.excerpt ?? '',
      content: t.content ?? '',
      meta_title: t.meta_title ?? '',
      meta_description: t.meta_description ?? '',
      og_image: t.og_image ?? '',
    }
  }
  form.sections = [...page.sections]
    .sort((a: Json, b: Json) => a.sort_order - b.sort_order)
    .map((s: Json) => {
      const byLocale = (code: string) => s.translations.find((x: Json) => x.locale === code)
      return {
        id: s.id,
        section_key: s.section_key,
        sort_order: s.sort_order,
        is_active: s.is_active,
        translations: Object.fromEntries(
          locales.map((l) => [l.code, toSectionTranslation(byLocale(l.code), byLocale(otherLocale(l.code)))]),
        ),
      }
    })
  savedSnapshot.value = snapshot()
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await pagesApi.get(pageId.value)
    fill(data.data)
  } catch {
    loadError.value = 'Không tải được trang.'
  } finally {
    loading.value = false
  }
}

// --- saving --------------------------------------------------------------------

const saving = ref(false)
const message = ref<{ type: 'ok' | 'error'; text: string } | null>(null)

/** Turns empty strings into null so cleared fields don't linger as "". */
function emptyToNull(value: string) {
  return value === '' ? null : value
}

async function save() {
  saving.value = true
  message.value = null
  const payload = {
    status: form.status,
    translations: Object.fromEntries(
      Object.entries(form.translations).map(([code, t]) => [
        code,
        {
          title: t.title,
          excerpt: emptyToNull(t.excerpt),
          content: emptyToNull(t.content),
          meta_title: emptyToNull(t.meta_title),
          meta_description: emptyToNull(t.meta_description),
          og_image: emptyToNull(t.og_image),
        },
      ]),
    ),
    sections: form.sections.map((s) => ({
      id: s.id,
      sort_order: s.sort_order,
      is_active: s.is_active,
      translations: Object.fromEntries(
        Object.entries(s.translations).map(([code, t]) => [
          code,
          {
            heading: emptyToNull(t.heading),
            subheading: emptyToNull(t.subheading),
            body: emptyToNull(t.body),
            cta_label: emptyToNull(t.cta_label),
            cta_url: emptyToNull(t.cta_url),
            extra: t.extra,
          },
        ]),
      ),
    })),
  }
  try {
    const { data } = await pagesApi.update(pageId.value, payload)
    fill(data.data)
    message.value = { type: 'ok', text: 'Đã lưu. Website cập nhật ngay.' }
  } catch (e: Json) {
    const status = e?.response?.status
    message.value = {
      type: 'error',
      text:
        status === 403
          ? 'Bạn không có quyền lưu trang đang Published. Hãy nhờ admin.'
          : status === 422
            ? `Dữ liệu chưa hợp lệ: ${Object.values(e.response.data.errors ?? {}).flat().slice(0, 3).join(' ')}`
            : 'Lưu thất bại. Vui lòng thử lại.',
    }
  } finally {
    saving.value = false
  }
}

// --- move sections ------------------------------------------------------------

function moveSection(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= form.sections.length) return
  const list = form.sections
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item)
  // Renumber so the saved order matches what's on screen.
  list.forEach((s, i) => (s.sort_order = (i + 1) * 10))
}

// --- unsaved-changes guard ----------------------------------------------------

function beforeUnload(event: BeforeUnloadEvent) {
  if (isDirty.value) event.preventDefault()
}

onBeforeRouteLeave(() => !isDirty.value || confirm('Bạn có thay đổi chưa lưu. Rời trang?'))

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  load()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none'
</script>

<template>
  <div class="max-w-4xl">
    <RouterLink to="/pages" class="text-sm text-slate-500 hover:text-slate-800">← Tất cả trang</RouterLink>

    <p v-if="loading" class="mt-6 text-sm text-slate-400">Đang tải...</p>
    <p v-else-if="loadError" class="mt-6 text-sm text-red-600">{{ loadError }}</p>

    <template v-else>
      <!-- Toolbar stays visible while scrolling through long pages. -->
      <div class="sticky top-0 z-10 -mx-8 mt-2 border-b border-slate-200 bg-slate-50/95 px-8 pb-3 pt-3 backdrop-blur">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold text-slate-900">{{ pageTitle }}</h1>
            <a :href="pageUrl(activeLocale)" target="_blank" rel="noopener" class="text-xs text-slate-500 hover:text-slate-800 hover:underline">
              {{ pageUrl(activeLocale) }} ↗
            </a>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="isDirty" class="text-xs font-medium text-amber-600">● Chưa lưu</span>
            <select v-model="form.status" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="published">Published</option>
              <option value="draft">Draft (ẩn trang)</option>
            </select>
            <button
              type="button"
              :disabled="saving || !isDirty"
              class="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              @click="save"
            >
              {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
          </div>
        </div>

        <div class="mt-3 flex gap-2">
          <button
            v-for="l in locales"
            :key="l.code"
            type="button"
            class="rounded-full px-3.5 py-1 text-sm"
            :class="activeLocale === l.code ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900'"
            @click="activeLocale = l.code"
          >
            {{ l.label }}
          </button>
        </div>

        <p
          v-if="message"
          class="mt-3 rounded-lg px-3 py-2 text-sm"
          :class="message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
        >
          {{ message.text }}
        </p>
      </div>

      <p v-if="form.status === 'draft'" class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
        Trang đang ở trạng thái Draft: khách truy cập sẽ không xem được trang này.
      </p>

      <!-- Page info + SEO -->
      <section v-if="form.translations[activeLocale]" class="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold text-slate-900">Thông tin trang & SEO</h2>
        <div class="mt-4 space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-700">Tiêu đề trang</label>
            <input v-model="form.translations[activeLocale].title" type="text" :class="inputClass" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Mô tả ngắn</label>
            <textarea v-model="form.translations[activeLocale].excerpt" rows="2" :class="inputClass" />
          </div>
          <div v-if="hasContentField">
            <label class="text-sm font-medium text-slate-700">Nội dung trang</label>
            <textarea v-model="form.translations[activeLocale].content" rows="10" :class="inputClass" />
            <p class="mt-1 text-xs text-slate-400">Văn bản thường. Xuống dòng sẽ được giữ nguyên khi hiển thị.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium text-slate-700">
                Meta title
                <span class="font-normal text-slate-400">({{ form.translations[activeLocale].meta_title.length }}/60)</span>
              </label>
              <input v-model="form.translations[activeLocale].meta_title" type="text" :placeholder="form.translations[activeLocale].title" :class="inputClass" />
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">
                Meta description
                <span class="font-normal text-slate-400">({{ form.translations[activeLocale].meta_description.length }}/160)</span>
              </label>
              <textarea v-model="form.translations[activeLocale].meta_description" rows="4" :placeholder="form.translations[activeLocale].excerpt" :class="inputClass" />
            </div>
          </div>
          <ImageUploadField
            v-model="form.translations[activeLocale].og_image"
            label="Ảnh chia sẻ (OG image)"
            hint="Ảnh hiển thị khi chia sẻ link lên Facebook/Zalo/LinkedIn."
            :recommended-width="1200"
            :recommended-height="630"
          />
        </div>
      </section>

      <!-- Sections -->
      <h2 v-if="form.sections.length" class="mt-8 font-semibold text-slate-900">Các section ({{ form.sections.length }})</h2>
      <p v-if="form.sections.length" class="mt-1 text-sm text-slate-500">
        Thứ tự dưới đây là thứ tự hiển thị trên trang. Bỏ tick "Hiển thị" để ẩn section mà không mất nội dung.
      </p>

      <div class="mt-4 space-y-3">
        <section
          v-for="(section, index) in form.sections"
          :key="section.id"
          class="rounded-xl border bg-white"
          :class="section.is_active ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-75'"
        >
          <!-- Header -->
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="flex flex-col text-xs leading-none text-slate-400">
              <button type="button" title="Lên" class="px-1 py-0.5 hover:text-slate-800 disabled:opacity-30" :disabled="index === 0" @click="moveSection(index, -1)">▲</button>
              <button type="button" title="Xuống" class="px-1 py-0.5 hover:text-slate-800 disabled:opacity-30" :disabled="index === form.sections.length - 1" @click="moveSection(index, 1)">▼</button>
            </div>
            <button type="button" class="min-w-0 flex-1 text-left" @click="toggle(expanded, section.id)">
              <div class="flex items-center gap-2">
                <span class="font-medium text-slate-900">{{ sectionLabel(section.section_key) }}</span>
                <code class="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{{ section.section_key }}</code>
                <span v-if="!section.is_active" class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">Đang ẩn</span>
              </div>
              <p class="mt-0.5 truncate text-xs text-slate-500">{{ sectionSummary(section) }}</p>
            </button>
            <label class="flex items-center gap-1.5 text-sm text-slate-600">
              <input v-model="section.is_active" type="checkbox" class="rounded border-slate-300" />
              Hiển thị
            </label>
            <button type="button" class="w-6 text-slate-400 hover:text-slate-800" @click="toggle(expanded, section.id)">
              {{ expanded.has(section.id) ? '−' : '+' }}
            </button>
          </div>

          <!-- Body -->
          <div v-if="expanded.has(section.id)" class="space-y-4 border-t border-slate-100 px-4 py-4">
            <template v-for="f in visibleTextFields(section)" :key="f.key">
              <div>
                <label class="text-sm font-medium text-slate-700">{{ f.label }}</label>
                <textarea v-if="f.long" v-model="section.translations[activeLocale][f.key]" rows="3" :class="inputClass" />
                <input v-else v-model="section.translations[activeLocale][f.key]" type="text" :class="inputClass" />
              </div>
            </template>

            <JsonFieldEditor
              v-if="hasExtra(section, activeLocale)"
              :parent="section.translations[activeLocale]"
              field="extra"
              :sample="section.translations[otherLocale(activeLocale)]?.extra"
              label=""
            />

            <p
              v-if="!visibleTextFields(section).length && !hasExtra(section, activeLocale)"
              class="text-sm text-slate-500"
            >
              Section này lấy dữ liệu tự động (ví dụ danh sách dự án, bài viết), chỉ bật/tắt và đổi thứ tự được.
            </p>

            <button
              type="button"
              class="text-xs text-slate-400 hover:text-slate-700"
              @click="toggle(showEmptyFields, section.id)"
            >
              {{ showEmptyFields.has(section.id) ? 'Ẩn các trường trống' : 'Hiện cả các trường đang trống' }}
            </button>
          </div>
        </section>
      </div>

      <div class="h-16" />
    </template>
  </div>
</template>
