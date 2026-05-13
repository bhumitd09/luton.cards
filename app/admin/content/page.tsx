'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Check, Save, Plus, X, ChevronUp, ChevronDown,
  Loader2, Type, AlignLeft, Tag,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentItem {
  id?: string
  key: string
  value: string
  type: 'text' | 'json' | 'html' | 'image'
  label: string
  updatedAt?: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateString?: string): string {
  if (!dateString) return 'never'
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatSectionHeader(title: string, subtitle: string) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h2>
      <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.2rem 0 0' }}>{subtitle}</p>
    </div>
  )
}

// ─── SaveButton ───────────────────────────────────────────────────────────────

function SaveButton({ state, onClick }: { state: SaveState; onClick: () => void }) {
  const isLoading = state === 'saving'
  const isSaved = state === 'saved'
  const isError = state === 'error'

  return (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      whileHover={!isLoading ? { scale: 1.03 } : {}}
      whileTap={!isLoading ? { scale: 0.97 } : {}}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.45rem 0.875rem',
        borderRadius: '8px', border: 'none', cursor: isLoading ? 'default' : 'pointer',
        fontWeight: 600, fontSize: '0.8125rem',
        background: isSaved ? 'rgba(236,30,121,0.15)' : isError ? 'rgba(239,68,68,0.15)' : '#EC1E79',
        color: isSaved ? '#EC1E79' : isError ? '#ef4444' : '#000',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLoading && (
          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          </motion.span>
        )}
        {isSaved && (
          <motion.span key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ opacity: 0 }}>
            <Check size={14} />
          </motion.span>
        )}
        {(state === 'idle' || isError) && (
          <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Save size={14} />
          </motion.span>
        )}
      </AnimatePresence>
      {isSaved ? 'Saved' : isError ? 'Error' : 'Save'}
    </motion.button>
  )
}

// ─── TextField ────────────────────────────────────────────────────────────────

