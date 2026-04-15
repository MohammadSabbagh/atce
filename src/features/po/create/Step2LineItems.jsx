import { formatCurrency } from '@/lib/utils'
import { S } from '@/lib/strings'
import '@/styles/form.scss'

export default function Step2LineItems({ wizard }) {
  const { form, addLineItem, updateLineItem, removeLineItem, lineTotal, departments } = wizard

  return (
    <div className="form">
      <div className="form__line-items">
        {form.line_items.map((item, index) => (
          <div key={item.id} className="form__line-item">

            <div className="form__line-item-header">
              <span className="form__line-item-num">{index + 1}</span>
              {form.line_items.length > 1 && (
                <button
                  className="form__line-item-remove"
                  onClick={() => removeLineItem(item.id)}
                  title={S.cancel_action}
                >
                  ×
                </button>
              )}
            </div>

            <div className="form__line-item-fields">
              {/* Description */}
              <input
                className="form__input"
                type="text"
                placeholder={S.itemPlaceholder}
                value={item.description}
                onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
              />

              {/* Department */}
              <select
                className="form__input form__input--select"
                value={item.department}
                onChange={(e) => updateLineItem(item.id, 'department', e.target.value)}
              >
                <option value="">{S.selectDepartment ?? 'اختر القسم'}</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Quantity + Unit Price on same row */}
              <div className="form__line-item-price-row">
                <div className="form__line-item-qty-field">
                  <label className="form__inline-label">{S.quantity ?? 'الكمية'}</label>
                  <input
                    className="form__input form__input--qty mono"
                    type="number"
                    min="0.001"
                    step="1"
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                  />
                </div>

                <span className="form__line-item-times">×</span>

                <div className="form__line-item-price-field">
                  <label className="form__inline-label">{S.unitPrice ?? 'سعر الوحدة'}</label>
                  <div className="form__price-wrap">
                    <span className="form__currency-prefix">$</span>
                    <input
                      className="form__input form__input--price mono"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(item.id, 'unit_price', e.target.value)}
                    />
                  </div>
                </div>

                {/* Line total — read only, updates live */}
                <span className="form__line-item-subtotal mono">
                  {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>

      <button className="form__add-item" onClick={addLineItem}>
        {S.addItem}
      </button>

      <div className="form__total">
        <span className="form__total-label">{S.total}</span>
        <span className="form__total-value mono">{formatCurrency(lineTotal)}</span>
      </div>
    </div>
  )
}