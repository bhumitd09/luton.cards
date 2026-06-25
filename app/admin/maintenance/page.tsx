'use client'

import { useEffect, useState } from 'react'
import { Lock, Unlock, Globe, ShieldAlert } from 'lucide-react'
import { useToast } from '@/components/admin/toast'

const T = {
  panel: '#0f0f10', raised: '#161617', border: '#202022', pink: '#EC1E79',
  text: '#f4f4f5', dim: '#9ca3af', faint: '#6b7280',
}

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0c0c0d', border: `1px solid ${T.border}`,
  borderRadius: 11, color: T.text, padding: '0.65rem 0.85rem', fontSize: 14, outline: 'none',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 800, color: T.faint,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
}

export default function MaintenancePage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/content')
      .then(r => (r.ok ? r.json() : { content: [] }))
      .then(data => {
        const map = new Map<string, string>((data.content || []).map((c: { key: string; value: string }) => [c.key, c.value]))
        setEnabled(map.get('maintenance_enabled') === 'true')
        setPassword(map.get('maintenance_password') || '')
        setTitle(map.get('maintenance_title') || '')
        setMessage(map.get('maintenance_message') || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveKey = (key: string, value: string, label: string) =>
    fetch('/api/admin/content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, type: 'text', label }),
    })

  const persist = async (nextEnabled: boolean) => {
    if (nextEnabled && !password.trim()) {
      toast.error('Set an access password first — so you can still get in while the site is locked.')
      return
    }
    setSaving(true)
    try {
      const results = await Promise.all([
        saveKey('maintenance_enabled', nextEnabled ? 'true' : 'false', 'Maintenance enabled'),
        saveKey('maintenance_password', password.trim(), 'Maintenance password'),
        saveKey('maintenance_title', title.trim(), 'Maintenance title'),
        saveKey('maintenance_message', message.trim(), 'Maintenance message'),
      ])
      if (results.some(r => !r.ok)) {
        toast.error('Could not save. Are you signed in as superadmin?')
        return
      }
      setEnabled(nextEnabled)
      toast.success(nextEnabled ? 'Site locked — visitors now see the holding page.' : 'Site unlocked — store is live.')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', color: T.dim }}>Loading…</div>
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 720 }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.pink }}>
        System
      </p>
      <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: T.text }}>
        Site Lock
      </h1>
      <p style={{ margin: '0 0 1.75rem', fontSize: 14, color: T.dim }}>
        Put up a holding page while you work on the site or restock. You and anyone with the password still get in.
      </p>

      {/* Status + toggle */}
      <div style={{
        background: enabled ? 'rgba(239,68,68,0.06)' : T.panel,
        border: `1px solid ${enabled ? 'rgba(239,68,68,0.3)' : T.border}`,
        borderRadius: 16, padding: '1.25rem 1.4rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: enabled ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: enabled ? '#ef4444' : '#10b981',
          }}>
            {enabled ? <Lock size={19} /> : <Globe size={19} />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>
              {enabled ? 'Site is LOCKED' : 'Site is LIVE'}
            </div>
            <div style={{ fontSize: 13, color: T.dim, marginTop: 2 }}>
              {enabled ? 'Visitors see the holding page.' : 'Everyone can shop normally.'}
            </div>
          </div>
        </div>
        <button
          onClick={() => persist(!enabled)}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.7rem 1.2rem',
            borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer',
            border: '1px solid',
            borderColor: enabled ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)',
            background: enabled ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: enabled ? '#10b981' : '#ef4444',
          }}
        >
          {enabled ? <><Unlock size={15} /> Unlock site</> : <><Lock size={15} /> Lock site</>}
        </button>
      </div>

      {/* Settings */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: '1.4rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Access password</label>
          <input style={input} type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="e.g. cards2026" />
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: T.faint, display: 'flex', gap: 6 }}>
            <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            Share this with anyone who needs to preview the site while it&apos;s locked. You&apos;re always let through automatically when signed into the back office.
          </p>
        </div>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Holding page heading</label>
          <input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="We’ll be right back" />
        </div>
        <div style={{ marginBottom: '1.4rem' }}>
          <label style={labelStyle}>Holding page message</label>
          <textarea style={{ ...input, minHeight: 90, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} placeholder="We're updating the shop and restocking some cards. Back very soon!" />
        </div>
        <button
          onClick={() => persist(enabled)}
          disabled={saving}
          style={{
            background: 'linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%)', border: 'none',
            borderRadius: 11, color: '#fff', fontWeight: 800, fontSize: 14, padding: '0.7rem 1.4rem',
            cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
