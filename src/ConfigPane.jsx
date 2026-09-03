import { useState } from 'react'
import { Switch } from '@/components/ui/switch'

// Screen-only editor for the parts of the proposal that change per client.
// .no-print keeps it out of the PDF.
export default function ConfigPane({
  clientName,
  onClientNameChange,
  sampleQuestions,
  onSampleQuestionChange,
  clientLogoHeight,
  onClientLogoHeightChange,
  clientLogoName,
  onClientLogoFile,
  onClientLogoReset,
  chatFirst,
  onChatFirstChange,
}) {
  const [dragging, setDragging] = useState(false)

  const takeFile = file => {
    if (file && file.type.startsWith('image/')) onClientLogoFile(file)
  }

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

      <div className="field">
        <span>Client logo</span>
        <label
          className={`dropzone${dragging ? ' dragging' : ''}`}
          onDragOver={e => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setDragging(false)
            takeFile(e.dataTransfer.files[0])
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={e => takeFile(e.target.files[0])}
          />
          <span>{clientLogoName ?? 'Drop a logo here, or click to pick'}</span>
        </label>
        {clientLogoName && (
          <button type="button" className="reset" onClick={onClientLogoReset}>
            Clear
          </button>
        )}
      </div>

      <label className="field">
        <span>Client logo height: {clientLogoHeight}mm</span>
        <input
          type="range"
          min="4"
          max="11"
          step="0.1"
          value={clientLogoHeight}
          onChange={e => onClientLogoHeightChange(Number(e.target.value))}
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

      <div className="field field--row">
        <label htmlFor="chat-first">Chat page first</label>
        <Switch
          id="chat-first"
          checked={chatFirst}
          onCheckedChange={onChatFirstChange}
        />
      </div>
    </aside>
  )
}
