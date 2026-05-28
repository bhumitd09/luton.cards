'use client'

/**
 * <EditableText> — inline live-editing for any single CMS text key.
 *
 * Usage:
 *   <EditableText cmsKey="hero_headline" multiline>
 *     {value => <h1 className="...">{value || 'Default heading'}</h1>}
 *   </EditableText>
 *
 * - Renders normally for every visitor.
 * - When an admin is logged in, a small pencil overlay appears on hover.
 * - Click pencil → modal opens with the current value in a textarea/input.
 * - Saves to /api/admin/content/[key] (which upserts on the server).
 * - Optimistic UI: the new value renders the moment Save is clicked.
 * - Falls back to the children render with the current value so the public
 *   site never knows the editor exists.
 *
 * The fetch on first render hits /api/content?keys=<key> once per key. If
 * you have many keys on one page, prefer the parent to fetch them all
 * together and pass `value` in directly via the prop — the component
 * accepts a value override that skips its own fetch.
 */
import { useEffect, useRef, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, X, Check, Loader2 } from 'lucide-react'
import { useAdmin } from '@/lib/admin-context'

type EditableTextProps = {
  /** CMS key — also used as the storage label if a new row is created. */
  cmsKey: string
  /** Pretty label shown in the editor modal header. Falls back to cmsKey. */
  label?: string
  /** Initial value the parent already knows (skip the auto-fetch). */
  value?: string
  /** Default text shown if the CMS row is empty/missing. */
  fallback?: string
  /** Multi-line textarea instead of single-line input. */
  multiline?: boolean
  /** Max characters in the editor. */
  maxLength?: number
  /** Render prop receiving the current value (CMS, fresh save, or fallback). */
  children: (value: string) => ReactNode
}

export function EditableText({
  cmsKey,
  label,
  value: valueProp,
  fallback = '',
  multiline = false,
  maxLength,
  children,
}: EditableTextProps) {
  // Editor surface is superadmin-only — vendors don't get to rewrite global
  // brand content. Matches the server-side gate at /api/admin/content/[key].
  const { isSuperadmin, loading: adminLoading } = useAdmin()
  const [value, setValue] = useState<string>(valueProp ?? '')
  const [hasFetched, setHasFetched] = useState<boolean>(valueProp !== undefined)
  const [isOpen, setIsOpen] = useState(false)

  // Auto-fetch only if no prop value was supplied. Keeps SSR-passed values
  // authoritative when the parent does its own data load.
  useEffect(() => {
    if (valueProp !== undefined) {
      setValue(valueProp)
      setHasFetched(true)
      return
    }
    let aborted = false
    fetch(`/api/content?keys=${encodeURIComponent(cmsKey)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (aborted) return
        if (data && typeof data[cmsKey] === 'string') setValue(data[cmsKey])
        setHasFetched(true)
      })
      .catch(() => { if (!aborted) setHasFetched(true) })
    return () => { aborted = true }
  }, [cmsKey, valueProp])

  const display = value || fallback

  return (
    <span style={{ position: 'relative', display: 'contents' }}>
      {/* The actual rendered text — unaltered for every visitor. */}
      {children(display)}

      {/* Admin overlay: floating pencil + click handler. Wraps the children
          in a positioned span so the pencil can sit at the top-right. */}
      {isSuperadmin && !adminLoading && (
        <EditablePencil
          label={label || cmsKey}
          onClick={() => setIsOpen(true)}
        />
      )}

      {/* Modal */}
      {isOpen && (
        <EditorModal
          cmsKey={cmsKey}
          label={label || cmsKey}
          initialValue={value}
          multiline={multiline}
          maxLength={maxLength}
          onClose={() => setIsOpen(false)}
          onSaved={newVal => { setValue(newVal); setIsOpen(false) }}
        />
      )}
    </span>
  )
}

// ─── Floating pencil overlay ────────────────────────────────────────────
function EditablePencil({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Edit ${label}`}
      aria-label={`Edit ${label}`}
      className="lc-edit-pencil"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
        verticalAlign: 'middle',
        width: 22,
        height: 22,
        borderRadius: 6,
        background: 'rgba(236,30,121,0.92)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 10px -2px rgba(236,30,121,0.55)',
        transition: 'transform 0.15s, background 0.15s',
        position: 'relative',
        zIndex: 30,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.08)'
        e.currentTarget.style.background = '#EC1E79'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = 'rgba(236,30,121,0.92)'
      }}
    >
      <Pencil size={12} />
    </button>
  )
}

