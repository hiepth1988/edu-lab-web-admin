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
  }>(),
  { ogImageHint: 'Ảnh hiển thị khi chia sẻ lên Facebook/Zalo. Kích thước lý tưởng: 1200×630px.' },
)

const previewTitle = computed(() => metaTitle.value || props.titleFallback || 'Tiêu đề trang')
const previewDescription = computed(() => metaDescription.value || props.descriptionFallback || 'Mô tả trang sẽ hiển thị ở đây...')
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-4 space-y-4">
    <div>
      <h3 class="text-sm font-semibold text-slate-900">SEO</h3>
      <p class="text-xs text-slate-500">Kiểm soát cách trang hiển thị trên Google và mạng xã hội.</p>
    </div>

    <div class="rounded-lg border border-slate-200 p-3 bg-slate-50">
      <p class="text-[11px] uppercase tracking-wide text-slate-400">Xem trước trên Google</p>
      <p class="mt-1 text-xs text-emerald-700 truncate">{{ previewUrl }}</p>
      <p class="text-base text-blue-700 truncate">{{ previewTitle }}</p>
      <p class="text-sm text-slate-600 line-clamp-2">{{ previewDescription }}</p>
    </div>

    <div>
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-slate-700">Meta Title</label>
        <span class="text-xs text-slate-400">{{ metaTitle?.length ?? 0 }}/60</span>
      </div>
      <input
        v-model="metaTitle"
        type="text"
        placeholder="Để trống sẽ dùng tiêu đề mặc định"
        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <p class="mt-1 text-xs text-slate-400">Tối ưu: 30–60 ký tự. Nên chứa từ khóa chính ở đầu.</p>
    </div>

    <div>
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-slate-700">Meta Description</label>
        <span class="text-xs text-slate-400">{{ metaDescription?.length ?? 0 }}/160</span>
      </div>
      <textarea
        v-model="metaDescription"
        rows="2"
        placeholder="Để trống sẽ dùng mô tả mặc định"
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
      :hint="props.ogImageHint"
    />
  </div>
</template>
