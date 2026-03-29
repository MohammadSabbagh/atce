// features/po/usePODetail.js

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { MOCK_PURCHASE_ORDERS } from '@/lib/mockData'

export function usePODetail() {
  const { id } = useParams()
  const [pos, setPos] = useState(MOCK_PURCHASE_ORDERS)

  const po = pos.find((p) => p.id === id) ?? null

  // Phase 4: replace with supabase calls + audit_log insert
  const approvePO = () => {
    const now = new Date().toISOString()
    setPos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'approved',
              approved_by: 'mock-ceo-001',
              approved_at: now,
              audit: [
                ...(p.audit ?? []),
                { action: 'approved', performed_by: 'Marwan Idris', created_at: now },
              ],
            }
          : p
      )
    )
  }

  const rejectPO = () => {
    const now = new Date().toISOString()
    setPos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'rejected',
              audit: [
                ...(p.audit ?? []),
                { action: 'rejected', performed_by: 'Marwan Idris', created_at: now },
              ],
            }
          : p
      )
    )
  }

  return { po, approvePO, rejectPO }
}