// ─────────────────────────────────────────────────────────────────────────────
//  TagInput
//
//  Chip-style tag input. Pills inline with the text input; suggestions render
//  below as tappable chips. Keydown-driven:
//    • Enter / comma / space → add current text as a tag
//    • Backspace on empty input → remove the last tag
//
//  Owns its own input text state — parent only manages the tags array.
//
//  Styling lives in _form-patterns.scss (.form__tag-input, .form__tag-pill,
//  .form__tag-suggestions, .form__tag-suggestion).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Tag from '@/components/ui/Tag'

export default function TagInput({
  tags = [],
  onAdd,
  onRemove,
  suggestions = [],
  placeholder = '',
}) {
  const [text, setText] = useState('')

  const commit = (raw) => {
    const tag = raw.trim()
    if (!tag) return
    if (tags.includes(tag)) return
    onAdd(tag)
    setText('')
  }

  // Comma or trailing space ends the tag — feels natural when typing fast.
  const handleChange = (e) => {
    const val = e.target.value
    if (val.endsWith(',') || val.endsWith(' ')) {
      commit(val.slice(0, -1))
    } else {
      setText(val)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(text)
    }
    if (e.key === 'Backspace' && !text && tags.length > 0) {
      onRemove(tags[tags.length - 1])
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !tags.includes(s) &&
      (!text || s.toLowerCase().includes(text.toLowerCase()))
  )

  return (
    <>
      <div className="form__tag-input">
        {tags.map((tag) => (
          <span key={tag} className="form__tag-pill">
            <Tag label={tag} />
            <button
              type="button"
              className="form__tag-remove"
              onClick={() => onRemove(tag)}
              aria-label="إزالة"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="form__tag-text"
          type="text"
          placeholder={tags.length === 0 ? placeholder : ''}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>

      {filteredSuggestions.length > 0 && (
        <div className="form__tag-suggestions">
          {filteredSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              className="form__tag-suggestion"
              onClick={() => commit(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </>
  )
}