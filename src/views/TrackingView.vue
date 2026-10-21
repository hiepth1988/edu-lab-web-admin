<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { trackingApi, type ContentRow, type ContentType, type TrackingEventRow, type TrackingSummary, type VisitorType } from '@/api/tracking'

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Xem trang',
  page_engagement: 'Thời gian xem (giây)',
  scroll_depth: 'Cuộn trang',
  section_view: 'Xem section',
  cta_click: 'Bấm CTA',
  nav_click: 'Bấm menu',
  outbound_click: 'Link ra ngoài',
  contact_click: 'Bấm liên hệ (mail/điện thoại/chat)',
  locale_switch: 'Đổi ngôn ngữ',
  search: 'Tìm kiếm',
  lead_submit: 'Gửi form liên hệ',
  lead_error: 'Lỗi form liên hệ',
  newsletter_subscribe: 'Đăng ký newsletter',
  newsletter_error: 'Lỗi newsletter',
}

const TYPE_LABELS: Record<VisitorType, string> = { vn: 'Việt Nam', foreign: 'Nước ngoài', unknown: 'Chưa xác định' }

const GEO_SOURCE_LABELS: Record<string, string> = {
  cloudflare: 'Cloudflare',
  ip: 'Địa chỉ IP',
  timezone: 'Múi giờ trình duyệt',
  language: 'Ngôn ngữ trình duyệt',
}

const CONTENT_LABELS: Record<ContentType, string> = {
  post: 'Bài viết',
  research: 'Research',
  solution: 'Solution',
  product: 'Product',
  project: 'Our Work',
  audience: 'Who We Help',
  page: 'Trang',
}

const regionNames =new Intl.DisplayNames(['vi'], { type: 'region' })

function isoDate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoDate(d)
}

const to = ref(isoDate(new Date()))
const from = ref(daysAgo(29))
const visitorType = ref<VisitorType | ''>('')
const summary = ref<TrackingSummary | null>(null)
const loading = ref(true)
const error = ref('')

const events = ref<TrackingEventRow[]>([])
const eventsPage = ref(1)
const eventsLastPage = ref(1)
const eventFilter = ref('')
const contentTab = ref<ContentType | ''>('')
const contentFilter = ref<ContentRow | null>(null)

const contentRows = computed(() =>
  (summary.value?.top_content ?? []).filter((row) => !contentTab.value || row.content_type === contentTab.value),
)

// Only tabs that actually have views in the selected range.
const contentTabs = computed(() => {
  const counts = new Map<ContentType, number>()
  for (const row of summary.value?.top_content ?? []) counts.set(row.content_type, (counts.get(row.content_type) ?? 0) + row.views)
  return (Object.keys(CONTENT_LABELS) as ContentType[]).filter((t) => counts.has(t)).map((t) => ({ type: t, views: counts.get(t)! }))
})

function contentTitle(row: ContentRow) {
  if (row.title) return row.title
  if (row.content_type === 'page') return row.content_slug === 'home' ? 'Trang chủ' : `/${row.content_slug}`
  return row.content_slug
}

function duration(seconds: number) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  return m ? `${m}p ${seconds % 60}s` : `${seconds}s`
}

function showContentEvents(row: ContentRow | null) {
  contentFilter.value = row
  loadEvents()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await trackingApi.summary({ from: from.value, to: to.value, visitor_type: visitorType.value })
    summary.value = data
  } catch {
    error.value = 'Không tải được dữ liệu tracking.'
  } finally {
    loading.value = false
  }
}

async function loadEvents(page = 1) {
  const { data } = await trackingApi.events({
    page,
    event: eventFilter.value,
    visitor_type: visitorType.value,
    content_type: contentFilter.value?.content_type ?? '',
    content_slug: contentFilter.value?.slugs.join(',') ?? '',
  })
  events.value = data.data
  eventsPage.value = data.current_page
  eventsLastPage.value = data.last_page
}

function setPreset(days: number) {
  to.value = isoDate(new Date())
  from.value = daysAgo(days - 1)
  load()
}

