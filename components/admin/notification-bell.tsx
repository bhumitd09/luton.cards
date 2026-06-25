'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ShoppingBag, RotateCcw, PackageX, Inbox, Check } from 'lucide-react'

interface Note {
  id: string
  type: string
  title: string
  body: string | null
  href: string | null
  read: boolean
  createdAt: string
}

const ICONS: Record<string, React.ElementType> = {
  sale: ShoppingBag,
  order: ShoppingBag,
  refund: RotateCcw,
  'low-stock': PackageX,
  contact: Inbox,
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [unread, setUnread] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotes(data.notifications ?? [])
      setUnread(data.unread ?? 0)
    } catch { /* ignore */ }
  }, [])

  // Poll every 30s; refresh immediately on open.
  useEffect(() => {
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  const markAll = async () => {
    setNotes(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
    await fetch('/api/admin/notifications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }),
    }).catch(() => {})
  }

  const openNote = async (n: Note) => {
    if (!n.read) {
      setNotes(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      setUnread(u => Math.max(0, u - 1))
      fetch('/api/admin/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }),
      }).catch(() => {})
    }
    setOpen(false)
    if (n.href) router.push(n.href)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load() }}
        aria-label="Notifications"
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 9, background: open ? '#1a1a1c' : 'transparent',
          border: '1px solid #202022', color: '#9ca3af', cursor: 'pointer',
        }}
      >
        <Bell size={16.5} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5, minWidth: 17, height: 17, padding: '0 4px',
            borderRadius: 999, background: '#EC1E79', color: '#fff', fontSize: '0.625rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f0f10',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 360, maxWidth: '90vw',
          background: '#0f0f10', border: '1px solid #202022', borderRadius: 14,
          boxShadow: '0 18px 50px -12px rgba(0,0,0,0.7)', zIndex: 100, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1rem', borderBottom: '1px solid #1a1a1c',
          }}>
            <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 800 }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                color: '#EC1E79', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}>
                <Check size={13} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {notes.length === 0 ? (
              <div style={{ padding: '2.25rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.8125rem' }}>
                <Bell size={22} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div>You&apos;re all caught up.</div>
              </div>
            ) : (
              notes.map(n => {
                const Icon = ICONS[n.type] || Bell
                return (
                  <button
                    key={n.id}
                    onClick={() => openNote(n)}
                    style={{
                      display: 'flex', gap: '0.7rem', width: '100%', textAlign: 'left',
                      padding: '0.75rem 1rem', background: n.read ? 'transparent' : 'rgba(236,30,121,0.06)',
                      border: 'none', borderBottom: '1px solid #161617', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161617' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'rgba(236,30,121,0.06)' }}
                  >
                    <span style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: 9,
                      background: n.type === 'refund' ? 'rgba(239,68,68,0.12)' : n.type === 'low-stock' ? 'rgba(245,158,11,0.12)' : 'rgba(236,30,121,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: n.type === 'refund' ? '#ef4444' : n.type === 'low-stock' ? '#f59e0b' : '#EC1E79',
                    }}>
                      <Icon size={15} />
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'block', color: '#f4f4f5', fontSize: '0.8125rem', fontWeight: 700, lineHeight: 1.3 }}>
                        {n.title}
                      </span>
                      {n.body && (
                        <span style={{ display: 'block', color: '#9ca3af', fontSize: '0.75rem', marginTop: 2, lineHeight: 1.4 }}>
                          {n.body}
                        </span>
                      )}
                      <span style={{ display: 'block', color: '#52525b', fontSize: '0.6875rem', marginTop: 4 }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: 999, background: '#EC1E79', marginTop: 6 }} />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
