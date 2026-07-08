<script setup lang="ts">
const props = defineProps<{
  locales: { code: string; label: string }[]
  completed: Record<string, boolean>
}>()

const active = defineModel<string>('active', { required: true })

defineOptions({ inheritAttrs: false })
void props
</script>

<template>
  <div class="flex gap-2 border-b border-slate-200 mb-4">
    <button
      v-for="locale in locales"
      :key="locale.code"
      type="button"
      class="px-3 py-2 text-sm border-b-2 -mb-px"
      :class="
        active === locale.code
          ? 'border-slate-900 text-slate-900 font-medium'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      "
      @click="active = locale.code"
    >
      {{ locale.label }}
      <span
        class="ml-1.5 inline-block w-2 h-2 rounded-full align-middle"
        :class="completed[locale.code] ? 'bg-emerald-500' : 'bg-slate-300'"
      />
    </button>
  </div>
</template>
