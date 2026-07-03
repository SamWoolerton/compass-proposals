import Page from "./Page.jsx";
import "./paged.css";

// The Export button. Native browser print → "Save as PDF" as the destination.
// Because @page margin is 0 and each .page is exactly A4, the PDF is 1:1.
function exportPdf() {
  window.print();
}

// Placeholder for a screenshot/image that content will drop in later.
function Shot({ label = "Screenshot", tall = false }) {
  return (
    <div className={`shot${tall ? " tall" : ""}`}>
      <span>{label}</span>
    </div>
  );
}

const TOTAL = 6;

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
          Kept from the existing scaffold — Compass + "Chat with your
          data", TW logo prominent, white on Bearing green.
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
              Chat with your data. One place to ask questions of everything the
              firm knows — no reports to request, no waiting on IT.
            </p>
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
        <div className="eyebrow">01 — The headline benefit</div>
        <h2 className="section">Chat with your data</h2>
        <p className="lead">
          [Lead paragraph — the one-line pitch for conversational access to the
          firm&apos;s data. Ask a question in plain English, get an answer
          grounded in your own systems.]
        </p>
        <div className="divider" />
        <div className="split">
          <ul className="benefits">
            <li>
              <h3>[Benefit one]</h3>
              <p>[Short supporting sentence.]</p>
            </li>
            <li>
              <h3>[Benefit two]</h3>
              <p>[Short supporting sentence.]</p>
            </li>
            <li>
              <h3>[Benefit three]</h3>
              <p>[Short supporting sentence.]</p>
            </li>
            <li>
              <h3>[Benefit four]</h3>
              <p>[Short supporting sentence.]</p>
            </li>
          </ul>
          <Shot label="Chat screenshot" tall />
        </div>
        <div className="footer">
          <span>Bearing</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>

      {/* ============================================================
          PAGE 3 · DASHBOARDS  (general)
          Curate your own dashboard, no IT required
          ============================================================ */}
      <Page n={3} total={TOTAL} label="Dashboards">
        <div className="eyebrow">02 — For the questions you ask often</div>
        <h2 className="section">Curate your own dashboard</h2>
        <p className="lead">
          [Lead paragraph — pin the questions you ask regularly into a dashboard
          you build yourself. No IT tickets, no analyst in the loop.]
        </p>
        <div className="divider" />
        <div className="split">
          <ul className="benefits">
            <li>
              <h3>No IT required</h3>
              <p>[Build and change it yourself, in minutes.]</p>
            </li>
            <li>
              <h3>[Benefit two]</h3>
              <p>[Short supporting sentence.]</p>
            </li>
            <li>
              <h3>[Benefit three]</h3>
              <p>[Short supporting sentence.]</p>
            </li>
          </ul>
          <Shot label="Dashboard screenshot" tall />
        </div>
        <div className="footer">
          <span>Bearing</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>

      {/* ============================================================
          PAGE 4 · OPERATIONS  (TW-focused)
          Implementation, Resolution8, ongoing support, their software
          ============================================================ */}
      <Page n={4} total={TOTAL} label="Operations">
        <div className="eyebrow">03 — What&apos;s involved</div>
        <h2 className="section">Operations</h2>
        <p className="lead">
          [Lead — who takes point on implementation and how much work it is for
          your team. Short answer: not much.]
        </p>
        <div className="divider" />

        <div className="two-col">
          <div className="card">
            <h3>Built with Resolution8</h3>
            <p>
              [Bearing works with Resolution8 to …] Compass sits on top of your
              existing data and draws on the data-modelling work Resolution8 have
              already done — so this isn&apos;t a full new engagement, it builds
              on what&apos;s in place.
            </p>
          </div>
          <div className="card">
            <h3>Ongoing support included</h3>
            <p>
              Ongoing support is included in the licensing fee — [expand on what
              that covers].
            </p>
          </div>
        </div>

        <div className="divider" />
        <h3 className="minihead">Connected to the software you already use</h3>
        <p className="note">
          Both are already in your database — Actionstep for matters, Xero for
          financials.
        </p>
        <div className="logo-row">
          <div className="logo-slot">Actionstep</div>
          <div className="logo-slot">Xero</div>
          <div className="logo-slot more">+ more</div>
        </div>

        <div className="footer">
          <span>Bearing</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>

      {/* ============================================================
          PAGE 5 · THE TEAM  (general)
          Pull from the Bearing website; link out for detail
          ============================================================ */}
      <Page n={5} total={TOTAL} label="Team">
        <div className="eyebrow">04 — Who&apos;s behind it</div>
        <h2 className="section">The team behind Compass</h2>
        <p className="lead">
          [Lead paragraph — pulled from usebearing.com. Who Bearing is and why
          the firm is in safe hands.]
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
        <p className="note">
          More about the team at{" "}
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
          PAGE 6 · INTEGRATIONS  (general / TW — TBD)
          A platform for data-driven integrations & automation
          ============================================================ */}
      <Page n={6} total={TOTAL} label="Integrations">
        <div className="eyebrow">05 — Beyond answering questions</div>
        <h2 className="section">A platform for integrations</h2>
        <p className="lead">
          [Lead — Compass is also a platform for data-driven integrations that
          save the team time: process automation, syncing between systems, and
          more.]
        </p>
        <div className="divider" />
        <div className="two-col">
          <div className="card">
            <h3>[Automation example]</h3>
            <p>[Short supporting sentence.]</p>
          </div>
          <div className="card">
            <h3>[Automation example]</h3>
            <p>[Short supporting sentence.]</p>
          </div>
          <div className="card">
            <h3>[Automation example]</h3>
            <p>[Short supporting sentence.]</p>
          </div>
          <div className="card">
            <h3>[Automation example]</h3>
            <p>[Short supporting sentence.]</p>
          </div>
        </div>
        <div className="footer">
          <span>Bearing · usebearing.com</span>
          <span>Proposal · Compass</span>
        </div>
      </Page>
    </>
  );
}
