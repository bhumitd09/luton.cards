'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Image as ImageIcon, Trash2, Copy, Check,
  Loader2, FileImage, X, ChevronLeft, ChevronRight,
  Search, Grid, List, Upload,
} from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaItem {
  id: string
  filename: string
  url: string
  size: number
  mimeType: string
  alt?: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function truncateFilename(name: string, max = 22): string {
  if (name.length <= max) return name
  const ext = name.lastIndexOf('.')
  if (ext > 0) {
    const base = name.slice(0, ext)
    const extension = name.slice(ext)
    return `${base.slice(0, max - extension.length - 3)}...${extension}`
  }
  return `${name.slice(0, max - 3)}...`
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
      background: 'linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%)', color: '#fff',
      padding: '0.65rem 1.1rem', borderRadius: '11px',
      fontWeight: 800, fontSize: '0.875rem',
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
      animation: 'slideIn 0.2s ease',
    }}>
      <Check size={15} />
      {message}
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void
  onUploaded: (urls: string[]) => void
}) {
  const [pendingImages, setPendingImages] = useState<string[]>([])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDone = () => {
    if (pendingImages.length > 0) onUploaded(pendingImages)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0f10', border: '1px solid #202022',
          borderRadius: '16px', padding: '1.5rem',
          width: '100%', maxWidth: '560px',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'rgba(236,30,121,0.12)', border: '1px solid rgba(236,30,121,0.25)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={16} color="#EC1E79" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em', margin: 0, color: '#f4f4f5' }}>Upload Images</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        <ImageUploader
          images={pendingImages}
          onChange={setPendingImages}
          max={20}
          label="Select images to upload"
        />

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.1rem', background: '#161617',
              border: '1px solid #202022', borderRadius: '11px',
              color: '#e4e4e7', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={pendingImages.length === 0}
            style={{
              padding: '0.6rem 1.4rem',
              background: pendingImages.length === 0 ? '#161617' : 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
              border: pendingImages.length === 0 ? '1px solid #202022' : 'none', borderRadius: '11px',
              color: pendingImages.length === 0 ? '#6b7280' : '#fff', fontWeight: 800, fontSize: '0.85rem',
              boxShadow: pendingImages.length === 0 ? 'none' : '0 8px 22px -10px rgba(236,30,121,0.6)',
              cursor: pendingImages.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {pendingImages.length === 0 ? 'No images yet' : `Add ${pendingImages.length} to Library`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Full Preview Modal ───────────────────────────────────────────────────────

function PreviewModal({
  item,
  onClose,
  onDelete,
  onAltSave,
  onCopy,
}: {
  item: MediaItem
  onClose: () => void
  onDelete: (id: string) => void
  onAltSave: (id: string, alt: string) => void
  onCopy: (url: string) => void
}) {
  const [altText, setAltText] = useState(item.alt ?? '')
  const [savingAlt, setSavingAlt] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleAltSave = async () => {
    setSavingAlt(true)
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt: altText }),
      })
      if (!res.ok) throw new Error('Failed to save')
      onAltSave(item.id, altText)
    } finally {
      setSavingAlt(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' })
      onDelete(item.id)
      onClose()
    } catch {
      setDeleting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '0.6rem 0.8rem',
    background: '#0c0c0d', border: '1px solid #202022',
    borderRadius: '11px', color: '#fff', fontSize: '0.875rem',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0f10', border: '1px solid #202022',
          borderRadius: '16px', overflow: 'hidden',
          maxWidth: '800px', width: '100%',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #1a1a1c',
        }}>
          <div>
            <p style={{ fontWeight: 800, color: '#f4f4f5', fontSize: '0.9375rem', letterSpacing: '-0.01em', margin: 0 }}>
              {item.filename}
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
              {item.mimeType} &middot; {formatBytes(item.size)} &middot; {timeAgo(item.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Image */}
        <div style={{
          background: '#0a0a0a', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          maxHeight: '55vh', overflow: 'hidden',
        }}>
          <img
            src={item.url}
            alt={item.alt ?? item.filename}
            style={{ maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Footer actions */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid #1a1a1c', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* URL copy */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              readOnly
              value={item.url}
              style={{ ...inputStyle, color: '#9ca3af', cursor: 'text' }}
            />
            <button
              onClick={() => onCopy(item.url)}
              style={{
                padding: '0.6rem 1.1rem', background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
                border: 'none', borderRadius: '11px',
                color: '#fff', fontWeight: 800, fontSize: '0.8125rem',
                boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                flexShrink: 0,
              }}
            >
              <Copy size={13} /> Copy URL
            </button>
          </div>

          {/* Alt text */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder="Alt text (describe the image)"
              style={inputStyle}
            />
            <button
              onClick={handleAltSave}
              disabled={savingAlt}
              style={{
                padding: '0.6rem 1.1rem', background: '#161617',
                border: '1px solid #202022', borderRadius: '11px',
                color: '#e4e4e7', fontWeight: 700, fontSize: '0.8125rem',
                cursor: savingAlt ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                flexShrink: 0,
              }}
            >
              {savingAlt ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
              Save Alt
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              alignSelf: 'flex-start',
              padding: '0.6rem 1.1rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '11px', color: '#ef4444',
              fontWeight: 700, fontSize: '0.8125rem', cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}
          >
            {deleting
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <Trash2 size={13} />}
            {deleting ? 'Deleting...' : 'Delete Image'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

function GridCard({
  item,
  selected,
  bulkMode,
  onSelect,
  onDelete,
  onCopy,
  onPreview,
}: {
  item: MediaItem
  selected: boolean
  bulkMode: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onCopy: (url: string) => void
  onPreview: (item: MediaItem) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' })
      onDelete(item.id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }, [confirmDelete, item.id, onDelete])

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onCopy(item.url)
  }, [item.url, onCopy])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
      onClick={() => bulkMode ? onSelect(item.id) : onPreview(item)}
      style={{
        background: '#0f0f10',
        border: `1px solid ${selected ? 'rgba(236,30,121,0.5)' : hovered ? '#2c2c2e' : '#202022'}`,
        borderRadius: '16px', overflow: 'hidden', position: 'relative',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: selected
          ? '0 0 0 2px rgba(236,30,121,0.25)'
          : hovered ? '0 12px 28px -12px rgba(0,0,0,0.6)' : 'none',
      }}
    >
      {/* Checkbox in bulk mode */}
      {bulkMode && (
        <div
          onClick={e => { e.stopPropagation(); onSelect(item.id) }}
          style={{
            position: 'absolute', top: '8px', left: '8px', zIndex: 3,
            width: '20px', height: '20px', borderRadius: '6px',
            background: selected ? '#EC1E79' : 'rgba(0,0,0,0.7)',
            border: `2px solid ${selected ? '#EC1E79' : '#4b5563'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {selected && <Check size={12} color="#fff" />}
        </div>
      )}

      {/* Thumbnail */}
      <div style={{ width: '100%', paddingBottom: '70%', position: 'relative', background: '#0a0a0a', overflow: 'hidden' }}>
        <img
          src={item.url}
          alt={item.alt ?? item.filename}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.2s ease',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
          }}
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
        />

        {/* Hover overlay */}
        {!bulkMode && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            opacity: hovered ? 1 : 0, transition: 'opacity 0.15s ease',
          }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)', color: '#fff', border: 'none',
                cursor: 'pointer', padding: '0.5rem 0.875rem',
                borderRadius: '11px', fontWeight: 800, fontSize: '0.8125rem',
                boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}
            >
              <Copy size={13} /> Copy URL
            </button>

            {confirmDelete ? (
              <div style={{ display: 'flex', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={handleDelete} disabled={deleting}
                  style={{
                    background: '#ef4444', color: '#fff',
                    border: 'none', cursor: deleting ? 'default' : 'pointer',
                    padding: '0.5rem 0.75rem', borderRadius: '11px',
                    fontWeight: 800, fontSize: '0.8125rem',
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                  }}
                >
                  {deleting && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
                  Delete?
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
                  style={{
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    border: '1px solid #374151', cursor: 'pointer',
                    padding: '0.5rem', borderRadius: '11px', display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                style={{
                  background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.25)',
                  cursor: 'pointer', padding: '0.5rem',
                  borderRadius: '11px', display: 'flex', alignItems: 'center',
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.625rem 0.75rem' }}>
        <p style={{
          fontSize: '0.8125rem', fontWeight: 700, color: '#f4f4f5',
          margin: '0 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }} title={item.filename}>
          {truncateFilename(item.filename)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>{formatBytes(item.size)}</span>
          <span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{timeAgo(item.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function ListRow({
  item,
  selected,
  bulkMode,
  onSelect,
  onDelete,
  onCopy,
  onPreview,
}: {
  item: MediaItem
  selected: boolean
  bulkMode: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onCopy: (url: string) => void
  onPreview: (item: MediaItem) => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' })
      onDelete(item.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div
      onClick={() => bulkMode ? onSelect(item.id) : onPreview(item)}
      style={{
        display: 'grid',
        gridTemplateColumns: bulkMode ? '28px 56px 1fr auto auto auto auto' : '56px 1fr auto auto auto auto',
        gap: '1rem', alignItems: 'center',
        padding: '0.75rem 1rem',
        background: selected ? 'rgba(236,30,121,0.12)' : '#0f0f10',
        border: `1px solid ${selected ? 'rgba(236,30,121,0.3)' : '#202022'}`,
        borderRadius: '11px', cursor: 'pointer',
        transition: 'background 0.1s ease, border-color 0.1s ease',
      }}
    >
      {bulkMode && (
        <div
          onClick={e => { e.stopPropagation(); onSelect(item.id) }}
          style={{
            width: '18px', height: '18px', borderRadius: '5px',
            background: selected ? '#EC1E79' : 'transparent',
            border: `2px solid ${selected ? '#EC1E79' : '#4b5563'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
          }}
        >
          {selected && <Check size={10} color="#fff" />}
        </div>
      )}

      <img
        src={item.url}
        alt={item.alt ?? item.filename}
        style={{
          width: '48px', height: '48px', objectFit: 'cover',
          borderRadius: '12px', background: '#0a0a0a', flexShrink: 0,
        }}
        onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
      />

      <span style={{
        fontSize: '0.875rem', fontWeight: 700, color: '#f4f4f5',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={item.filename}>
        {item.filename}
      </span>

      <span style={{ fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
        {formatBytes(item.size)}
      </span>
      <span style={{ fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
        {item.mimeType.split('/')[1]?.toUpperCase() ?? item.mimeType}
      </span>
      <span style={{ fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
        {timeAgo(item.createdAt)}
      </span>

      <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onCopy(item.url)}
          style={{
            padding: '0.45rem 0.75rem', background: 'rgba(236,30,121,0.12)',
            border: '1px solid rgba(236,30,121,0.25)', borderRadius: '11px',
            color: '#EC1E79', cursor: 'pointer', fontSize: '0.75rem',
            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem',
          }}
        >
          <Copy size={12} /> Copy
        </button>
        <button
          onClick={handleDelete} disabled={deleting}
          style={{
            padding: '0.45rem 0.55rem',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '11px', color: '#ef4444',
            cursor: deleting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          {deleting
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchMedia = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '24' })
      if (q) params.set('search', q)
      const res = await fetch(`/api/admin/media?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json() as { media: MediaItem[]; pagination: Pagination }
      setMedia(Array.isArray(data.media) ? data.media : [])
      setPagination(data.pagination ?? null)
    } catch {
      setMedia([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMedia(page, search)
  }, [fetchMedia, page, search])

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 350)
  }

  // After upload, refresh grid
  const handleUploaded = useCallback((urls: string[]) => {
    // Refresh from DB to get accurate Media records (with IDs)
    setPage(1)
    setSearch('')
    setSearchInput('')
    fetchMedia(1, '')
    setToast(`${urls.length} image${urls.length !== 1 ? 's' : ''} uploaded!`)
  }, [fetchMedia])

  const handleDelete = useCallback((id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id))
    setPagination(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : null)
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
    setToast('Image deleted.')
  }, [])

  const handleAltSave = useCallback((id: string, alt: string) => {
    setMedia(prev => prev.map(m => m.id === id ? { ...m, alt } : m))
    setToast('Alt text saved.')
  }, [])

  const handleCopy = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setToast('URL copied to clipboard!')
    } catch {
      setToast('Could not copy — check browser permissions.')
    }
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }, [])

  const handleSelectAll = () => {
    if (selected.size === media.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(media.map(m => m.id)))
    }
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    const ids = Array.from(selected)
    await Promise.allSettled(ids.map(id => fetch(`/api/admin/media/${id}`, { method: 'DELETE' })))
    setMedia(prev => prev.filter(m => !selected.has(m.id)))
    setPagination(prev => prev ? { ...prev, total: Math.max(0, prev.total - ids.length) } : null)
    setSelected(new Set())
    setBulkMode(false)
    setBulkDeleting(false)
    setToast(`${ids.length} image${ids.length !== 1 ? 's' : ''} deleted.`)
  }

  const totalItems = pagination?.total ?? media.length
  const totalPages = pagination?.totalPages ?? 1

  return (
    <div style={{ padding: '2rem', color: '#f4f4f5', maxWidth: '1400px' }}>
      {/* Page header */}
      <div style={{
        marginBottom: '1.75rem',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <p style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em',
            color: '#EC1E79', margin: '0 0 0.45rem',
          }}>
            <ImageIcon size={11} /> Library
          </p>
          <h1 style={{ fontSize: 'clamp(1.4rem,2.5vw,1.75rem)', fontWeight: 900, letterSpacing: '-0.025em', margin: 0, color: '#f4f4f5' }}>
            Media Library
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            {loading ? 'Loading...' : (
              <>
                <span style={{ color: '#f4f4f5', fontWeight: 700 }}>{totalItems}</span>
                {' image'}{totalItems !== 1 ? 's' : ''}{' saved'}
              </>
            )}
          </p>
        </div>

        {/* Toolbar right side */}
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#4b5563" style={{
              position: 'absolute', left: '10px', top: '50%',
              transform: 'translateY(-50%)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search images..."
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              style={{
                padding: '0.6rem 0.8rem 0.6rem 2.1rem',
                background: '#0c0c0d', border: '1px solid #202022',
                borderRadius: '11px', color: '#fff', fontSize: '0.875rem',
                outline: 'none', width: '200px',
              }}
            />
          </div>

          {/* Grid / List toggle */}
          <div style={{
            display: 'flex', background: '#161617', border: '1px solid #202022',
            borderRadius: '11px', overflow: 'hidden',
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.55rem 0.75rem', border: 'none', cursor: 'pointer',
                background: viewMode === 'grid' ? 'rgba(236,30,121,0.12)' : 'transparent',
                color: viewMode === 'grid' ? '#EC1E79' : '#9ca3af',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.55rem 0.75rem', border: 'none', cursor: 'pointer',
                background: viewMode === 'list' ? 'rgba(236,30,121,0.12)' : 'transparent',
                color: viewMode === 'list' ? '#EC1E79' : '#9ca3af',
                display: 'flex', alignItems: 'center',
              }}
            >
              <List size={15} />
            </button>
          </div>

          {/* Bulk select toggle */}
          <button
            onClick={() => { setBulkMode(v => !v); setSelected(new Set()) }}
            style={{
              padding: '0.6rem 1.1rem',
              background: bulkMode ? 'rgba(236,30,121,0.12)' : '#161617',
              border: `1px solid ${bulkMode ? 'rgba(236,30,121,0.25)' : '#202022'}`,
              borderRadius: '11px', color: bulkMode ? '#EC1E79' : '#e4e4e7',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.8125rem',
            }}
          >
            {bulkMode ? 'Cancel' : 'Select'}
          </button>

          {/* Upload button */}
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)', color: '#fff',
              padding: '0.6rem 1.1rem', borderRadius: '11px',
              border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem',
              boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
            }}
          >
            <Upload size={15} />
            Upload Images
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {bulkMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(236,30,121,0.12)', border: '1px solid rgba(236,30,121,0.25)',
          borderRadius: '11px', marginBottom: '1.25rem',
        }}>
          <button
            onClick={handleSelectAll}
            style={{
              padding: '0.45rem 0.875rem', background: '#161617',
              border: '1px solid #202022', borderRadius: '11px',
              color: '#e4e4e7', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
            }}
          >
            {selected.size === media.length ? 'Deselect All' : 'Select All'}
          </button>
          <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
            {selected.size} selected
          </span>
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete} disabled={bulkDeleting}
              style={{
                padding: '0.45rem 0.875rem',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '11px', color: '#ef4444',
                cursor: bulkDeleting ? 'not-allowed' : 'pointer',
                fontSize: '0.8125rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              {bulkDeleting
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <Trash2 size={13} />}
              Delete selected
            </button>
          )}
        </div>
      )}

      {/* Media grid / list / loading / empty */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr',
          gap: '1rem',
        }}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                background: '#0f0f10', border: '1px solid #202022',
                borderRadius: '16px', overflow: 'hidden', opacity: 1 - i * 0.06,
              }}
            >
              <div style={{ width: '100%', paddingBottom: viewMode === 'grid' ? '70%' : '0', height: viewMode === 'list' ? '64px' : undefined, background: '#161617' }} />
              {viewMode === 'grid' && (
                <div style={{ padding: '0.625rem 0.75rem' }}>
                  <div style={{ height: '12px', background: '#202022', borderRadius: '6px', marginBottom: '0.4rem' }} />
                  <div style={{ height: '10px', background: '#1a1a1c', borderRadius: '6px', width: '55%' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : media.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '5rem 2rem',
          background: '#0f0f10', border: '1px solid #202022', borderRadius: '16px',
        }}>
          <div style={{
            width: '44px', height: '44px',
            background: '#161617', border: '1px solid #202022',
            borderRadius: '999px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <FileImage size={20} color="#6b7280" />
          </div>
          <p style={{ fontWeight: 800, color: '#f4f4f5', fontSize: '1rem', marginBottom: '0.4rem' }}>
            {search ? 'No images found' : 'No media yet'}
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {search ? `No results for "${search}"` : 'Upload images to build your library.'}
          </p>
          {!search && (
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)', color: '#fff', border: 'none',
                padding: '0.6rem 1.1rem', borderRadius: '11px',
                fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <Upload size={15} />
              Upload your first image
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {media.map(item => (
            <GridCard
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              bulkMode={bulkMode}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onPreview={setPreviewItem}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {media.map(item => (
            <ListRow
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              bulkMode={bulkMode}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onPreview={setPreviewItem}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.75rem', marginTop: '2rem',
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              background: '#161617', border: '1px solid #202022',
              color: page === 1 ? '#6b7280' : '#e4e4e7',
              padding: '0.55rem 0.85rem', borderRadius: '11px',
              cursor: page === 1 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.85rem', fontWeight: 700,
            }}
          >
            <ChevronLeft size={15} /> Prev
          </button>

          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            Page <span style={{ color: '#f4f4f5', fontWeight: 800 }}>{page}</span> of{' '}
            <span style={{ color: '#f4f4f5', fontWeight: 800 }}>{totalPages}</span>
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              background: '#161617', border: '1px solid #202022',
              color: page === totalPages ? '#6b7280' : '#e4e4e7',
              padding: '0.55rem 0.85rem', borderRadius: '11px',
              cursor: page === totalPages ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.85rem', fontWeight: 700,
            }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploaded={handleUploaded}
        />
      )}

      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onDelete={handleDelete}
          onAltSave={handleAltSave}
          onCopy={handleCopy}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
