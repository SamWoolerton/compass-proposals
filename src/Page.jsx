/**
 * A single fixed-size sheet. Whatever you put in `children` lives on exactly
 * one physical page — it will not reflow onto the next sheet. If content
 * overflows the sheet it is clipped (overflow:hidden in paged.css), which is
 * the tradeoff that guarantees "what you see is what prints".
 *
 * Manage pagination yourself by splitting content across <Page> elements.
 */
export default function Page({ n, total, label, children }) {
  return (
    <section className="page">
      {label && (
        <div className="rail">
          <span className="num">{String(n).padStart(2, '0')}</span>
          <div className="tick" />
          <span className="label">{label}</span>
          <div className="tick" />
          <span className="num">/{String(total).padStart(2, '0')}</span>
        </div>
      )}
      {children}
    </section>
  )
}
