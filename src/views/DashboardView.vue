<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-900">Dashboard</h1>
    <p class="mt-1 text-sm text-slate-500">
      Xin chào {{ auth.user?.name }}. MVP 1 — admin đã kết nối API backend.
    </p>

    <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <p class="text-sm text-slate-500">Roles</p>
        <p class="mt-1 text-lg font-semibold text-slate-900">
          {{ auth.user?.roles?.join(', ') || '—' }}
        </p>
      </div>
    </div>
  </div>
</template>
