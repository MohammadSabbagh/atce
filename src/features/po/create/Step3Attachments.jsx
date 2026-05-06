import AttachmentsInput from '@/components/form/AttachmentsInput'
import { S } from '@/lib/strings'

const MAX_MB = 10

const fmtFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileIcon = (type) => {
  if (type === 'application/pdf') return '📄'
  if (type?.startsWith('image/')) return '🖼️'
  return '📎'
}

export default function Step3Attachments({ wizard }) {
  const {
    form,
    addAttachment,
    removeAttachment,
    existingAttachments,
    markExistingForDeletion,
    isEditMode,
  } = wizard

  return (
    <div className="form">

      {isEditMode && existingAttachments?.length > 0 && (
        <div className="form__existing-attachments">
          <p className="form__section-label">
            {S.attachExisting ?? 'المرفقات الحالية'}
          </p>
          <div className="form__file-list">
            {existingAttachments.map((att) => (
              <div key={att.id} className="form__file-item">
                <div className="form__file-info">
                  <span className="form__file-icon">{fileIcon(att.file_type)}</span>
                  <div>
                    <p className="form__file-name">{att.file_name}</p>
                    <p className="form__file-size">{fmtFileSize(att.file_size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="form__file-remove"
                  onClick={() => markExistingForDeletion(att)}
                  aria-label="إزالة"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AttachmentsInput
        files={form.attachments}
        onAdd={addAttachment}
        onRemove={removeAttachment}
        maxSizeMB={MAX_MB}
        hint={
          isEditMode
            ? `إضافة مرفقات جديدة (PDF أو صورة، حد أقصى ${MAX_MB} ميغابايت)`
            : S.attachHint.replace('{max}', MAX_MB)
        }
      />

    </div>
  )
}