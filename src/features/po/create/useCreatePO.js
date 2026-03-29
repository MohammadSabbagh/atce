import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

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
    if (form.line_items.length === 1) return // minimum 1
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
        return true // attachments optional
      case 4:
        return true
      default:
        return false
    }
  }

  // ── Submit ───────────────────────────────────
  const handleSubmit = () => {
    // Phase 4: replace with real Supabase insert
    console.log('Submitting PO:', {
      ...form,
      total: lineTotal,
      created_by: profile.id,
      status: 'pending',
    })
    setSubmitted(true)
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
  }
}