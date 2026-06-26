'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/admin/toast'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Upload, X, Check, AlertCircle, Banknote } from 'lucide-react'
import { Particles } from '@/components/magicui/particles'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text'

const MAX_IMAGES = 12
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
  const toast = useToast()
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
  const [dragActive, setDragActive] = useState(false)
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
        toast.error(data?.error || 'Could not submit. Please try again.')
        setSubmitting(false)
        return
      }
      setSuccess(true)
      toast.success('Submission received — we will be in touch within 48 hours.')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* hero */}
        <section className="relative overflow-hidden bg-[#070708] py-20 sm:py-24">
          <Particles
            className="absolute inset-0"
            quantity={60}
            color="#EC1E79"
            ease={70}
            size={0.5}
            staticity={40}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 50% at 50% 0%, rgba(236,30,121,0.22) 0%, rgba(236,30,121,0.05) 35%, transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-[720px] px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 flex justify-center"
            >
              <AnimatedGradientText className="!bg-white/[0.04] !text-white">
                <Banknote className="mr-1.5 size-3.5 text-[#EC1E79]" />
                <span className="inline animate-gradient bg-gradient-to-r from-[#EC1E79] via-[#FF80B8] to-[#EC1E79] bg-[length:var(--bg-size)_100%] bg-clip-text text-xs font-bold uppercase tracking-[0.14em] text-transparent">
                  Sell to Luton Cards
                </span>
              </AnimatedGradientText>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="m-0 text-[clamp(2.2rem,4.8vw,3.25rem)] font-black leading-[1.04] tracking-[-0.035em] text-white"
            >
              Got cards to sell?
              <br />
              <span className="bg-gradient-to-br from-[#EC1E79] to-[#FF4DA6] bg-clip-text text-transparent">
                We&apos;re buying.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-5 max-w-[520px] text-base leading-[1.65] text-white/55"
            >
              Single chase card, vintage collection or sealed product &mdash; tell us what you&apos;ve got and we&apos;ll
              come back with a fair offer.
            </motion.p>
          </div>
        </section>

        <div className="mx-auto max-w-[720px] px-6 py-12 sm:py-16">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border-2 border-[#EC1E79] bg-[#fff0f7] p-10 text-center"
              >
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#EC1E79] text-white shadow-[0_12px_30px_-10px_rgba(236,30,121,0.6)]">
                  <Check size={26} />
                </div>
                <h2 className="m-0 mb-2 text-[1.45rem] font-black tracking-[-0.02em] text-neutral-900">
                  Submission received.
                </h2>
                <p className="m-0 text-[0.95rem] leading-[1.65] text-neutral-600">
                  Thanks &mdash; we&apos;ll have a look at what you&apos;ve sent and come back to you within 48 hours
                  with an offer or follow-up questions.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Your Name *" htmlFor="name">
                    <input
                      id="name"
                      className={inputCls}
                      required
                      maxLength={120}
                      value={form.name}
                      onChange={update('name')}
                      placeholder="Full name"
                    />
                  </Field>
                  <Field label="Email *" htmlFor="email">
                    <input
                      id="email"
                      className={inputCls}
                      type="email"
                      required
                      value={form.email}
                      onChange={update('email')}
                      placeholder="you@example.com"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Phone (optional)" htmlFor="phone">
                    <input
                      id="phone"
                      className={inputCls}
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      placeholder="UK mobile number"
                    />
                  </Field>
                  <Field label="Game *" htmlFor="game">
                    <select id="game" className={inputCls} value={form.game} onChange={update('game')}>
                      <option value="pokemon">Pokémon</option>
                      <option value="one-piece">One Piece</option>
                      <option value="mixed">Mixed / Both</option>
                    </select>
                  </Field>
                </div>

                <Field label="What are you selling? *" htmlFor="details">
                  <textarea
                    id="details"
                    className={`${inputCls} min-h-[140px] resize-y leading-[1.6]`}
                    required
                    minLength={10}
                    maxLength={4000}
                    value={form.details}
                    onChange={update('details')}
                    placeholder="Tell us what you have: sets, conditions, whether it's sealed/graded/raw, quantities. The more detail the better."
                  />
                </Field>

                <Field label="Estimated value (optional)" htmlFor="estimate">
                  <input
                    id="estimate"
                    className={inputCls}
                    value={form.estimate}
                    onChange={update('estimate')}
                    placeholder="e.g. £500, what you'd hope to get, or 'open to offers'"
                  />
                </Field>

                <Field label={`Photos (up to ${MAX_IMAGES})`} htmlFor="">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => {
                      e.preventDefault()
                      setDragActive(true)
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={e => {
                      e.preventDefault()
                      setDragActive(false)
                      handleFiles(e.dataTransfer.files)
                    }}
                    className={[
                      'cursor-pointer rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all',
                      dragActive
                        ? 'border-[#EC1E79] bg-[#fff0f7]'
                        : 'border-neutral-200 bg-neutral-50 hover:border-[#EC1E79] hover:bg-[#fff0f7]',
                    ].join(' ')}
                  >
                    <Upload size={26} className="mx-auto mb-2 text-[#EC1E79]" />
                    <p className="m-0 mb-0.5 text-sm font-extrabold text-neutral-900">
                      Click or drop images here
                    </p>
                    <p className="m-0 text-xs text-neutral-500">
                      JPG or PNG, up to {MAX_IMAGE_BYTES / 1024 / 1024}MB each.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => handleFiles(e.target.files)}
                    />
                  </div>
                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
                      {images.map((src, i) => (
                        <div
                          key={i}
                          className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Upload ${i + 1}`} className="size-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            aria-label="Remove"
                            className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <ShimmerButton
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-4 text-sm"
                  background="linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)"
                >
                  {submitting ? 'Sending…' : 'Submit for offer'}
                </ShimmerButton>

                <p className="mx-auto m-0 max-w-[440px] text-center text-xs leading-[1.6] text-neutral-400">
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

const inputCls =
  'box-border w-full rounded-xl border-[1.5px] border-neutral-200 bg-white px-3.5 py-3 text-sm font-medium text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#EC1E79]'

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor || undefined}
        className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-900"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
