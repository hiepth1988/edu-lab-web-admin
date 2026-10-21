<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { mediaApi } from '@/api/media'
import { importHtml, looksLikeHtml, type ImportedHtmlMeta } from '@/utils/importHtml'

const MAX_VIDEO_MB = 100

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ imported: [meta: ImportedHtmlMeta] }>()

const editor = ref<HTMLDivElement>()
const imageInput = ref<HTMLInputElement>()
const videoInput = ref<HTMLInputElement>()
const uploading = ref<'image' | 'video' | null>(null)
const uploadProgress = ref(0)

const sourceMode = ref(false)
const source = ref('')

// Image/video currently clicked in the editor, edited through the media panel.
const selectedMedia = ref<HTMLImageElement | HTMLVideoElement | null>(null)
const mediaAlt = ref('')
const mediaCaption = ref('')
const altInput = ref<HTMLInputElement>()

// What we last wrote to the model, so the model watcher doesn't rebuild the DOM under us.
let lastEmitted = ''

function cleanHtml(html: string) {
  return html
    .replace(/ data-selected="[^"]*"/g, '')
    .replace(/<figcaption>(\s|<br\s*\/?>)*<\/figcaption>/g, '')
}

function emitChange() {
  lastEmitted = cleanHtml(editor.value?.innerHTML ?? '')
  model.value = lastEmitted
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

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

async function upload(kind: 'image' | 'video', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (kind === 'video' && file.size > MAX_VIDEO_MB * 1024 * 1024) {
    window.alert(`Video tối đa ${MAX_VIDEO_MB}MB. Video dài nên đăng lên YouTube rồi chèn bằng nút YouTube.`)
    return
  }

  uploading.value = kind
  uploadProgress.value = 0
  try {
    const { data } = await mediaApi.upload(file, (p) => (uploadProgress.value = p))
    const src = escapeAttr(data.data.url)
    const media =
      kind === 'image'
        ? `<img src="${src}" alt="">`
        : `<video src="${src}" controls preload="metadata"></video>`
    exec('insertHTML', `<figure>${media}<figcaption></figcaption></figure><p><br></p>`)
    // Open the panel on the new element so the alt text/caption can be filled right away.
    const inserted = editor.value?.querySelectorAll<HTMLImageElement | HTMLVideoElement>(
      `${kind === 'image' ? 'img' : 'video'}[src="${CSS.escape(data.data.url)}"]`,
    )
    const el = inserted?.[inserted.length - 1]
    if (el) selectMedia(el)
  } catch {
    window.alert(kind === 'image' ? 'Tải ảnh thất bại. Vui lòng thử lại.' : 'Tải video thất bại. Kiểm tra định dạng (mp4, webm, mov) và dung lượng.')
  } finally {
    uploading.value = null
  }
}

function youtubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/)
  return match?.[1] ?? null
}

