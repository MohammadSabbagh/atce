import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { S } from '@/lib/strings'
import StatusBadge from '@/components/ui/StatusBadge'
import Tag from '@/components/ui/Tag'
import '@/styles/form.scss'

export default function Step4Review({ wizard }) {
  const { form, lineTotal } = wizard
  const { profile } = useAuth()

  return (
    <div className="form form--review">
      <div className="review__section">
        <h3 className="review__section-title">{S.reviewDetails}</h3>
        <div className="review__grid">
          <div className="review__row">
            <span className="review__label">{S.reviewTitle}</span>
            <span className="review__value">{form.title}</span>
          </div>
          {form.description && (
            <div className="review__row">
              <span className="review__label">{S.reviewDescription}</span>
              <span className="review__value">{form.description}</span>
            </div>
          )}
          <div className="review__row">
            <span className="review__label">{S.reviewDate}</span>
            <span className="review__value">{formatDate(form.date)}</span>
          </div>
          <div className="review__row">
            <span className="review__label">{S.reviewDepartment}</span>
            <span className="review__value">{form.department}</span>
          </div>
          <div className="review__row">
            <span className="review__label">{S.reviewSubmittedBy}</span>
            <span className="review__value">{profile.full_name}</span>
          </div>
          <div className="review__row">
            <span className="review__label">{S.reviewStatus}</span>
            <StatusBadge status="pending" />
          </div>
          {form.requires_ceo && (
            <div className="review__row">
              <span className="review__label">{S.reviewCeoApproval}</span>
              <span className="review__value review__value--flag">{S.reviewCeoRequired}</span>
            </div>
          )}
        </div>
      </div>

      {form.tags.length > 0 && (
        <div className="review__section">
          <h3 className="review__section-title">{S.reviewTags}</h3>
          <div className="review__tags">
            {form.tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        </div>
      )}

      <div className="review__section">
        <h3 className="review__section-title">{S.reviewLineItems}</h3>
        <div className="review__items">
          {form.line_items.map((item, i) => (
            <div key={item.id} className="review__item">
              <span className="review__item-desc">
                <span className="review__item-num">{i + 1}.</span>
                {item.description}
              </span>
              <span className="review__item-price mono">
                {formatCurrency(parseFloat(item.price) || 0)}
              </span>
            </div>
          ))}
          <div className="review__item review__item--total">
            <span>{S.reviewTotal}</span>
            <span className="mono">{formatCurrency(lineTotal)}</span>
          </div>
        </div>
      </div>

      {form.attachments.length > 0 && (
        <div className="review__section">
          <h3 className="review__section-title">
            {S.reviewAttachCount.replace('{count}', form.attachments.length)}
          </h3>
          <div className="review__files">
            {form.attachments.map((file, i) => (
              <span key={i} className="review__file">{file.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}