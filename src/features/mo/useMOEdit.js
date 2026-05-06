// src/features/mo/hooks/useEditMO.js

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'

const MO_SELECT = `
  id,
  mo_number,
  title,
  description,
  asset_id,
  type,
  department,
  service_provider,
  handler,
  requires_ceo,
  currency,
  item_description,
  item_price,
  status,
  created_at,
  asset:assets!asset_id(id, name, type, plate_number, department),
  tags:mo_tags(tag),
  attachments:mo_attachments(id, file_name, file_path, file_type, file_size)
`

export function useMOEdit() {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState(null)
  const [step, setStep]               = useState(1)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)
  const [submitted, setSubmitted]     = useState(false)

  const [form, setFormState]           = useState(null)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [attachments, setAttachments]  = useState([])          // new File objects
  const [existingAttachments, setExistingAttachments] = useState([])
  const [attachmentsToDelete, setAttachmentsToDelete] = useState([])

  // Asset search UI state
  const [assetSearch, setAssetSearch]       = useState('')
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)

  const assets = useLiveQuery(
    () => db.assets.filter(a => a.is_active).toArray().then(rows =>
      rows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ar'))
    ), []
  ) ?? []

  const filteredAssets = assetSearch
    ? assets.filter(a =>
        a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
        a.plate_number?.toLowerCase().includes(assetSearch.toLowerCase())
      )
    : assets

  useEffect(() => {
    if (!id) return
    loadMO()
  }, [id])

  async function loadMO() {
    setLoading(true)
    setLoadError(null)

    const { data, error } = await supabase
      .from('maintenance_orders')
      .select(MO_SELECT)
      .eq('id', id)
      .single()

    if (error) {
      setLoadError(error.message)
      setLoading(false)
      return
    }

    if (data.status !== 'draft') {
      navigate(`/mo/${id}`, { replace: true })
      return
    }

    setFormState({
      title:            data.title,
      description:      data.description ?? '',
      asset_id:         data.asset_id,
      department:       data.department,
      service_provider: data.service_provider ?? '',
      handler:          data.handler ?? '',
      requires_ceo:     data.requires_ceo ?? false,
      currency:         data.currency ?? 'USD',
      item_description: data.item_description,
      item_price:       String(data.item_price ?? ''),
      tags:             (data.tags ?? []).map(t => t.tag),
    })

    if (data.asset) {
      setSelectedAsset(data.asset)
    }

    setExistingAttachments(data.attachments ?? [])
    setLoading(false)
  }

  // ── Form helpers ─────────────────────────────────────────
  const set = (field) => (e) =>
    setFormState(prev => ({ ...prev, [field]: e.target.value }))

  const setPrice = (v) =>
    setFormState(prev => ({ ...prev, item_price: v }))

  const setField = (field, value) =>
    setFormState(prev => ({ ...prev, [field]: value }))

  const selectAsset = (asset) => {
    setSelectedAsset(asset)
    setFormState(prev => ({
      ...prev,
      asset_id:   asset.id,
      department: asset.department ?? prev.department,
    }))
    setAssetPickerOpen(false)
    setAssetSearch('')
  }

  // ── Tags ─────────────────────────────────────────────────
  const addTag = (tag) =>
    setFormState(prev => ({ ...prev, tags: [...prev.tags, tag] }))

  const removeTag = (tag) =>
    setFormState(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))

  // ── New attachments ──────────────────────────────────────
  const addAttachment    = (file)  => setAttachments(prev => [...prev, file])
  const removeAttachment = (idx)   => setAttachments(prev => prev.filter((_, i) => i !== idx))

  // ── Existing attachment deletion (deferred) ──────────────
  const markExistingForDeletion = (attachment) => {
    setAttachmentsToDelete(prev => [...prev, attachment])
    setExistingAttachments(prev => prev.filter(a => a.id !== attachment.id))
  }

  // ── Navigation ───────────────────────────────────────────
  const nextStep = () => {
    if (!validateStep()) return
    setStep(s => Math.min(s + 1, 4))
  }

  const prevStep = () => {
    setError(null)
    setStep(s => Math.max(s - 1, 1))
  }

  // ── Validation ───────────────────────────────────────────
  const validateStep = () => {
    if (!form) return false
    if (step === 1) {
      if (!form.title.trim())  { setError('عنوان أمر الصيانة مطلوب'); return false }
      if (!form.asset_id)      { setError('يجب اختيار الأصل'); return false }
      if (!form.department)    { setError('القسم مطلوب'); return false }
    }
    if (step === 2) {
      if (!form.item_description.trim()) { setError('وصف البند مطلوب'); return false }
      if (!form.item_price || isNaN(Number(form.item_price)) || Number(form.item_price) <= 0) {
        setError('السعر مطلوب ويجب أن يكون أكبر من صفر'); return false
      }
    }
    setError(null)
    return true
  }

  // ── Save ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (saving || !form) return
    setSaving(true)
    setError(null)

    try {
      // 1. Patch MO header
      const { error: moError } = await supabase
        .from('maintenance_orders')
        .update({
          title:            form.title.trim(),
          description:      form.description.trim() || null,
          asset_id:         form.asset_id,
          type:             selectedAsset?.type ?? 'other',
          department:       form.department,
          service_provider: form.service_provider.trim() || null,
          handler:          form.handler.trim() || null,
          requires_ceo:     form.requires_ceo,
          currency:         form.currency,
          item_description: form.item_description.trim(),
          item_price:       Number(form.item_price),
          updated_at:       new Date().toISOString(),
        })
        .eq('id', id)
      if (moError) throw moError

      // 2. Replace tags
      await supabase.from('mo_tags').delete().eq('mo_id', id)
      if (form.tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('mo_tags')
          .insert(form.tags.map(tag => ({ mo_id: id, tag })))
        if (tagsError) throw tagsError
      }

      // 3. Delete marked existing attachments
      if (attachmentsToDelete.length > 0) {
        const paths = attachmentsToDelete.map(a => a.file_path)
        await supabase.storage.from('attachments').remove(paths)

        const { error: deleteAttachError } = await supabase
          .from('mo_attachments')
          .delete()
          .in('id', attachmentsToDelete.map(a => a.id))
        if (deleteAttachError) throw deleteAttachError
      }

      // 4. Upload new attachments
      for (const file of attachments) {
        const path = `mo/${id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('attachments').upload(path, file)
        if (uploadError) throw uploadError

        const { error: attachError } = await supabase
          .from('mo_attachments')
          .insert({
            mo_id:     id,
            file_name: file.name,
            file_path: path,
            file_size: file.size,
            file_type: file.type,
          })
        if (attachError) throw attachError
      }

      // No audit_log entry — draft edits are pre-submission

      setSubmitted(true)
    } catch (err) {
      console.error('MO edit save error:', err)
      setError(err.message || 'فشل في حفظ التعديلات. حاول مرة أخرى.')
    } finally {
      setSaving(false)
    }
  }

  const handleDone = () => navigate(`/mo/${id}`)

  return {
    loading,
    loadError,
    step,
    form,
    set,
    setPrice,
    setField,
    selectAsset,
    selectedAsset,
    assets,
    filteredAssets,
    assetSearch,
    setAssetSearch,
    assetPickerOpen,
    setAssetPickerOpen,
    addTag,
    removeTag,
    attachments,
    addAttachment,
    removeAttachment,
    existingAttachments,
    markExistingForDeletion,
    nextStep,
    prevStep,
    validateStep,
    handleSubmit,
    handleDone,
    saving,
    error,
    submitted,
    isEditMode: true,
  }
}