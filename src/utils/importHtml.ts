export interface ImportedHtmlMeta {
  title?: string
  description?: string
  image?: string
}

export interface ImportedHtml {
  html: string
  meta: ImportedHtmlMeta
}

const DROP_TAGS = 'script, style, link, meta, title, noscript, iframe, object, embed, form, input, button, svg, template'
const BLOCK_TAGS = new Set([
  'P', 'DIV', 'SECTION', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'FIGURE', 'BLOCKQUOTE', 'PRE', 'HR',
])
const KEEP_ATTRS: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
}

/** True when a plain-text clipboard payload is really HTML markup (e.g. copied from a code editor). */
export function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim()
  return /^<(!doctype|html|head|body|article|main|section|div|p|h[1-6]|ul|ol|table|figure|blockquote)\b/i.test(trimmed)
    && /<\/[a-z][a-z0-9]*>/i.test(trimmed)
}

function metaContent(doc: Document, selector: string): string | undefined {
  return doc.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined
}

/**
 * Turns a full HTML page (or fragment) into clean post content: keeps only the article body,
 * drops head/scripts/styles/layout chrome, strips classes/inline styles/event handlers, and
 * removes <h1> since the site already renders the post title as the page's only H1.
 */
export function importHtml(raw: string): ImportedHtml {
  const doc = new DOMParser().parseFromString(raw, 'text/html')

  const meta: ImportedHtmlMeta = {
    title: metaContent(doc, 'meta[property="og:title"]') || doc.title?.trim() || undefined,
    description: metaContent(doc, 'meta[name="description"]') || metaContent(doc, 'meta[property="og:description"]'),
    image: metaContent(doc, 'meta[property="og:image"]'),
  }

  const root = doc.querySelector('article') ?? doc.querySelector('main') ?? doc.body
  root.querySelectorAll(DROP_TAGS).forEach((el) => el.remove())
  root.querySelectorAll('header, nav, footer, aside').forEach((el) => {
    if (el !== root) el.remove()
  })
  root.querySelectorAll('h1').forEach((el) => el.remove())

  root.querySelectorAll('*').forEach((el) => {
    const allowed = KEEP_ATTRS[el.tagName.toLowerCase()] ?? []
    for (const attr of Array.from(el.attributes)) {
      if (!allowed.includes(attr.name)) el.removeAttribute(attr.name)
    }
    const href = el.getAttribute('href')
    if (href && /^\s*javascript:/i.test(href)) el.removeAttribute('href')
  })

  // Unwrap layout-only wrappers (deepest first) so the content is a flat list of blocks;
  // a wrapper holding only inline content becomes a paragraph so text doesn't run together.
  Array.from(root.querySelectorAll('div, section')).reverse().forEach((el) => {
    const hasBlockChild = Array.from(el.children).some((child) => BLOCK_TAGS.has(child.tagName))
    if (hasBlockChild || !el.textContent?.trim()) {
      el.replaceWith(...Array.from(el.childNodes))
    } else {
      const p = doc.createElement('p')
      p.append(...Array.from(el.childNodes))
      el.replaceWith(p)
    }
  })
  root.querySelectorAll('span').forEach((el) => el.replaceWith(...Array.from(el.childNodes)))

  const html = root.innerHTML
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .trim()

  return { html, meta }
}