function TextField({
  contentKey, label, multiline, allContent, onSaved,
}: {
  contentKey: string
  label: string
  multiline?: boolean
  allContent: Record<string, ContentItem>
  onSaved: (key: string, item: ContentItem) => void
}) {
  const existing = allContent[contentKey]
  const [value, setValue] = useState(existing?.value ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')

  // sync when allContent loads
  useEffect(() => {
    if (existing?.value !== undefined) setValue(existing.value)
  }, [existing?.value])

  const handleSave = useCallback(async () => {
    setSaveState('saving')
    try {
      let res: Response
      if (existing?.id) {
        res = await fetch(`/api/admin/content/${contentKey}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        })
      } else {
        res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: contentKey, value, type: 'text', label }),
        })
      }
      if (!res.ok) throw new Error('Failed')
      const body = await res.json()
      const saved: ContentItem = body.content ?? body
      onSaved(contentKey, saved)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2500)
    }
  }, [contentKey, existing, label, onSaved, value])

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {multiline ? <AlignLeft size={13} color="#6b7280" /> : <Type size={13} color="#6b7280" />}
          {label}
        </label>
        <span style={{ fontSize: '0.6875rem', color: '#4b5563' }}>
          {existing?.updatedAt ? `Updated ${timeAgo(existing.updatedAt)}` : 'Not saved yet'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.625rem', alignItems: multiline ? 'flex-end' : 'center' }}>
        {multiline ? (
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            rows={3}
            style={{
              flex: 1, background: '#161616', border: '1px solid #1f1f1f',
              borderRadius: '10px', color: '#fff', padding: '0.75rem',
              fontSize: '0.875rem', resize: 'vertical', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.6,
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = '#EC1E79' }}
            onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = '#1f1f1f' }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            style={{
              flex: 1, background: '#161616', border: '1px solid #1f1f1f',
              borderRadius: '10px', color: '#fff', padding: '0.65rem 0.875rem',
              fontSize: '0.875rem', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#EC1E79' }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#1f1f1f' }}
          />
        )}
        <SaveButton state={saveState} onClick={handleSave} />
      </div>
    </div>
  )
}

// ─── MarqueeEditor ────────────────────────────────────────────────────────────

function MarqueeEditor({
  allContent, onSaved,
}: {
  allContent: Record<string, ContentItem>
  onSaved: (key: string, item: ContentItem) => void
}) {
  const existing = allContent['marquee_items']
  const [items, setItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')

  useEffect(() => {
    if (existing?.value) {
      try {
        const parsed = JSON.parse(existing.value)
        if (Array.isArray(parsed)) setItems(parsed)
      } catch {
        setItems([])
      }
    }
  }, [existing?.value])

  const addItem = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    setItems(prev => [...prev, trimmed])
    setNewItem('')
  }

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setItems(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (idx: number) => {
    setItems(prev => {
      if (idx === prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  const handleSave = useCallback(async () => {
    setSaveState('saving')
    const value = JSON.stringify(items)
    try {
      let res: Response
      if (existing?.id) {
        res = await fetch('/api/admin/content/marquee_items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        })
      } else {
        res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'marquee_items', value, type: 'json', label: 'Marquee Items' }),
        })
      }
      if (!res.ok) throw new Error('Failed')
      const body = await res.json()
      const saved: ContentItem = body.content ?? body
      onSaved('marquee_items', saved)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2500)
    }
  }, [existing, items, onSaved])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Tag size={13} color="#6b7280" />
          Ticker Items
        </label>
        <span style={{ fontSize: '0.6875rem', color: '#4b5563' }}>
          {existing?.updatedAt ? `Updated ${timeAgo(existing.updatedAt)}` : 'Not saved yet'}
        </span>
      </div>

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <AnimatePresence>
          {items.map((item, idx) => (
            <motion.div
              key={`${item}-${idx}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#161616', border: '1px solid #1f1f1f',
                borderRadius: '10px', padding: '0.5rem 0.75rem',
              }}
            >
              <span style={{ flex: 1, fontSize: '0.875rem', color: '#fff' }}>{item}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  style={{
                    background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer',
                    padding: '2px', color: idx === 0 ? '#2d2d2d' : '#6b7280',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === items.length - 1}
                  style={{
                    background: 'none', border: 'none',
                    cursor: idx === items.length - 1 ? 'default' : 'pointer',
                    padding: '2px', color: idx === items.length - 1 ? '#2d2d2d' : '#6b7280',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <ChevronDown size={15} />
                </button>
                <button
                  onClick={() => removeItem(idx)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px', color: '#6b7280', display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div style={{
            padding: '1rem', background: '#161616', border: '1px dashed #1f1f1f',
            borderRadius: '10px', textAlign: 'center', color: '#4b5563', fontSize: '0.8125rem',
          }}>
            No items yet. Add some below.
          </div>
        )}
      </div>

      {/* Add new item */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addItem() }}
          placeholder="New ticker item..."
          style={{
            flex: 1, background: '#161616', border: '1px solid #1f1f1f',
            borderRadius: '10px', color: '#fff', padding: '0.65rem 0.875rem',
            fontSize: '0.875rem', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#EC1E79' }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#1f1f1f' }}
        />
        <motion.button
          onClick={addItem}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.65rem 0.875rem', borderRadius: '10px',
            background: 'rgba(236,30,121,0.12)', border: '1px solid rgba(236,30,121,0.25)',
            color: '#EC1E79', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem',
          }}
        >
          <Plus size={15} />
          Add
        </motion.button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton state={saveState} onClick={handleSave} />
      </div>
    </div>
  )
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      style={{
        background: '#111', border: '1px solid #1f1f1f',
        borderRadius: '16px', padding: '1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const [allContent, setAllContent] = useState<Record<string, ContentItem>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((data: ContentItem[] | { content: ContentItem[] }) => {
        const map: Record<string, ContentItem> = {}
        const items = Array.isArray(data) ? data : (data as { content: ContentItem[] }).content ?? []
        if (Array.isArray(items)) {
          items.forEach(item => { map[item.key] = item })
        }
        setAllContent(map)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSaved = useCallback((key: string, item: ContentItem) => {
    setAllContent(prev => ({ ...prev, [key]: item }))
  }, [])

  return (
    <div style={{ padding: '2rem', color: '#fff', maxWidth: '860px' }}>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
      >
        <div style={{
          width: '44px', height: '44px',
          background: 'rgba(236,30,121,0.1)', border: '1px solid rgba(236,30,121,0.2)',
          borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FileText size={20} color="#EC1E79" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.025em', margin: 0 }}>
            Content
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
            Page content and website copy
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: '160px', background: '#111', border: '1px solid #1f1f1f',
              borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <SectionCard delay={0.05}>
            {formatSectionHeader('Hero Section', 'Main banner copy displayed at the top of the homepage')}
            <TextField
              contentKey="hero_headline"
              label="Headline"
              multiline
              allContent={allContent}
              onSaved={handleSaved}
            />
            <TextField
              contentKey="hero_subtext"
              label="Subtext"
              multiline
              allContent={allContent}
              onSaved={handleSaved}
            />
          </SectionCard>

          {/* Marquee Ticker */}
          <SectionCard delay={0.1}>
            {formatSectionHeader('Marquee Ticker', 'Scrolling ticker items shown across the site')}
            <MarqueeEditor allContent={allContent} onSaved={handleSaved} />
          </SectionCard>

          {/* Site Settings */}
          <SectionCard delay={0.15}>
            {formatSectionHeader('Site Settings', 'Global site copy and metadata')}
            <TextField
              contentKey="site_tagline"
              label="Site Tagline"
              allContent={allContent}
              onSaved={handleSaved}
            />
          </SectionCard>
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}
