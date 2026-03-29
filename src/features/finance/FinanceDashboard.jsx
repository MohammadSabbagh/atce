// features/finance/FinanceDashboard.jsx

import { useFinancePOs } from './hooks/useFinancePOs';
import styles from './FinanceDashboard.module.scss';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtTime = (date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Sub-components ───────────────────────────────────────────────────────────
function LiveChip({ lastUpdate }) {
  return (
    <div className={styles.liveChip}>
      <span className={styles.liveDot} />
      LIVE
    </div>
  );
}

function StatCard({ label, value, sub, modifier, badge }) {
  return (
    <div className={`${styles.statCard} ${modifier ? styles[modifier] : ''}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {badge && <span className={`${styles.statBadge} ${styles[badge.cls]}`}>{badge.text}</span>}
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

function DeptBar({ dept, value, approved, count, maxValue }) {
  const fillPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const approvedPct = value > 0 ? (approved / value) * 100 : 0;

  return (
    <div className={styles.deptRow}>
      <div className={styles.deptMeta}>
        <span className={styles.deptName}>{dept}</span>
        <span className={styles.deptTotal}>{fmt(value)}</span>
      </div>
      <div className={styles.deptBarTrack}>
        <div className={styles.deptBarFill} style={{ width: `${fillPct}%` }} />
        <div
          className={styles.deptBarApproved}
          style={{ width: `${fillPct * (approvedPct / 100)}%` }}
        />
      </div>
      <span className={styles.deptCount}>{count} order{count !== 1 ? 's' : ''}</span>
    </div>
  );
}

function POCard({ po }) {
  const tags = po.tags ?? [];
  return (
    <div className={`${styles.poCard} ${styles[`poCard--${po.status}`]}`}>
      <div className={styles.poCardTop}>
        <div className={styles.poCardLeft}>
          <span className={styles.poNumber}>{po.po_number}</span>
          <span className={styles.poTitle}>{po.title}</span>
        </div>
        <span className={`${styles.statusBadge} ${styles[`statusBadge--${po.status}`]}`}>
          {po.status}
        </span>
      </div>

      <div className={styles.poCardMeta}>
        <div className={styles.poMeta}>
          <span>{po.department}</span>
          <span className={styles.metaDot} />
          <span>{fmtDate(po.date)}</span>
          {po.creator?.full_name && (
            <>
              <span className={styles.metaDot} />
              <span>{po.creator.full_name}</span>
            </>
          )}
        </div>
        <span className={styles.poTotal}>{fmt(po.total)}</span>
      </div>

      {(tags.length > 0 || po.requires_ceo) && (
        <div className={styles.poTags}>
          {po.requires_ceo && (
            <span className={styles.ceoFlag}>⚑ CEO</span>
          )}
          {tags.map((t) => (
            <span key={t.tag} className={styles.tag}>#{t.tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STATUS FILTER CHIPS ──────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function FinanceDashboard() {
  const {
    pos, allPos, isLive, lastUpdate,
    statusFilter, setStatusFilter,
    deptFilter, setDeptFilter,
    stats, deptBreakdown, maxDeptValue, departments,
  } = useFinancePOs();

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>Finance Overview</span>
          <span className={styles.headerSub}>Read-only · All departments</span>
        </div>
        <LiveChip lastUpdate={lastUpdate} />
      </div>

      <div className={styles.content}>

        {/* Last updated */}
        <div className={styles.updateBar}>
          <span className={styles.updateDot} />
          Updated {fmtTime(lastUpdate)}
        </div>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Total Orders"
            value={stats.totalCount}
            modifier="statCard--total"
            sub={`${stats.rejectedCount} rejected`}
          />
          <StatCard
            label="Total Value"
            value={fmt(stats.totalValue)}
            modifier="statCard--value"
            sub="all statuses"
          />
          <StatCard
            label="Approved"
            value={fmt(stats.approvedValue)}
            modifier="statCard--approved"
            badge={{ cls: 'statBadge--approved', text: '✓ cleared' }}
          />
          <StatCard
            label="Pending"
            value={fmt(stats.pendingValue)}
            modifier="statCard--pending"
            badge={{ cls: 'statBadge--pending', text: '⏳ awaiting' }}
          />
        </div>

        {/* Department breakdown */}
        <div className={styles.deptSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>By Department</span>
            <span className={styles.sectionCount}>{deptBreakdown.length} active</span>
          </div>
          {deptBreakdown.map((d) => (
            <DeptBar
              key={d.dept}
              dept={d.dept}
              value={d.value}
              approved={d.approved}
              count={d.count}
              maxValue={maxDeptValue}
            />
          ))}
        </div>

        {/* Filters + PO list */}
        <div>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>All Orders</span>
            <span className={styles.sectionCount}>{pos.length} shown</span>
          </div>

          <div className={styles.filtersSection}>
            {/* Status filter */}
            <div className={styles.filterRow}>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`${styles.chip} ${statusFilter === f.value ? `${styles['chip--active']} ${styles[`chip--${f.value}`]}` : ''}`}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Department filter */}
            <div className={styles.filterRow}>
              <button
                className={`${styles.chip} ${deptFilter === 'all' ? styles['chip--active'] : ''}`}
                onClick={() => setDeptFilter('all')}
              >
                All Depts
              </button>
              {departments.map((d) => (
                <button
                  key={d}
                  className={`${styles.chip} ${deptFilter === d ? styles['chip--active'] : ''}`}
                  onClick={() => setDeptFilter(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.poList} style={{ marginTop: 12 }}>
            {pos.length === 0 ? (
              <div className={styles.empty}>No orders match the current filters</div>
            ) : (
              pos.map((po) => <POCard key={po.id} po={po} />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}