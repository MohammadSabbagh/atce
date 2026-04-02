import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const INITIAL_FORM = {
  // Step 1 — Details
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  department: '',
  tags: [],
  requires_ceo: false,

  // Step 2 — Line Items
  line_items: [{ id: crypto.randomUUID(), description: '', price: '' }],

  // Step 3 — Attachments
  attachments: [],
}

export function useCreatePO() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // ── Generic field updater ────────────────────
  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ── Tags ────────────────────────────────────
  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase()
    if (!clean || form.tags.includes(clean)) return
    setField('tags', [...form.tags, clean])
  }

  const removeTag = (tag) => {
    setField('tags', form.tags.filter((t) => t !== tag))
  }

  // ── Line items ───────────────────────────────
  const addLineItem = () => {
    setField('line_items', [
      ...form.line_items,
      { id: crypto.randomUUID(), description: '', price: '' },
    ])
  }

  const updateLineItem = (id, field, value) => {
    setField(
      'line_items',
      form.line_items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const removeLineItem = (id) => {
    if (form.line_items.length === 1) return
    setField('line_items', form.line_items.filter((item) => item.id !== id))
  }

  const lineTotal = form.line_items.reduce(
    (sum, item) => sum + (parseFloat(item.price) || 0),
    0
  )

  // ── Attachments ──────────────────────────────
  const addAttachment = (file) => {
    setField('attachments', [...form.attachments, file])
  }

  const removeAttachment = (index) => {
    setField(
      'attachments',
      form.attachments.filter((_, i) => i !== index)
    )
  }

  // ── Navigation ───────────────────────────────
  const goNext = () => setStep((s) => Math.min(s + 1, 4))
  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  // ── Validation per step ──────────────────────
  const canProceed = () => {
    switch (step) {
      case 1:
        return form.title.trim() && form.department && form.date
      case 2:
        return form.line_items.every(
          (i) => i.description.trim() && parseFloat(i.price) > 0
        )
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  // ── Submit ───────────────────────────────────
  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Insert the PO header
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          date: form.date,
          department: form.department,
          requires_ceo: form.requires_ceo,
          status: 'pending',
          total: lineTotal,
          created_by: profile.id,
        })
        .select('id')
        .single()

      if (poError) throw poError

      const poId = po.id

      // 2. Insert line items
      if (form.line_items.length > 0) {
        const { error: itemsError } = await supabase
          .from('po_line_items')
          .insert(
            form.line_items.map((item, index) => ({
              po_id: poId,
              description: item.description.trim(),
              price: parseFloat(item.price),
              sort_order: index,
            }))
          )

        if (itemsError) throw itemsError
      }

      // 3. Insert tags
      if (form.tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('po_tags')
          .insert(
            form.tags.map((tag) => ({
              po_id: poId,
              tag,
            }))
          )

        if (tagsError) throw tagsError
      }

      // 4. Upload attachments to Storage + insert records
      if (form.attachments.length > 0) {
        for (const file of form.attachments) {
          const filePath = `${poId}/${Date.now()}-${file.name}`

          const { error: uploadError } = await supabase.storage
            .from('po-attachments')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          const { error: attachError } = await supabase
            .from('po_attachments')
            .insert({
              po_id: poId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
            })

          if (attachError) throw attachError
        }
      }

      // 5. Write audit log entry
      await supabase.from('audit_log').insert({
        entity_type: 'purchase_order',
        entity_id: poId,
        action: 'created',
        performed_by: profile.id,
        details: { title: form.title, total: lineTotal, department: form.department },
      })

      setSubmitted(true)
    } catch (err) {
      console.error('PO submit error:', err)
      setSubmitError(err.message || 'Failed to submit PO. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDone = () => {
    navigate('/po/list')
  }

  return {
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
  }
}