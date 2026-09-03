import { useEffect, useState } from 'react'
import ConfigPane from './ConfigPane.jsx'
import Page, { Pages } from './Page.jsx'
import './paged.css'

const clientLogo = 'stoney-creek.svg'
const clientLogoHeight = '7mm'

type ClientPortalConfig = { visible: false } | { visible: true; label: string }
const clientPortalsConfig: ClientPortalConfig = { visible: false }

type PricingConfig =
  { visible: false } | { visible: true; monthly: string; annual: string }
const pricingConfig: PricingConfig = { visible: false }

const retailSampleQuestions = [
  'Top 5 products by gross profit?',
  'What products are our best sellers this year?',
]
const manufacturingSampleQuestions = [
  'Top 5 most profitable clients?',
  'What product lines are our best sellers this year?',
]
const servicesSampleQuestions = [
  'Top 5 most profitable projects?',
  'Engineer utilisation rate trend this financial year?',
]

// The Export button. Native browser print → "Save as PDF" as the destination.
// Because @page margin is 0 and each .page is exactly A4, the PDF is 1:1.
function exportPdf() {
  window.print()
}

function Footer() {
  return (
    <div className="footer">
      <span>Bearing · usebearing.com</span>
      <span>Proposal · Compass</span>
    </div>
  )
}

// Placeholder for a screenshot/image that content will drop in later.
function Figure({
  src,
  alt,
  caption,
}: {
  src: string
  alt: string
  caption?: string
}) {
  return (
    <figure className="figure">
      <img src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

// Line icons for the "More than dashboards" detail rows. 24×24, drawn with
// currentColor so the accent green flows through from CSS.
const Icon = {
  Tag: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11.8V4a1 1 0 0 1 1-1h7.8a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8l-6.8 6.8a2 2 0 0 1-2.8 0L3.6 13.2A2 2 0 0 1 3 11.8z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </svg>
  ),
  Sync: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9a8 8 0 0 1 13.5-3.5L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 15a8 8 0 0 1-13.5 3.5L4 16" />
      <path d="M4 20v-4h4" />
    </svg>
  ),
  Extract: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="8" cy="5" rx="5" ry="2.2" />
      <path d="M3 5v10c0 1.2 2.2 2.2 5 2.2" />
      <path d="M13 5v4" />
      <path d="M15 15h7" />
      <path d="M19 12l3 3-3 3" />
    </svg>
  ),
  Report: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  ),
  Inbox: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 13l2.5-7.5A2 2 0 0 1 8.4 4h7.2a2 2 0 0 1 1.9 1.5L20 13" />
      <path d="M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      <path d="M4 13h4l1.5 2.5h5L16 13h4" />
    </svg>
  ),
  Source: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="5" cy="6" r="1.8" />
      <circle cx="19" cy="6" r="1.8" />
      <circle cx="5" cy="18" r="1.8" />
      <circle cx="19" cy="18" r="1.8" />
      <path d="M10.2 10.4 6.4 7.2M13.8 10.4l3.8-3.2M10.2 13.6l-3.8 3.2M13.8 13.6l3.8 3.2" />
    </svg>
  ),
  Shield: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  ),
  Lift: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3c2.8 2.1 4 5 4 8.2L14 13h-4l-2-1.8C8 8 9.2 5.1 12 3z" />
      <circle cx="12" cy="9" r="1.3" />
      <path d="M8 14l-2 3.5 3-1M16 14l2 3.5-3-1" />
    </svg>
  ),
  Trial: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 3h5" />
      <path d="M10 3v6.5l-4.2 7.8A2 2 0 0 0 7.6 20h8.8a2 2 0 0 0 1.8-2.7L14 9.5V3" />
      <path d="M7.6 14.5h8.8" />
    </svg>
  ),
  Check: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
}

