import Page from "./Page.jsx";
import "./paged.css";

// The Export button. Native browser print → "Save as PDF" as the destination.
// Because @page margin is 0 and each .page is exactly A4, the PDF is 1:1.
function exportPdf() {
  window.print();
}

// Placeholder for a screenshot/image that content will drop in later.
function Figure({ src, alt, caption }) {
  return (
    <figure className="figure">
      <img src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

const TOTAL = 8;

export default function App() {
  return (
    <>
      {/* Toolbar is .no-print, so it never appears in the PDF */}
      <div className="toolbar no-print">
        <button
          className="ghost"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Top
        </button>
        <button onClick={exportPdf}>Export to PDF</button>
      </div>

      {/* ============================================================
          PAGE 1 · COVER  (TW-focused)
          Compass + "Your data, on tap", TW logo prominent,
          white on Bearing green.
          ============================================================ */}
      <Page n={1} total={TOTAL}>
        <div className="cover">
          <div className="mark">COMPASS BY BEARING</div>
          <div className="center">
            <div className="eyebrow">Proposal · Compass</div>
            <h1>
              Compass
              <br />
              for <span className="thin">Tompkins&nbsp;Wake</span>.
            </h1>
            <p className="sub">
              Your data, on tap. Ask a question — get an answer you can trust.
            </p>
            <div className="intro">
              <p>
                Today, &ldquo;how are we tracking?&rdquo; means someone stops,
                pulls an export, wrangles it, and builds a report. By the time it
                lands, the question has moved on.
              </p>
              <p>
                Compass changes that. Ask in plain English — get the chart, the
                table, the number, in seconds. No SQL. No report queue. No
                guesswork. And for a firm that lives on accuracy: the numbers are
                always real.
              </p>
            </div>
          </div>
          <dl className="meta">
            <div className="prepared-for">
              <dt>Prepared for</dt>
              <dd>
                <img
                  className="client-logo"
                  src="/logos/tompkins-wake-logo.png"
                  alt="Tompkins Wake"
                />
              </dd>
            </div>
            <div className="prepared-by">
              <dt>Prepared by</dt>
              <dd>Bearing</dd>
            </div>
          </dl>
        </div>
      </Page>

      {/* ============================================================
          PAGE 2 · CHAT FEATURE  (general) — the headline benefit
          ============================================================ */}
      <Page n={2} total={TOTAL} label="Chat">
        <div className="eyebrow">In plain English</div>
        <h2 className="section">Chat with your data</h2>
        <p className="lead">The fastest path from question to answer.</p>
        <div className="divider" />
        <ul className="benefits grid">
          <li>
            <h3>Ask anything, get it instantly.</h3>
            <p>
              &ldquo;Revenue by practice group this quarter?&rdquo; &ldquo;WIP by
              partner?&rdquo; Type it like you&apos;d say it — chart or table back
              in seconds.
            </p>
          </li>
          <li>
            <h3>Numbers you can trust, every time.</h3>
            <p>
              The AI reads your question, never your data — so it can&apos;t
              invent a figure. The worst it can do is pick the wrong metric, and
              you&apos;ll see that from its name. No silent errors buried in a
              board pack.
            </p>
          </li>
          <li>
            <h3>Locked to your permissions.</h3>
            <p>
              Everyone sees exactly what they&apos;re cleared to see — and nothing
              else. Restricted data stays invisible by design, not by policy.
            </p>
          </li>
          <li>
            <h3>Your data never leaves your systems.</h3>
            <p>The AI never touches it. Nothing goes offshore.</p>
          </li>
        </ul>
        <Figure
          src="/Chat chart.png"
          alt="A chat question resolving into a chart"
        />
        <div className="footer">
          <span>Bearing</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>

      {/* ============================================================
          PAGE 3 · DASHBOARDS  (general)
          Build the dashboard yourself, no IT required
          ============================================================ */}
      <Page n={3} total={TOTAL} label="Dashboards">
        <div className="eyebrow">Build it yourself</div>
        <h2 className="section">The dashboard you keep asking for</h2>
        <p className="lead">No IT ticket. No report developer. No wait.</p>
        <div className="divider" />
        <ul className="benefits grid">
          <li>
            <h3>Save it in one click.</h3>
            <p>Pin any answer to a dashboard, straight from the chat.</p>
          </li>
          <li>
            <h3>Every partner and exec self-serves.</h3>
            <p>
              The people asking the questions get the answers directly, instead
              of queuing behind Finance.
            </p>
          </li>
          <li>
            <h3>Frees your analysts for the real work.</h3>
            <p>
              Less time pulling routine numbers, more time on analysis that moves
              the needle.
            </p>
          </li>
          <li>
            <h3>Opens instantly.</h3>
            <p>Built once, ready whenever you are.</p>
          </li>
        </ul>
        <Figure src="/Dashboard chart.png" alt="A saved dashboard" />
        <div className="footer">
          <span>Bearing</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>

      {/* ============================================================
          PAGE 4 · BUILT ON EXISTING WORK  (TW-focused)
          Resolution8, no new data project, local, support
          ============================================================ */}
      <Page n={4} total={TOTAL} label="Head start">
        <div className="eyebrow">A head start, not a rebuild</div>
        <h2 className="section">Built on the work you&apos;ve already done</h2>
        <p className="lead">
          Resolution8 have already cracked the hard part — getting clean,
          reliable data out of your systems and modelling it. Compass sits
          straight on top.
        </p>
        <div className="divider" />

        <div className="two-col">
          <div className="card">
            <h3>Resolution8 lead the rollout</h3>
            <p>
              You keep the relationship you already trust; we provide the
              platform and support behind the scenes.
            </p>
          </div>
          <div className="card">
            <h3>No new data project</h3>
            <p>
              We reuse Resolution8&apos;s existing model and metric definitions —
              a small lift, not a fresh engagement.
            </p>
          </div>
          <div className="card">
            <h3>All local</h3>
            <p>
              Bearing, Resolution8 and your IT partner are all Hamilton-based.
            </p>
          </div>
          <div className="card">
            <h3>Support is included</h3>
            <p>
              Ongoing support sits in the licence — plus hours bundled in to get
              you live smoothly.
            </p>
          </div>
        </div>

        <div className="divider" />
        <h3 className="minihead">Your systems, already connected</h3>
        <p className="note">
          Both are already in your database — Actionstep for matters, Xero for
          financials.
        </p>
        <div className="logo-row brand">
          <div className="logo-slot">
            <img src="/logos/actionstep.svg" alt="Actionstep" />
          </div>
          <div className="logo-slot">
            <img src="/logos/xero.svg" alt="Xero" />
          </div>
          <div className="logo-slot more">+ more</div>
        </div>

        <div className="footer">
          <span>Bearing</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>

      {/* ============================================================
          PAGE 5 · PRICING  (TW-focused)
          ============================================================ */}
      <Page n={5} total={TOTAL} label="Pricing">
        <div className="eyebrow">Investment</div>
        <h2 className="section">Pricing</h2>
        <p className="lead">Simple, all-in, and built to fit.</p>
        <div className="divider" />

        <div className="price-hero">
          <span className="badge">Indicative licence</span>
          <div className="price-figure">
            <span className="amount">$2,000</span>
            <span className="per">/ month</span>
          </div>
        </div>

        <div className="two-col">
          <div className="card">
            <h3>Support included</h3>
            <p>Ongoing support is in the licence, not billed on top.</p>
          </div>
          <div className="card">
            <h3>Implementation help bundled in</h3>
            <p>
              We&apos;ll fold in hours to get you live and drive adoption — and
              Resolution8 can do the same.
            </p>
          </div>
          <div className="card">
            <h3>Try before you commit</h3>
            <p>
              Start on your own data with a trial, so the value is proven before
              anything&apos;s locked in.
            </p>
          </div>
        </div>

        <div className="divider" />
        <p className="note">
          An indicative figure for a firm your size — we&apos;ll shape the final
          package with you and Resolution8 to match how you want to roll it out.
        </p>
        <div className="footer">
          <span>Bearing · usebearing.com</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>

      {/* ============================================================
          PAGE 6 · THE TEAM  (general)
          ============================================================ */}
      <Page n={6} total={TOTAL} label="Team">
        <div className="eyebrow">Who&apos;s behind it</div>
        <h2 className="section">The team behind Compass</h2>
        <p className="lead">
          A small, senior studio in Hamilton — the people you talk to are the
          people who build it.
        </p>
        <div className="divider" />
        <div className="two-col team">
          <div className="member">
            <img className="avatar" src="/team/sam.png" alt="Sam Woolerton" />
            <h3>Sam Woolerton</h3>
            <p className="role">Founder &amp; Director</p>
          </div>
          <div className="member">
            <img className="avatar" src="/team/jesse.png" alt="Jesse O'Connor" />
            <h3>Jesse O&apos;Connor</h3>
            <p className="role">Full-Stack Developer</p>
          </div>
          <div className="member">
            <img className="avatar" src="/team/ethan.png" alt="Ethan MacLeod" />
            <h3>Ethan MacLeod</h3>
            <p className="role">Full-Stack Developer</p>
          </div>
          <div className="member">
            <img className="avatar" src="/team/isaiah.png" alt="Isaiah Foulidis" />
            <h3>Isaiah Foulidis</h3>
            <p className="role">Data Pipeline Specialist</p>
          </div>
        </div>
        <div className="divider" />
        <div className="two-col">
          <div className="card">
            <h3>Senior by design</h3>
            <p>
              Bearing, est. 2022. A hand-picked team of seven — no juniors
              learning on your dime.
            </p>
          </div>
          <div className="card">
            <h3>You own what we build</h3>
            <p>Code lives in your repo, documented as we go.</p>
          </div>
          <div className="card">
            <h3>We stay because you want us to</h3>
            <p>
              95% of our clients bring us back — not because they&apos;re locked
              in, but because the systems keep earning their place.
            </p>
          </div>
          <div className="card">
            <h3>Right down the road</h3>
            <p>Hamilton-based, same team end to end, references you can call.</p>
          </div>
        </div>
        <p className="note">
          Meet the team at{" "}
          <a className="link" href="https://usebearing.com/about-us">
            usebearing.com/about-us
          </a>
          .
        </p>
        <div className="footer">
          <span>Bearing · usebearing.com</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>

      {/* ============================================================
          PAGE 7 · INTEGRATIONS & AUTOMATION  (general / TW)
          ============================================================ */}
      <Page n={7} total={TOTAL} label="Automation">
        <div className="eyebrow">Beyond answering questions</div>
        <h2 className="section">More than dashboards</h2>
        <p className="lead">
          The same engine that answers your questions can move your data for you.
          Making the systems underneath a firm run without the manual overhead is
          Bearing&apos;s core business — connecting the tools you already pay for
          so data flows where it needs to, on its own.
        </p>
        <div className="divider" />
        <div className="two-col">
          <div className="card">
            <h3>Stop entering the same data twice</h3>
            <p>
              We sync between your systems so the team stops copy-pasting by hand.
            </p>
          </div>
          <div className="card">
            <h3>Get data out of stubborn systems</h3>
            <p>
              Some platforms don&apos;t like giving up their data — prising it out
              cleanly is exactly what we specialise in. (And much of that
              groundwork is already done for you.)
            </p>
          </div>
          <div className="card">
            <h3>Reports that write themselves</h3>
            <p>
              Auto-generate the documents your team builds by hand today, ready
              for your commentary. (Yes — the one James asked about.)
            </p>
          </div>
          <div className="card">
            <h3>Delivered to the inbox</h3>
            <p>
              Schedule the numbers that matter and have them sent — no one has to
              go and pull them.
            </p>
          </div>
          <div className="card span-2">
            <h3>One source of truth</h3>
            <p>
              Define the logic once; dashboards, reports and automations all draw
              from it, so nothing drifts out of sync.
            </p>
          </div>
        </div>
        <div className="footer">
          <span>Bearing · usebearing.com</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>

      {/* ============================================================
          PAGE 8 · CTA  — closing, full-bleed green to bookend cover
          ============================================================ */}
      <Page n={8} total={TOTAL}>
        <div className="cta">
          <div className="mark">COMPASS BY BEARING</div>
          <div className="center">
            <div className="eyebrow">What happens next</div>
            <h1>Seeing it beats reading about it.</h1>
            <ol className="next-steps">
              <li>
                <span className="step-n">1</span>
                <div>
                  <h3>Book a walkthrough</h3>
                  <p>
                    We&apos;ll take the questions your partners ask most and
                    answer them live, on your own data.
                  </p>
                </div>
              </li>
              <li>
                <span className="step-n">2</span>
                <div>
                  <h3>Run a trial you drive yourselves</h3>
                  <p>Proof on your own data before anything&apos;s signed.</p>
                </div>
              </li>
            </ol>
          </div>
          <p className="closer">
            Say the word and we&apos;ll get a time in the diary this week.
          </p>
        </div>
      </Page>
    </>
  );
}
