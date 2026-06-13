'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, Mail, Archive, Trash2, CheckCheck } from 'lucide-react'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  createdAt: string
}

type Filter = 'all' | 'new' | 'read' | 'archived'

const STATUS_META: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: '#EC1E79' },
  read: { label: 'Read', color: '#9ca3af' },
  archived: { label: 'Archived', color: '#6b7280' },
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.read
  return (
    <span
      style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        background: `${meta.color}1f`,
        color: meta.color,
        border: `1px solid ${meta.color}33`,
        whiteSpace: 'nowrap',
        textTransform: 'capitalize',
      }}
    >
      {meta.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ContactInboxPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const confirm = useConfirm()
  const toast = useToast()

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/contact')
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const patchStatus = async (id: string, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, status } : m)))
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const handleRowClick = (msg: ContactMessage) => {
    const opening = expandedId !== msg.id
    setExpandedId(opening ? msg.id : null)
    // Auto-mark a 'new' message as read on open.
    if (opening && msg.status === 'new') {
      patchStatus(msg.id, 'read')
    }
  }

  const markRead = async (msg: ContactMessage) => {
    const ok = await patchStatus(msg.id, 'read')
    if (ok) toast.success('Marked as read')
    else toast.error('Could not update message')
  }

  const archive = async (msg: ContactMessage) => {
    const ok = await patchStatus(msg.id, 'archived')
    if (ok) toast.success('Archived')
    else toast.error('Could not archive message')
  }

  const handleDelete = async (msg: ContactMessage) => {
    const ok = await confirm({
      title: 'Delete message?',
      message: `Permanently delete the message from ${msg.name}? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/contact/${msg.id}`, { method: 'DELETE' })
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msg.id))
        if (expandedId === msg.id) setExpandedId(null)
        toast.success('Deleted')
      } else {
        toast.error('Could not delete message')
      }
    } catch {
      toast.error('Could not delete message')
    }
  }

  const counts = {
    all: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    archived: messages.filter(m => m.status === 'archived').length,
  }

  const filtered = messages.filter(m => (filter === 'all' ? true : m.status === filter))

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'read', label: 'Read' },
    { key: 'archived', label: 'Archived' },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
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
          <Inbox size={12} />
          Inbox
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, letterSpacing: '-0.025em', color: '#fff', margin: 0 }}>
          Contact Messages
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.4rem 0 0' }}>
          Messages submitted through the website contact form
        </p>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {FILTERS.map(({ key, label }) => {
          const active = filter === key
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '0.375rem 0.9rem',
                borderRadius: '999px',
                border: active ? '1px solid #EC1E79' : '1px solid #202022',
                background: active ? 'rgba(236,30,121,0.12)' : '#0f0f10',
                color: active ? '#EC1E79' : '#9ca3af',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {label}
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.05rem 0.4rem',
                borderRadius: '999px',
                background: active ? 'rgba(236,30,121,0.2)' : '#161617',
                color: active ? '#EC1E79' : '#6b7280',
              }}>
                {counts[key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: '#9ca3af', padding: '3rem', textAlign: 'center' }}>Loading messages…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#0f0f10',
          border: '1px solid #202022',
          borderRadius: '16px',
          padding: '4rem 3rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '44px', height: '44px',
            background: '#161617',
            border: '1px solid #202022',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            color: '#6b7280',
          }}>
            <Inbox size={20} />
          </div>
          <p style={{ color: '#f4f4f5', fontWeight: 700, margin: 0 }}>
            {filter === 'all' ? 'No messages yet' : `No ${filter} messages`}
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
            Messages from the contact form will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(msg => {
            const expanded = expandedId === msg.id
            return (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#0f0f10',
                  border: expanded ? '1px solid rgba(236,30,121,0.3)' : '1px solid #202022',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                {/* Row */}
                <div
                  onClick={() => handleRowClick(msg)}
                  style={{
                    padding: '1.1rem 1.35rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ color: '#f4f4f5', fontWeight: 700, fontSize: '0.9375rem' }}>
                        {msg.name}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{msg.email}</span>
                      <StatusPill status={msg.status} />
                    </div>
                    <div style={{ color: '#e4e4e7', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>
                      {msg.subject}
                    </div>
                    {!expanded && (
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '0.8125rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {msg.message}
                      </div>
                    )}
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                    {formatDate(msg.createdAt)}
                  </span>
                </div>

                {/* Expanded drawer */}
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      key="drawer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ borderTop: '1px solid #1a1a1c', padding: '1.25rem 1.35rem' }}>
                        <div style={{
                          background: '#161617',
                          border: '1px solid #202022',
                          borderRadius: '12px',
                          padding: '1rem 1.1rem',
                          color: '#d4d4d8',
                          fontSize: '0.9rem',
                          lineHeight: 1.65,
                          whiteSpace: 'pre-wrap',
                          marginBottom: '1rem',
                        }}>
                          {msg.message}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a
                            href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + msg.subject)}`}
                            onClick={e => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
                              color: '#fff',
                              textDecoration: 'none',
                              border: 'none',
                              borderRadius: '11px',
                              padding: '0.5rem 0.9rem',
                              fontSize: '0.8125rem',
                              fontWeight: 800,
                              boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
                            }}
                          >
                            <Mail size={14} /> Reply
                          </a>

                          {msg.status !== 'read' && (
                            <button
                              onClick={e => { e.stopPropagation(); markRead(msg) }}
                              style={secondaryBtnStyle}
                            >
                              <CheckCheck size={14} /> Mark read
                            </button>
                          )}

                          {msg.status !== 'archived' && (
                            <button
                              onClick={e => { e.stopPropagation(); archive(msg) }}
                              style={secondaryBtnStyle}
                            >
                              <Archive size={14} /> Archive
                            </button>
                          )}

                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(msg) }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.25)',
                              borderRadius: '11px',
                              padding: '0.5rem 0.9rem',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              color: '#ef4444',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  background: '#161617',
  border: '1px solid #202022',
  borderRadius: '11px',
  padding: '0.5rem 0.9rem',
  fontSize: '0.8125rem',
  fontWeight: 700,
  color: '#e4e4e7',
  cursor: 'pointer',
}
