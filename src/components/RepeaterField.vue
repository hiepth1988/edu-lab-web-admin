<script setup lang="ts">
export interface RepeaterFieldSchema {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  options?: { value: string; label: string }[]
}

const model = defineModel<Record<string, unknown>[]>({ default: () => [] })

const props = defineProps<{
  fields: RepeaterFieldSchema[]
  addLabel?: string
  emptyRow?: () => Record<string, unknown>
}>()

function defaultEmptyRow(): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const field of props.fields) {
    row[field.key] = field.type === 'checkbox' ? false : ''
  }
  return row
}

function addRow() {
  model.value = [...model.value, (props.emptyRow ?? defaultEmptyRow)()]
}

function removeRow(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="space-y-3">
    <div v-for="(row, index) in model" :key="index" class="rounded-lg border border-slate-200 p-3 space-y-2">
      <div class="grid gap-2" :class="fields.length > 2 ? 'sm:grid-cols-2' : ''">
        <div v-for="field in fields" :key="field.key">
          <label class="text-xs font-medium text-slate-600 block mb-1">{{ field.label }}</label>
          <textarea
            v-if="field.type === 'textarea'"
            v-model="row[field.key]"
            :placeholder="field.placeholder"
            rows="3"
            class="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
          <select
            v-else-if="field.type === 'select'"
            v-model="row[field.key]"
            class="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          >
            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <label v-else-if="field.type === 'checkbox'" class="flex items-center gap-2 text-sm text-slate-700 mt-1.5">
            <input v-model="row[field.key]" type="checkbox" class="rounded border-slate-300" />
            {{ field.placeholder }}
          </label>
          <input
            v-else
            v-model="row[field.key]"
            type="text"
            :placeholder="field.placeholder"
            class="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>
      <button type="button" class="text-xs text-red-600 hover:text-red-800" @click="removeRow(index)">Xóa</button>
    </div>
    <button type="button" class="text-sm text-slate-600 hover:text-slate-900" @click="addRow">
      {{ addLabel ?? '+ Thêm' }}
    </button>
  </div>
</template>
