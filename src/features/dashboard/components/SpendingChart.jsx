// features/dashboard/components/SpendingChart.jsx
import './SpendingChart.scss'
import { S, formatCurrency } from '../../../lib/strings'

// Pure CSS bar chart — no charting library needed for this simple case.
// Bars are horizontal, RTL-aware, scaled relative to max department spend.

export function SpendingChart({ deptSpending }) {
  if (!deptSpending || deptSpending.length === 0) {
    return (
      <div className="spending-chart spending-chart--empty">
        <p className="spending-chart__empty-text">{S.noSpendingData}</p>
      </div>
    )
  }

  const maxTotal = Math.max(...deptSpending.map(d => d.total))

  return (
    <div className="spending-chart">
      <h2 className="spending-chart__title">{S.spendingByDept}</h2>
      <div className="spending-chart__bars">
        {deptSpending.map(({ department, total }) => {
          const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0
          return (
            <div key={department} className="spending-chart__row">
              <span className="spending-chart__dept">{department}</span>
              <div className="spending-chart__bar-track">
                <div
                  className="spending-chart__bar-fill"
                  style={{ width: `${pct}%` }}
                  aria-valuenow={total}
                  aria-valuemax={maxTotal}
                  role="progressbar"
                />
              </div>
              <span className="spending-chart__amount">
                {formatCurrency(total)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}