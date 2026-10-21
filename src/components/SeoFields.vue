<script setup lang="ts">
import { computed } from 'vue'
import ImageUploadField from '@/components/ImageUploadField.vue'

const metaTitle = defineModel<string>('metaTitle', { default: '' })
const metaDescription = defineModel<string>('metaDescription', { default: '' })
const canonicalUrl = defineModel<string>('canonicalUrl', { default: '' })
const ogImage = defineModel<string>('ogImage', { default: '' })

const props = withDefaults(
  defineProps<{
    previewUrl: string
    titleFallback: string
    descriptionFallback: string
    ogImageHint?: string
    /** Image the site uses when OG Image is empty (e.g. the post cover). */
    imageFallback?: string
    imageFallbackLabel?: string
  }>(),
  { ogImageHint: 'Ảnh hiển thị khi chia sẻ lên Facebook/Zalo. Kích thước lý tưởng: 1200×630px.' },
)

const previewTitle = computed(() => metaTitle.value || props.titleFallback || 'Tiêu đề trang')
const previewDescription = computed(() => metaDescription.value || props.descriptionFallback || 'Mô tả trang sẽ hiển thị ở đây...')
const previewImage = computed(() => ogImage.value || props.imageFallback || '')
const previewDomain = computed(() => {
  try {
    return new URL(props.previewUrl).host.toUpperCase()
  } catch {
    return ''
  }
})

// Empty fields aren't missing: the site falls back to the title/excerpt, so count and judge those.
const effectiveTitleLength = computed(() => (metaTitle.value || props.titleFallback || '').length)
const effectiveDescriptionLength = computed(() => (metaDescription.value || props.descriptionFallback || '').length)

function lengthClass(length: number, min: number, max: number) {
  if (!length) return 'text-slate-400'
  return length > max || length < min ? 'text-amber-600' : 'text-emerald-600'
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-4 space-y-4">
    <div>
      <h3 class="text-sm font-semibold text-slate-900">SEO</h3>
      <p class="text-xs text-slate-500">Kiểm soát cách trang hiển thị trên Google và mạng xã hội.</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <div class="rounded-lg border border-slate-200 p-3 bg-slate-50">
        <p class="text-[11px] uppercase tracking-wide text-slate-400">Xem trước trên Google</p>
        <p class="mt-1 text-xs text-emerald-700 truncate">{{ previewUrl }}</p>
        <p class="text-base text-blue-700 line-clamp-2">{{ previewTitle }}</p>
        <p class="text-sm text-slate-600 line-clamp-2">{{ previewDescription }}</p>
      </div>
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <p class="px-3 pt-3 text-[11px] uppercase tracking-wide text-slate-400">Xem trước khi chia sẻ Facebook/Zalo</p>
        <div class="mx-3 mb-3 mt-2 overflow-hidden rounded-md border border-slate-200 bg-white">
          <div class="aspect-[1200/630] bg-slate-100">
            <img v-if="previewImage" :src="previewImage" alt="" class="h-full w-full object-cover" />
            <div v-else class="flex h-full items-center justify-center text-xs text-slate-400">Chưa có ảnh</div>
          </div>
          <div class="px-2.5 py-2">
            <p class="text-[10px] text-slate-500">{{ previewDomain }}</p>
            <p class="text-sm font-semibold text-slate-900 line-clamp-2">{{ previewTitle }}</p>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-slate-700">
          Meta Title
          <span v-if="!metaTitle && titleFallback" class="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Tự động từ tiêu đề</span>
        </label>
        <span class="text-xs" :class="lengthClass(effectiveTitleLength, 30, 60)">{{ effectiveTitleLength }}/60</span>
      </div>
      <input
        v-model="metaTitle"
        type="text"
        :placeholder="titleFallback || 'Để trống sẽ dùng tiêu đề'"
        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <p class="mt-1 text-xs text-slate-400">
        Tối ưu: 30–60 ký tự. Để trống sẽ dùng tiêu đề; chỉ điền khi muốn tiêu đề trên Google khác (ngắn hơn, chứa từ khóa ở đầu).
      </p>
    </div>

    <div>
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-slate-700">
          Meta Description
          <span v-if="!metaDescription && descriptionFallback" class="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Tự động từ mô tả ngắn</span>
        </label>
        <span class="text-xs" :class="lengthClass(effectiveDescriptionLength, 120, 160)">{{ effectiveDescriptionLength }}/160</span>
      </div>
      <textarea
        v-model="metaDescription"
        rows="2"
        :placeholder="descriptionFallback || 'Để trống sẽ dùng mô tả ngắn'"
        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <p class="mt-1 text-xs text-slate-400">Tối ưu: 120–160 ký tự. Mô tả hấp dẫn, chứa từ khóa, kêu gọi click.</p>
    </div>

    <div>
      <label class="text-sm font-medium text-slate-700">Canonical URL</label>
      <input
        v-model="canonicalUrl"
        type="text"
        :placeholder="`${previewUrl} (để trống nếu không cần)`"
        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <p class="mt-1 text-xs text-slate-400">Chỉ điền khi trang này là bản sao của URL khác, để tránh nội dung trùng lặp.</p>
    </div>

    <ImageUploadField
      v-model="ogImage"
      label="OG Image (Open Graph)"
      :recommended-width="1200"
      :recommended-height="630"
      :hint="props.ogImageHint"
      :fallback-src="props.imageFallback"
      :fallback-label="props.imageFallbackLabel"
    />
  </div>
</template>
