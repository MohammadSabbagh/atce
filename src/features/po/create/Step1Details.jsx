import * as RadioGroup from '@radix-ui/react-radio-group'
import TagInput from '@/components/form/TagInput'
import ProviderPicker from '@/components/form/ProviderPicker'
import { S } from '@/lib/strings'

// Tag values stay in English/Arabic data form — they are stored in the DB.
// Translating them would break existing tag filtering.
const SUGGESTED_TAGS = ['مستعجل', 'فوري', 'فواتير']

export default function Step1Details({ wizard }) {
  const { form, setField, addTag, removeTag } = wizard

  return (
    <div className="form">
      <div className="field">
        <label className="field__label">
          {S.poTitle} <span className="field__required">{S.required}</span>
        </label>
        <input
          className="input"
          type="text"
          placeholder={S.poTitlePlaceholder}
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field__label">{S.poDescription}</label>
        <textarea
          className="textarea"
          placeholder={S.poDescPlaceholder}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={3}
        />
      </div>

      {/* ── Currency ── */}
      <div className="field">
        <label className="field__label">{S.poCurrency}</label>
        <RadioGroup.Root
          className="currency-radio"
          value={form.currency}
          onValueChange={(val) => setField('currency', val)}
          dir="rtl"
        >
          <RadioGroup.Item value="SYP" className="currency-radio__item">
            <RadioGroup.Indicator className="currency-radio__indicator" />
            <div className="currency-radio__content">
              <span className="currency-radio__symbol">ل.س</span>
              <span className="currency-radio__label">{S.currencyLS}</span>
            </div>
          </RadioGroup.Item>

          <RadioGroup.Item value="USD" className="currency-radio__item">
            <RadioGroup.Indicator className="currency-radio__indicator" />
            <div className="currency-radio__content">
              <span className="currency-radio__symbol">$</span>
              <span className="currency-radio__label">{S.currencyUSD}</span>
            </div>
          </RadioGroup.Item>
        </RadioGroup.Root>
      </div>

      {/* ── Tags ── */}
      <div className="field">
        <label className="field__label">{S.poTags}</label>
        <TagInput
          tags={form.tags}
          onAdd={addTag}
          onRemove={removeTag}
          suggestions={SUGGESTED_TAGS}
          placeholder={S.poTagsPlaceholder}
        />
      </div>

      {/* ── Provider (optional) ── */}
      <div className="field">
        <label className="field__label">{S.providerLabel}</label>
        <ProviderPicker
          value={form.provider_id}
          onChange={(id) => setField('provider_id', id)}
        />
      </div>

      {/* ── CEO toggle ── */}
      <div className="form__toggle-row">
        <div className="form__toggle-label">
          <span className="form__toggle-label-text">{S.requiresCeo}</span>
          <span className="form__toggle-label-hint">{S.requiresCeoHint}</span>
        </div>
        <button
          type="button"
          className="toggle"
          data-state={form.requires_ceo ? 'on' : 'off'}
          onClick={() => setField('requires_ceo', !form.requires_ceo)}
          aria-pressed={form.requires_ceo}
        >
          <span className="toggle__knob" />
        </button>
      </div>
    </div>
  )
}