import Page from "./Page.jsx";
import "./paged.css";

// The Export button. Native browser print → "Save as PDF" as the destination.
// Because @page margin is 0 and each .page is exactly A4, the PDF is 1:1.
function exportPdf() {
  window.print();
}

const TOTAL = 4;

export default function App() {
  return (
    <>
      {/* Toolbar is .no-print, so it never appears in the PDF */}
      <div className="toolbar no-print">
        <button className="ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Top
        </button>
        <button onClick={exportPdf}>Export to PDF</button>
      </div>

      {/* ---- PAGE 1 · COVER ------------------------------------ */}
      <Page n={1} total={TOTAL}>
        <div className="cover">
          <div className="mark">NORTHLIGHT&nbsp;STUDIO</div>
          <div className="center">
            <div className="eyebrow">Proposal · Website Design &amp; Build</div>
            <h1>
              A new home<br />for <span className="thin">Harbour&nbsp;&amp;&nbsp;Vine</span>.
            </h1>
            <p className="sub">
              A fast, editorial storefront that makes the range feel as considered
              online as it does on the shelf — built to be run by your team, not by us.
            </p>
          </div>
          <dl className="meta">
            <div>
              <dt>Prepared for</dt>
              <dd>Harbour &amp; Vine</dd>
            </div>
            <div>
              <dt>Prepared by</dt>
              <dd>Northlight Studio</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>3 July 2026</dd>
            </div>
            <div>
              <dt>Valid until</dt>
              <dd>3 August 2026</dd>
            </div>
          </dl>
        </div>
      </Page>

      {/* ---- PAGE 2 · APPROACH --------------------------------- */}
      <Page n={2} total={TOTAL} label="Approach">
        <div className="eyebrow">01 — The brief, as we understand it</div>
        <h2 className="section">Approach</h2>
        <p className="lead">
          You have a strong physical brand and a website that undersells it. The goal
          isn&apos;t a redesign for its own sake — it&apos;s a site that converts browsers into
          buyers and that your team can update without calling us.
        </p>
        <div className="divider" />
        <div className="two-col">
          <div className="card">
            <h3>Editorial, not templated</h3>
            <p>
              A layout system built around your photography and product stories, so
              each collection can be given room rather than dropped into a grid.
            </p>
          </div>
          <div className="card">
            <h3>Owned by your team</h3>
            <p>
              A clean CMS with guardrails: your staff publish new products and journal
              posts confidently, without breaking the design.
            </p>
          </div>
          <div className="card">
            <h3>Fast by default</h3>
            <p>
              Static-first delivery with image optimisation baked in. Target: sub-second
              loads on mobile, which is where two-thirds of your traffic sits.
            </p>
          </div>
          <div className="card">
            <h3>Measured</h3>
            <p>
              Analytics and a simple conversion dashboard from day one, so we can tune
              the funnel against real numbers after launch.
            </p>
          </div>
        </div>
        <div className="footer">
          <span>Northlight Studio</span>
          <span>Proposal · Harbour &amp; Vine</span>
        </div>
      </Page>

      {/* ---- PAGE 3 · SCOPE & TIMELINE ------------------------- */}
      <Page n={3} total={TOTAL} label="Scope">
        <div className="eyebrow">02 — What we&apos;ll do, and when</div>
        <h2 className="section">Scope &amp; timeline</h2>
        <ul className="timeline">
          <li>
            <span className="phase">WEEK 1–2</span>
            <div>
              <h3>Discovery &amp; content model</h3>
              <p>Workshops, audit of the current catalogue, and a content model your team signs off on.</p>
            </div>
          </li>
          <li>
            <span className="phase">WEEK 3–5</span>
            <div>
              <h3>Design</h3>
              <p>Two directions for the homepage and a product page, then one refined system through to a full kit.</p>
            </div>
          </li>
          <li>
            <span className="phase">WEEK 6–9</span>
            <div>
              <h3>Build</h3>
              <p>Front-end build, CMS wiring, and migration of your existing 140 products.</p>
            </div>
          </li>
          <li>
            <span className="phase">WEEK 10</span>
            <div>
              <h3>Launch &amp; handover</h3>
              <p>QA, a training session for your team, and two weeks of post-launch support included.</p>
            </div>
          </li>
        </ul>
        <div className="footer">
          <span>Northlight Studio</span>
          <span>Proposal · Harbour &amp; Vine</span>
        </div>
      </Page>

      {/* ---- PAGE 4 · INVESTMENT ------------------------------- */}
      <Page n={4} total={TOTAL} label="Investment">
        <div className="eyebrow">03 — Investment</div>
        <h2 className="section">The numbers</h2>
        <table className="price">
          <thead>
            <tr>
              <th>Item</th>
              <th className="r">Amount (NZD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="name">Discovery &amp; content model</span><br /><span className="desc">Workshops, audit, sign-off</span></td>
              <td className="r">$6,500</td>
            </tr>
            <tr>
              <td><span className="name">Design system</span><br /><span className="desc">Homepage, product, journal, full kit</span></td>
              <td className="r">$14,000</td>
            </tr>
            <tr>
              <td><span className="name">Build &amp; migration</span><br /><span className="desc">Front end, CMS, 140 products</span></td>
              <td className="r">$18,500</td>
            </tr>
            <tr>
              <td><span className="name">Launch &amp; training</span> <span className="badge">Included support</span><br /><span className="desc">QA, handover, 2 weeks support</span></td>
              <td className="r">$4,000</td>
            </tr>
            <tr className="total">
              <td>Total, fixed</td>
              <td className="r">$43,000</td>
            </tr>
          </tbody>
        </table>
        <div className="divider" />
        <p className="lead" style={{ fontSize: "10pt" }}>
          Fixed price, billed in three stages: 40% to start, 40% at build, 20% at launch.
          Ongoing care plans start at $850/month if you&apos;d like us to stay on.
        </p>
        <div className="footer">
          <span>Northlight Studio · hello@northlight.studio</span>
          <span>Proposal · Harbour &amp; Vine</span>
        </div>
      </Page>
    </>
  );
}
