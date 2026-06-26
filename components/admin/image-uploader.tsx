'use client'

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react'
import { X, Loader2, Star, ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadingEntry {
  id: string
  name: string
}

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  max?: number
  label?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageUploader({
  images,
  onChange,
  max = 8,
  label = 'Images',
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState<UploadingEntry[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Upload logic ──────────────────────────────────────────────────────────

  // Upload a single file and RETURN its URL (or null on failure) — it does not
  // touch the images array itself, so multiple uploads can run at once without
  // racing on stale state. It only manages its own spinner entry.
  const uploadOne = useCallback(async (file: File): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`"${file.name}" exceeds the 5 MB limit.`)
      return null
    }
    const id = uid()
    setUploading(prev => [...prev, { id, name: file.name }])
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }
      const data = await res.json() as { url: string }
      return data.url
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setErrorMsg(`${msg} — add a URL instead`)
      return null
    } finally {
      setUploading(prev => prev.filter(e => e.id !== id))
    }
  }, [])

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return
      const incoming = Array.from(files).filter(f => f.type.startsWith('image/'))
      if (incoming.length === 0) return
      setErrorMsg(null)
      // Only take as many as there's room for (respects the max + anything mid-upload).
      const room = Math.max(0, max - images.length - uploading.length)
      const batch = incoming.slice(0, room)
      if (batch.length === 0) return
      // Upload them all, then append the successful URLs in ONE update — so
      // dragging several at once adds every one (no stale-state clobbering).
      const urls = (await Promise.all(batch.map(uploadOne))).filter((u): u is string => !!u)
      if (urls.length) onChange([...images, ...urls])
    },
    [images, uploading, max, onChange, uploadOne]
  )

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // ── URL fallback ──────────────────────────────────────────────────────────

  const addUrl = () => {
    const url = urlInput.trim()
    if (!url || images.includes(url)) { setUrlInput(''); return }
    if (!url.startsWith('http')) { setErrorMsg('URL must start with http:// or https://'); return }
    onChange([...images, url])
    setUrlInput('')
    setErrorMsg(null)
  }

  // ── Remove ────────────────────────────────────────────────────────────────

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  // ── Reorder ───────────────────────────────────────────────────────────────

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  const setAsMain = (index: number) => {
    if (index === 0) return
    const next = [...images]
    const [promoted] = next.splice(index, 1)
    next.unshift(promoted)
    onChange(next)
  }

  const canUploadMore = images.length + uploading.length < max

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Label */}
      {label && (
        <p style={{
          fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af',
          textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
        }}>
          {label}
          <span style={{ color: '#4b5563', marginLeft: '0.5rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            — {images.length}/{max}
          </span>
        </p>
      )}

      {/* Drop zone */}
      {canUploadMore && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#EC1E79' : '#2a2a2a'}`,
            borderRadius: '12px',
            background: dragging ? 'rgba(236,30,121,0.05)' : '#111',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, background 0.15s ease',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '10px',
            background: 'rgba(236,30,121,0.1)',
            border: '1px solid rgba(236,30,121,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#EC1E79" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#e5e7eb' }}>
            Drop images here or click to upload
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
            PNG, JPG, WebP up to 5 MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { const el = e.target; handleFiles(el.files); el.value = '' }}
          />
        </div>
      )}

      {/* Uploading spinners */}
      {uploading.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
          {uploading.map(entry => (
            <div
              key={entry.id}
              style={{
                width: '80px', height: '80px', borderRadius: '10px',
                border: '1px solid #2a2a2a', background: '#161616',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              }}
            >
              <Loader2
                size={20}
                color="#EC1E79"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <span style={{ fontSize: '0.6rem', color: '#6b7280', textAlign: 'center', padding: '0 4px', wordBreak: 'break-all', lineHeight: 1.2 }}>
                {entry.name.length > 10 ? entry.name.slice(0, 8) + '…' : entry.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.625rem',
        }}>
          {images.map((url, i) => (
            <div
              key={url + i}
              className="img-tile"
              style={{
                position: 'relative',
                borderRadius: '10px',
                border: '1px solid #2a2a2a',
                overflow: 'visible',
                background: '#161616',
              }}
            >
              <style>{`
                .img-tile .img-overlay { opacity: 0; transition: opacity 0.15s ease; }
                .img-tile:hover .img-overlay { opacity: 1; }
              `}</style>

              <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                <img
                  src={url}
                  alt={`Image ${i + 1}`}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={e => {
                    const el = e.target as HTMLImageElement
                    el.style.opacity = '0.3'
                  }}
                />

                {/* MAIN badge on first image */}
                {i === 0 && (
                  <span style={{
                    position: 'absolute', bottom: '4px', left: '4px',
                    background: 'rgba(0,0,0,0.75)', color: '#EC1E79',
                    fontSize: '0.6rem', fontWeight: 700,
                    padding: '1px 5px', borderRadius: '4px',
                    display: 'inline-flex', alignItems: 'center', gap: '2px',
                    zIndex: 3,
                  }}>
                    <Star size={9} fill="#EC1E79" /> MAIN
                  </span>
                )}

                {/* Hover overlay with reorder controls */}
                <div
                  className="img-overlay"
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '0.35rem', zIndex: 2,
                  }}
                >
                  {/* Reorder row */}
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={() => moveImage(i, i - 1)}
                      disabled={i === 0}
                      title="Move left"
                      style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: i === 0 ? '#2a2a2a' : '#fff',
                        color: i === 0 ? '#4b5563' : '#000',
                        border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, i + 1)}
                      disabled={i === images.length - 1}
                      title="Move right"
                      style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: i === images.length - 1 ? '#2a2a2a' : '#fff',
                        color: i === images.length - 1 ? '#4b5563' : '#000',
                        border: 'none', cursor: i === images.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  {/* Set as main button (only for non-first images) */}
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setAsMain(i)}
                      title="Make this the main image"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        padding: '3px 7px', borderRadius: 5,
                        background: '#EC1E79', color: '#fff', border: 'none',
                        fontSize: '0.65rem', fontWeight: 700,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      <Star size={9} /> Set main
                    </button>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(i)}
                title="Remove"
                style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#ef4444', border: '2px solid #0a0a0a',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#fff', padding: 0, zIndex: 3,
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* URL fallback */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#6b7280', flexShrink: 0 }}>
          Or add image URL
        </span>
        <input
          type="url"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
          placeholder="https://..."
          style={{
            flex: 1, padding: '0.5rem 0.75rem',
            background: '#161616', border: '1px solid #1f1f1f',
            borderRadius: '8px', color: '#fff', fontSize: '0.8125rem',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim() || images.length >= max}
          style={{
            padding: '0.5rem 0.875rem',
            background: '#1f1f1f', border: '1px solid #2a2a2a',
            borderRadius: '8px', color: '#9ca3af',
            cursor: images.length >= max ? 'not-allowed' : 'pointer',
            fontSize: '0.8125rem', fontWeight: 600, flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>

      {/* Error */}
      {errorMsg && (
        <p style={{ fontSize: '0.8rem', color: '#f87171', margin: 0 }}>
          {errorMsg}
        </p>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
