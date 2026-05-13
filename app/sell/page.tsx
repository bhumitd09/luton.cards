'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Upload, X, Check, AlertCircle } from 'lucide-react'

const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 3 * 1024 * 1024

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function SellPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    game: 'pokemon',
    details: '',
    estimate: '',
  })
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setError(null)
    const slotsLeft = MAX_IMAGES - images.length
    const toAdd: File[] = Array.from(files).slice(0, slotsLeft)
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) {
        setError('Only images are allowed.')
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`Each image must be under ${MAX_IMAGE_BYTES / 1024 / 1024}MB.`)
        return
      }
    }
    try {
      const dataUrls = await Promise.all(toAdd.map(readFileAsDataURL))
      setImages(prev => [...prev, ...dataUrls])
    } catch {
      setError('Failed to read image file.')
    }
  }

  const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, images }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Could not submit. Please try again.')
        setSubmitting(false)
        return
      }
      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <style>{`
          .sell-hero { background: linear-gradient(135deg, #0a0a0a 0%, #1a0612 60%, #2b0a1f 100%); padding: 4.5rem 1.5rem 3rem; text-align: center; position: relative; overflow: hidden; }
          .sell-hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 700px; height: 700px; background: radial-gradient(circle, rgba(236,30,121,0.2) 0%, transparent 60%); pointer-events: none; }
          .sell-form-wrap { max-width: 720px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
          .sell-field { display: flex; flex-direction: column; gap: 0.4rem; }
          .sell-label { font-size: 0.75rem; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 0.08em; }
          .sell-input, .sell-textarea, .sell-select {
            width: 100%; padding: 0.75rem 0.9rem;
            border: 1.5px solid #e5e7eb; border-radius: 10px;
            background: #fff; font-size: 0.95rem; outline: none;
            font-family: inherit; transition: border-color 0.15s;
            box-sizing: border-box;
          }
          .sell-input:focus, .sell-textarea:focus, .sell-select:focus { border-color: #EC1E79; }
          .sell-textarea { min-height: 140px; resize: vertical; line-height: 1.6; }
          .sell-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
          @media (max-width: 600px) { .sell-row { grid-template-columns: 1fr; } }
          .sell-drop {
            border: 2px dashed #e5e7eb; border-radius: 14px; padding: 1.75rem 1rem;
            text-align: center; cursor: pointer; transition: all 0.15s;
            background: #fafafa;
          }
          .sell-drop:hover { border-color: #EC1E79; background: #fff0f7; }
          .sell-thumb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
          .sell-thumb { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 1.5px solid #eee; }
          .sell-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .sell-thumb-x {
            position: absolute; top: 4px; right: 4px;
            width: 22px; height: 22px; border-radius: 50%;
            background: rgba(0,0,0,0.7); color: #fff;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
          }
        `}</style>

        <section className="sell-hero">
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#EC1E79', margin: '0 0 0.85rem' }}>
              Sell to Luton Cards
            </p>
            <h1 style={{
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              margin: '0 0 1rem',
            }}>
              Got cards to sell?<br />We&apos;re buying.
            </h1>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: '0 auto', maxWidth: '520px' }}>
              Whether it&apos;s a single chase card, a vintage collection or a stack of sealed product &mdash; tell us what you&apos;ve got. We&apos;ll come back with a fair offer.
            </p>
          </div>
        </section>

        <div className="sell-form-wrap">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: '#fff0f7',
                  border: '1.5px solid #EC1E79',
                  borderRadius: '16px',
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: '#EC1E79', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <Check size={28} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
                  Submission received.
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#444', lineHeight: 1.6, margin: 0 }}>
                  Thanks &mdash; we&apos;ll have a look at what you&apos;ve sent and come back to you within 48 hours with an offer or follow-up questions.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div className="sell-row">
                  <div className="sell-field">
                    <label className="sell-label">Your Name *</label>
                    <input
                      className="sell-input"
                      required
                      maxLength={120}
                      value={form.name}
                      onChange={update('name')}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="sell-field">
                    <label className="sell-label">Email *</label>
                    <input
                      className="sell-input"
                      type="email"
                      required
                      value={form.email}
                      onChange={update('email')}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="sell-row">
                  <div className="sell-field">
                    <label className="sell-label">Phone (optional)</label>
                    <input
                      className="sell-input"
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      placeholder="UK mobile number"
                    />
                  </div>
                  <div className="sell-field">
                    <label className="sell-label">Game *</label>
                    <select className="sell-select" value={form.game} onChange={update('game')}>
                      <option value="pokemon">Pokémon</option>
                      <option value="one-piece">One Piece</option>
                      <option value="mixed">Mixed / Both</option>
                    </select>
                  </div>
                </div>

                <div className="sell-field">
                  <label className="sell-label">What are you selling? *</label>
                  <textarea
                    className="sell-textarea"
                    required
                    minLength={10}
                    maxLength={4000}
                    value={form.details}
                    onChange={update('details')}
                    placeholder="Tell us what you have — sets, conditions, whether it's sealed/graded/raw, quantities. The more detail the better."
                  />
                </div>

                <div className="sell-field">
                  <label className="sell-label">Estimated value (optional)</label>
                  <input
                    className="sell-input"
                    value={form.estimate}
                    onChange={update('estimate')}
                    placeholder="e.g. £500 — what you'd hope to get, or 'open to offers'"
                  />
                </div>

                <div className="sell-field">
                  <label className="sell-label">Photos (up to {MAX_IMAGES})</label>
                  <div
                    className="sell-drop"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
                  >
                    <Upload size={26} color="#EC1E79" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111', margin: '0 0 0.25rem' }}>
                      Click or drop images here
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                      JPG or PNG, up to {MAX_IMAGE_BYTES / 1024 / 1024}MB each. Helps us give a faster, better offer.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={e => handleFiles(e.target.files)}
                    />
                  </div>
                  {images.length > 0 && (
                    <div className="sell-thumb-grid">
                      {images.map((src, i) => (
                        <div key={i} className="sell-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Upload ${i + 1}`} />
                          <button type="button" className="sell-thumb-x" aria-label="Remove" onClick={() => removeImage(i)}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                    background: '#fef2f2', border: '1.5px solid #fecaca',
                    color: '#b91c1c', padding: '0.85rem 1rem', borderRadius: '10px',
                    fontSize: '0.85rem',
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? '#c81c6b' : '#EC1E79',
                    color: '#fff',
                    border: 'none',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: submitting ? 'wait' : 'pointer',
                    letterSpacing: '-0.01em',
                    fontFamily: 'inherit',
                    transition: 'background 0.15s, transform 0.1s',
                    boxShadow: '0 8px 22px -8px rgba(236,30,121,0.55)',
                  }}
                >
                  {submitting ? 'Sending…' : 'Submit for offer'}
                </button>

                <p style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                  We&apos;ll reply within 48 hours. By submitting, you agree to be contacted by Luton Cards about your sale.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  )
}
