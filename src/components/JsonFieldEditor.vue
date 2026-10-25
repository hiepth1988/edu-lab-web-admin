<script setup lang="ts">
// Renders a form for any JSON value by looking at its shape: text → input,
// list → repeatable rows, object → one field per key. Edits parent[field] in
// place, so it works directly on a reactive form object.
//
// `sample` is the same value in the other language. It decides the shape of
// new list items when a list is empty here.
import { computed } from 'vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import { blankLike, isImageKey, isLongText, keyLabel, sortKeys } from '@/utils/pageLabels'

defineOptions({ name: 'JsonFieldEditor' })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

const props = withDefaults(
  defineProps<{
    parent: Json
    field: string | number
    sample?: Json
    label?: string
    depth?: number
  }>(),
  { depth: 0 },
)

const value = computed<Json>(() => props.parent[props.field])
const list = computed<Json[]>(() => (Array.isArray(value.value) ? value.value : []))
const title = computed(() => props.label ?? keyLabel(props.field))

const kind = computed(() => {
  const v = value.value
  if (Array.isArray(v)) {
    const probe = v.length ? v[0] : Array.isArray(props.sample) ? props.sample[0] : undefined
    return probe && typeof probe === 'object' ? 'objectList' : 'stringList'
  }
  if (v && typeof v === 'object') return 'object'
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'number') return 'number'
  return 'string'
})

const objectKeys = computed(() => (kind.value === 'object' ? sortKeys(Object.keys(value.value)) : []))

function childSample(key: string | number): Json {
  const s = props.sample
  if (s == null) return undefined
  if (Array.isArray(s)) return s[typeof key === 'number' ? Math.min(key, s.length - 1) : 0]
  return typeof s === 'object' ? s[key] : undefined
}

function isShortString(key: string): boolean {
  const v = value.value[key]
  // Questions read badly when cut off, so they always get the full width.
  return typeof v === 'string' && !useTextarea(key, v) && !isImageKey(key) && key !== 'q' && v.length <= 45
}

function addItem() {
  const list = value.value as Json[]
  if (kind.value === 'stringList') {
    list.push('')
    return
  }
  const template = list[0] ?? (Array.isArray(props.sample) ? props.sample[0] : {})
  list.push(blankLike(template))
}

function move(index: number, delta: number) {
  const list = value.value as Json[]
  const target = index + delta
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item)
}

function removeItem(index: number) {
  const list = value.value as Json[]
  const item = list[index]
  const hasContent = item && typeof item === 'object' ? JSON.stringify(item) !== JSON.stringify(blankLike(item)) : !!item
  if (hasContent && !confirm('Xóa mục này?')) return
  list.splice(index, 1)
}

// Decide input vs textarea once per field, so the box doesn't swap (and lose focus) while typing.
const longCache = new Map<string | number, boolean>()
function useTextarea(key: string | number, current: unknown): boolean {
  if (!longCache.has(key)) longCache.set(key, isLongText(key, String(current ?? '')))
  return longCache.get(key)!
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none'
</script>

<template>
  <!-- Text -->
  <div v-if="kind === 'string'">
    <ImageUploadField v-if="isImageKey(field)" v-model="parent[field]" :label="title" />
    <template v-else>
      <label class="mb-1 block text-xs font-medium text-slate-600">
        {{ title }}
        <a
          v-if="field === 'icon'"
          href="https://fonts.google.com/icons"
          target="_blank"
          rel="noopener"
          class="ml-1 font-normal text-slate-400 underline hover:text-slate-600"
        >(tên icon Material Symbols)</a>
      </label>
      <textarea
        v-if="useTextarea(field, parent[field])"
        v-model="parent[field]"
        rows="3"
        :class="inputClass"
      />
      <input v-else v-model="parent[field]" type="text" :class="inputClass" />
    </template>
  </div>

  <!-- Yes/no -->
  <label v-else-if="kind === 'boolean'" class="flex items-center gap-2 pt-5 text-sm text-slate-700">
    <input v-model="parent[field]" type="checkbox" class="rounded border-slate-300" />
    {{ title }}
  </label>

  <!-- Number -->
  <div v-else-if="kind === 'number'">
    <label class="mb-1 block text-xs font-medium text-slate-600">{{ title }}</label>
    <input v-model.number="parent[field]" type="number" :class="inputClass" />
  </div>

  <!-- List of text lines -->
  <div v-else-if="kind === 'stringList'">
    <label class="mb-1 block text-xs font-medium text-slate-600">{{ title }}</label>
    <div class="space-y-1.5">
      <div v-for="(_, i) in list" :key="i" class="flex items-start gap-1.5">
        <textarea
          v-if="useTextarea(i, value[i])"
          v-model="value[i]"
          rows="2"
          :class="inputClass"
        />
        <input v-else v-model="value[i]" type="text" :class="inputClass" />
        <div class="flex shrink-0 gap-0.5 pt-1 text-slate-400">
          <button type="button" title="Lên" class="px-1 hover:text-slate-700 disabled:opacity-30" :disabled="i === 0" @click="move(i, -1)">↑</button>
          <button type="button" title="Xuống" class="px-1 hover:text-slate-700 disabled:opacity-30" :disabled="i === list.length - 1" @click="move(i, 1)">↓</button>
          <button type="button" title="Xóa" class="px-1 hover:text-red-600" @click="removeItem(i)">✕</button>
        </div>
      </div>
    </div>
    <button type="button" class="mt-1.5 text-xs font-medium text-slate-500 hover:text-slate-900" @click="addItem">+ Thêm dòng</button>
  </div>

  <!-- List of cards -->
  <div v-else-if="kind === 'objectList'">
    <label class="mb-1.5 block text-sm font-medium text-slate-700">{{ title }}</label>
    <div class="space-y-3">
      <div
        v-for="(_, i) in list"
        :key="i"
        class="rounded-lg border border-slate-200 p-3"
        :class="depth % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">#{{ i + 1 }}</span>
          <div class="flex gap-0.5 text-sm text-slate-400">
            <button type="button" title="Lên" class="px-1.5 hover:text-slate-700 disabled:opacity-30" :disabled="i === 0" @click="move(i, -1)">↑</button>
            <button type="button" title="Xuống" class="px-1.5 hover:text-slate-700 disabled:opacity-30" :disabled="i === list.length - 1" @click="move(i, 1)">↓</button>
            <button type="button" title="Xóa" class="px-1.5 hover:text-red-600" @click="removeItem(i)">✕</button>
          </div>
        </div>
        <JsonFieldEditor :parent="value" :field="i" :sample="childSample(i)" label="" :depth="depth + 1" />
      </div>
    </div>
    <button type="button" class="mt-2 text-sm font-medium text-slate-500 hover:text-slate-900" @click="addItem">+ Thêm mục</button>
  </div>

  <!-- Object: one field per key -->
  <div v-else>
    <label v-if="title" class="mb-1.5 block text-sm font-medium text-slate-700">{{ title }}</label>
    <div class="grid gap-3 sm:grid-cols-2">
      <div v-for="key in objectKeys" :key="key" :class="isShortString(key) ? '' : 'sm:col-span-2'">
        <JsonFieldEditor :parent="value" :field="key" :sample="childSample(key)" :depth="depth + 1" />
      </div>
    </div>
  </div>
</template>