// ─── Editor modal (portal to body) ─────────────────────────────────────
function EditorModal({
  cmsKey,
  label,
  initialValue,
  multiline,
  maxLength,
  onClose,
  onSaved,
}: {
  cmsKey: string
  label: string
  initialValue: string
  multiline?: boolean
  maxLength?: number
  onClose: () => void
  onSaved: (v: string) => void
}) {
  const [draft, setDraft] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    // Autofocus + select all on open. Slight delay to wait for portal mount.
    const t = setTimeout(() => {
      inputRef.current?.focus()
      if (inputRef.current && 'select' in inputRef.current) inputRef.current.select()
    }, 50)
    return () => clearTimeout(t)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/content/${encodeURIComponent(cmsKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          value: draft,
          type: multiline ? 'text' : 'text',
          label,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(`Save failed (${res.status}): ${data?.error || 'unknown'}`)
        setSaving(false)
        return
      }
      onSaved(draft)
    } catch {
      setError('Network error. Try again.')
      setSaving(false)
    }
  }

  // Cmd/Ctrl + Enter to save, Esc to close
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave()
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
        animation: 'lcFadeIn 120ms ease-out',
      }}
    >
      <div
        onKeyDown={onKey}
        style={{
          width: '100%',
          maxWidth: 540,
          background: '#0f0f10',
          color: '#fff',
          borderRadius: 16,
          border: '1px solid #1f1f1f',
          boxShadow: '0 28px 70px -20px rgba(236,30,121,0.45), 0 4px 12px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '0.85rem 1.1rem',
          borderBottom: '1px solid #1f1f1f',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#EC1E79',
              textTransform: 'uppercase', letterSpacing: '0.14em',
            }}>
              Inline edit
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {label}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', padding: 4, borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem 1.1rem' }}>
          {multiline ? (
            <textarea
              ref={el => { inputRef.current = el }}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              maxLength={maxLength}
              rows={8}
              style={{
                width: '100%',
                resize: 'vertical',
                background: '#161616',
                color: '#fff',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: '0.7rem 0.9rem',
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(236,30,121,0.55)')}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
            />
          ) : (
            <input
              ref={el => { inputRef.current = el }}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              maxLength={maxLength}
              style={{
                width: '100%',
                background: '#161616',
                color: '#fff',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: '0.7rem 0.9rem',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(236,30,121,0.55)')}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
            />
          )}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 8, fontSize: 11, color: '#6b7280',
          }}>
            <span style={{ fontFamily: 'monospace' }}>{cmsKey}</span>
            {maxLength && <span>{draft.length} / {maxLength}</span>}
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            <kbd style={kbdStyle}>{multiline ? 'Cmd/Ctrl + Enter' : 'Enter'}</kbd> to save · <kbd style={kbdStyle}>Esc</kbd> to close
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
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
              type="button"
              onClick={handleSave}
              disabled={saving || draft === initialValue}
              style={{
                background: saving || draft === initialValue ? '#2a2a2a' : '#EC1E79',
                color: saving || draft === initialValue ? '#6b7280' : '#fff',
                border: 'none', borderRadius: 9,
                padding: '0.5rem 1rem', fontSize: 13, fontWeight: 800,
                cursor: saving || draft === initialValue ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: saving || draft === initialValue ? 'none' : '0 6px 16px -6px rgba(236,30,121,0.6)',
              }}
            >
              {saving ? <Loader2 size={14} className="lc-spin" /> : <Check size={14} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lcFadeIn { from { opacity: 0 } to { opacity: 1 } }
        .lc-spin { animation: lcSpin 1s linear infinite; }
        @keyframes lcSpin { to { transform: rotate(360deg) } }
      `}</style>
    </div>,
    document.body,
  )
}

const kbdStyle: React.CSSProperties = {
  background: '#1a1a1b',
  border: '1px solid #2a2a2a',
  borderRadius: 4,
  padding: '1px 5px',
  fontFamily: 'monospace',
  fontSize: 10.5,
  color: '#d1d5db',
}