export default function App() {
  const [clientName, setClientName] = useState('Sample Client')
  const [sampleQuestions, setSampleQuestions] = useState(retailSampleQuestions)

  useEffect(
    function setDocName() {
      document.title = `Compass + ${clientName}`
    },
    [clientName],
  )

  const setSampleQuestion = (i: number, value: string) =>
    setSampleQuestions(qs => qs.map((q, j) => (j === i ? value : q)))

  return (
    <>
      {/* Toolbar is .no-print, so it never appears in the PDF */}
      <div className="toolbar no-print">
        <button
          className="ghost"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Top
        </button>
        <button onClick={exportPdf}>Export to PDF</button>
      </div>

      <ConfigPane
        clientName={clientName}
        onClientNameChange={setClientName}
        sampleQuestions={sampleQuestions}
        onSampleQuestionChange={setSampleQuestion}
      />

      <Pages>
        {/* ============================================================
            COVER 
            Compass + "Your data, on tap", TW logo prominent,
            white on Bearing green.
            ============================================================ */}
        <Page>
          <div className="cover">
            <div className="mark">COMPASS BY BEARING</div>
            <div className="center">
              <div className="eyebrow">Proposal · Compass</div>
              <h1>
                Compass
                <br />
                for <span className="thin">{clientName}</span>.
              </h1>
              <p className="sub">Effortless answers you can trust.</p>
              <div className="intro">
                <p>
                  Today, &ldquo;how are we tracking?&rdquo; means someone stops
                  what they're doing to pull an export, wrangle the data, and
                  build a report.
                </p>
                <p>
                  Compass changes that: ask in plain English and get answers in
                  seconds. Save the most useful charts to your personal
                  dashboard. AI with guardrails, providing answers you can
                  trust.
                </p>
              </div>
            </div>
            <dl className="meta">
              <div className="prepared-for">
                <dt>Prepared for</dt>
                <dd>
                  <img
                    className="client-logo"
                    src={`/logos/${clientLogo}`}
                    alt={clientName}
                    style={{ height: clientLogoHeight }}
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
            DASHBOARDS  
            ============================================================ */}
        <Page label="Dashboards">
          <div className="eyebrow">Curate your favourites</div>
          <h2 className="section">A dashboard that's tailor-made for you</h2>
          <p className="lead">
            Save the most useful charts to your personal dashboard. No need to
            wait for a report developer.
          </p>
          <div className="divider" />
          <ul className="benefits grid">
            <li>
              <h3>Always up to date.</h3>
              <p>
                No more stale reports; see the latest data whenever you refresh
                the page.
              </p>
            </li>
            <li>
              <h3>Frees up your time to deep dive.</h3>
              <p>
                Less time pulling routine numbers, and more time on analysis
                that moves the needle.
              </p>
            </li>
            <li>
              <h3>Share with your team.</h3>
              <p>
                Share a report with your team, and they can refer to it directly
                or use it as the base to build their own dashboard.
              </p>
            </li>
            <li>
              <h3>Track comments directly in the report.</h3>
              <p>Keep everyone on the same page with in-report comments.</p>
            </li>
          </ul>
          <Figure src="/Dashboard chart.png" alt="A saved dashboard" />
          <Footer />
        </Page>

        {/* ============================================================
            CHAT FEATURE 
            ============================================================ */}
        <Page label="Chat">
          <div className="eyebrow">Effortless answers</div>
          <h2 className="section">Chat with your data</h2>
          <p className="lead">
            The fastest path to insights. Send a question and Compass answers
            with a table or chart.
          </p>
          <div className="divider" />
          <ul className="benefits grid">
            <li>
              <h3>Ask anything, get answers immediately.</h3>
              <p>
                {sampleQuestions.map((q, i) => (
                  <span key={i}>
                    {i !== 0 ? ', ' : ''}&ldquo;{q}&rdquo;
                  </span>
                ))}
                . Type it like you&apos;d say it, and get a chart or table back
                in seconds.
              </p>
            </li>
            <li>
              <h3>Numbers you can trust, every time.</h3>
              <p>
                The AI reads your question but our custom query engine runs the
                query - the worst case is that it misunderstands you, and you
                clarify in a follow up. No hallucinated answers.
              </p>
            </li>
            <li>
              <h3>Locked down with granular permissions.</h3>
              <p>
                Everyone sees exactly what they&apos;re cleared to see, and
                nothing else. Users can't circumvent controls to trick the AI
                into revealing info it shouldn't.
              </p>
            </li>
            <li>
              <h3>Your data never leaves your systems.</h3>
              <p>
                The AI never sees your sensitive data, only your queries. Your
                data never leaves your control.
              </p>
            </li>
          </ul>
          <Figure
            src="/Chat GP chart.png"
            alt="A chat question resolving into a chart"
          />
          <Footer />
        </Page>

        {/* ============================================================
            BUILT ON EXISTING WORK 
            Resolution8, no new data project, local, support
            ============================================================ */}
        {/* <Page label="Head start">
          <div className="eyebrow">A running start</div>
          <h2 className="section">Built on the work you&apos;ve already done</h2>
          <p className="lead">
            Resolution8 have already done the hard part: getting clean, reliable
            data out of your systems and modelling it. Compass sits straight on
            top.
          </p>
          <div className="divider" />

          <div className="two-col">
            <div className="card">
              <h3>Go live in weeks, not months</h3>
              <p>
                Compass sits on top of your existing data foundation, so your team
                can start getting answers straight away.
              </p>
            </div>
            <div className="card">
              <h3>Streamlined setup</h3>
              <p>
                Compass reuses the metric definitions has Resolution8 built for
                your existing reporting, keeping the extra work to a minimum.
              </p>
            </div>
            <div className="card">
              <h3>Built to grow with you</h3>
              <p>
                Start with operational and finance data, and teach Compass about
                more topics whenever you&apos;re ready.
              </p>
            </div>
            <div className="card">
              <h3>Lives in your infrastructure</h3>
              <p>
                Everything runs on your own systems, so sensitive client data is
                protected by the controls you already trust.
              </p>
            </div>
          </div>

          <div className="divider" />
          <h3 className="minihead">Your systems are already connected</h3>
          <p className="note">
            Compass draws on what's already in your database — Actionstep for
            operations, Xero for financials.
          </p>
          <div className="mt-3 flex gap-4">
            <div className="flex flex-1 items-center justify-center rounded-md bg-green-900 px-4 h-[72mm] [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
              <img
                className="h-[8.5mm] w-auto max-w-[70%] object-contain text-white rotate-90 scale-[1.4]"
                src="/logos/actionstep.svg"
                alt="Actionstep"
              />
            </div>
            <div className="flex flex-1 items-center justify-center rounded-md bg-green-900 px-4 h-[72mm] [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
              <img
                className="h-[6.5mm] w-auto max-w-[70%] object-contain text-white rotate-90"
                src="/logos/xero.svg"
                alt="Xero"
              />
            </div>
            <div className="flex flex-[3] flex-col items-center justify-center gap-3 rounded-md border border-hair bg-green-700-12 px-6 h-[72mm] text-center [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
              <span className="font-mono text-[8pt] uppercase tracking-[0.16em] text-accent">
                + more
              </span>
              <span className="max-w-[52mm] font-display text-[14pt] leading-snug text-heading">
                Unify all of your data in Compass
              </span>
            </div>
          </div>

          <Footer />
        </Page> */}

        {/* ============================================================
            PRICING 
            ============================================================ */}
        {pricingConfig.visible && (
          <Page label="Pricing">
            <div className="eyebrow">Investment</div>
            <h2 className="section">Pricing package</h2>
            <p className="lead">
              Clear pricing with no surprises: one flat fee for the whole
              company.
            </p>
            <div className="divider" />

            <p className="text-xs mb-5">
              Start on a monthly plan for complete flexibility, and then move to
              a 12-month contract when you're ready.
            </p>

            <div className="price-options">
              <div className="price-opt price-opt--light">
                <span className="badge">Flexible</span>
                <div className="price-figure">
                  <span className="amount">${pricingConfig.monthly}</span>
                  <span className="per">/ month</span>
                </div>
                <p className="panel-sub">
                  + BYO AI for chat; 3c/message in our testing.
                </p>
                {/* <p className="panel-sub">
                + est 3-4w for implementation at $185/h.
              </p> */}
              </div>
              <div className="price-opt">
                <span className="badge">12-month contract</span>
                <div className="price-figure">
                  <span className="amount">${pricingConfig.annual}</span>
                  <span className="per">/ month</span>
                </div>
                <p className="panel-sub">
                  + BYO AI for chat; 3c/message in our testing.
                </p>
                {/* <p className="panel-sub">
                + est 3-4w for implementation at $185/h.
              </p> */}
                {/* <p className="panel-sub-small">
                Sign up within your first 3 months and we'll waive 40 hours.
              </p> */}
              </div>
            </div>

            <div className="price-details">
              <h3>What&apos;s included</h3>
              <ul className="included included--light">
                <li>
                  <span className="check">
                    <Icon.Check />
                  </span>
                  Unlimited partners &amp; users with bespoke security controls.
                </li>
                <li>
                  <span className="check">
                    <Icon.Check />
                  </span>
                  Chat &amp; personalised dashboards
                </li>
                <li>
                  <span className="check">
                    <Icon.Check />
                  </span>
                  Ongoing support &amp; updates
                </li>
                <li>
                  <span className="check">
                    <Icon.Check />
                  </span>
                  Hosted in your environment for maximum security
                </li>
              </ul>
            </div>

            <div className="divider" />

            <div className="price-features">
              <div className="feat">
                <span className="feat-icon">
                  <Icon.Shield />
                </span>
                <h3>Support included</h3>
                <p>Ongoing support is in the licence, not billed on top.</p>
              </div>
              <div className="feat">
                <span className="feat-icon">
                  <Icon.Tag />
                </span>
                <h3>Predictable pricing</h3>
                <p>
                  The flat fee is indexed to inflation, so you know the price
                  won't be hiked on you.
                </p>
              </div>
              <div className="feat">
                <span className="feat-icon">
                  <Icon.Trial />
                </span>
                <h3>Try before you commit</h3>
                <p>
                  Start on monthly billing so you can see Compass up close
                  before anything&apos;s locked in.
                </p>
              </div>
            </div>

            <div className="divider" />
            {/* <p className="note">
            Our standard pricing for a firm your size — we&apos;ll shape the final
            package with you to match how you want to roll it out.
          </p> */}
            <p className="note">Prices shown are exclusive of GST.</p>
            <Footer />
          </Page>
        )}

        {/* ============================================================
            THE TEAM 
            ============================================================ */}
        <Page label="Team">
          <div className="eyebrow">Who&apos;s behind it</div>
          <h2 className="section">The team behind Compass</h2>
          <p className="lead">
            A boutique development studio in Hamilton — the people you talk to
            are the people who build it.
          </p>
          <div className="divider" />
          <div className="space-y-6">
            <div className="team flex justify-center space-x-8">
              <div className="member">
                <img
                  className="avatar"
                  src="/team/sam.jpg"
                  alt="Sam Woolerton"
                />
                <h3>Sam Woolerton</h3>
                <p className="role">Founder &amp; Director</p>
              </div>
              <div className="member">
                <img
                  className="avatar"
                  src="/team/cathan.jpg"
                  alt="Cathan Bowler"
                />
                <h3>Cathan Bowler</h3>
                <p className="role">Sales Lead</p>
              </div>
            </div>
            <div className="team flex justify-center space-x-6">
              <div className="member">
                <img
                  className="avatar"
                  src="/team/jesse.jpg"
                  alt="Jesse O'Connor"
                />
                <h3>Jesse O&apos;Connor</h3>
                <p className="role">Full-Stack Developer</p>
              </div>
              <div className="member">
                <img
                  className="avatar"
                  src="/team/ethan.jpg"
                  alt="Ethan MacLeod"
                />
                <h3>Ethan MacLeod</h3>
                <p className="role">Full-Stack Developer</p>
              </div>
              <div className="member">
                <img
                  className="avatar"
                  src="/team/isaiah.jpg"
                  alt="Isaiah Foulidis"
                />
                <h3>Isaiah Foulidis</h3>
                <p className="role">Data Pipeline Specialist</p>
              </div>
            </div>
          </div>
          <div className="divider" />
          <div className="two-col">
            <div className="card">
              <h3>Only A players</h3>
              <p>
                We’ve shipped projects like yours many times over, and we don’t
                have juniors learning on your dime.
              </p>
            </div>
            <div className="card">
              <h3>Clear scope, no surprises</h3>
              <p>
                Exactly what we&apos;ll build and what it costs is agreed up
                front, before a single line of code is written.
              </p>
            </div>
            <div className="card">
              <h3>A track record you can check</h3>
              <p>
                150+ projects delivered since 2022 — and we&apos;ll happily
                connect you with our satisfied clients.
              </p>
            </div>
            <div className="card">
              <h3>Right down the road</h3>
              <p>
                Hamilton-based, same team end to end, references you can call.
              </p>
            </div>
          </div>
          <p className="note mt-8">
            Meet the team at{' '}
            <a className="link" href="https://usebearing.com/about-us">
              usebearing.com/about-us
            </a>
            .
          </p>
          <Footer />
        </Page>

        {/* ============================================================
            INTEGRATIONS & AUTOMATION 
            ============================================================ */}
        <Page label="Automation">
          <div className="eyebrow">Your data hub</div>
          <h2 className="section">More than dashboards</h2>
          <p className="lead">
            The same query engine that answers your questions can move your data
            for you. Compass connects your tools so data flows where it needs
            to, without the manual overhead.
          </p>
          <div className="divider" />
          <ul className="detail-rows">
            <li>
              <span className="detail-icon">
                <Icon.Sync />
              </span>
              <div>
                <h3>Stop entering the same data twice</h3>
                <p>
                  We sync data between your systems so the team stops
                  copy-pasting by hand.
                </p>
              </div>
            </li>
            <li>
              <span className="detail-icon">
                <Icon.Report />
              </span>
              <div>
                <h3>Reports that write themselves</h3>
                <p>
                  Auto-generate the documents you build by hand today. Your team
                  are in the loop to provide value-add commentary, not just to
                  pull data together.
                </p>
              </div>
            </li>
            <li>
              <span className="detail-icon">
                <Icon.Inbox />
              </span>
              <div>
                <h3>Dashboards delivered to your inbox</h3>
                <p>
                  For Outlook power users, schedule a Compass dashboard to come
                  to your inbox on your terms.
                </p>
              </div>
            </li>
            {clientPortalsConfig.visible && (
              <li>
                <span className="detail-icon">
                  <Icon.Shield />
                </span>
                <div>
                  <h3>Secure {clientPortalsConfig.label} portals</h3>
                  <p>
                    Raise the bar for {clientPortalsConfig.label} interactions
                    by giving your key
                    {clientPortalsConfig.label}s more insights into their data.
                    Strict security controls so they only see information that
                    you allow them to.
                  </p>
                </div>
              </li>
            )}
            <li>
              <span className="detail-icon">
                <Icon.Source />
              </span>
              <div>
                <h3>One source of truth</h3>
                <p>
                  We define the logic once, and then dashboards, reports and
                  automations stay in sync as your business evolves.
                </p>
              </div>
            </li>
          </ul>
          <Footer />
        </Page>

        {/* ============================================================
            CTA  — closing, full-bleed green to bookend cover
            ============================================================ */}
        <Page>
          <div className="cta">
            <div className="mark">COMPASS BY BEARING</div>
            <div className="center">
              <div className="eyebrow">What happens next</div>
              <h1>Seeing it beats reading about it.</h1>
              <ol className="next-steps">
                <li>
                  <span className="step-n">1</span>
                  <div>
                    <h3>Book a demo on your data</h3>
                    <p>
                      We&apos;ll take a data extract and show you live how
                      Compass understands your data.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="step-n">2</span>
                  <div>
                    <h3>Run a trial</h3>
                    <p>
                      Put Compass through its paces, so you can see how it would
                      fit into your workflows before signing.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            <p className="closer">
              {/* Say the word and we&apos;ll get a time in the diary this week. */}
            </p>
          </div>
        </Page>
      </Pages>
    </>
  )
}
