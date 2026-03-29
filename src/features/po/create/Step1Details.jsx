import { useState } from 'react'
import { DEPARTMENTS } from '@/lib/constants'
import Tag from '@/components/ui/Tag'
import '@/styles/form.scss'

const SUGGESTED_TAGS = [
  'urgent', 'monthly', 'quarterly', 'annual',
  'Q1', 'Q2', 'Q3', 'Q4',
  'recurring', 'one-time', 'capex', 'opex',
]

export default function Step1Details({ wizard }) {
  const { form, setField, addTag, removeTag } = wizard
  const [tagInput, setTagInput] = useState('')

  const handleTagInput = (e) => {
    const val = e.target.value
    if (val.endsWith(',') || val.endsWith(' ')) {
      addTag(val.slice(0, -1))
      setTagInput('')
    } else {
      setTagInput(val)
    }
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    }
    if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1])
    }
  }

  const suggestions = SUGGESTED_TAGS.filter(
    (t) => !form.tags.includes(t) &&
      (!tagInput || t.toLowerCase().includes(tagInput.toLowerCase()))
  )

  return (
    <div className="form">
      <div className="form__field">
        <label className="form__label">Title <span className="form__required">*</span></label>
        <input
          className="form__input"
          type="text"
          placeholder="e.g. Office Supplies Q1"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />
      </div>

      <div className="form__field">
        <label className="form__label">Description</label>
        <textarea
          className="form__input form__input--textarea"
          placeholder="Optional details about this purchase order"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className="form__row">
        <div className="form__field">
          <label className="form__label">Date <span className="form__required">*</span></label>
          <input
            className="form__input"
            type="date"
            value={form.date}
            onChange={(e) => setField('date', e.target.value)}
          />
        </div>

        <div className="form__field">
          <label className="form__label">Department <span className="form__required">*</span></label>
          <select
            className="form__input form__input--select"
            value={form.department}
            onChange={(e) => setField('department', e.target.value)}
          >
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form__field">
        <label className="form__label">Tags</label>
        <div className="form__tag-input">
          {form.tags.map((tag) => (
            <span key={tag} className="form__tag-pill">
              <Tag label={tag} />
              <button
                className="form__tag-remove"
                onClick={() => removeTag(tag)}
              >×</button>
            </span>
          ))}
          <input
            className="form__tag-text"
            type="text"
            placeholder={form.tags.length === 0 ? 'Add tags...' : ''}
            value={tagInput}
            onChange={handleTagInput}
            onKeyDown={handleTagKeyDown}
          />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="form__tag-suggestions">
            {suggestions.slice(0, 8).map((s) => (
              <button
                key={s}
                className="form__tag-suggestion"
                onClick={() => addTag(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form__field">
        <label className="form__toggle">
          <input
            type="checkbox"
            checked={form.requires_ceo}
            onChange={(e) => setField('requires_ceo', e.target.checked)}
          />
          <div className="form__toggle-track">
            <div className="form__toggle-thumb" />
          </div>
          <div className="form__toggle-label">
            <span>Requires CEO Approval</span>
            <span className="form__toggle-hint">
              Routes this PO to the CEO approval queue
            </span>
          </div>
        </label>
      </div>
    </div>
  )
}