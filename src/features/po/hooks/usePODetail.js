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
  requires_ceo,
  status,
  total,
  created_at,
  created_by,
  creator:profiles!created_by(full_name),
  line_items:po_line_items(id, description, department, quantity, unit_price, sort_order),
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

    if (data?.line_items) {
      data.line_items.sort((a, b) => a.sort_order - b.sort_order)
    }

    data.audit = auditResult.data ?? []
    data.notes = notesResult.data ?? []

    // After setting data.audit and data.notes
    if (data.attachments?.length) {
      const signed = await Promise.all(
        data.attachments.map(async (att) => {
          const { data: url } = await supabase.storage
            .from('attachments')
            .createSignedUrl(att.file_path, 60 * 60) // 1 hour
          return { ...att, url: url?.signedUrl ?? null }
        })
      )
      data.attachments = signed
    }

    setPO(data)
    setLoading(false)
  }

  // ─── Shared audit writer ─────────────────────────────────
  async function writeAudit(action) {
    return supabase.from('audit_log').insert({
      entity_type:  'purchase_order',
      entity_id:    po.id,
      action,
      performed_by: profile.id,
    })
  }

  // ─── CEO: Approve ────────────────────────────────────────
  async function approvePO() {
    if (!po || acting) return
    setActing(true)
    try {
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', po.id)
      if (updateError) throw updateError

      await writeAudit('approved')
      await fetchPO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── CEO / Finance: Reject ───────────────────────────────
  async function rejectPO(note) {
    if (!po || acting) return
    setActing(true)
    try {
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
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

      await writeAudit('rejected')
      await fetchPO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── Finance: Release ────────────────────────────────────
  async function releasePO() {
    if (!po || acting) return
    setActing(true)
    try {
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'released', updated_at: new Date().toISOString() })
        .eq('id', po.id)
      if (updateError) throw updateError

      // For non-CEO path, Finance both approves and releases in one step —
      // write both audit entries so the trail reflects the full lifecycle.
      const entries = []
      if (!po.requires_ceo) {
        entries.push({
          entity_type:  'purchase_order',
          entity_id:    po.id,
          action:       'approved',
          performed_by: profile.id,
        })
      }
      entries.push({
        entity_type:  'purchase_order',
        entity_id:    po.id,
        action:       'released',
        performed_by: profile.id,
      })
      await supabase.from('audit_log').insert(entries)

      await fetchPO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── PM/Secretary: Cancel ────────────────────────────────
  async function cancelPO(note) {
    if (!po || acting) return
    setActing(true)
    try {
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', po.id)
      if (updateError) throw updateError

      if (note?.trim()) {
        await supabase.from('po_notes').insert({
          po_id:      po.id,
          created_by: profile.id,
          context:    'cancellation',
          note:       note.trim(),
        })
      }

      await writeAudit('cancelled')
      await fetchPO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── PM: Confirm draft → pending ────────────────────────
  async function confirmPO() {
    if (!po || acting) return
    setActing(true)
    // Optimistic update — flip status immediately so PMActionBar unmounts
    // cleanly in this render cycle before any async work begins.
    setPO(prev => prev ? { ...prev, status: 'pending' } : prev)
    try {
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({
          status:      'pending',
          updated_at:  new Date().toISOString(),
        })
        .eq('id', po.id)
      if (updateError) throw updateError

      await writeAudit('confirmed')

      // Refresh audit trail and notes only — do NOT use fetchPO() which
      // re-fetches the full PO and can overwrite the optimistic status
      // if the DB read races with the write.
      const [auditResult, notesResult] = await Promise.all([
        supabase
          .from('audit_log')
          .select('id, action, created_at, actor:profiles!performed_by(full_name)')
          .eq('entity_type', 'purchase_order')
          .eq('entity_id', po.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('po_notes')
          .select('id, note, context, created_at, author:profiles!created_by(full_name)')
          .eq('po_id', po.id)
          .order('created_at', { ascending: true }),
      ])
      setPO(prev => prev ? {
        ...prev,
        status: 'pending',
        audit:  auditResult.data ?? prev.audit,
        notes:  notesResult.data ?? prev.notes,
      } : prev)
    } catch (err) {
      // Roll back optimistic update on failure
      setPO(prev => prev ? { ...prev, status: 'draft' } : prev)
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
    cancelPO,
    confirmPO,
    addNote,
    refetch: fetchPO,
  }
}