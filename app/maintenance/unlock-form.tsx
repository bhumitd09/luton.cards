'use client'

import { useState } from 'react'

/**
 * Password unlock for the holding page. On success the server sets the bypass
 * cookie; we then reload to the homepage, which the middleware now lets
 * through. Collapsed behind a "Staff?" toggle so customers just see the notice.
 */
export function UnlockForm() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/maintenance/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || 'Incorrect password.')
        setSubmitting(false)
        return
      }
      window.location.href = '/'
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #1a1a1c' }}>
        <button
          onClick={() => setOpen(true)}
          style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Staff? Enter the access password →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #1a1a1c', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Access password"
        style={{
          width: '100%', boxSizing: 'border-box', background: '#0c0c0d',
          border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : '#202022'}`, borderRadius: 11,
          color: '#f4f4f5', padding: '0.7rem 0.85rem', fontSize: 14, outline: 'none',
        }}
      />
      {error && <span style={{ fontSize: 12.5, color: '#ef4444', textAlign: 'left' }}>{error}</span>}
      <button
        type="submit"
        disabled={submitting || !password}
        style={{
          background: 'linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%)', border: 'none',
          borderRadius: 11, color: '#fff', fontWeight: 800, fontSize: 14, padding: '0.75rem',
          cursor: submitting || !password ? 'not-allowed' : 'pointer', opacity: submitting || !password ? 0.6 : 1,
        }}
      >
        {submitting ? 'Unlocking…' : 'Enter site'}
      </button>
    </form>
  )
}
