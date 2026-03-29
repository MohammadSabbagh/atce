import { formatCurrency } from '@/lib/utils'
import '@/styles/form.scss'

export default function Step2LineItems({ wizard }) {
  const { form, addLineItem, updateLineItem, removeLineItem, lineTotal } = wizard

  return (
    <div className="form">
      <div className="form__line-items">
        {form.line_items.map((item, index) => (
          <div key={item.id} className="form__line-item">
            <div className="form__line-item-num">{index + 1}</div>
            <div className="form__line-item-fields">
              <input
                className="form__input"
                type="text"
                placeholder="Item description"
                value={item.description}
                onChange={(e) =>
                  updateLineItem(item.id, 'description', e.target.value)
                }
              />
              <div className="form__line-item-price-row">
                <span className="form__currency-prefix">$</span>
                <input
                  className="form__input form__input--price mono"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={item.price}
                  onChange={(e) =>
                    updateLineItem(item.id, 'price', e.target.value)
                  }
                />
              </div>
            </div>
            {form.line_items.length > 1 && (
              <button
                className="form__line-item-remove"
                onClick={() => removeLineItem(item.id)}
                title="Remove item"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button className="form__add-item" onClick={addLineItem}>
        + Add Line Item
      </button>

      <div className="form__total">
        <span className="form__total-label">Total</span>
        <span className="form__total-value mono">{formatCurrency(lineTotal)}</span>
      </div>
    </div>
  )
}