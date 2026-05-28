'use client'

/**
 * <EditableImage> — inline image swap for any CMS image key.
 *
 * Usage:
 *   <EditableImage cmsKey="about_group_photo" alt="The crew">
 *     {url => (
 *       url
 *         ? <img src={url} alt="..." />
 *         : <div>Placeholder</div>
 *     )}
 *   </EditableImage>
 *
 * Behaviour mirrors <EditableText>: visitor sees nothing, admin sees a
 * pencil button overlaid; clicking opens a modal with the existing
 * ImageUploader (which already handles upload to the Storage layer and
 * returns a public URL). Save writes the URL into the same Content table.
 *
 * Set max={n} if you want multi-image support later (currently single only).
 */
import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, X, Check, Loader2, Trash2 } from 'lucide-react'
import { useAdmin } from '@/lib/admin-context'
import { ImageUploader } from '@/components/admin/image-uploader'

type EditableImageProps = {
  cmsKey: string
  label?: string
  value?: string
  alt?: string
  children: (url: string) => ReactNode
}

export function EditableImage({
  cmsKey,
  label,
  value: valueProp,
  alt,
  children,
}: EditableImageProps) {
  // Superadmin-only — matches /api/admin/content/[key] server gate.
  const { isSuperadmin, loading: adminLoading } = useAdmin()
  const [value, setValue] = useState<string>(valueProp ?? '')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (valueProp !== undefined) {
      setValue(valueProp)
      return
    }
    let aborted = false
    fetch(`/api/content?keys=${encodeURIComponent(cmsKey)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (aborted) return
        if (data && typeof data[cmsKey] === 'string') setValue(data[cmsKey])
      })
      .catch(() => {})
    return () => { aborted = true }
  }, [cmsKey, valueProp])

  return (
    <span style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {children(value)}

      {isSuperadmin && !adminLoading && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={`Edit ${label || cmsKey}`}
          aria-label={`Edit ${label || cmsKey}`}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 30,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '0.4rem 0.65rem',
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            fontSize: 11.5, fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 6px 16px -4px rgba(0,0,0,0.55)',
          }}
        >
          <ImagePlus size={13} />
          Edit image
        </button>
      )}

      {isOpen && (
        <ImageEditorModal
          cmsKey={cmsKey}
          label={label || cmsKey}
          alt={alt}
          initialUrl={value}
          onClose={() => setIsOpen(false)}
          onSaved={url => { setValue(url); setIsOpen(false) }}
        />
      )}
    </span>
  )
}

function ImageEditorModal({
  cmsKey,
  label,
  alt,
  initialUrl,
  onClose,
  onSaved,
}: {
  cmsKey: string
  label: string
  alt?: string
  initialUrl: string
  onClose: () => void
  onSaved: (url: string) => void
}) {
  const [draftUrl, setDraftUrl] = useState(initialUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/content/${encodeURIComponent(cmsKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          value: draftUrl,
          type: 'text',
          label,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(`Save failed (${res.status}): ${data?.error || 'unknown'}`)
        setSaving(false)
        return
      }
      onSaved(draftUrl)
    } catch {
      setError('Network error. Try again.')
      setSaving(false)
    }
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: '#0f0f10',
          color: '#fff',
          borderRadius: 16,
          border: '1px solid #1f1f1f',
          boxShadow: '0 28px 70px -20px rgba(236,30,121,0.45), 0 4px 12px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '0.85rem 1.1rem',
          borderBottom: '1px solid #1f1f1f',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#EC1E79',
              textTransform: 'uppercase', letterSpacing: '0.14em',
            }}>
              Inline edit · image
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', padding: 4, borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem 1.1rem', overflowY: 'auto' }}>
          {draftUrl ? (
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draftUrl}
                alt={alt || label}
                style={{
                  display: 'block', width: '100%', height: 'auto',
                  maxHeight: 320, objectFit: 'contain',
                  borderRadius: 12, background: '#161616',
                  border: '1px solid #2a2a2a',
                }}
              />
              <button
                type="button"
                onClick={() => setDraftUrl('')}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '0.35rem 0.6rem',
                  background: 'rgba(239,68,68,0.95)',
                  color: '#fff', border: 'none', borderRadius: 7,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Trash2 size={11} /> Remove
              </button>
            </div>
          ) : (
            <div style={{
              border: '1px dashed #2a2a2a', borderRadius: 12, padding: 8,
              background: '#0a0a0b', marginBottom: '0.75rem',
            }}>
              <ImageUploader
                images={[]}
                onChange={imgs => { if (imgs[0]) setDraftUrl(imgs[0]) }}
                max={1}
                label=""
              />
            </div>
          )}

          <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
            {cmsKey}
          </div>

          {error && (
            <div style={{
              marginTop: 10, padding: '0.55rem 0.75rem', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5', fontSize: 12.5,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.75rem 1.1rem',
          borderTop: '1px solid #1f1f1f',
          background: '#0a0a0b',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button
            type="button" onClick={onClose}
            style={{
              background: 'transparent', color: '#9ca3af',
              border: '1px solid #2a2a2a', borderRadius: 9,
              padding: '0.5rem 0.85rem', fontSize: 13, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={handleSave} disabled={saving || draftUrl === initialUrl}
            style={{
              background: saving || draftUrl === initialUrl ? '#2a2a2a' : '#EC1E79',
              color: saving || draftUrl === initialUrl ? '#6b7280' : '#fff',
              border: 'none', borderRadius: 9,
              padding: '0.5rem 1rem', fontSize: 13, fontWeight: 800,
              cursor: saving || draftUrl === initialUrl ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: saving || draftUrl === initialUrl ? 'none' : '0 6px 16px -6px rgba(236,30,121,0.6)',
            }}
          >
            {saving ? <Loader2 size={14} className="lc-spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
