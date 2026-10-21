<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { mediaApi } from '@/api/media'
import { importHtml, looksLikeHtml, type ImportedHtmlMeta } from '@/utils/importHtml'

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ imported: [meta: ImportedHtmlMeta] }>()

const sourceMode = ref(false)
const source = ref('')

const editor = ref<HTMLDivElement>()
const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)

function emitChange() {
  model.value = editor.value?.innerHTML ?? ''
}

function exec(command: string, value?: string) {
  editor.value?.focus()
  document.execCommand(command, false, value)
  emitChange()
}

function insertLink() {
  const url = window.prompt('Nhập URL liên kết:')
  if (url) exec('createLink', url)
}

function pickImage() {
  fileInput.value?.click()
}

async function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const { data } = await mediaApi.upload(file)
    exec('insertImage', data.data.url)
  } catch {
    window.alert('Tải ảnh thất bại. Vui lòng thử lại.')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text/plain') ?? ''
  // Rich HTML copied from a web page is handled natively; we only step in when the
  // clipboard holds raw markup as plain text (copied from a code editor or view-source).
  if (!looksLikeHtml(text)) return
  event.preventDefault()
  const { html, meta } = importHtml(text)
  exec('insertHTML', html)
  emit('imported', meta)
}

function toggleSource() {
  if (!sourceMode.value) {
    source.value = model.value ?? ''
    sourceMode.value = true
    return
  }
  // Full pages pasted into the source box get the same cleanup as a paste into the editor.
  if (/<(!doctype|html|head|body)/i.test(source.value)) {
    const { html, meta } = importHtml(source.value)
    model.value = html
    emit('imported', meta)
  } else {
    model.value = source.value
  }
  sourceMode.value = false
  nextTick(() => {
    if (editor.value) editor.value.innerHTML = model.value ?? ''
  })
}

onMounted(() => {
  if (editor.value) editor.value.innerHTML = model.value ?? ''
})

watch(model, (value) => {
  if (!editor.value) return
  if (document.activeElement === editor.value) return
  if (editor.value.innerHTML === (value ?? '')) return
  editor.value.innerHTML = value ?? ''
})

const toolBtn =
  'rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50'
</script>

<template>
  <div class="rounded-lg border border-slate-300 overflow-hidden">
    <div class="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
      <button type="button" :class="toolBtn" title="Đậm" @click="exec('bold')"><b>B</b></button>
      <button type="button" :class="toolBtn" title="Nghiêng" @click="exec('italic')"><i>I</i></button>
      <button type="button" :class="toolBtn" title="Gạch chân" @click="exec('underline')"><u>U</u></button>
      <span class="w-px h-5 bg-slate-300 mx-1" />
      <button type="button" :class="toolBtn" title="Tiêu đề 2" @click="exec('formatBlock', 'H2')">H2</button>
      <button type="button" :class="toolBtn" title="Tiêu đề 3" @click="exec('formatBlock', 'H3')">H3</button>
      <button type="button" :class="toolBtn" title="Đoạn văn" @click="exec('formatBlock', 'P')">P</button>
      <span class="w-px h-5 bg-slate-300 mx-1" />
      <button type="button" :class="toolBtn" title="Danh sách" @click="exec('insertUnorderedList')">• List</button>
      <button type="button" :class="toolBtn" title="Danh sách số" @click="exec('insertOrderedList')">1. List</button>
      <button type="button" :class="toolBtn" title="Trích dẫn" @click="exec('formatBlock', 'BLOCKQUOTE')">“ ”</button>
      <span class="w-px h-5 bg-slate-300 mx-1" />
      <button type="button" :class="toolBtn" title="Chèn liên kết" @click="insertLink">Link</button>
      <button type="button" :class="toolBtn" :disabled="uploading" title="Chèn ảnh" @click="pickImage">
        {{ uploading ? 'Đang tải...' : 'Ảnh' }}
      </button>
      <span class="w-px h-5 bg-slate-300 mx-1" />
      <button type="button" :class="toolBtn" title="Hoàn tác" @click="exec('undo')">↶</button>
      <button type="button" :class="toolBtn" title="Làm lại" @click="exec('redo')">↷</button>
      <button type="button" :class="toolBtn" title="Xóa định dạng" @click="exec('removeFormat')">Xóa định dạng</button>
      <button
        type="button"
        :class="[toolBtn, 'ml-auto', sourceMode ? 'bg-slate-900 text-white hover:bg-slate-800' : '']"
        title="Sửa trực tiếp mã HTML"
        @click="toggleSource"
      >
        {{ sourceMode ? 'Xong' : '</> HTML' }}
      </button>
    </div>
    <textarea
      v-if="sourceMode"
      v-model="source"
      spellcheck="false"
      @input="model = source"
      placeholder="Dán mã HTML vào đây (có thể dán cả trang HTML, hệ thống sẽ tự lọc lấy phần nội dung)..."
      class="block w-full min-h-96 resize-y bg-slate-900 px-3 py-2 font-mono text-xs leading-relaxed text-slate-100 focus:outline-none"
    />
    <div
      v-show="!sourceMode"
      ref="editor"
      contenteditable="true"
      data-placeholder="Nhập nội dung bài viết..."
      class="html-editor-content prose prose-sm max-w-none min-h-60 px-3 py-2 text-sm focus:outline-none"
      @input="emitChange"
      @paste="onPaste"
    />
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onImageSelected" />
  </div>
</template>

<style scoped>
.html-editor-content:empty::before {
  content: attr(data-placeholder);
  color: #94a3b8;
}
</style>
