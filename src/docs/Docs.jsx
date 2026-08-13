import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import './docs.css'
import { sumBy } from '../utility/numbers'

// Native browser print → "Save as PDF". @page (in docs.css) sets A4 + margins,
// and the browser paginates the free-flowing content for us.
function exportPdf() {
  window.print()
}

// Pull the leading "# Title" out of the markdown for the document heading and
// for a stable, shareable slug. Falls back to the filename if there's no H1.
function deriveTitle(raw, path) {
  const m = raw.match(/^\s*#\s+(.+?)\s*$/m)
  if (m) return m[1].trim()
  return path.split('/').pop().replace(/\.md$/, '')
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Every .md in /docs becomes a selectable document. import.meta.glob copes with
// the spaces + curly quotes in the filenames that a plain import can't.
const modules = import.meta.glob('../../docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const DOCS = Object.entries(modules)
  .map(([path, raw]) => {
    const title = deriveTitle(raw, path)
    return { slug: slugify(title), title, raw }
  })
  .sort((a, b) => a.title.localeCompare(b.title))

const LONG_TABLE_ROWS = 8
const LONG_CODE_LINES = 16

const sumChildren = (node, count) => sumBy(node.children ?? [], count)

function countNewlines(node) {
  if (node.type !== 'text') return sumChildren(node, countNewlines)

  let found = 0
  const { value } = node
  for (let i = value.indexOf('\n'); i !== -1; i = value.indexOf('\n', i + 1))
    found += 1
  return found
}

// Fence tag → the label shown in the block's corner. Anything unmapped falls
// back to its own uppercased tag.
const LANG_LABELS = {
  ts: 'TypeScript',
  tsx: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  dax: 'DAX',
  sql: 'SQL',
  json: 'JSON',
  bash: 'Shell',
  sh: 'Shell',
}

// react-markdown puts the fence tag on the <code> as `language-x`, whether or
// not rehype-highlight recognised it — so ```dax gets a label even though it
// highlights as plain text. An untagged fence has no class and no label.
function langLabel(node) {
  const code = node.children?.find(child => child.tagName === 'code')
  const tag = (code?.properties?.className ?? [])
    .find(c => c.startsWith('language-'))
    ?.slice('language-'.length)

  if (!tag) return undefined
  return LANG_LABELS[tag] ?? tag.toUpperCase()
}

function countRows(node) {
  if (node.tagName === 'tr') return 1
  return sumChildren(node, countRows)
}

// External links open in a new tab; nothing here is same-app navigation.
const rehypePlugins = [
  // Highlighting for code blocks
  [rehypeHighlight, { detect: false, ignoreMissing: true }],
]

const mdComponents = {
  a: ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  table: ({ node, children, ...props }) => (
    <table
      // See the notes in the CSS file.
      className={countRows(node) > LONG_TABLE_ROWS ? 'is-long' : undefined}
      {...props}
    >
      {children}
    </table>
  ),
  pre: ({ node, children, ...props }) => (
    <pre
      // See the notes in the CSS file.
      className={countNewlines(node) > LONG_CODE_LINES ? 'is-long' : undefined}
      data-lang={langLabel(node)}
      {...props}
    >
      {children}
    </pre>
  ),
}

export default function Docs() {
  const [slug, setSlug] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('doc')
    return DOCS.some(d => d.slug === fromUrl) ? fromUrl : DOCS[0]?.slug
  })

  const doc = useMemo(() => DOCS.find(d => d.slug === slug) ?? DOCS[0], [slug])

  // Keep the URL (?doc=…) in sync so a selection is shareable + survives reload,
  // and support Back/Forward between docs — all without a router. The first sync
  // replaces (no junk history entry); later user switches push a new entry.
  const firstSync = useRef(true)
  useEffect(() => {
    if (!doc) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('doc') !== doc.slug) {
      params.set('doc', doc.slug)
      const url = `?${params}`
      if (firstSync.current) window.history.replaceState({}, '', url)
      else window.history.pushState({}, '', url)
    }
    firstSync.current = false
    document.title = `Bearing Docs · ${doc.title}`
  }, [doc])

  useEffect(() => {
    const onPop = () => {
      const fromUrl = new URLSearchParams(window.location.search).get('doc')
      if (DOCS.some(d => d.slug === fromUrl)) setSlug(fromUrl)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (!doc) {
    return <div className="doc-empty">No documents found in /docs.</div>
  }

  return (
    <>
      {/* Toolbar + picker are .no-print, so they never reach the PDF. */}
      <div className="toolbar no-print">
        <label className="doc-picker">
          <span className="doc-picker-label">Doc</span>
          <select value={doc.slug} onChange={e => setSlug(e.target.value)}>
            {DOCS.map(d => (
              <option key={d.slug} value={d.slug}>
                {d.title}
              </option>
            ))}
          </select>
        </label>
        <button onClick={exportPdf}>Export to PDF</button>
      </div>

      {/* One beige sheet on screen. The table structure is what makes the
          header/footer repeat on every A4 page in print: browsers natively
          reprint <thead>/<tfoot> across page breaks and reserve their space,
          which position:fixed can't do (see docs.css @media print). */}
      <div className="doc-page">
        <table className="doc-sheet">
          <thead>
            <tr>
              <td>
                <div className="doc-running">
                  <span className="wordmark">Bearing</span>
                  <span className="kicker">Documentation</span>
                </div>
              </td>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td>
                <div className="doc-footer">
                  <span>Bearing · usebearing.com</span>
                  <span>{doc.title}</span>
                </div>
              </td>
            </tr>
          </tfoot>
          <tbody>
            <tr>
              <td>
                <article className="doc-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={rehypePlugins}
                    components={mdComponents}
                  >
                    {doc.raw}
                  </ReactMarkdown>
                </article>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