function setType(type: VisitorType | '') {
  visitorType.value = type
  load()
  loadEvents()
}

onMounted(() => {
  load()
  loadEvents()
})

const totals = computed(() => {
  const t = summary.value?.by_type
  if (!t) return null
  const all = (k: keyof TrackingSummary['by_type']['vn']) => t.vn[k] + t.foreign[k] + t.unknown[k]
  return { visitors: all('visitors'), sessions: all('sessions'), page_views: all('page_views'), leads: all('leads') }
})

function share(part: number, whole: number) {
  return whole ? `${Math.round((part / whole) * 100)}%` : '—'
}

function rate(leads: number, visitors: number) {
  return visitors ? `${((leads / visitors) * 100).toFixed(1)}%` : '—'
}

const dailyMax = computed(() => Math.max(1, ...(summary.value?.daily ?? []).map((d) => d.vn + d.foreign + d.unknown)))

const scrollBase = computed(() => summary.value?.scroll_depth.find((s) => s.value === 25)?.sessions ?? 0)

function eventLabel(event: string) {
  return EVENT_LABELS[event] ?? event
}

function country(code: string | null) {
  if (!code) return '—'
  try {
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Tracking khách truy cập</h1>
        <p class="mt-1 text-sm text-slate-500">
          Dữ liệu từ website front-end. Khách Việt Nam / nước ngoài được xác định theo IP, nếu không có thì theo múi giờ trình duyệt.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <button
          v-for="d in [7, 30, 90]"
          :key="d"
          class="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100"
          @click="setPreset(d)"
        >
          {{ d }} ngày
        </button>
        <input v-model="from" type="date" class="rounded-lg border border-slate-300 px-3 py-2" @change="load" />
        <span class="text-slate-400">→</span>
        <input v-model="to" type="date" class="rounded-lg border border-slate-300 px-3 py-2" @change="load" />
      </div>
    </div>

    <div class="inline-flex rounded-lg border border-slate-300 bg-white p-1 text-sm">
      <button
        v-for="opt in ([['', 'Tất cả'], ['vn', 'Việt Nam'], ['foreign', 'Nước ngoài']] as const)"
        :key="opt[0]"
        class="rounded-md px-4 py-1.5"
        :class="visitorType === opt[0] ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'"
        @click="setType(opt[0])"
      >
        {{ opt[1] }}
      </button>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-if="loading && !summary" class="text-sm text-slate-400">Đang tải...</p>

    <template v-if="summary && totals">
      <!-- VN vs foreign split -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          v-for="type in (['vn', 'foreign', 'unknown'] as const)"
          :key="type"
          class="bg-white rounded-xl border border-slate-200 p-5"
          :class="type === 'unknown' ? 'opacity-70' : ''"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium" :class="type === 'vn' ? 'text-red-600' : type === 'foreign' ? 'text-sky-600' : 'text-slate-500'">
              {{ TYPE_LABELS[type] }}
            </p>
            <span class="text-xs text-slate-400">{{ share(summary.by_type[type].visitors, totals.visitors) }} khách</span>
          </div>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ summary.by_type[type].visitors.toLocaleString() }}</p>
          <p class="text-xs text-slate-500">khách truy cập</p>
          <dl class="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt class="text-slate-500">Phiên</dt>
            <dd class="text-right font-medium">{{ summary.by_type[type].sessions.toLocaleString() }}</dd>
            <dt class="text-slate-500">Lượt xem trang</dt>
            <dd class="text-right font-medium">{{ summary.by_type[type].page_views.toLocaleString() }}</dd>
            <dt class="text-slate-500">Lead gửi form</dt>
            <dd class="text-right font-medium">{{ summary.by_type[type].leads }}</dd>
            <dt class="text-slate-500">Đăng ký newsletter</dt>
            <dd class="text-right font-medium">{{ summary.by_type[type].subscribers }}</dd>
            <dt class="text-slate-500">Tỉ lệ chuyển đổi</dt>
            <dd class="text-right font-medium">{{ rate(summary.by_type[type].leads, summary.by_type[type].visitors) }}</dd>
          </dl>
        </div>
      </div>

      <!-- Daily visitors -->
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-slate-900">Khách truy cập theo ngày</h2>
          <div class="flex gap-4 text-xs text-slate-500">
            <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm bg-red-500" /> Việt Nam</span>
            <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm bg-sky-500" /> Nước ngoài</span>
            <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Chưa xác định</span>
          </div>
        </div>
        <div class="mt-4 flex h-40 items-end gap-px">
          <div
            v-for="day in summary.daily"
            :key="day.date"
            class="group relative flex flex-1 flex-col-reverse"
            :style="{ height: `${((day.vn + day.foreign + day.unknown) / dailyMax) * 100}%` }"
          >
            <div class="bg-red-500" :style="{ flexGrow: day.vn }" />
            <div class="bg-sky-500" :style="{ flexGrow: day.foreign }" />
            <div class="bg-slate-300" :style="{ flexGrow: day.unknown }" />
            <div class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
              {{ day.date }}: VN {{ day.vn }} · NN {{ day.foreign }}<template v-if="day.unknown"> · ? {{ day.unknown }}</template>
            </div>
          </div>
        </div>
        <div class="mt-1 flex justify-between text-xs text-slate-400">
          <span>{{ summary.range.from }}</span>
          <span>{{ summary.range.to }}</span>
        </div>
      </div>

      <!-- Opened pages & articles -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            <h2 class="font-semibold text-slate-900">Trang &amp; bài viết được mở</h2>
            <p class="text-xs text-slate-500">
              Thời gian xem chỉ tính lúc tab đang hiển thị. "Đọc hết" = tỉ lệ phiên cuộn tới ≥ 75% trang. Bấm vào dòng để xem sự kiện chi tiết.
            </p>
          </div>
          <div class="flex flex-wrap gap-1 text-sm">
            <button
              class="rounded-md px-3 py-1"
              :class="contentTab === '' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'"
              @click="contentTab = ''"
            >
              Tất cả
            </button>
            <button
              v-for="tab in contentTabs"
              :key="tab.type"
              class="rounded-md px-3 py-1"
              :class="contentTab === tab.type ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'"
              @click="contentTab = tab.type"
            >
              {{ CONTENT_LABELS[tab.type] }} <span class="opacity-60">{{ tab.views }}</span>
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th class="px-4 py-2">Nội dung</th>
                <th class="px-4 py-2 text-right">Lượt xem</th>
                <th class="px-4 py-2 text-right">Khách</th>
                <th class="px-4 py-2 text-right">VN</th>
                <th class="px-4 py-2 text-right">NN</th>
                <th class="px-4 py-2 text-right whitespace-nowrap">TG xem TB</th>
                <th class="px-4 py-2 text-right whitespace-nowrap">Đọc hết</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="row in contentRows"
                :key="`${row.content_type}:${row.content_slug}`"
                class="cursor-pointer hover:bg-slate-50"
                :class="contentFilter?.content_type === row.content_type && contentFilter?.content_slug === row.content_slug ? 'bg-amber-50' : ''"
                @click="showContentEvents(row)"
              >
                <td class="px-4 py-2">
                  <div class="flex items-start gap-2">
                    <span class="mt-0.5 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{{ CONTENT_LABELS[row.content_type] }}</span>
                    <div class="min-w-0">
                      <p class="font-medium text-slate-800">{{ contentTitle(row) }}</p>
                      <p class="font-mono text-xs text-slate-400 break-all">{{ row.path }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-2 text-right font-medium">{{ row.views }}</td>
                <td class="px-4 py-2 text-right">{{ row.visitors }}</td>
                <td class="px-4 py-2 text-right text-red-600">{{ row.vn }}</td>
                <td class="px-4 py-2 text-right text-sky-600">{{ row.foreign }}</td>
                <td class="px-4 py-2 text-right whitespace-nowrap">{{ duration(row.avg_seconds) }}</td>
                <td class="px-4 py-2 text-right">{{ row.content_type === 'page' && !row.read_rate ? '—' : `${Math.round(row.read_rate * 100)}%` }}</td>
              </tr>
              <tr v-if="!contentRows.length"><td colspan="7" class="px-4 py-4 text-slate-400">Chưa có dữ liệu.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <!-- Top actions -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <h2 class="px-5 pt-4 pb-2 font-semibold text-slate-900">Hành động quan trọng</h2>
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th class="px-4 py-2">Sự kiện</th>
                <th class="px-4 py-2 text-right">Lượt</th>
                <th class="px-4 py-2 text-right">VN</th>
                <th class="px-4 py-2 text-right">NN</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="row in summary.top_actions" :key="`${row.event}-${row.label}`">
                <td class="px-4 py-2">
                  <p class="font-medium text-slate-800">{{ eventLabel(row.event) }}</p>
                  <p v-if="row.label" class="text-xs text-slate-500 break-all">{{ row.label }}</p>
                </td>
                <td class="px-4 py-2 text-right font-medium">{{ row.total }}</td>
                <td class="px-4 py-2 text-right text-red-600">{{ row.vn }}</td>
                <td class="px-4 py-2 text-right text-sky-600">{{ row.foreign }}</td>
              </tr>
              <tr v-if="!summary.top_actions.length"><td colspan="4" class="px-4 py-4 text-slate-400">Chưa có dữ liệu.</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Sections -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <h2 class="px-5 pt-4 pb-2 font-semibold text-slate-900">Section được xem (số phiên)</h2>
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th class="px-4 py-2">Section</th>
                <th class="px-4 py-2 text-right">Phiên</th>
                <th class="px-4 py-2 text-right">VN</th>
                <th class="px-4 py-2 text-right">NN</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="row in summary.sections" :key="`${row.path}-${row.label}`">
                <td class="px-4 py-2">
                  <p class="font-medium text-slate-800">{{ row.label }}</p>
                  <p class="font-mono text-xs text-slate-400">{{ row.path }}</p>
                </td>
                <td class="px-4 py-2 text-right font-medium">{{ row.sessions }}</td>
                <td class="px-4 py-2 text-right text-red-600">{{ row.vn }}</td>
                <td class="px-4 py-2 text-right text-sky-600">{{ row.foreign }}</td>
              </tr>
              <tr v-if="!summary.sections.length"><td colspan="4" class="px-4 py-4 text-slate-400">Chưa có dữ liệu.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-4">
          <!-- Scroll depth -->
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <h2 class="font-semibold text-slate-900">Độ sâu cuộn trang</h2>
            <div class="mt-3 space-y-2">
              <div v-for="row in summary.scroll_depth" :key="row.value" class="flex items-center gap-3 text-sm">
                <span class="w-12 text-slate-500">{{ row.value }}%</span>
                <div class="h-2 flex-1 rounded bg-slate-100">
                  <div class="h-2 rounded bg-slate-700" :style="{ width: share(row.sessions, scrollBase) === '—' ? '0' : share(row.sessions, scrollBase) }" />
                </div>
                <span class="w-16 text-right font-medium">{{ row.sessions }}</span>
              </div>
              <p v-if="!summary.scroll_depth.length" class="text-sm text-slate-400">Chưa có dữ liệu.</p>
            </div>
          </div>

          <!-- Countries & referrers -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-white rounded-xl border border-slate-200 p-5">
              <h2 class="font-semibold text-slate-900">Quốc gia</h2>
              <ul class="mt-3 space-y-1.5 text-sm">
                <li v-for="row in summary.countries" :key="row.country" class="flex justify-between">
                  <span :class="row.country === 'VN' ? 'text-red-600' : 'text-slate-700'">{{ country(row.country) }}</span>
                  <span class="font-medium">{{ row.visitors }}</span>
                </li>
                <li v-if="!summary.countries.length" class="text-slate-400">Chưa có dữ liệu.</li>
              </ul>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 p-5">
              <h2 class="font-semibold text-slate-900">Nguồn truy cập</h2>
              <ul class="mt-3 space-y-1.5 text-sm">
                <li v-for="row in summary.referrers" :key="row.referrer_host" class="flex justify-between gap-2">
                  <span class="truncate text-slate-700">{{ row.referrer_host }}</span>
                  <span class="whitespace-nowrap font-medium">{{ row.sessions }}</span>
                </li>
                <li v-if="!summary.referrers.length" class="text-slate-400">Chỉ có truy cập trực tiếp.</li>
              </ul>
            </div>
          </div>

          <!-- Devices & classification reliability -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-white rounded-xl border border-slate-200 p-5">
              <h2 class="font-semibold text-slate-900">Thiết bị</h2>
              <ul class="mt-3 space-y-1.5 text-sm">
                <li v-for="row in summary.devices" :key="row.device ?? 'none'" class="flex justify-between">
                  <span class="capitalize text-slate-700">{{ row.device ?? '—' }}</span>
                  <span class="font-medium">{{ share(row.visitors, totals.visitors) }}</span>
                </li>
              </ul>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 p-5">
              <h2 class="font-semibold text-slate-900">Cách xác định VN / NN</h2>
              <ul class="mt-3 space-y-1.5 text-sm">
                <li v-for="row in summary.geo_sources" :key="row.geo_source ?? 'none'" class="flex justify-between">
                  <span class="text-slate-700">{{ row.geo_source ? GEO_SOURCE_LABELS[row.geo_source] ?? row.geo_source : 'Không xác định' }}</span>
                  <span class="font-medium">{{ row.visitors }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Raw events -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-2">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="font-semibold text-slate-900">Sự kiện gần đây</h2>
          <span v-if="contentFilter" class="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-800">
            {{ contentTitle(contentFilter) }}
            <button class="font-bold hover:text-amber-950" aria-label="Bỏ lọc" @click="showContentEvents(null)">×</button>
          </span>
        </div>
        <select v-model="eventFilter" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" @change="loadEvents()">
          <option value="">Tất cả sự kiện</option>
          <option v-for="(label, key) in EVENT_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th class="px-4 py-2">Thời gian</th>
              <th class="px-4 py-2">Sự kiện</th>
              <th class="px-4 py-2">Trang</th>
              <th class="px-4 py-2">Khách</th>
              <th class="px-4 py-2">Thiết bị</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in events" :key="row.id">
              <td class="px-4 py-2 whitespace-nowrap text-slate-500">{{ new Date(row.created_at).toLocaleString('vi-VN') }}</td>
              <td class="px-4 py-2">
                <p class="font-medium text-slate-800">{{ eventLabel(row.event) }}<template v-if="row.value !== null"> · {{ row.value }}</template></p>
                <p v-if="row.label" class="text-xs text-slate-500 break-all">{{ row.label }}</p>
              </td>
              <td class="px-4 py-2 font-mono text-xs text-slate-600 break-all">{{ row.path }}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                <span
                  class="rounded-full px-2 py-0.5 text-xs"
                  :class="row.visitor_type === 'vn' ? 'bg-red-50 text-red-700' : row.visitor_type === 'foreign' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ TYPE_LABELS[row.visitor_type] }}
                </span>
                <span v-if="row.country" class="ml-1 text-xs text-slate-500">{{ country(row.country) }}</span>
              </td>
              <td class="px-4 py-2 text-slate-500 capitalize">{{ row.device ?? '—' }}</td>
            </tr>
            <tr v-if="!events.length"><td colspan="5" class="px-4 py-4 text-slate-400">Chưa có sự kiện nào.</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="eventsLastPage > 1" class="flex items-center justify-end gap-2 px-5 py-3 text-sm">
        <button class="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40" :disabled="eventsPage <= 1" @click="loadEvents(eventsPage - 1)">Trước</button>
        <span class="text-slate-500">{{ eventsPage }} / {{ eventsLastPage }}</span>
        <button class="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40" :disabled="eventsPage >= eventsLastPage" @click="loadEvents(eventsPage + 1)">Sau</button>
      </div>
    </div>
  </div>
</template>
