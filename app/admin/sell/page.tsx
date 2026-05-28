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
  { value: 'declined', label: 'Declined', color: '#ef4444' },
  { value: 'closed', label: 'Closed', color: '#6b7280' },
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
    <div style={{ padding: '2rem', color: '#fff', background: '#0a0a0a' }}>
      <style>{`
        .sell-table { width: 100%; border-collapse: collapse; background: #0f0f10; border: 1px solid #202022; border-radius: 16px; overflow: hidden; }
        .sell-table th, .sell-table td { padding: 0.85rem 1rem; text-align: left; font-size: 0.875rem; border-bottom: 1px solid #1a1a1c; }
        .sell-table tr:last-child td { border-bottom: none; }
        .sell-table th { background: #161617; color: #9ca3af; font-weight: 700; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.08em; }
        .sell-table tr:hover td { background: rgba(236,30,121,0.05); cursor: pointer; }
        .pill { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; }
        .filter-btn { padding: 0.4rem 0.9rem; border-radius: 999px; border: 1px solid #202022; background: #0f0f10; color: #9ca3af; cursor: pointer; font-size: 0.8rem; font-weight: 700; transition: all 0.15s; }
        .filter-btn.active { background: rgba(236,30,121,0.12); color: #EC1E79; border-color: #EC1E79; }
      `}</style>

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
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
        Buy-back
      </div>
      <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', margin: 0 }}>
        Buy-back Submissions
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '0.4rem 0 2rem' }}>
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
        <p style={{ color: '#9ca3af' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', background: '#0f0f10', borderRadius: '16px', border: '1px solid #202022' }}>
          <div style={{
            width: '44px', height: '44px',
            background: '#161617',
            border: '1px solid #202022',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            color: '#6b7280',
          }}>
            <ImageIcon size={20} />
          </div>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#f4f4f5', margin: '0 0 0.35rem' }}>No submissions{statusFilter !== 'all' ? ` in "${statusFilter}"` : ''} yet</p>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>When someone submits the /sell form, it&apos;ll show up here.</p>
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
                    <span className="pill" style={{ background: `${meta.color}1f`, color: meta.color, border: `1px solid ${meta.color}40` }}>
                      {meta.label}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); deleteSubmission(s.id) }}
                      aria-label="Delete"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        borderRadius: '9px',
                        padding: '0.4rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
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
              role="dialog"
              aria-modal="true"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '560px',
                background: '#0f0f10', height: '100vh',
                overflowY: 'auto', padding: '2rem',
                borderLeft: '1px solid #202022',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '10px', color: '#EC1E79', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 800, margin: '0 0 0.5rem' }}>
                    Submission
                  </p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.025em' }}>
                    {active.name}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                    {new Date(active.createdAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setActive(null)} aria-label="Close" style={{
                  background: '#161617',
                  border: '1px solid #202022',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  borderRadius: '9px',
                  padding: '0.35rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}>
                  <X size={20} />
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
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Game
                </label>
                <p style={{ fontSize: '0.95rem', color: '#fff', margin: 0, textTransform: 'capitalize' }}>
                  {active.game.replace('-', ' ')}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  What they&apos;re selling
                </label>
                <p style={{ fontSize: '0.95rem', color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                  {active.details}
                </p>
              </div>

              {active.estimate && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                    Estimated value
                  </label>
                  <p style={{ fontSize: '0.95rem', color: '#fff', margin: 0 }}>{active.estimate}</p>
                </div>
              )}

              {active.images.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                    <ImageIcon size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Photos ({active.images.length})
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {active.images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a href={src} key={i} target="_blank" rel="noopener noreferrer">
                        <img src={src} alt={`Photo ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '11px', border: '1px solid #202022', display: 'block' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Status
                </label>
                <select
                  value={active.status}
                  onChange={e => updateSubmission(active.id, { status: e.target.value })}
                  style={{
                    width: '100%', padding: '0.6rem 0.8rem',
                    background: '#0c0c0d', border: '1px solid #202022',
                    borderRadius: '11px', color: '#fff', fontSize: '0.875rem',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                >
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Internal notes
                </label>
                <textarea
                  defaultValue={active.adminNotes || ''}
                  onBlur={e => updateSubmission(active.id, { adminNotes: e.target.value })}
                  rows={5}
                  placeholder="Notes for the team about this submission (saved on blur)"
                  style={{
                    width: '100%', padding: '0.6rem 0.8rem',
                    background: '#0c0c0d', border: '1px solid #202022',
                    borderRadius: '11px', color: '#fff', fontSize: '0.875rem',
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
