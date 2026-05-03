import AttachmentsInput from '@/components/form/AttachmentsInput'
import { S } from '@/lib/strings'

const MAX_MB = 10

export default function Step3Attachments({ wizard }) {
  const { form, addAttachment, removeAttachment } = wizard

  return (
    <div className="form">
      <AttachmentsInput
        files={form.attachments}
        onAdd={addAttachment}
        onRemove={removeAttachment}
        maxSizeMB={MAX_MB}
        hint={S.attachHint.replace('{max}', MAX_MB)}
      />
    </div>
  )
}