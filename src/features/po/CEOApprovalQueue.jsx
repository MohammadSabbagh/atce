// features/po/CEOApprovalQueue.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_PURCHASE_ORDERS } from '@/lib/mockData'
import POCard from './POCard'
import NavIcon from '@/components/layout/NavIcon'
import '@/styles/ceo-approval-queue.scss'

export default function CEOApprovalQueue() {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState(null)

  const pendingApprovals = MOCK_PURCHASE_ORDERS.filter(
    (po) => po.requires_ceo && po.status === 'pending'
  )

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="ceo-queue">
      {/* ── Page header ── */}
      <div className="ceo-queue__header">
        <button className="ceo-queue__back" onClick={() => navigate(-1)}>
          <NavIcon name="arrow-left" size={18} />
        </button>
        <div className="ceo-queue__title-block">
          <h1 className="ceo-queue__title">PO Approvals</h1>
          {pendingApprovals.length > 0 && (
            <span className="ceo-queue__badge">{pendingApprovals.length}</span>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div className="ceo-queue__list">
        {pendingApprovals.length === 0 ? (
          <div className="ceo-queue__empty">
            <NavIcon name="check-circle" size={40} />
            <p>No pending approvals</p>
            <span>You're all caught up</span>
          </div>
        ) : (
          pendingApprovals.map((po) => (
            <POCard
              key={po.id}
              po={po}
              isExpanded={expandedId === po.id}
              onToggle={() => toggle(po.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}