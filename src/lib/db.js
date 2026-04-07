// src/lib/db.js
// Local IndexedDB cache via Dexie.
// Provides instant reads for PO list and dashboard — Supabase Realtime keeps it fresh.

import Dexie from 'dexie'

const db = new Dexie('atce')

db.version(1).stores({
  // PO header cache — indexed fields used for filtering
  // Non-indexed fields (po_number, title, total, etc.) are stored but not indexed
  purchase_orders: 'id, status, department, date, requires_ceo, updated_at',

  // Sync metadata — key/value pairs (lastSyncedAt, userId)
  _meta: 'key',
})

export default db