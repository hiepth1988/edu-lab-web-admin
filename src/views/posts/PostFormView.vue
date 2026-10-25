<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsApi, categoriesApi, tagsApi, type PostTranslationPayload } from '@/api/posts'
import LocaleTabs from '@/components/LocaleTabs.vue'
import HtmlEditor from '@/components/HtmlEditor.vue'
import SeoFields from '@/components/SeoFields.vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import PostPreview from '@/components/PostPreview.vue'
import type { ImportedHtmlMeta } from '@/utils/importHtml'

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://xotech.space').replace(/\/$/, '')

// Keep in sync with edu-lab-web-front: i18n `detail.postCta*` and runtimeConfig `postCtaUrl`.
const defaultCta: Record<string, { text: string; label: string }> = {
  vi: {
    text: 'Bạn đang xây nền tảng thi trực tuyến hoặc ngân hàng câu hỏi? XO có sẵn Exam Engine và Question Bank Engine đã chạy thực tế tại TopThi.',
    label: 'Cơ chế hợp tác',
  },
  en: {
    text: 'Building an online exam platform or question bank? XO has a ready Exam Engine and Question Bank Engine, already running in production at TopThi.',
    label: 'Partnership models',
  },
}
const defaultCtaUrl = import.meta.env.VITE_POST_CTA_URL ?? '/hop-tac'
// The partnership page has localized paths (i18n.paths in front's pages/hop-tac.vue); used for the preview link only.
const localizedPaths: Record<string, Record<string, string>> = { '/hop-tac': { en: '/partnership' } }

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
const otherPosts = ref<{ id: number; status: string; translations: { locale: string; title: string }[] }[]>([])

function emptyTranslation(): PostTranslationPayload {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cta_text: '',
    cta_label: '',
    cta_url: '',
    meta_title: '',
    meta_description: '',
    og_image: '',
    canonical_url: '',
  }
}

const form = reactive({
  category_id: null as number | null,
  status: 'draft' as 'draft' | 'published',
  featured_image: '' as string,
  featured_image_en: '' as string,
  is_featured: false,
  show_cta: true,
  tag_ids: [] as number[],
  related_post_ids: [] as number[],
  translations: {
    vi: emptyTranslation(),
    en: emptyTranslation(),
  } as Record<string, PostTranslationPayload>,
})

const localePathPrefix: Record<string, string> = { vi: '', en: '/en' }

function previewUrl(localeCode: string) {
  const slug = form.translations[localeCode]?.slug || 'bai-viet-cua-ban'
  return `${siteUrl}${localePathPrefix[localeCode] ?? ''}/insights/${slug}`
}

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

function postTitle(p: { id: number; status: string; translations: { locale: string; title: string }[] }) {
  const title = p.translations.find((t) => t.locale === 'vi')?.title ?? p.translations[0]?.title ?? `#${p.id}`
  return p.status === 'published' ? title : `${title} (draft)`
}

function addRelatedPost() {
  const used = new Set(form.related_post_ids)
  form.related_post_ids.push(otherPosts.value.find((p) => !used.has(p.id))?.id ?? 0)
}
function removeRelatedPost(i: number) {
  form.related_post_ids.splice(i, 1)
}

async function loadOptions() {
  const [cats, tgs, posts] = await Promise.all([
    categoriesApi.list(),
    tagsApi.list(),
    postsApi.list({ per_page: 200 }),
  ])
  categories.value = cats.data.data
  tags.value = tgs.data.data
  otherPosts.value = posts.data.data.filter((p: { id: number }) => !isEdit.value || p.id !== postId.value)
}

