// src/lib/db.js
// Local IndexedDB cache via Dexie.
// Provides instant reads for PO list, MO list, and dashboard — Supabase Realtime keeps it fresh.

import Dexie from 'dexie'

const db = new Dexie('atce')

// version(1) must stay to give Dexie the migration baseline.
// Do not remove it — Dexie requires the full version history to upgrade existing DBs.
db.version(1).stores({
  purchase_orders: 'id, status, department, date, requires_ceo, updated_at',
  _meta: 'key',
})

// version(2): line items become first-class cached data.
// purchase_orders drops the department and date indexes (department now lives on line items, date field removed).
// po_line_items indexed on id (PK), po_id (join), department (filter/aggregate).
db.version(2).stores({
  purchase_orders: 'id, status, date, requires_ceo, updated_at, created_by',
  po_line_items:   'id, po_id, department',
  _meta: 'key',
})

// version(3): replace date index with created_at on purchase_orders.
// date field was removed from the schema — created_at is used for ordering and filtering.
db.version(3).stores({
  purchase_orders: 'id, status, created_at, requires_ceo, updated_at, created_by',
  po_line_items:   'id, po_id, department',
  _meta: 'key',
})

// version(4): add po_number index to support orderBy('po_number') in usePOList.
db.version(4).stores({
  purchase_orders: 'id, po_number, status, created_at, requires_ceo, updated_at, created_by',
  po_line_items:   'id, po_id, department',
  _meta: 'key',
})

// version(5): add po_tags table. Indexed on po_id for per-PO lookups.
db.version(5).stores({
  purchase_orders: 'id, po_number, status, created_at, requires_ceo, updated_at, created_by',
  po_line_items:   'id, po_id, department',
  po_tags:         'id, po_id',
  _meta: 'key',
})

// version(6): Phase 6 — Assets, Team Members, Maintenance Orders.
//
// assets        — registry of company assets (cars and other equipment).
//                 Indexed on type and department for list filtering.
// team_members  — staff registry. Lightweight for now; will connect with HR module later.
// maintenance_orders — same status lifecycle as purchase_orders.
//                 Indexed identically for MO list + dashboard queries.
// mo_tags       — same pattern as po_tags.
db.version(7).stores({
  purchase_orders:    'id, po_number, status, created_at, requires_ceo, updated_at, created_by',
  po_line_items:      'id, po_id, department',
  po_tags:            'id, po_id',
  assets:             'id, type, department, is_active, updated_at',
  team_members:       'id, department, is_active, updated_at',
  maintenance_orders: 'id, mo_number, status, type, asset_id, created_at, requires_ceo, updated_at, created_by',
  mo_tags:            'id, mo_id',
  _meta: 'key',
})

export default db