import { format } from 'date-fns'

export const client = 'Tompkins Wake'

// Default to the current date to save time; can always hard-code it per client where required.
const effectiveDate = format(new Date(), 'do MMMM yyyy')

const parties = [
  {
    role: 'Provider',
    name: 'Bearing Holdings Limited',
    term: 'Bearing',
    address: ['45 Brookview Court', 'Queenwood', 'Hamilton 3210'],
  },
  {
    role: 'Client',
    name: client,
    term: 'Client',
    address: ['Westpac House, Level 8', '430 Victoria Street', 'Hamilton 3204'],
  },
]

const signatories = [
  {
    party: 'Bearing Holdings Limited',
    name: 'Sam Woolerton',
    role: 'Director',
  },
  {
    party: client,
    name: 'Maree Hadden',
    role: 'Chief Operating Officer',
  },
]

export default function Contract() {
  return (
    <>
      <h1>Compass — Software License Agreement</h1>

      <p>
        <strong>Effective date:</strong> {effectiveDate}
      </p>

      <div className="parties">
        {parties.map(({ role, name, term, address }) => (
          <section className="party" key={role}>
            <div className="party-role">{role}</div>
            <div className="party-name">
              {name} <span className="party-term">(“{term}”)</span>
            </div>
            <div className="party-address">
              {address.map(line => (
                <span key={line}>{line}</span>
              ))}
            </div>
          </section>
        ))}
      </div>

      <h2>Licence</h2>

      <p>
        Bearing grants the Client a{' '}
        <strong>non-exclusive, non-transferable licence to use Compass</strong>{' '}
        for the Client’s internal business purposes for the duration of this
        agreement, while the Client’s subscription remains current and paid.
      </p>

      <p>
        The licence is limited to the Client and its authorised users. The
        Client must not resell, sublicense, or provide Compass to third parties.
      </p>

      <h2>Term</h2>

      <p>
        The agreement runs for an initial <strong>12-month term</strong> from
        the Effective Date.
      </p>

      <p>
        At the completion of the initial term, the Client may opt to move to a
        monthly subscription (rate to be discussed at that time), or renew for a
        further 12-month term if they wish.
      </p>

      <h2>Fees &amp; Payment</h2>

      <p>
        The subscription fee is: <strong>NZ $2,000 +GST per month</strong>.
      </p>

      <p>
        Invoices are payable by the <strong>20th of the month following</strong>
        .
      </p>

      <p>
        The Client is responsible for maintaining and paying for its own{' '}
        <strong>
          AI subscription required to use Compass’s chat functionality
        </strong>
        . The AI subscription is separate from the Compass subscription fee and
        is not included in the above pricing.
      </p>
      <p>
        The AI subscription provided must have API access, rather than being
        tied to only one user.
      </p>
      <p>
        Any AI model available via API is valid, and on request the Bearing team
        will update Compass to support the requested API model within a
        reasonable timeframe.
      </p>

      <h2>Access &amp; Support</h2>

      <p>
        Bearing will provide the Client with access to Compass during the term
        and will maintain the software in a commercially reasonable manner.
      </p>

      <p>
        The Client is responsible for its own internet access, devices, user
        accounts and AI subscription.
      </p>

      <h2>Ownership</h2>

      <p>
        Compass, including its software, underlying technology, design and
        intellectual property, remains the property of Bearing.
      </p>

      <p>
        The Client receives a right to use Compass under this agreement but does
        not acquire ownership of Compass or its underlying intellectual
        property.
      </p>

      <h2>Ending the Agreement</h2>

      <p>
        Either party may end this agreement if the other party materially
        breaches the agreement and does not remedy the breach within a
        reasonable period after being notified.
      </p>

      <p>
        At the end of the agreement, the Client’s right to use Compass ends and
        access will be removed.
      </p>

      <h2>Agreement</h2>

      <p>
        By signing below, both parties agree to the terms of this agreement.
      </p>

      <div className="signatures">
        {signatories.map(({ party, name, role }) => (
          <section className="signatory" key={party}>
            <div className="font-semibold text-xs mb-3">{party}</div>

            <p className="signatory-signer">
              {name}
              <span className="signatory-role">{role}</span>
            </p>

            <div className="sig-line">Signature</div>
            <div className="sig-line is-date">Date</div>
          </section>
        ))}
      </div>
    </>
  )
}
