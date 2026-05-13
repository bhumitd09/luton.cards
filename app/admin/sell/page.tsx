'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Image as ImageIcon, X, Trash2 } from 'lucide-react'

interface SellSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  game: string
  details: string
  estimate: string | null
  images: string[]
  status: string
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

const STATUSES = [
  { value: 'new', label: 'New', color: '#EC1E79' },
  { value: 'reviewing', label: 'Reviewing', color: '#f59e0b' },
  { value: 'offered', label: 'Offered', color: '#3b82f6' },
  { value: 'accepted', label: 'Accepted', color: '#10b981' },
  { value: 'declined', label: 'Declined', color: '#6b7280' },
  { value: 'closed', label: 'Closed', color: '#374151' },
]

function statusMeta(status: string) {
  return STATUSES.find(s => s.value === status) ?? STATUSES[0]
}

export default function AdminSellPage() {
  const [submissions, setSubmissions] = useState<SellSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<SellSubmission | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const load = () => {
    setLoading(true)
    fetch('/api/admin/sell')
      .then(r => r.json())
      .then(data => {
        setSubmissions(Array.isArray(data?.submissions) ? data.submissions : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = statusFilter === 'all' ? submissions : submissions.filter(s => s.status === statusFilter)

  const updateSubmission = async (id: string, patch: Partial<Pick<SellSubmission, 'status' | 'adminNotes'>>) => {
    const res = await fetch(`/api/admin/sell/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const data = await res.json()
      setSubmissions(prev => prev.map(s => (s.id === id ? data.submission : s)))
      if (active?.id === id) setActive(data.submission)
    }
  }

  const deleteSubmission = async (id: string) => {
    if (!confirm('Delete this submission? This cannot be undone.')) return
    const res = await fetch(`/api/admin/sell/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSubmissions(prev => prev.filter(s => s.id !== id))
      if (active?.id === id) setActive(null)
    }
  }

  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <style>{`
        .sell-table { width: 100%; border-collapse: collapse; background: #111; border-radius: 12px; overflow: hidden; }
        .sell-table th, .sell-table td { padding: 0.85rem 1rem; text-align: left; font-size: 0.875rem; border-bottom: 1px solid #1f1f1f; }
        .sell-table th { background: #161616; color: #9ca3af; font-weight: 700; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.08em; }
        .sell-table tr:hover td { background: rgba(236,30,121,0.04); cursor: pointer; }
        .pill { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; }
        .filter-btn { padding: 0.4rem 0.9rem; border-radius: 999px; border: 1px solid #1f1f1f; background: transparent; color: #9ca3af; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.15s; }
        .filter-btn.active { background: #EC1E79; color: #fff; border-color: #EC1E79; }
      `}</style>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
        Buy-back Submissions
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '0 0 2rem' }}>
        Cards customers want to sell to Luton Cards.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
          All ({submissions.length})
        </button>
        {STATUSES.map(s => {
          const count = submissions.filter(x => x.status === s.value).length
          return (
            <button key={s.value} className={`filter-btn ${statusFilter === s.value ? 'active' : ''}`} onClick={() => setStatusFilter(s.value)}>
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#6b7280', background: '#111', borderRadius: '12px', border: '1px solid #1f1f1f' }}>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#9ca3af', margin: '0 0 0.5rem' }}>No submissions{statusFilter !== 'all' ? ` in "${statusFilter}"` : ''} yet</p>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>When someone submits the /sell form, it&apos;ll show up here.</p>
        </div>
      ) : (
        <table className="sell-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>Name</th>
              <th>Email</th>
              <th>Game</th>
              <th>Photos</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const meta = statusMeta(s.status)
              return (
                <tr key={s.id} onClick={() => setActive(s)}>
                  <td style={{ color: '#9ca3af' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ color: '#9ca3af' }}>{s.email}</td>
                  <td style={{ textTransform: 'capitalize', color: '#9ca3af' }}>{s.game.replace('-', ' ')}</td>
                  <td style={{ color: '#9ca3af' }}>{s.images.length}</td>
                  <td>
                    <span className="pill" style={{ background: `${meta.color}22`, color: meta.color }}>
                      {meta.label}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); deleteSubmission(s.id) }}
                      aria-label="Delete"
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
              display: 'flex', justifyContent: 'flex-end', zIndex: 300,
            }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '560px',
                background: '#0d0d0d', height: '100vh',
                overflowY: 'auto', padding: '2rem',
                borderLeft: '1px solid #1f1f1f',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 0.5rem' }}>
                    Submission
                  </p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                    {active.name}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                    {new Date(active.createdAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setActive(null)} aria-label="Close" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
                <a href={`mailto:${active.email}`} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: '#EC1E79', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
                  <Mail size={15} /> {active.email}
                </a>
                {active.phone && (
                  <a href={`tel:${active.phone}`} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: '#fff', fontSize: '0.9rem', textDecoration: 'none' }}>
                    <Phone size={15} /> {active.phone}
                  </a>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Game
                </label>
                <p style={{ fontSize: '0.95rem', color: '#fff', margin: 0, textTransform: 'capitalize' }}>
                  {active.game.replace('-', ' ')}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  What they&apos;re selling
                </label>
                <p style={{ fontSize: '0.95rem', color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                  {active.details}
                </p>
              </div>

              {active.estimate && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                    Estimated value
                  </label>
                  <p style={{ fontSize: '0.95rem', color: '#fff', margin: 0 }}>{active.estimate}</p>
                </div>
              )}

              {active.images.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                    <ImageIcon size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Photos ({active.images.length})
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {active.images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a href={src} key={i} target="_blank" rel="noopener noreferrer">
                        <img src={src} alt={`Photo ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', border: '1px solid #1f1f1f', display: 'block' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Status
                </label>
                <select
                  value={active.status}
                  onChange={e => updateSubmission(active.id, { status: e.target.value })}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem',
                    background: '#161616', border: '1px solid #1f1f1f',
                    borderRadius: '8px', color: '#fff', fontSize: '0.875rem',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                >
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Internal notes
                </label>
                <textarea
                  defaultValue={active.adminNotes || ''}
                  onBlur={e => updateSubmission(active.id, { adminNotes: e.target.value })}
                  rows={5}
                  placeholder="Notes for the team about this submission (saved on blur)"
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem',
                    background: '#161616', border: '1px solid #1f1f1f',
                    borderRadius: '8px', color: '#fff', fontSize: '0.875rem',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    lineHeight: 1.6, boxSizing: 'border-box',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
