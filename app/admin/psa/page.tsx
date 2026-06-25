'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Award, Search, ImageOff, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/admin/toast'

// ─── Types from /api/admin/psa/* ───────────────────────────────────────────

interface PsaCert {
  certNumber: string
  grade: string
  gradeDescription: string
  grader: string
  subject: string
  year: string
  brand: string
  category: string
  cardNumber: string
  variety: string
  population: string
}

interface PsaListingSuggestion {
  name: string
  description: string
}

type SuggestedGame = 'pokemon' | 'one-piece'

interface PsaLookupResult {
  cert: PsaCert
  images: string[]
  listing: PsaListingSuggestion
  suggestedGame: SuggestedGame
}

interface ImportedProduct {
  id: string
  name: string
}

interface SessionAddition {
  id: string
  name: string
}

// ─── Shared styles (admin dark theme) ──────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 700,
  display: 'block',
  marginBottom: '0.5rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  background: '#0c0c0d',
  border: '1px solid #202022',
  borderRadius: '11px',
  color: '#fff',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.65rem 1.2rem',
  background: 'linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%)',
  border: 'none',
  borderRadius: '11px',
  color: '#fff',
  fontSize: '0.85rem',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.45rem',
  whiteSpace: 'nowrap',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '0.65rem 1.2rem',
  background: '#161617',
  border: '1px solid #202022',
  borderRadius: '11px',
  color: '#e4e4e7',
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const cardStyle: React.CSSProperties = {
  background: '#0f0f10',
  border: '1px solid #202022',
  borderRadius: '16px',
  padding: '1.5rem',
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminPsaPage() {
  const toast = useToast()

  // Status
  const [configured, setConfigured] = useState<boolean | null>(null)

  // Step 1 — lookup
  const [certInput, setCertInput] = useState('')
  const [looking, setLooking] = useState(false)

  // Step 2 — preview + listing form
  const [result, setResult] = useState<PsaLookupResult | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [category, setCategory] = useState('graded')
  const [game, setGame] = useState<SuggestedGame>('pokemon')
  const [featured, setFeatured] = useState(false)
  const [active, setActive] = useState(true)
  const [importing, setImporting] = useState(false)

  // Added this session
  const [added, setAdded] = useState<SessionAddition[]>([])

  useEffect(() => {
    fetch('/api/admin/psa/status')
      .then(r => r.json())
      .then(data => setConfigured(!!data?.configured))
      .catch(() => setConfigured(null))
  }, [])

  const handleLookup = async () => {
    const certNumber = certInput.trim()
    if (!certNumber) {
      toast.error('Enter a PSA cert number')
      return
    }
    setLooking(true)
    try {
      const res = await fetch('/api/admin/psa/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ certNumber }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || `Lookup failed (${res.status})`)
        return
      }
      const lookup = data as PsaLookupResult
      setResult(lookup)
      setName(lookup.listing?.name ?? '')
      setDescription(lookup.listing?.description ?? '')
      setPrice('')
      setComparePrice('')
      setCategory('graded')
      setGame(lookup.suggestedGame === 'one-piece' ? 'one-piece' : 'pokemon')
      setFeatured(false)
      setActive(true)
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setLooking(false)
    }
  }

  const resetToLookup = () => {
    setResult(null)
    setCertInput('')
    setName('')
    setDescription('')
    setPrice('')
    setComparePrice('')
    setCategory('graded')
    setGame('pokemon')
    setFeatured(false)
    setActive(true)
  }

  const priceValue = Number(price)
  const canImport = price.trim() !== '' && Number.isFinite(priceValue) && priceValue > 0

  const handleImport = async () => {
    if (!result || !canImport) return
    setImporting(true)
    try {
      const compareValue = Number(comparePrice)
      const res = await fetch('/api/admin/psa/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          certNumber: result.cert.certNumber,
          price: priceValue,
          comparePrice:
            comparePrice.trim() !== '' && Number.isFinite(compareValue) ? compareValue : undefined,
          category: category.trim() || undefined,
          game,
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          featured,
          active,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || `Could not list (${res.status})`)
        return
      }
      const product = data?.product as ImportedProduct | undefined
      const productName = product?.name || name.trim() || 'Card'
      toast.success(`Listed: ${productName}`)
      if (product?.id) {
        setAdded(prev => [{ id: product.id, name: productName }, ...prev])
      }
      resetToLookup()
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setImporting(false)
    }
  }

  const cert = result?.cert
  const gradeLabel = cert ? cert.gradeDescription || `PSA ${cert.grade}` : ''

  return (
    <div style={{ padding: '2rem', color: '#fff', background: '#0a0a0a' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#EC1E79',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            marginBottom: '0.5rem',
          }}
        >
          <Award size={12} /> Graded
        </div>
        <h1
          style={{
            fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.025em',
            margin: 0,
          }}
        >
          Add from PSA
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '0.4rem 0 1.5rem' }}>
          Enter a PSA certification number to pull the card details and slab photos.
        </p>

        {/* Not-configured notice */}
        {configured === false && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              color: '#f59e0b',
              fontSize: '0.825rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              PSA isn&apos;t connected yet — add your{' '}
              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '0.05rem 0.3rem', borderRadius: 5 }}>
                PSA_API_TOKEN
              </code>{' '}
              in Railway, then redeploy.
            </span>
          </div>
        )}

        {/* Step 1 — lookup */}
        {!result && (
          <div style={cardStyle}>
            <label style={labelStyle} htmlFor="psa-cert">
              PSA cert number
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
              <input
                id="psa-cert"
                type="text"
                inputMode="numeric"
                value={certInput}
                onChange={e => setCertInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleLookup()
                  }
                }}
                placeholder="e.g. 12345678"
                disabled={looking}
                aria-label="PSA cert number"
                style={{ ...inputStyle, flex: 1, minWidth: 200 }}
              />
              <button
                type="button"
                onClick={() => void handleLookup()}
                disabled={looking}
                style={{ ...primaryBtnStyle, opacity: looking ? 0.6 : 1, cursor: looking ? 'wait' : 'pointer' }}
              >
                <Search size={15} />
                {looking ? 'Looking up…' : 'Look up'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — preview + list */}
        {result && cert && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Images */}
            <div style={cardStyle}>
              <label style={labelStyle}>Slab photos</label>
              {result.images.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#6b7280',
                    fontSize: '0.85rem',
                  }}
                >
                  <ImageOff size={16} /> No PSA images returned
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {result.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt={`PSA slab ${i === 0 ? 'front' : `image ${i + 1}`}`}
                      style={{
                        width: 200,
                        height: 280,
                        objectFit: 'contain',
                        background: '#161617',
                        border: '1px solid #202022',
                        borderRadius: '12px',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Cert facts */}
            <div style={cardStyle}>
              <label style={labelStyle}>Certificate details</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '0.9rem 1.5rem',
                }}
              >
                <Fact label="Cert #" value={cert.certNumber} />
                <Fact label="Grade" value={gradeLabel} />
                <Fact label="Subject" value={cert.subject} />
                <Fact label="Year" value={cert.year} />
                <Fact label="Brand" value={cert.brand} />
                <Fact label="Card number" value={cert.cardNumber} />
                <Fact label="Variety" value={cert.variety} />
                <Fact label="Population" value={cert.population} />
              </div>
            </div>

            {/* Listing form */}
            <div style={cardStyle}>
              <label style={labelStyle}>Listing</label>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={labelStyle} htmlFor="psa-name">
                  Name
                </label>
                <input
                  id="psa-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Listing name"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={labelStyle} htmlFor="psa-description">
                  Description
                </label>
                <textarea
                  id="psa-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Listing description"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.1rem',
                  marginBottom: '1.1rem',
                }}
              >
                <div>
                  <label style={labelStyle} htmlFor="psa-price">
                    Price (GBP)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.8rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        fontSize: '0.9rem',
                        pointerEvents: 'none',
                      }}
                    >
                      £
                    </span>
                    <input
                      id="psa-price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                      aria-label="Price in pounds"
                      style={{ ...inputStyle, paddingLeft: '1.6rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle} htmlFor="psa-compare">
                    Compare-at price (optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.8rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        fontSize: '0.9rem',
                        pointerEvents: 'none',
                      }}
                    >
                      £
                    </span>
                    <input
                      id="psa-compare"
                      type="number"
                      min={0}
                      step="0.01"
                      value={comparePrice}
                      onChange={e => setComparePrice(e.target.value)}
                      placeholder="0.00"
                      aria-label="Compare-at price in pounds"
                      style={{ ...inputStyle, paddingLeft: '1.6rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle} htmlFor="psa-category">
                    Category
                  </label>
                  <input
                    id="psa-category"
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="graded"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle} htmlFor="psa-game">
                    Game
                  </label>
                  <select
                    id="psa-game"
                    value={game}
                    onChange={e => setGame(e.target.value === 'one-piece' ? 'one-piece' : 'pokemon')}
                    style={inputStyle}
                  >
                    <option value="pokemon">Pokémon</option>
                    <option value="one-piece">One Piece</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} style={{ accentColor: '#EC1E79' }} />
                  Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} style={{ accentColor: '#EC1E79' }} />
                  Active / visible
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={!canImport || importing}
                  style={{
                    ...primaryBtnStyle,
                    opacity: !canImport || importing ? 0.5 : 1,
                    cursor: !canImport || importing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {importing ? 'Adding…' : 'Add for sale'}
                </button>
                <button type="button" onClick={resetToLookup} disabled={importing} style={secondaryBtnStyle}>
                  Cancel / new lookup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Added this session */}
        {added.length > 0 && (
          <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={13} color="#10b981" /> Added this session ({added.length})
            </label>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {added.map(item => (
                <li key={item.id} style={{ fontSize: '0.875rem' }}>
                  <Link
                    href={`/admin/products/${item.id}`}
                    style={{ color: '#EC1E79', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Small components ──────────────────────────────────────────────────────

function Fact({ label, value }: { label: string; value: string }) {
  if (!value || !value.trim()) return null
  return (
    <div>
      <div
        style={{
          fontSize: '0.65rem',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 700,
          marginBottom: '0.2rem',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '0.9rem', color: '#f4f4f5', fontWeight: 600 }}>{value}</div>
    </div>
  )
}