function insertYoutube() {
  const url = window.prompt('Dán link YouTube (youtube.com/watch?v=... hoặc youtu.be/...):')
  if (!url) return
  const id = youtubeId(url)
  if (!id) {
    window.alert('Link YouTube không hợp lệ.')
    return
  }
  exec(
    'insertHTML',
    `<figure><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" loading="lazy" ` +
      `allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
      `<figcaption></figcaption></figure><p><br></p>`,
  )
}

function selectMedia(el: HTMLImageElement | HTMLVideoElement) {
  selectedMedia.value?.removeAttribute('data-selected')
  selectedMedia.value = el
  el.setAttribute('data-selected', '')
  mediaAlt.value = el instanceof HTMLImageElement ? el.alt : ''
  mediaCaption.value = el.closest('figure')?.querySelector('figcaption')?.textContent ?? ''
  if (el instanceof HTMLImageElement) nextTick(() => altInput.value?.focus())
}

function deselectMedia() {
  selectedMedia.value?.removeAttribute('data-selected')
  selectedMedia.value = null
}

function onEditorClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target instanceof HTMLImageElement || target instanceof HTMLVideoElement) {
    selectMedia(target)
  } else if (selectedMedia.value) {
    deselectMedia()
  }
}

/** Wraps a bare image/video in a <figure>, moving it out of its paragraph (figure can't live inside <p>). */
function wrapInFigure(el: HTMLElement): HTMLElement {
  const figure = document.createElement('figure')
  const parent = el.parentElement
  if (parent && parent !== editor.value && parent.tagName === 'P') {
    const onlyChild = !parent.textContent?.trim() && parent.querySelectorAll('img, video').length === 1
    if (onlyChild) parent.replaceWith(figure)
    else parent.after(figure)
  } else {
    el.replaceWith(figure)
  }
  figure.append(el)
  return figure
}

function applyMedia() {
  const el = selectedMedia.value
  if (!el) return
  if (el instanceof HTMLImageElement) el.alt = mediaAlt.value.trim()

  const caption = mediaCaption.value.trim()
  let figure = el.closest('figure')
  if (!figure && caption) figure = wrapInFigure(el)
  if (figure) {
    let figcaption = figure.querySelector('figcaption')
    if (caption) {
      if (!figcaption) {
        figcaption = document.createElement('figcaption')
        figure.append(figcaption)
      }
      figcaption.textContent = caption
    } else {
      figcaption?.remove()
    }
  }
  emitChange()
}

function removeMedia() {
  const el = selectedMedia.value
  if (!el) return
  ;(el.closest('figure') ?? el).remove()
  selectedMedia.value = null
  emitChange()
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
  deselectMedia()
  if (!sourceMode.value) {
    source.value = model.value ?? ''
    sourceMode.value = true
    return
  }
  // Full pages pasted into the source box get the same cleanup as a paste into the editor.
  if (/<(!doctype|html|head|body)\b/i.test(source.value)) {
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
  if (value === lastEmitted) return
  if (document.activeElement === editor.value) return
  if (cleanHtml(editor.value.innerHTML) === (value ?? '')) return
  selectedMedia.value = null
  editor.value.innerHTML = value ?? ''
})

const toolBtn =
  'rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50'
</script>

<template>
  <div class="rounded-lg border border-slate-300">
    <div class="sticky top-0 z-10 rounded-t-lg">
    <div class="flex flex-wrap items-center gap-1 rounded-t-lg border-b border-slate-200 bg-slate-50 px-2 py-1.5">
      <template v-if="!sourceMode">
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
        <button type="button" :class="toolBtn" :disabled="!!uploading" title="Tải ảnh lên" @click="imageInput?.click()">
          {{ uploading === 'image' ? `Đang tải ${uploadProgress}%` : 'Ảnh' }}
        </button>
        <button type="button" :class="toolBtn" :disabled="!!uploading" :title="`Tải video lên (mp4, webm, mov; tối đa ${MAX_VIDEO_MB}MB)`" @click="videoInput?.click()">
          {{ uploading === 'video' ? `Đang tải ${uploadProgress}%` : 'Video' }}
        </button>
        <button type="button" :class="toolBtn" title="Chèn video YouTube" @click="insertYoutube">YouTube</button>
        <span class="w-px h-5 bg-slate-300 mx-1" />
        <button type="button" :class="toolBtn" title="Hoàn tác" @click="exec('undo')">↶</button>
        <button type="button" :class="toolBtn" title="Làm lại" @click="exec('redo')">↷</button>
        <button type="button" :class="toolBtn" title="Xóa định dạng" @click="exec('removeFormat')">Xóa định dạng</button>
      </template>
      <button
        type="button"
        :class="[toolBtn, 'ml-auto', sourceMode ? 'bg-slate-900 text-white hover:bg-slate-800' : '']"
        title="Sửa trực tiếp mã HTML"
        @click="toggleSource"
      >
        {{ sourceMode ? 'Xong' : '</> HTML' }}
      </button>
    </div>

    <div
      v-if="selectedMedia && !sourceMode"
      class="flex flex-wrap items-end gap-3 border-b border-amber-200 bg-amber-50 px-3 py-2"
    >
      <label v-if="selectedMedia.tagName === 'IMG'" class="min-w-48 flex-1 text-xs font-medium text-slate-700">
        Mô tả ảnh (alt) — cho Google và người khiếm thị
        <input
          ref="altInput"
          v-model="mediaAlt"
          type="text"
          placeholder="vd: Bảng so sánh LMS SaaS, Moodle và LMS xây riêng"
          class="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal"
          @input="applyMedia"
        />
      </label>
      <label class="min-w-48 flex-1 text-xs font-medium text-slate-700">
        Chú thích hiển thị dưới {{ selectedMedia.tagName === 'IMG' ? 'ảnh' : 'video' }}
        <input
          v-model="mediaCaption"
          type="text"
          placeholder="Để trống nếu không cần"
          class="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal"
          @input="applyMedia"
        />
      </label>
      <div class="flex gap-1">
        <button type="button" class="rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100" @click="removeMedia">Xóa</button>
        <button type="button" class="rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200" @click="deselectMedia">Đóng</button>
      </div>
    </div>
    </div>

    <textarea
      v-if="sourceMode"
      v-model="source"
      spellcheck="false"
      placeholder="Dán mã HTML vào đây (có thể dán cả trang HTML, hệ thống sẽ tự lọc lấy phần nội dung)..."
      class="block w-full min-h-96 resize-y rounded-b-lg bg-slate-900 px-3 py-2 font-mono text-xs leading-relaxed text-slate-100 focus:outline-none"
      @input="model = source"
    />
    <div
      v-show="!sourceMode"
      ref="editor"
      contenteditable="true"
      data-placeholder="Nhập nội dung bài viết..."
      class="html-editor-content rich-content min-h-60 px-3 py-2 text-sm focus:outline-none"
      @input="emitChange"
      @paste="onPaste"
      @click="onEditorClick"
    />
    <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="upload('image', $event)" />
    <input ref="videoInput" type="file" accept="video/mp4,video/webm,video/quicktime" class="hidden" @change="upload('video', $event)" />
  </div>
</template>

<style scoped>
.html-editor-content:empty::before {
  content: attr(data-placeholder);
  color: #94a3b8;
}
.html-editor-content :deep(img),
.html-editor-content :deep(video) {
  cursor: pointer;
}
.html-editor-content :deep([data-selected]) {
  outline: 3px solid #f59e0b;
  outline-offset: 2px;
}
.html-editor-content :deep(figcaption:empty)::before {
  content: 'Nhập chú thích (không bắt buộc)...';
  color: #cbd5e1;
}
</style>
