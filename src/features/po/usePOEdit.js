// src/features/po/hooks/useEditPO.js

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'

const PO_SELECT = `
  id,
  po_number,
  title,
  description,
  requires_ceo,
  status,
  currency,
  total,
  created_at,
  created_by,
  line_items:po_line_items(id, description, department, quantity, unit_price, sort_order),
  tags:po_tags(tag),
  attachments:po_attachments(id, file_name, file_path, file_type, file_size)
`

export function useEditPO() {
  const { id }       = useParams()
  const navigate     = useNavigate()

  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState(null)
  const [step, setStep]               = useState(1)
  const [submitted, setSubmitted]     = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Existing attachments still visible (not yet marked for deletion)
  const [existingAttachments, setExistingAttachments] = useState([])
  // Full attachment objects queued for deletion — need file_path at save time
  const [attachmentsToDelete, setAttachmentsToDelete] = useState([])

  const [form, setFormState] = useState(null)

  useEffect(() => {
    if (!id) return
    loadPO()
  }, [id])

  async function loadPO() {
    setLoading(true)
    setLoadError(null)

    const { data, error } = await supabase
      .from('purchase_orders')
      .select(PO_SELECT)
      .eq('id', id)
      .single()

      console.log('attachments:', data.attachments)

    if (error) {
      setLoadError(error.message)
      setLoading(false)
      return
    }

    if (data.status !== 'draft') {
      // Only drafts are editable — silently redirect to detail
      navigate(`/po/${id}`, { replace: true })
      return
    }

    const sorted = [...(data.line_items ?? [])].sort((a, b) => a.sort_order - b.sort_order)

    setFormState({
      title:        data.title,
      description:  data.description ?? '',
      date:         data.created_at.split('T')[0],
      currency:     data.currency ?? 'SYP',
      tags:         (data.tags ?? []).map(t => t.tag),
      requires_ceo: data.requires_ceo ?? false,
      line_items:   sorted.map(item => ({
        id:          item.id,
        description: item.description,
        department:  item.department,
        quantity:    item.quantity,
        unit_price:  item.unit_price,
      })),
      attachments: [],   // new File objects only
    })

    setExistingAttachments(data.attachments ?? [])
    setLoading(false)
  }

  // ── Generic field updater ────────────────────────────────
  const setField = (field, value) =>
    setFormState(prev => ({ ...prev, [field]: value }))

  // ── Tags ─────────────────────────────────────────────────
  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase()
    if (!clean || form.tags.includes(clean)) return
    setField('tags', [...form.tags, clean])
  }

  const removeTag = (tag) =>
    setField('tags', form.tags.filter(t => t !== tag))

  // ── Line items ───────────────────────────────────────────
  const addLineItem = () =>
    setField('line_items', [
      ...form.line_items,
      { id: crypto.randomUUID(), description: '', department: '', quantity: 1, unit_price: '' },
    ])

  const updateLineItem = (itemId, field, value) =>
    setField('line_items',
      form.line_items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
    )

  const removeLineItem = (itemId) => {
    if (form.line_items.length === 1) return
    setField('line_items', form.line_items.filter(item => item.id !== itemId))
  }

  const lineTotal = (form?.line_items ?? []).reduce((sum, item) =>
    sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0)

  // ── New attachments ──────────────────────────────────────
  const addAttachment    = (file)  => setField('attachments', [...form.attachments, file])
  const removeAttachment = (index) => setField('attachments', form.attachments.filter((_, i) => i !== index))

  // ── Existing attachment deletion (deferred to save) ──────
  // Store full object so file_path is available when we call storage.remove()
  const markExistingForDeletion = (attachment) => {
    setAttachmentsToDelete(prev => [...prev, attachment])
    setExistingAttachments(prev => prev.filter(a => a.id !== attachment.id))
  }

  // ── Navigation ───────────────────────────────────────────
  const goNext = () => setStep(s => Math.min(s + 1, 4))
  const goBack = () => setStep(s => Math.max(s - 1, 1))

  // ── Validation ───────────────────────────────────────────
  const canProceed = () => {
    if (!form) return false
    switch (step) {
      case 1: return form.title.trim() && form.date
      case 2: return form.line_items.every(
        i => i.description.trim() && i.department &&
             parseFloat(i.quantity) > 0 && parseFloat(i.unit_price) > 0
      )
      case 3:
      case 4: return true
      default: return false
    }
  }

  // ── Save ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting || !form) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Patch PO header
      const { error: poError } = await supabase
        .from('purchase_orders')
        .update({
          title:        form.title.trim(),
          description:  form.description.trim() || null,
          requires_ceo: form.requires_ceo,
          currency:     form.currency,
          updated_at:   new Date().toISOString(),
        })
        .eq('id', id)
      if (poError) throw poError

      // 2. Replace line items (delete all, re-insert)
      const { error: deleteItemsError } = await supabase
        .from('po_line_items').delete().eq('po_id', id)
      if (deleteItemsError) throw deleteItemsError

      const { error: insertItemsError } = await supabase
        .from('po_line_items')
        .insert(form.line_items.map((item, index) => ({
          po_id:       id,
          description: item.description.trim(),
          department:  item.department,
          quantity:    parseFloat(item.quantity),
          unit_price:  parseFloat(item.unit_price),
          sort_order:  index,
        })))
      if (insertItemsError) throw insertItemsError

      // 3. Replace tags (delete all, re-insert)
      await supabase.from('po_tags').delete().eq('po_id', id)
      if (form.tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('po_tags')
          .insert(form.tags.map(tag => ({ po_id: id, tag })))
        if (tagsError) throw tagsError
      }

      // 4. Delete marked existing attachments
      if (attachmentsToDelete.length > 0) {
        const paths = attachmentsToDelete.map(a => a.file_path)
        await supabase.storage.from('attachments').remove(paths)

        const { error: deleteAttachError } = await supabase
          .from('po_attachments')
          .delete()
          .in('id', attachmentsToDelete.map(a => a.id))
        if (deleteAttachError) throw deleteAttachError
      }

      // 5. Upload new attachments
      for (const file of form.attachments) {
        const filePath = `po/${id}/${Date.now()}-${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('attachments').upload(filePath, file)
        if (uploadError) throw uploadError

        const { error: attachError } = await supabase
          .from('po_attachments')
          .insert({
            po_id:     id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
          })
        if (attachError) throw attachError
      }

      // No audit_log entry — draft edits are pre-submission, nothing to track

      setSubmitted(true)
    } catch (err) {
      console.error('PO edit save error:', err)
      setSubmitError(err.message || 'فشل في حفظ التعديلات. حاول مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDone = () => navigate(`/po/${id}`)

  return {
    loading,
    loadError,
    step,
    form,
    setField,
    addTag,
    removeTag,
    addLineItem,
    updateLineItem,
    removeLineItem,
    lineTotal,
    addAttachment,
    removeAttachment,
    goNext,
    goBack,
    canProceed,
    handleSubmit,
    handleDone,
    submitted,
    submitting,
    submitError,
    existingAttachments,
    markExistingForDeletion,
    isEditMode: true,
  }
}