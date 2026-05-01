// src/features/mo/hooks/useMODetail.js

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { getAvailableTransitions } from '@/lib/moStatusConfig'

const MO_SELECT = `
  id,
  mo_number,
  title,
  description,
  requires_ceo,
  status,
  currency,
  item_description,
  item_price,
  type,
  department,
  service_provider,
  handler,
  asset_id,
  created_at,
  created_by,
  creator:profiles!created_by(full_name),
  asset:assets!asset_id(id, name, type, plate_number),
  tags:mo_tags(tag),
  attachments:mo_attachments(id, file_name, file_path, file_type, file_size)
`

export function useMODetail() {
  const { id }                = useParams()
  const { profile }           = useAuth()
  const [mo, setMO]           = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [acting, setActing]   = useState(false)

  useEffect(() => {
    if (!id) return
    fetchMO()
  }, [id])

  async function fetchMO() {
    setLoading(true)
    setError(null)

    const [moResult, auditResult, notesResult] = await Promise.all([
      supabase
        .from('maintenance_orders')
        .select(MO_SELECT)
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
        .eq('entity_type', 'maintenance_order')
        .eq('entity_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('mo_notes')
        .select(`
          id,
          note,
          context,
          created_at,
          author:profiles!created_by(full_name)
        `)
        .eq('mo_id', id)
        .order('created_at', { ascending: true }),
    ])

    if (moResult.error) {
      setError(moResult.error.message)
      setLoading(false)
      return
    }

    const data = moResult.data
    data.audit = auditResult.data ?? []
    data.notes = notesResult.data ?? []

    if (data.attachments?.length) {
      const signed = await Promise.all(
        data.attachments.map(async (att) => {
          const { data: url } = await supabase.storage
            .from('attachments')
            .createSignedUrl(att.file_path, 60 * 60)
          return { ...att, url: url?.signedUrl ?? null }
        })
      )
      data.attachments = signed
    }

    setMO(data)
    setLoading(false)
  }

  function canDo(transitionKey) {
    if (!mo || !profile) return false
    return getAvailableTransitions(mo, profile.role, profile.id).includes(transitionKey)
  }

  async function writeAudit(action) {
    return supabase.from('audit_log').insert({
      entity_type:  'maintenance_order',
      entity_id:    mo.id,
      action,
      performed_by: profile.id,
    })
  }

  // ─── CEO: Approve ────────────────────────────────────────
  async function approveMO() {
    if (!mo || acting) return
    if (!canDo('ceo_approve')) return
    setActing(true)
    try {
      const { error: updateError } = await supabase
        .from('maintenance_orders')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', mo.id)
      if (updateError) throw updateError

      await writeAudit('approved')
      await fetchMO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── CEO / Finance: Reject ───────────────────────────────
  async function rejectMO(note) {
    if (!mo || acting) return
    const transitionKey = profile?.role === 'ceo' ? 'ceo_reject' : 'finance_reject'
    if (!canDo(transitionKey)) return
    setActing(true)
    try {
      const { error: updateError } = await supabase
        .from('maintenance_orders')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', mo.id)
      if (updateError) throw updateError

      if (note?.trim()) {
        await supabase.from('mo_notes').insert({
          mo_id:      mo.id,
          created_by: profile.id,
          context:    'rejection',
          note:       note.trim(),
        })
      }

      await writeAudit('rejected')
      await fetchMO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── Finance: Release ────────────────────────────────────
  async function releaseMO() {
    if (!mo || acting) return
    const transitionKey = mo.requires_ceo
      ? 'finance_release_from_approved'
      : 'finance_release_from_pending'
    if (!canDo(transitionKey)) return
    setActing(true)
    try {
      const { error: updateError } = await supabase
        .from('maintenance_orders')
        .update({ status: 'released', updated_at: new Date().toISOString() })
        .eq('id', mo.id)
      if (updateError) throw updateError

      const entries = []
      if (!mo.requires_ceo) {
        entries.push({
          entity_type:  'maintenance_order',
          entity_id:    mo.id,
          action:       'approved',
          performed_by: profile.id,
        })
      }
      entries.push({
        entity_type:  'maintenance_order',
        entity_id:    mo.id,
        action:       'released',
        performed_by: profile.id,
      })
      await supabase.from('audit_log').insert(entries)

      await fetchMO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── PM/Secretary: Cancel ────────────────────────────────
  async function cancelMO(note) {
    if (!mo || acting) return
    const transitionKey = mo.status === 'draft' ? 'cancel_draft' : 'cancel'
    if (!canDo(transitionKey)) return
    setActing(true)
    try {
      const { error: updateError } = await supabase
        .from('maintenance_orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', mo.id)
      if (updateError) throw updateError

      if (note?.trim()) {
        await supabase.from('mo_notes').insert({
          mo_id:      mo.id,
          created_by: profile.id,
          context:    'cancellation',
          note:       note.trim(),
        })
      }

      await writeAudit('cancelled')
      await fetchMO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── PM: Confirm draft → pending ─────────────────────────
  async function confirmMO() {
    if (!mo || acting) return
    if (!canDo('pm_confirm')) return
    setActing(true)
    setMO(prev => prev ? { ...prev, status: 'pending' } : prev)
    try {
      const { error: updateError } = await supabase
        .from('maintenance_orders')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', mo.id)
      if (updateError) throw updateError

      await writeAudit('confirmed')

      const [auditResult, notesResult] = await Promise.all([
        supabase
          .from('audit_log')
          .select('id, action, created_at, actor:profiles!performed_by(full_name)')
          .eq('entity_type', 'maintenance_order')
          .eq('entity_id', mo.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('mo_notes')
          .select('id, note, context, created_at, author:profiles!created_by(full_name)')
          .eq('mo_id', mo.id)
          .order('created_at', { ascending: true }),
      ])
      setMO(prev => prev ? {
        ...prev,
        status: 'pending',
        audit:  auditResult.data ?? prev.audit,
        notes:  notesResult.data ?? prev.notes,
      } : prev)
    } catch (err) {
      setMO(prev => prev ? { ...prev, status: 'draft' } : prev)
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  // ─── Add a general note ──────────────────────────────────
  async function addNote(text) {
    if (!mo || !text?.trim() || acting) return
    setActing(true)
    try {
      const { error: insertError } = await supabase
        .from('mo_notes')
        .insert({
          mo_id:      mo.id,
          created_by: profile.id,
          context:    'general',
          note:       text.trim(),
        })
      if (insertError) throw insertError
      await fetchMO()
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  return {
    mo,
    loading,
    error,
    acting,
    approveMO,
    rejectMO,
    releaseMO,
    cancelMO,
    confirmMO,
    addNote,
    refetch: fetchMO,
  }
}