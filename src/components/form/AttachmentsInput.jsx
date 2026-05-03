// ─────────────────────────────────────────────────────────────────────────────
//  AttachmentsInput
//
//  Drop-zone-style file picker. Click to browse or drag-and-drop, with a list
//  of selected files below. Size validation handled internally — files over
//  `maxSizeMB` trigger an alert and are not added.
//
//  Parent owns the files array; component is otherwise self-contained.
//
//  Styling lives in _form-patterns.scss (.form__dropzone, .form__file-list,
//  .form__file-item, .form__file-info, etc.).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react'
import { S } from '@/lib/strings'

const DEFAULT_ACCEPT = 'application/pdf,image/png,image/jpeg'
const DEFAULT_MAX_MB = 10

export default function AttachmentsInput({
  files = [],
  onAdd,
  onRemove,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = DEFAULT_MAX_MB,
  hint,
}) {
  const inputRef = useRef(null)

  const handleFiles = (incoming) => {
    Array.from(incoming).forEach((file) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(
          S.attachSizeError
            .replace('{name}', file.name)
            .replace('{max}', maxSizeMB)
        )
        return
      }
      onAdd(file)
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <>
      {hint && <p className="form__section-hint">{hint}</p>}

      <div
        className="form__dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--text-muted, currentColor)' }}
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="form__dropzone-text">{S.attachDropzone}</p>
        <p className="form__dropzone-hint">
          {S.attachFormats.replace('{max}', maxSizeMB)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="form__file-list">
          {files.map((file, i) => (
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
                type="button"
                className="form__file-remove"
                onClick={() => onRemove(i)}
                aria-label="إزالة"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}