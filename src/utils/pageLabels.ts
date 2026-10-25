// Human-readable names for the fixed site pages, their sections and the keys
// inside a section's "extra" JSON. Unknown keys fall back to a humanized key.

export const PAGE_LABELS: Record<string, string> = {
  home: 'Trang chủ',
  partnership: 'Hợp tác',
  about: 'Giới thiệu',
  contact: 'Liên hệ',
  privacy: 'Chính sách bảo mật',
  terms: 'Điều khoản dịch vụ',
}

export const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero (đầu trang)',
  problem: 'Vấn đề khách hàng gặp',
  who_we_help: 'Đối tượng phục vụ',
  solutions: 'Giải pháp',
  tech_capability: 'Năng lực công nghệ',
  journey: 'Hành trình',
  process: 'Quy trình',
  our_work: 'Dự án tiêu biểu',
  scale: 'Quy mô',
  research_lab: 'Research Lab',
  latest_insights: 'Bài viết mới',
  starter_package: 'Gói khởi đầu (giá)',
  partnership: 'Mô hình hợp tác',
  models: 'Mô hình hợp tác',
  comparison: 'Bảng so sánh',
  faq: 'Câu hỏi thường gặp',
  case_study: 'Case study',
  final_cta: 'Kêu gọi cuối trang',
  philosophy: 'Triết lý',
}

const KEY_LABELS: Record<string, string> = {
  eyebrow: 'Nhãn nhỏ phía trên',
  title: 'Tiêu đề',
  label: 'Nhãn',
  value: 'Giá trị',
  values: 'Giá trị theo từng cột',
  body: 'Nội dung',
  icon: 'Icon',
  image: 'Ảnh',
  items: 'Các mục',
  groups: 'Nhóm tính năng',
  facts: 'Thông tin nhanh',
  plans: 'Các mô hình',
  fit: 'Phù hợp với',
  columns: 'Tên các cột',
  rows: 'Các hàng',
  steps: 'Các bước',
  phases: 'Các giai đoạn',
  cards: 'Các thẻ',
  tiles: 'Các ô',
  n: 'Số thứ tự',
  q: 'Câu hỏi',
  a: 'Trả lời',
  to: 'Link',
  price: 'Giá',
  price_prefix: 'Chữ trước giá',
  price_unit: 'Đơn vị tiền',
  price_note: 'Ghi chú dưới giá',
  hint: 'Gợi ý',
  quote: 'Trích dẫn',
  cite: 'Nguồn trích dẫn',
  size: 'Kích thước',
  type: 'Loại',
  featured: 'Nổi bật',
  cta_label: 'Chữ trên nút',
  cta_url: 'Link nút',
  secondary_cta_label: 'Chữ trên nút phụ',
  secondary_cta_url: 'Link nút phụ',
}

/** Display order for keys: MySQL JSON columns don't keep the original key order. */
const KEY_ORDER = [
  'eyebrow', 'n', 'icon', 'image', 'title', 'label', 'q', 'price_prefix', 'price', 'price_unit', 'price_note',
  'body', 'a', 'value', 'values', 'fit', 'size', 'type', 'featured', 'to', 'quote', 'cite', 'hint',
  'cta_label', 'cta_url', 'secondary_cta_label', 'secondary_cta_url',
  'items', 'facts', 'groups', 'plans', 'columns', 'rows', 'steps', 'phases', 'cards', 'tiles',
]

export function keyLabel(key: string | number): string {
  if (typeof key === 'number') return `#${key + 1}`
  if (KEY_LABELS[key]) return KEY_LABELS[key]
  const words = key.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function sortKeys(keys: string[]): string[] {
  const rank = (k: string) => {
    const i = KEY_ORDER.indexOf(k)
    return i === -1 ? KEY_ORDER.length : i
  }
  return [...keys].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

/** Fields that read better as a multi-line box. */
export function isLongText(key: string | number, value: string): boolean {
  if (typeof key === 'string' && ['body', 'a', 'quote', 'price_note', 'hint', 'fit'].includes(key)) return true
  return value.length > 90 || value.includes('\n')
}

export function isImageKey(key: string | number): boolean {
  return typeof key === 'string' && (key === 'image' || key.endsWith('_image'))
}

/** An empty value with the same shape, used when adding a new list item. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function blankLike(value: any): any {
  if (Array.isArray(value)) return []
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blankLike(v)]))
  }
  if (typeof value === 'boolean') return false
  if (typeof value === 'number') return 0
  return ''
}
