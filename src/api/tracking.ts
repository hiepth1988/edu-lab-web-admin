import { api } from './client'

export type VisitorType = 'vn' | 'foreign' | 'unknown'

export interface TypeTotals {
  visitors: number
  sessions: number
  page_views: number
  leads: number
  subscribers: number
}

export interface SplitRow {
  vn: number
  foreign: number
}

export type ContentType = 'post' | 'research' | 'solution' | 'product' | 'project' | 'audience' | 'page'

export interface ContentRow extends SplitRow {
  content_type: ContentType
  content_slug: string
  // vi + en slugs of the same record, merged into this row.
  slugs: string[]
  title: string | null
  path: string
  views: number
  visitors: number
  avg_seconds: number
  // Share of viewing sessions that scrolled to ≥ 75%.
  read_rate: number
}

export interface TrackingSummary {
  range: { from: string; to: string; visitor_type: VisitorType | null }
  by_type: Record<VisitorType, TypeTotals>
  daily: Array<{ date: string } & Record<VisitorType, number>>
  top_pages: Array<SplitRow & { path: string; views: number; visitors: number }>
  top_content: ContentRow[]
  top_actions: Array<SplitRow & { event: string; label: string | null; total: number; visitors: number }>
  sections: Array<SplitRow & { path: string; label: string; sessions: number }>
  scroll_depth: Array<{ value: number; sessions: number }>
  countries: Array<{ country: string; visitors: number }>
  referrers: Array<SplitRow & { referrer_host: string; sessions: number }>
  devices: Array<{ device: string | null; visitors: number }>
  geo_sources: Array<{ geo_source: string | null; visitors: number }>
}

export interface TrackingEventRow {
  id: number
  event: string
  label: string | null
  path: string
  content_type: ContentType | null
  content_slug: string | null
  target: string | null
  value: number | null
  visitor_type: VisitorType
  country: string | null
  geo_source: string | null
  device: string | null
  referrer_host: string | null
  created_at: string
}

export const trackingApi = {
  summary: (params: { from?: string; to?: string; visitor_type?: VisitorType | '' }) =>
    api.get<TrackingSummary>('/admin/tracking/summary', { params }),
  events: (params: {
    page?: number
    event?: string
    visitor_type?: VisitorType | ''
    content_type?: ContentType | ''
    content_slug?: string
  }) =>
    api.get<{ data: TrackingEventRow[]; current_page: number; last_page: number }>('/admin/tracking/events', { params }),
}
