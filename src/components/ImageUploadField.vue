<script setup lang="ts">
import { ref } from 'vue'
import { mediaApi } from '@/api/media'

const model = defineModel<string>({ default: '' })

const props = defineProps<{
  label?: string
  hint?: string
}>()

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const error = ref('')

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
        class="h-24 w-24 shrink-0 rounded-lg border border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center"
      >
        <img v-if="model" :src="model" alt="" class="h-full w-full object-cover" />
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
          placeholder="Hoặc dán URL ảnh"
          class="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
        <p v-if="props.hint" class="text-xs text-slate-400">{{ props.hint }}</p>
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      </div>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
    </div>
  </div>
</template>
