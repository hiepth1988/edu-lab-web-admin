<script setup lang="ts">
defineProps<{
  locale: string
  url: string
  category?: string | null
  title: string
  excerpt?: string
  featuredImage?: string
  content?: string
  tags: string[]
  cta: { text: string; label: string; url: string } | null
  relatedTitles: string[]
}>()
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div class="flex items-center gap-2 border-b border-slate-200 px-4 py-2">
      <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Xem trước</span>
      <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">{{ locale }}</span>
      <span class="ml-auto truncate text-xs text-slate-400">{{ url }}</span>
    </div>

    <article class="px-6 py-6">
      <p v-if="category" class="text-xs font-bold uppercase tracking-widest text-amber-700">{{ category }}</p>
      <h1 class="mt-2 text-2xl font-semibold leading-snug text-slate-900">
        {{ title || 'Tiêu đề bài viết' }}
      </h1>
      <p v-if="excerpt" class="mt-3 text-base text-slate-600">{{ excerpt }}</p>

      <img
        v-if="featuredImage"
        :src="featuredImage"
        :alt="title"
        class="mt-5 h-56 w-full rounded-xl object-cover"
      />

      <div v-if="content" class="post-preview-content mt-5 text-slate-800" v-html="content" />
      <p v-else class="mt-5 text-sm italic text-slate-400">Chưa có nội dung.</p>

      <aside v-if="cta" class="mt-6 rounded-xl bg-slate-100 p-5">
        <p class="text-base text-slate-800">
          {{ cta.text }}
          <a :href="cta.url" target="_blank" rel="noopener" class="font-bold text-amber-700 underline underline-offset-4">{{ cta.label }}</a>
        </p>
      </aside>

      <div v-if="tags.length" class="mt-5 flex flex-wrap gap-2">
        <span v-for="tag in tags" :key="tag" class="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600">
          {{ tag }}
        </span>
      </div>

      <div v-if="relatedTitles.length" class="mt-6 border-t border-slate-200 pt-4">
        <p class="text-xs font-bold uppercase tracking-widest text-amber-700">
          {{ locale === 'en' ? 'Related Insights' : 'Bài viết liên quan' }}
        </p>
        <ul class="mt-2 space-y-1 text-sm text-slate-700">
          <li v-for="r in relatedTitles" :key="r">• {{ r }}</li>
        </ul>
      </div>
    </article>
  </div>
</template>

<style scoped>
/* Tailwind preflight resets rich-text styles; restore a readable approximation of the site's `prose`. */
.post-preview-content :deep(h2) { font-size: 1.375rem; font-weight: 600; margin: 1.5rem 0 0.75rem; line-height: 1.3; }
.post-preview-content :deep(h3) { font-size: 1.125rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
.post-preview-content :deep(p) { margin: 0 0 1rem; line-height: 1.7; }
.post-preview-content :deep(ul) { list-style: disc; padding-left: 1.5rem; margin: 0 0 1rem; }
.post-preview-content :deep(ol) { list-style: decimal; padding-left: 1.5rem; margin: 0 0 1rem; }
.post-preview-content :deep(li) { margin: 0.25rem 0; line-height: 1.6; }
.post-preview-content :deep(blockquote) { border-left: 3px solid #cbd5e1; padding-left: 1rem; color: #475569; font-style: italic; margin: 0 0 1rem; }
.post-preview-content :deep(a) { color: #b45309; text-decoration: underline; }
.post-preview-content :deep(img) { max-width: 100%; border-radius: 0.75rem; margin: 1rem 0; }
.post-preview-content :deep(strong) { font-weight: 700; }
</style>
