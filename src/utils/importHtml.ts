export interface ImportedHtmlMeta {
  title?: string
  description?: string
  image?: string
}

export interface ImportedHtml {
  html: string
  meta: ImportedHtmlMeta
}

const DROP_TAGS = 'script, style, link, meta, title, noscript, object, embed, form, input, button, svg, template'
const EMBED_SRC = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\//
const BLOCK_TAGS = new Set([
  'P', 'DIV', 'SECTION', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'FIGURE', 'BLOCKQUOTE', 'PRE', 'HR',
  'IMG', 'VIDEO', 'IFRAME', 'NAV',
])
const KEEP_ATTRS: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  nav: ['aria-label'],
  video: ['src', 'controls', 'poster', 'preload'],
  source: ['src', 'type'],
  iframe: ['src', 'title', 'allow', 'allowfullscreen', 'loading'],
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
  // Only YouTube embeds survive; any other iframe could load arbitrary third-party pages.
  root.querySelectorAll('iframe').forEach((el) => {
    if (!EMBED_SRC.test(el.getAttribute('src') ?? '')) el.remove()
  })
  // Site chrome only needs stripping when there's no <article>/<main>; inside the article a
  // <nav> is usually the table of contents and must stay.
  if (root === doc.body) {
    root.querySelectorAll('header, footer, aside').forEach((el) => el.remove())
    root.querySelectorAll('nav').forEach((el) => {
      if (!/mục lục|table of contents|toc/i.test(`${el.getAttribute('aria-label') ?? ''} ${el.className}`)) el.remove()
    })
  }
  root.querySelectorAll('h1').forEach((el) => el.remove())

  root.querySelectorAll('*').forEach((el) => {
    // `id` is kept everywhere so table-of-contents links (#anchor) keep working.
    const allowed = ['id', ...(KEEP_ATTRS[el.tagName.toLowerCase()] ?? [])]
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
