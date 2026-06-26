'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail, Instagram, MapPin, Send, Check, Loader2, ArrowRight,
} from 'lucide-react'
import { useToast } from '@/components/admin/toast'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Particles } from '@/components/magicui/particles'
import { BorderBeam } from '@/components/magicui/border-beam'
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text'

const CONTENT_KEYS = ['contact_email', 'contact_heading', 'contact_subtext', 'instagram_handle']

const DEFAULTS: Record<string, string> = {
  contact_email: 'hello@lutoncards.co.uk',
  contact_heading: "Let's talk cards.",
  contact_subtext:
    "Question about a card, chasing an order, or want to know which event we are at next? The fastest way to reach the crew is a DM on Instagram. The form works too.",
  instagram_handle: 'luton.cards',
}

type FormState = {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactPage() {
  const toast = useToast()
  const [content, setContent] = useState<Record<string, string> | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formHovered, setFormHovered] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  // Anti-spam: hidden honeypot + when the form was opened (time-trap).
  const [honeypot, setHoneypot] = useState('')
  const mountedAt = useRef(Date.now())

  useEffect(() => {
    fetch(`/api/content?keys=${CONTENT_KEYS.join(',')}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: Record<string, string> | null) => setContent(data || {}))
      .catch(() => setContent({}))
  }, [])

  const get = (key: string) =>
    content && content[key] !== undefined && content[key] !== ''
      ? content[key]
      : DEFAULTS[key]

  const igHandle = (get('instagram_handle') || 'luton.cards').replace(/^@/, '')
  const igUrl = `https://instagram.com/${igHandle}`
  const email = get('contact_email')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company: honeypot, elapsedMs: Date.now() - mountedAt.current }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Could not send your message. Try again.')
      } else {
        setSubmitted(true)
        toast.success("Message sent — we'll get back to you shortly.")
      }
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className="bg-white">
        {/* ─── HERO ─────────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative overflow-hidden bg-[#070708] pt-20 pb-16 sm:pt-24 sm:pb-20"
        >
          <Particles
            className="absolute inset-0"
            quantity={60}
            ease={70}
            color="#EC1E79"
            size={0.6}
            staticity={45}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 50% at 50% 0%, rgba(236,30,121,0.22) 0%, rgba(236,30,121,0.05) 35%, transparent 70%)',
            }}
          />

          <div className="relative z-10 mx-auto max-w-[720px] px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 flex justify-center"
            >
              <AnimatedGradientText className="!bg-white/[0.04] !text-white">
                <Mail className="mr-1.5 size-3.5 text-[#EC1E79]" />
                <span className="inline animate-gradient bg-gradient-to-r from-[#EC1E79] via-[#FF80B8] to-[#EC1E79] bg-[length:var(--bg-size)_100%] bg-clip-text text-xs font-bold uppercase tracking-[0.14em] text-transparent">
                  Get in touch
                </span>
              </AnimatedGradientText>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="m-0 text-[clamp(2.1rem,5vw,3.2rem)] font-black leading-[1.04] tracking-[-0.04em] text-white"
            >
              {get('contact_heading')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="m-0 mx-auto mt-5 max-w-[540px] text-[1.02rem] leading-[1.7] text-neutral-400"
            >
              {get('contact_subtext')}
            </motion.p>
          </div>
        </section>

        {/* ─── BODY ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1080px] px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
            {/* Left: form */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              onMouseEnter={() => setFormHovered(true)}
              onMouseLeave={() => setFormHovered(false)}
              className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-7 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.25)] sm:p-9"
            >
              <p className="m-0 mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#EC1E79]">
                Drop us a message
              </p>
              <h2 className="m-0 mb-6 text-[1.5rem] font-black tracking-[-0.025em] text-neutral-900">
                Send it over
              </h2>

              {submitted ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-[#EC1E79] to-[#FF4DA6] shadow-[0_10px_30px_-8px_rgba(236,30,121,0.6)]">
                    <Check size={28} className="text-white" />
                  </div>
                  <h3 className="m-0 mb-2 text-[1.25rem] font-black tracking-[-0.02em] text-neutral-900">
                    Message sent.
                  </h3>
                  <p className="m-0 max-w-[320px] text-[0.95rem] leading-[1.6] text-neutral-500">
                    Cheers for reaching out. We will get back to you, usually within a day. For anything
                    urgent, DM us on Instagram.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Honeypot — hidden from people, catches bots that fill every field. */}
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={honeypot}
                    onChange={e => setHoneypot(e.target.value)}
                    style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Name">
                      <input
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="lc-cinput"
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@email.com"
                        className="lc-cinput"
                      />
                    </Field>
                  </div>
                  <Field label="Subject">
                    <input
                      name="subject"
                      type="text"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="What's it about?"
                      className="lc-cinput"
                    />
                  </Field>
                  <Field label="Message">
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us what you need a hand with."
                      className="lc-cinput resize-y min-h-[130px]"
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#EC1E79] to-[#FF4DA6] px-6 py-3.5 text-[0.95rem] font-extrabold text-white shadow-[0_10px_26px_-10px_rgba(236,30,121,0.7)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        Send message <Send size={15} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {formHovered && (
                <BorderBeam size={300} duration={10} colorFrom="#EC1E79" colorTo="#FF80B8" borderWidth={1.5} />
              )}
            </motion.div>

            {/* Right: channels */}
            <div className="flex flex-col gap-4">
              {/* Instagram — primary channel for a vending crew */}
              <motion.a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="group relative block overflow-hidden rounded-3xl bg-[#070708] p-7 no-underline"
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(80% 80% at 100% 0%, rgba(236,30,121,0.35) 0%, transparent 60%)',
                  }}
                />
                <div className="relative">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EC1E79] to-[#FF4DA6] shadow-[0_8px_22px_-8px_rgba(236,30,121,0.7)]">
                    <Instagram size={22} className="text-white" />
                  </div>
                  <p className="m-0 mb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FF80B8]">
                    Fastest way to reach us
                  </p>
                  <h3 className="m-0 text-[1.35rem] font-black tracking-[-0.02em] text-white">
                    DM us on Instagram
                  </h3>
                  <p className="m-0 mt-1.5 text-[0.95rem] text-neutral-400">
                    @{igHandle}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-white transition-transform group-hover:translate-x-0.5">
                    Open Instagram <ArrowRight size={14} />
                  </span>
                </div>
              </motion.a>

              {/* Email */}
              <motion.a
                href={`mailto:${email}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white p-6 no-underline transition-colors hover:border-[#EC1E79]/40 hover:bg-[#fff7fb]"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0f7]">
                  <Mail size={19} className="text-[#EC1E79]" />
                </div>
                <div className="min-w-0">
                  <p className="m-0 mb-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">
                    Email
                  </p>
                  <p className="m-0 break-words text-[1rem] font-extrabold tracking-[-0.01em] text-neutral-900">
                    {email}
                  </p>
                  <p className="m-0 mt-1 text-[13px] leading-[1.5] text-neutral-500">
                    Best for order questions and anything detailed.
                  </p>
                </div>
              </motion.a>

              {/* Catch us at events */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white p-6"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0f7]">
                  <MapPin size={19} className="text-[#EC1E79]" />
                </div>
                <div className="min-w-0">
                  <p className="m-0 mb-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">
                    Catch us in person
                  </p>
                  <p className="m-0 text-[1rem] font-extrabold tracking-[-0.01em] text-neutral-900">
                    We vend at events across the UK
                  </p>
                  <p className="m-0 mt-1 text-[13px] leading-[1.5] text-neutral-500">
                    Based in Luton. Follow us on Instagram to see where the stall lands next.
                  </p>
                </div>
              </motion.div>

              {/* Response note */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-2.5 rounded-2xl border border-[#EC1E79]/20 bg-[#fff0f7] px-4 py-3"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#EC1E79] opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#EC1E79]" />
                </span>
                <p className="m-0 text-[13px] font-bold text-[#7e1247]">
                  We usually reply within a day.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        .lc-cinput {
          width: 100%;
          padding: 0.7rem 0.9rem;
          border-radius: 12px;
          border: 1.5px solid #e6e6e6;
          font-size: 0.95rem;
          color: #111;
          background: #fafafa;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .lc-cinput::placeholder { color: #a1a1aa; }
        .lc-cinput:focus {
          border-color: #EC1E79;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(236,30,121,0.1);
        }
      `}</style>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  )
}
