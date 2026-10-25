<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mediaApi } from '@/api/media'

const model = defineModel<string>({ default: '' })

const props = defineProps<{
  label?: string
  hint?: string
  /** Recommended size in px; when set, the preview uses this ratio and off-size images get a warning. */
  recommendedWidth?: number
  recommendedHeight?: number
  /** Image used when this field is empty (e.g. OG image falls back to the cover); shown as "Mặc định". */
  fallbackSrc?: string
  fallbackLabel?: string
}>()

// Site-relative paths (e.g. /images/home/x.jpg) live on the front site, not the admin.
const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://edulab.xotech.space').replace(/\/$/, '')
const resolve = (src: string) => (src.startsWith('/') && !src.startsWith('//') ? `${siteUrl}${src}` : src)

const displaySrc = computed(() => resolve(model.value || props.fallbackSrc || ''))
const usingFallback = computed(() => !model.value && !!props.fallbackSrc)

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const error = ref('')
const natural = ref<{ width: number; height: number } | null>(null)

const hasRecommendation = computed(() => !!props.recommendedWidth && !!props.recommendedHeight)

const sizeWarning = computed(() => {
  if (!hasRecommendation.value || !natural.value) return ''
  const { width, height } = natural.value
  const target = props.recommendedWidth! / props.recommendedHeight!
  const ratio = width / height
  if (Math.abs(ratio - target) / target > 0.05) {
    return `Ảnh ${width}×${height}px khác tỉ lệ ${props.recommendedWidth}×${props.recommendedHeight}, phần ngoài khung xanh sẽ bị cắt khi hiển thị.`
  }
  if (width < props.recommendedWidth!) {
    return `Ảnh ${width}×${height}px nhỏ hơn khuyến nghị, có thể bị mờ trên màn hình lớn.`
  }
  return ''
})

watch(model, () => (natural.value = null))

function onPreviewLoad(event: Event) {
  const img = event.target as HTMLImageElement
  natural.value = { width: img.naturalWidth, height: img.naturalHeight }
}

function pickFile() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  error.value = ''
  uploading.value = true
  try {
    const { data } = await mediaApi.upload(file)
    model.value = data.data.url
  } catch {
    error.value = 'Tải ảnh thất bại. Vui lòng thử lại.'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function remove() {
  model.value = ''
}
</script>

<template>
  <div>
    <label v-if="props.label" class="text-sm font-medium text-slate-700 block mb-1">{{ props.label }}</label>
    <div class="flex items-start gap-3">
      <div
        v-if="hasRecommendation"
        class="relative w-48 shrink-0 rounded-lg border border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center"
        :style="{ aspectRatio: `${props.recommendedWidth} / ${props.recommendedHeight}` }"
      >
        <!-- Shown uncropped (contain) so the editor can see what falls outside the display frame. -->
        <img v-if="displaySrc" :src="displaySrc" alt="" class="h-full w-full object-contain" @load="onPreviewLoad" />
        <span v-else class="px-2 text-center text-xs text-slate-400">
          {{ props.recommendedWidth }}×{{ props.recommendedHeight }}px
        </span>
        <span v-if="displaySrc" class="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset ring-emerald-500/70" />
        <span
          v-if="usingFallback"
          class="absolute left-1 top-1 rounded bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-medium text-white"
        >
          Mặc định
        </span>
      </div>
      <div
        v-else
        class="h-24 w-24 shrink-0 rounded-lg border border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center"
      >
        <img v-if="model" :src="displaySrc" alt="" class="h-full w-full object-cover" />
        <span v-else class="text-xs text-slate-400">Chưa có ảnh</span>
      </div>
      <div class="flex-1 space-y-2">
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="uploading"
            class="rounded-lg border border-slate-300 text-sm font-medium px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            @click="pickFile"
          >
            {{ uploading ? 'Đang tải...' : 'Upload' }}
          </button>
          <button
            v-if="model"
            type="button"
            class="rounded-lg border border-slate-300 text-sm font-medium px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            @click="remove"
          >
            Xóa
          </button>
        </div>
        <input
          v-model="model"
          type="text"
          :placeholder="usingFallback ? `Đang dùng ${props.fallbackLabel ?? 'ảnh mặc định'}. Upload hoặc dán URL để thay.` : 'Hoặc dán URL ảnh'"
          class="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
        <p v-if="hasRecommendation" class="text-xs font-medium text-slate-600">
          Kích thước khuyến nghị: {{ props.recommendedWidth }}×{{ props.recommendedHeight }}px
          (tỉ lệ {{ (props.recommendedWidth! / props.recommendedHeight!).toFixed(2) }}:1)
          <span v-if="natural && !sizeWarning" class="text-emerald-600">✓ {{ natural.width }}×{{ natural.height }}px</span>
        </p>
        <p v-if="sizeWarning" class="text-xs text-amber-600">⚠ {{ sizeWarning }}</p>
        <p v-if="props.hint" class="text-xs text-slate-400">{{ props.hint }}</p>
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      </div>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
    </div>
  </div>
</template>
