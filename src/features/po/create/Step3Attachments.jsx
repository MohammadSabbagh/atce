import { useRef } from 'react'
import { S } from '@/lib/strings'
import '@/styles/form.scss'

const ACCEPTED = 'application/pdf,image/png,image/jpeg'
const MAX_MB = 10

export default function Step3Attachments({ wizard }) {
  const { form, addAttachment, removeAttachment } = wizard
  const inputRef = useRef(null)

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      if (file.size > MAX_MB * 1024 * 1024) {
        alert(S.attachSizeError.replace('{name}', file.name).replace('{max}', MAX_MB))
        return
      }
      addAttachment(file)
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="form">
      <p className="form__section-hint">
        {S.attachHint.replace('{max}', MAX_MB)}
      </p>

      {/* Drop zone */}
      <div
        className="form__dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--text-muted)' }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="form__dropzone-text">
          {S.attachDropzone}
        </p>
        <p className="form__dropzone-hint">
          {S.attachFormats.replace('{max}', MAX_MB)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {form.attachments.length > 0 && (
        <div className="form__file-list">
          {form.attachments.map((file, i) => (
            <div key={i} className="form__file-item">
              <div className="form__file-info">
                <span className="form__file-icon">
                  {file.type === 'application/pdf' ? '📄' : '🖼️'}
                </span>
                <div>
                  <p className="form__file-name">{file.name}</p>
                  <p className="form__file-size">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <button
                className="form__file-remove"
                onClick={() => removeAttachment(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}