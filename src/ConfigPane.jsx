// Screen-only editor for the parts of the proposal that change per client.
// .no-print keeps it out of the PDF.
export default function ConfigPane({
  clientName,
  onClientNameChange,
  sampleQuestions,
  onSampleQuestionChange,
}) {
  return (
    <aside className="config-pane no-print">
      <h2>Customise</h2>

      <label className="field">
        <span>Client name</span>
        <input
          type="text"
          value={clientName}
          onChange={e => onClientNameChange(e.target.value)}
        />
      </label>

      <label className="field">
        <span>Sample question 1</span>
        <input
          type="text"
          value={sampleQuestions[0]}
          onChange={e => onSampleQuestionChange(0, e.target.value)}
        />
      </label>

      <label className="field">
        <span>Sample question 2</span>
        <input
          type="text"
          value={sampleQuestions[1]}
          onChange={e => onSampleQuestionChange(1, e.target.value)}
        />
      </label>
    </aside>
  )
}
