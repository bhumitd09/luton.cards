'use client'

import { useEffect, useState, useCallback } from 'react'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'

interface Discount {
  id: string
  code: string
  type: string
  value: number
  minOrder: number | null
  maxUses: number | null
  uses: number
  active: boolean
  expiresAt: string | null
  createdAt: string
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function DiscountsPage() {
  const confirm = useConfirm()
  const toast = useToast()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/discounts')
      const data = await res.json()
      if (data.discounts) setDiscounts(data.discounts)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDiscounts()
  }, [fetchDiscounts])

  const resetForm = () => {
    setEditingId(null)
    setCode('')
    setType('percentage')
    setValue('')
    setMinOrder('')
    setMaxUses('')
    setExpiresAt('')
    setFormError(null)
  }

  const openSlideOver = () => {
    resetForm()
    setSlideOverOpen(true)
  }

  // Convert an ISO timestamp to the value a datetime-local input expects.
  const toLocalInput = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const openEdit = (d: Discount) => {
    setEditingId(d.id)
    setCode(d.code)
    setType(d.type === 'fixed' ? 'fixed' : 'percentage')
    setValue(String(d.value))
    setMinOrder(d.minOrder != null ? String(d.minOrder) : '')
    setMaxUses(d.maxUses != null ? String(d.maxUses) : '')
    setExpiresAt(toLocalInput(d.expiresAt))
    setFormError(null)
    setSlideOverOpen(true)
  }

  const closeSlideOver = () => {
    setSlideOverOpen(false)
    resetForm()
  }

  const handleSave = async () => {
    if (!code.trim()) {
      setFormError('Code is required')
      return
    }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setFormError('Value must be a positive number')
      return
    }
    if (type === 'percentage' && Number(value) > 100) {
      setFormError('Percentage cannot exceed 100')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const payload = {
        code: code.trim(),
        type,
        value: Number(value),
        minOrder: minOrder ? Number(minOrder) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
      }
      const res = await fetch(
        editingId ? `/api/admin/discounts/${editingId}` : '/api/admin/discounts',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()
      if (!res.ok) {
        const msg = data.error || (editingId ? 'Failed to update discount' : 'Failed to create discount')
        setFormError(msg)
        toast.error(msg)
        return
      }

      closeSlideOver()
      await fetchDiscounts()
      toast.success(editingId ? 'Discount updated' : 'Discount saved')
    } catch {
      setFormError('Network error. Please try again.')
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (discount: Discount) => {
    try {
      const res = await fetch(`/api/admin/discounts/${discount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !discount.active }),
      })
      if (res.ok) {
        setDiscounts(prev =>
          prev.map(d => d.id === discount.id ? { ...d, active: !discount.active } : d)
        )
      }
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete discount?', message: 'This cannot be undone.', danger: true, confirmLabel: 'Delete' })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDiscounts(prev => prev.filter(d => d.id !== id))
        toast.success('Discount deleted')
      } else {
        toast.error('Could not delete discount')
      }
    } catch {
      toast.error('Could not delete discount')
    }
  }

  const formatValue = (d: Discount) => {
    return d.type === 'percentage' ? `${d.value}%` : `£${d.value.toFixed(2)}`
  }

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return '—'
    return new Date(expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '11px',
    border: '1px solid #202022',
    background: '#0c0c0d',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#9ca3af',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div style={{ padding: '2rem', position: 'relative', minHeight: '100%', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#EC1E79',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            marginBottom: '0.5rem',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            Promotions
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, letterSpacing: '-0.025em', color: '#fff', margin: 0 }}>
            Discount Codes
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.4rem 0 0' }}>
            Manage promotional discount codes
          </p>
        </div>
        <button
          onClick={openSlideOver}
          style={{
            background: 'linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '11px',
            padding: '0.6rem 1.1rem',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New discount
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: '#0f0f10',
        borderRadius: '16px',
        border: '1px solid #202022',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            Loading...
          </div>
        ) : discounts.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{
              width: '44px', height: '44px',
              background: '#161617',
              border: '1px solid #202022',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <p style={{ color: '#f4f4f5', fontWeight: 700, margin: 0 }}>No discount codes yet</p>
            <p style={{ color: '#9ca3af', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
              Create your first discount code to get started
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #202022' }}>
                {['Code', 'Type', 'Value', 'Uses / Max', 'Min Order', 'Expires', 'Status', ''].map(col => (
                  <th key={col} style={{
                    padding: '0.875rem 1rem',
                    textAlign: 'left',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map((d, i) => (
                <tr
                  key={d.id}
                  style={{
                    borderBottom: i < discounts.length - 1 ? '1px solid #1a1a1c' : 'none',
                  }}
                >
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: '#EC1E79',
                      letterSpacing: '0.05em',
                    }}>
                      {d.code}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{
                      fontSize: '0.8125rem',
                      color: '#9ca3af',
                      textTransform: 'capitalize',
                    }}>
                      {d.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f4f4f5' }}>
                      {formatValue(d)}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      {d.uses} / {d.maxUses ?? '∞'}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      {d.minOrder != null ? `£${d.minOrder.toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{
                      fontSize: '0.8125rem',
                      color: d.expiresAt && new Date(d.expiresAt) < new Date() ? '#ef4444' : '#9ca3af',
                    }}>
                      {formatExpiry(d.expiresAt)}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button
                      onClick={() => handleToggleActive(d)}
                      style={{
                        background: d.active ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.12)',
                        border: `1px solid ${d.active ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.25)'}`,
                        borderRadius: '999px',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: d.active ? '#10b981' : '#9ca3af',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      {d.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => openEdit(d)}
                        style={{
                          background: '#161617',
                          border: '1px solid #202022',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: '9px',
                          color: '#9ca3af',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Edit"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: '9px',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Delete"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over overlay */}
      {slideOverOpen && (
        <div
          onClick={closeSlideOver}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 40,
          }}
        />
      )}

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          background: '#0f0f10',
          borderLeft: '1px solid #202022',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: slideOverOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          boxShadow: slideOverOpen ? '-8px 0 32px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Slide-over header */}
        <div style={{
          padding: '1.25rem 1.35rem',
          borderBottom: '1px solid #1a1a1c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
            {editingId ? 'Edit discount' : 'New discount'}
          </h2>
          <button
            onClick={closeSlideOver}
            aria-label="Close"
            style={{
              background: '#161617',
              border: '1px solid #202022',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '0.35rem',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Slide-over body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Code */}
          <div>
            <label style={labelStyle}>Code</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => setCode(generateCode())}
                style={{
                  background: '#161617',
                  border: '1px solid #202022',
                  borderRadius: '11px',
                  color: '#e4e4e7',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0 0.85rem',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
                type="button"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Type */}
          <div>
            <label style={labelStyle}>Type</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['percentage', 'fixed'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '11px',
                    border: `1px solid ${type === t ? '#EC1E79' : '#202022'}`,
                    background: type === t ? 'rgba(236,30,121,0.12)' : '#161617',
                    color: type === t ? '#EC1E79' : '#9ca3af',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  type="button"
                >
                  {t === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                </button>
              ))}
            </div>
          </div>

          {/* Value */}
          <div>
            <label style={labelStyle}>
              Value {type === 'percentage' ? '(%)' : '(£)'}
            </label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={type === 'percentage' ? 'e.g. 10' : 'e.g. 5.00'}
              min="0"
              step={type === 'percentage' ? '1' : '0.01'}
              style={inputStyle}
            />
          </div>

          {/* Min Order */}
          <div>
            <label style={labelStyle}>
              Min Order Value (£) <span style={{ color: '#6b7280', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>optional</span>
            </label>
            <input
              type="number"
              value={minOrder}
              onChange={e => setMinOrder(e.target.value)}
              placeholder="e.g. 50.00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
          </div>

          {/* Max Uses */}
          <div>
            <label style={labelStyle}>
              Max Uses <span style={{ color: '#6b7280', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>optional &mdash; blank for unlimited</span>
            </label>
            <input
              type="number"
              value={maxUses}
              onChange={e => setMaxUses(e.target.value)}
              placeholder="e.g. 100"
              min="1"
              step="1"
              style={inputStyle}
            />
          </div>

          {/* Expiry */}
          <div>
            <label style={labelStyle}>
              Expiry Date <span style={{ color: '#6b7280', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>optional</span>
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              style={inputStyle}
            />
          </div>

          {formError && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
              borderRadius: '11px',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
            }}>
              {formError}
            </div>
          )}
        </div>

        {/* Slide-over footer */}
        <div style={{
          padding: '1rem 1.35rem',
          borderTop: '1px solid #1a1a1c',
          display: 'flex',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          <button
            onClick={closeSlideOver}
            style={{
              flex: 1,
              padding: '0.6rem 1.1rem',
              borderRadius: '11px',
              border: '1px solid #202022',
              background: '#161617',
              color: '#e4e4e7',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2,
              padding: '0.6rem 1.1rem',
              borderRadius: '11px',
              border: 'none',
              background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'inherit',
              boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
            }}
          >
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Code'}
          </button>
        </div>
      </div>
    </div>
  )
}
