// src/features/po/hooks/usePODetail.js

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const PO_SELECT = `
  id,
  po_number,
  title,
  description,
  date,
  department,
  requires_ceo,
  status,
  total,
  created_at,
  approved_at,
  released_at,
  created_by,
  approved_by,
  released_by,
  creator:profiles!created_by(full_name),
  approver:profiles!approved_by(full_name),
  releaser:profiles!released_by(full_name),
  line_items:po_line_items(id, description, price, sort_order),
  tags:po_tags(tag),
  attachments:po_attachments(id, file_name, file_path, file_type, file_size)
`

export function usePODetail() {
  const { id }           = useParams()
  const { profile }      = useAuth()
  const [po, setPO]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [acting, setActing]   = useState(false)

  useEffect(() => {
    if (!id) return
    fetchPO()
  }, [id])

  async function fetchPO() {
    setLoading(true)
    setError(null)

    // Fetch PO, audit log, and notes in parallel
    const [poResult, auditResult, notesResult] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select(PO_SELECT)
        .eq('id', id)
        .single(),
      supabase
        .from('audit_log')
        .select(`
          id,
          action,
          created_at,
          actor:profiles!performed_by(full_name)
        `)
        .eq('entity_type', 'purchase_order')
        .eq('entity_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('po_notes')
        .select(`
          id,
          note,
          context,
          created_at,
          author:profiles!created_by(full_name)
        `)
        .eq('po_id', id)
        .order('created_at', { ascending: true }),
    ])

    if (poResult.error) {
      setError(poResult.error.message)
      setLoading(false)
      return
    }

    const data = poResult.data

    // Sort line items by sort_order
    if (data?.line_items) {
      data.line_items.sort((a, b) => a.sort_order - b.sort_order)
    }

    // Attach audit entries and notes (empty array if none or error)
    data.audit = auditResult.data ?? []
    data.notes = notesResult.data ?? []

    setPO(data)
    setLoading(false)
  }

  // ─── CEO: Approve ────────────────────────────────────
  async function approvePO() {
    if (!po || acting) return
    setActing(true)
    const now = new Date().toISOString()
    try {
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'approved', approved_by: profile.id, approved_at: now })
        .eq('id', po.id)
      if (updateError) throw updateError

      await supabase.from('audit_log').insert({
        entity_type: 'purchase_order',
        entity_id: po.id,
        action: 'approved',
        performed_by: profile.id,
      })
      await fetchPO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── CEO: Reject ─────────────────────────────────────
  async function rejectPO(note) {
    if (!po || acting) return
    setActing(true)
    const now = new Date().toISOString()
    try {
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'rejected', rejected_by: profile.id, rejected_at: now })
        .eq('id', po.id)
      if (updateError) throw updateError

      if (note?.trim()) {
        await supabase.from('po_notes').insert({
          po_id:      po.id,
          created_by: profile.id,
          context:    'rejection',
          note:       note.trim(),
        })
      }

      await supabase.from('audit_log').insert({
        entity_type: 'purchase_order',
        entity_id:   po.id,
        action:      'rejected',
        performed_by: profile.id,
      })
      await fetchPO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── Finance: Release ────────────────────────────────
  async function releasePO() {
    if (!po || acting) return
    setActing(true)
    const now = new Date().toISOString()
    try {
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'released', released_by: profile.id, released_at: now })
        .eq('id', po.id)
      if (updateError) throw updateError

      const auditEntries = []
      if (!po.requires_ceo) {
        auditEntries.push({
          entity_type: 'purchase_order',
          entity_id: po.id,
          action: 'approved',
          performed_by: profile.id,
        })
      }
      auditEntries.push({
        entity_type: 'purchase_order',
        entity_id: po.id,
        action: 'released',
        performed_by: profile.id,
      })
      await supabase.from('audit_log').insert(auditEntries)

      await fetchPO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── Add a general note ──────────────────────────────────
  async function addNote(text) {
    if (!po || !text?.trim() || acting) return
    setActing(true)
    try {
      const { error: insertError } = await supabase
        .from('po_notes')
        .insert({
          po_id:      po.id,
          created_by: profile.id,
          context:    'general',
          note:       text.trim(),
        })
      if (insertError) throw insertError
      await fetchPO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  return {
    po,
    loading,
    error,
    acting,
    approvePO,
    rejectPO,
    releasePO,
    addNote,
    refetch: fetchPO,
  }
}