async function loadPost() {
  if (!isEdit.value) return
  const { data } = await postsApi.get(postId.value)
  const post = data.data
  form.category_id = post.category_id
  form.status = post.status
  form.featured_image = post.featured_image ?? ''
  form.featured_image_en = post.featured_image_en ?? ''
  form.is_featured = post.is_featured
  form.show_cta = post.show_cta ?? true
  form.tag_ids = post.tags.map((t: { id: number }) => t.id)
  form.related_post_ids = (post.related_posts ?? []).map((r: { id: number }) => r.id)
  for (const t of post.translations) {
    form.translations[t.locale] = {
      title: t.title,
      slug: t.slug,
      excerpt: t.excerpt ?? '',
      content: t.content ?? '',
      cta_text: t.cta_text ?? '',
      cta_label: t.cta_label ?? '',
      cta_url: t.cta_url ?? '',
      meta_title: t.meta_title ?? '',
      meta_description: t.meta_description ?? '',
      og_image: t.og_image ?? '',
      canonical_url: t.canonical_url ?? '',
    }
  }
}

function absoluteSiteUrl(url: string, localeCode: string) {
  if (/^https?:\/\//.test(url)) return url
  const path = localizedPaths[url]?.[localeCode] ?? url
  return `${siteUrl}${localePathPrefix[localeCode] ?? ''}${path}`
}

const preview = computed(() => {
  const code = activeLocale.value
  const tr = form.translations[code]
  const cat = categories.value.find((c) => c.id === form.category_id)
  return {
    url: previewUrl(code),
    category: cat ? (cat.translations.find((t) => t.locale === code)?.name ?? categoryName(cat)) : null,
    tags: tags.value
      .filter((t) => form.tag_ids.includes(t.id))
      .map((t) => t.translations.find((x) => x.locale === code)?.name ?? tagName(t)),
    cta: form.show_cta
      ? {
          text: tr.cta_text || defaultCta[code].text,
          label: tr.cta_label || defaultCta[code].label,
          url: absoluteSiteUrl(tr.cta_url || defaultCtaUrl, code),
        }
      : null,
    relatedTitles: form.related_post_ids
      .map((id) => otherPosts.value.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p && p.status === 'published')
      .map((p) => p.translations.find((t) => t.locale === code)?.title ?? postTitle(p)),
  }
})

// When a full HTML page is pasted, fill only the fields that are still empty from its <head>.
function applyImportedMeta(localeCode: string, meta: ImportedHtmlMeta) {
  const tr = form.translations[localeCode]
  if (!tr.title && meta.title) tr.title = meta.title
  if (!tr.meta_title && meta.title) tr.meta_title = meta.title
  if (!tr.meta_description && meta.description) tr.meta_description = meta.description
  if (!tr.og_image && meta.image) tr.og_image = meta.image
  if (!form.featured_image && meta.image) form.featured_image = meta.image
}

const saving = ref(false)

async function onSubmit() {
  saving.value = true
  try {
    const payload = { ...form, related_post_ids: form.related_post_ids.filter(Boolean) }
    if (isEdit.value) {
      await postsApi.update(postId.value, payload)
    } else {
      await postsApi.create(payload)
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
  <div class="flex items-start gap-8">
  <div class="w-full max-w-3xl shrink-0">
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

      <ImageUploadField
        v-model="form.featured_image"
        label="Ảnh cover (Featured image)"
        :recommended-width="1200"
        :recommended-height="630"
        hint="Hiển thị đầu bài viết, ở danh sách bài viết và khi chia sẻ (nếu chưa có OG Image riêng). Giữ chữ và chi tiết quan trọng cách mép ảnh ~60px."
      />
      <ImageUploadField
        v-model="form.featured_image_en"
        label="Ảnh cover — tiếng Anh (tuỳ chọn)"
        :recommended-width="1200"
        :recommended-height="630"
        hint="Để trống = trang tiếng Anh dùng ảnh tiếng Việt."
        :fallback-src="form.featured_image"
        fallback-label="ảnh tiếng Việt"
      />

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
            <label class="text-sm font-medium text-slate-700">Mô tả ngắn (excerpt)</label>
            <textarea
              v-model="form.translations[locale.code].excerpt"
              rows="2"
              placeholder="Tóm tắt ngắn gọn nội dung bài viết..."
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p class="mt-1 text-xs text-slate-400">
              Dùng làm meta description nếu bạn không điền riêng. Tối đa 160 ký tự.
              ({{ form.translations[locale.code].excerpt?.length ?? 0 }}/160)
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 block mb-1">Nội dung</label>
            <HtmlEditor
              v-model="form.translations[locale.code].content"
              @imported="(meta) => applyImportedMeta(locale.code, meta)"
            />
          </div>

          <div class="rounded-xl border border-slate-200 p-4 space-y-3">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-sm font-semibold text-slate-900">CTA cuối bài</h3>
                <p class="text-xs text-slate-500">
                  Để trống sẽ dùng CTA mặc định của site (chữ mờ trong ô). Chỉ điền khi bài cần CTA riêng.
                  <span
                    v-if="!form.translations[locale.code].cta_text && !form.translations[locale.code].cta_label && !form.translations[locale.code].cta_url"
                    class="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                  >Đang dùng mặc định</span>
                </p>
              </div>
              <label class="flex shrink-0 items-center gap-1.5 text-sm text-slate-700">
                <input v-model="form.show_cta" type="checkbox" />
                Hiển thị CTA
              </label>
            </div>
            <template v-if="form.show_cta">
              <textarea
                v-model="form.translations[locale.code].cta_text"
                rows="3"
                :placeholder="defaultCta[locale.code].text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div class="grid grid-cols-2 gap-3">
                <input
                  v-model="form.translations[locale.code].cta_label"
                  type="text"
                  :placeholder="`Chữ trên link: ${defaultCta[locale.code].label}`"
                  class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  v-model="form.translations[locale.code].cta_url"
                  type="text"
                  :placeholder="`Link: ${defaultCtaUrl}`"
                  class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <p class="text-xs text-slate-400">Link nội bộ bắt đầu bằng / (vd: /contact) sẽ tự thêm /en cho bản tiếng Anh. Link ngoài dùng https://...</p>
            </template>
          </div>

          <SeoFields
            v-model:meta-title="form.translations[locale.code].meta_title"
            v-model:meta-description="form.translations[locale.code].meta_description"
            v-model:canonical-url="form.translations[locale.code].canonical_url"
            v-model:og-image="form.translations[locale.code].og_image"
            :preview-url="previewUrl(locale.code)"
            :title-fallback="form.translations[locale.code].title || 'Tiêu đề bài viết'"
            :description-fallback="form.translations[locale.code].excerpt || ''"
            og-image-hint="Ảnh hiển thị khi chia sẻ lên Facebook/Zalo. Để trống sẽ dùng ảnh cover của bài viết."
            :image-fallback="form.featured_image"
            image-fallback-label="ảnh cover"
          />
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 p-4 space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Bài viết liên quan</h3>
          <p class="text-xs text-slate-500">Nếu để trống, trang bài viết sẽ tự động hiển thị 3 bài mới nhất cùng chuyên mục. Bài ở trạng thái draft sẽ không hiển thị ngoài site.</p>
        </div>
        <div v-for="(_, i) in form.related_post_ids" :key="i" class="flex items-center gap-2">
          <select v-model="form.related_post_ids[i]" class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option v-for="p in otherPosts" :key="p.id" :value="p.id">{{ postTitle(p) }}</option>
          </select>
          <button type="button" class="text-xs text-red-600 hover:text-red-800" @click="removeRelatedPost(i)">Xóa</button>
        </div>
        <button type="button" class="text-sm text-slate-600 hover:text-slate-900" @click="addRelatedPost">+ Thêm bài viết liên quan</button>
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

  <aside class="sticky top-6 hidden max-h-[calc(100vh-3rem)] min-w-0 flex-1 overflow-y-auto xl:block">
    <PostPreview
      :locale="activeLocale"
      :url="preview.url"
      :category="preview.category"
      :title="form.translations[activeLocale].title"
      :excerpt="form.translations[activeLocale].excerpt"
      :featured-image="form.featured_image"
      :content="form.translations[activeLocale].content"
      :tags="preview.tags"
      :cta="preview.cta"
      :related-titles="preview.relatedTitles"
    />
  </aside>
  </div>
</template>
