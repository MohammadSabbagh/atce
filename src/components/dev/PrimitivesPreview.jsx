import { useState } from 'react';
import './PrimitivesPreview.scss';

/**
 * Dev-only style guide. Mount at /dev/primitives behind a route guard
 * (e.g. NODE_ENV === 'development'). Demonstrates every primitive in
 * every state so visual review can happen before feature migration.
 *
 * Add no business logic here. This file should never reference Supabase,
 * Dexie, or any feature hook.
 */
export default function PrimitivesPreview() {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    setTheme(next);
  };

  return (
    <div className="primitives-preview">
      <header className="primitives-preview__header">
        <div>
          <h1>المكونات الأساسية</h1>
          <p>نظام تصميم ASTE — مرجع بصري</p>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={toggleTheme}>
          {theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
        </button>
      </header>

      <Section title="الأزرار">
        <Group label="الأنواع">
          <button className="btn btn--primary">أساسي</button>
          <button className="btn btn--secondary">ثانوي</button>
          <button className="btn btn--ghost">خفيف</button>
          <button className="btn btn--danger">خطر</button>
          <button className="btn btn--success">نجاح</button>
        </Group>

        <Group label="الأحجام">
          <button className="btn btn--primary btn--sm">صغير</button>
          <button className="btn btn--primary">افتراضي</button>
          <button className="btn btn--primary btn--lg">كبير</button>
        </Group>

        <Group label="الحالات">
          <button className="btn btn--primary">عادي</button>
          <button className="btn btn--primary" disabled>معطل</button>
          <button className="btn btn--primary btn--block">عرض كامل</button>
        </Group>

        <Group label="أزرار الأيقونات">
          <button className="btn btn--ghost btn--icon" aria-label="تعديل">✎</button>
          <button className="btn btn--secondary btn--icon" aria-label="تعديل">✎</button>
          <button className="btn btn--danger btn--icon-sm" aria-label="حذف">×</button>
        </Group>
      </Section>

      <Section title="شارات الحالة">
        <Group label="الحالات الست">
          <span className="status-badge status-badge--draft">مسودة</span>
          <span className="status-badge status-badge--pending">معلق</span>
          <span className="status-badge status-badge--approved">معتمد</span>
          <span className="status-badge status-badge--released">صادر</span>
          <span className="status-badge status-badge--rejected">مرفوض</span>
          <span className="status-badge status-badge--cancelled">ملغي</span>
        </Group>
      </Section>

      <Section title="الشارات">
        <Group label="محايدة (الأقسام والبيانات الإضافية)">
          <span className="chip chip--neutral">اداري</span>
          <span className="chip chip--neutral">مالي</span>
          <span className="chip chip--neutral">طبي تجاري</span>
        </Group>
        <Group label="مميزة (الوسوم)">
          <span className="chip chip--accent">عاجل</span>
          <span className="chip chip--accent">شهري</span>
          <span className="chip chip--accent">سيارات</span>
        </Group>
      </Section>

      <Section title="حقول النموذج">
        <div className="primitives-preview__form-grid">
          <div className="field">
            <label className="field__label">
              العنوان
              <span className="field__required">*</span>
            </label>
            <input
              className="input"
              type="text"
              placeholder="عنوان أمر الشراء"
            />
          </div>

          <div className="field">
            <label className="field__label">المبلغ</label>
            <input
              className="input"
              type="text"
              placeholder="0.00"
              defaultValue="1,234.56"
            />
            <span className="field__hint">بالدولار الأمريكي</span>
          </div>

          <div className="field">
            <label className="field__label">حقل خاطئ</label>
            <input
              className="input input--error"
              type="text"
              defaultValue="قيمة"
            />
            <span className="field__error">هذا الحقل مطلوب</span>
          </div>

          <div className="field">
            <label className="field__label">حقل معطل</label>
            <input
              className="input"
              type="text"
              disabled
              defaultValue="غير قابل للتعديل"
            />
          </div>

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field__label">الوصف</label>
            <textarea
              className="textarea"
              placeholder="وصف تفصيلي للطلب..."
              rows={4}
            />
          </div>
        </div>
      </Section>

      <Section title="البطاقات">
        <Group label="أساسية وتفاعلية ومرفوعة">
          <div className="card primitives-preview__card-demo">
            <span className="section-title">بطاقة أساسية</span>
            <p>إطار بطاقة بسيط.</p>
          </div>
          <div className="card card--interactive primitives-preview__card-demo">
            <span className="section-title">بطاقة تفاعلية</span>
            <p>تظهر حدود أوضح عند التمرير.</p>
          </div>
          <div className="card card--raised primitives-preview__card-demo">
            <span className="section-title">بطاقة مرفوعة</span>
            <p>بظل خفيف ودون حدود.</p>
          </div>
        </Group>
      </Section>

      <Section title="عناصر التخطيط">
        <Group label="عمودي (Stack)">
          <div className="stack" style={{ minWidth: 240 }}>
            <span className="chip chip--neutral">العنصر الأول</span>
            <span className="chip chip--neutral">العنصر الثاني</span>
            <span className="chip chip--neutral">العنصر الثالث</span>
          </div>
        </Group>
        <Group label="أفقي مع توزيع (Row)">
          <div className="row row--between" style={{ width: 320 }}>
            <span className="section-title">العنوان</span>
            <button className="btn btn--ghost btn--sm">إجراء</button>
          </div>
        </Group>
      </Section>

      <Section title="عنوان القسم (مساعد)">
        <span className="section-title">عنوان قسم بحجم صغير</span>
      </Section>
    </div>
  );
}

// ─── Internal layout helpers (not primitives — only for this preview) ────────

function Section({ title, children }) {
  return (
    <section className="primitives-preview__section">
      <h2>{title}</h2>
      <div className="primitives-preview__section-body">{children}</div>
    </section>
  );
}

function Group({ label, children }) {
  return (
    <div className="primitives-preview__group">
      <span className="primitives-preview__group-label">{label}</span>
      <div className="primitives-preview__group-items">{children}</div>
    </div>
  );
}