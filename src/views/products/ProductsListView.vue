<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { productsApi } from '@/api/catalog'

interface ProductRow {
  id: number
  status: string
  stage: string | null
  translations: { locale: string; name: string }[]
}

const products = ref<ProductRow[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  const { data } = await productsApi.list()
  products.value = data.data
  loading.value = false
}

function name(row: ProductRow) {
  return row.translations.find((t) => t.locale === 'vi')?.name ?? row.translations[0]?.name ?? '—'
}

async function remove(id: number) {
  if (!confirm('Xóa sản phẩm này?')) return
  await productsApi.remove(id)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Products</h1>
      <RouterLink to="/products/new" class="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
        + Product mới
      </RouterLink>
    </div>

    <div class="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th class="px-4 py-3">Tên</th>
            <th class="px-4 py-3">Stage</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-400" colspan="4">Đang tải...</td>
          </tr>
          <tr v-for="row in products" v-else :key="row.id">
            <td class="px-4 py-3 font-medium text-slate-800">{{ name(row) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ row.stage }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-xs" :class="row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                {{ row.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-right space-x-3">
              <RouterLink :to="`/products/${row.id}`" class="text-slate-600 hover:text-slate-900">Sửa</RouterLink>
              <button class="text-red-600 hover:text-red-800" @click="remove(row.id)">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
