import { useEffect, useState } from 'react'

import '../docs/docs.css'
import './contracts.css'

function exportPdf() {
  window.print()
}

export default function ContractPage({ client, children }) {
  const [guide, setGuide] = useState(false)
  const title = `Compass License - ${client}`
  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <>
      <div className="toolbar no-print">
        <button onClick={() => setGuide(g => !g)}>
          {guide ? 'Hide guide' : 'Show guide'}
        </button>
        <button onClick={exportPdf}>Export to PDF</button>
      </div>

      <div className="doc-page">
        <table className="doc-sheet">
          <thead>
            <tr>
              <td>
                <div className="doc-running">
                  <span className="wordmark">Bearing</span>
                  <span className="kicker">Contract</span>
                </div>
              </td>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td>
                <div className="doc-footer">
                  <span>Bearing · usebearing.com</span>
                  <span>{title}</span>
                </div>
              </td>
            </tr>
          </tfoot>
          <tbody>
            <tr>
              <td>
                <article
                  className={`doc-body is-contract${guide ? ' show-guide' : ''}`}
                >
                  {children}
                </article>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
