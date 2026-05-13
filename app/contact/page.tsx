'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

const CONTENT_KEYS = [
  'contact_email',
  'contact_phone',
  'contact_address',
  'contact_heading',
  'contact_subtext',
]

const DEFAULTS: Record<string, string> = {
  contact_email: 'hello@lutoncards.co.uk',
  contact_phone: '+44 7700 000000',
  contact_address: 'United Kingdom',
  contact_heading: 'Get in Touch',
  contact_subtext: 'Have a question about a card, an order, or just want to chat about the hobby? We\'d love to hear from you.',
}

type FormState = {
  name: string
  email: string
  subject: string
  message: string
}

function SkeletonBlock({ width = '100%', height = '1.2rem', radius = '6px' }: { width?: string; height?: string; radius?: string }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  )
}

export default function ContactPage() {
  const [content, setContent] = useState<Record<string, string> | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/content?keys=${CONTENT_KEYS.join(',')}`)
      .then(r => r.json())
      .then((data: Record<string, string>) => setContent(data))
      .catch(() => setContent({}))
  }, [])

  const get = (key: string) =>
    content && content[key] !== undefined && content[key] !== ''
      ? content[key]
      : DEFAULTS[key]

  const loading = content === null

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send message. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1.5px solid #e0e0e0',
    fontSize: '0.95rem',
    color: '#111',
    background: '#fff',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#444',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .contact-input:focus {
          border-color: #EC1E79 !important;
        }
        .contact-submit:hover:not(:disabled) {
          background: #C81C6B !important;
          transform: translateY(-1px);
        }
        .contact-submit {
          transition: background 0.2s, transform 0.15s;
        }
        .contact-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .contact-hero { padding: 3rem 1rem 2.5rem !important; }
          .contact-body { padding: 2rem 1rem !important; }
          .contact-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .contact-form-card { padding: 1.5rem !important; }
          .contact-submit { width: 100% !important; }
        }
      `}</style>
      <Header />
      <main>
        {/* Hero */}
        <section
          className="contact-hero"
          style={{
            background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 60%, #0d1b2a 100%)',
            padding: '5rem 1.5rem 4rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(236,30,121,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}>
            {loading ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <SkeletonBlock width="50%" height="3rem" radius="8px" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <SkeletonBlock width="75%" height="1.4rem" radius="6px" />
                </div>
              </>
            ) : (
              <>
                <h1
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 900,
                    color: '#fff',
                    letterSpacing: '-0.03em',
                    margin: '0 0 1rem',
                    lineHeight: 1.1,
                  }}
                >
                  {get('contact_heading')}
                </h1>
                <p
                  style={{
                    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                    color: 'rgba(255,255,255,0.5)',
                    margin: 0,
                    lineHeight: 1.65,
                  }}
                >
                  {get('contact_subtext')}
                </p>
              </>
            )}
          </div>
        </section>

        {/* Two-column layout */}
        <section className="contact-body" style={{ background: '#f7f7f7', padding: '4rem 1.5rem' }}>
          <div
            className="contact-grid"
            style={{
              maxWidth: '1040px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3rem',
              alignItems: 'start',
            }}
          >
            {/* Left: Contact Form */}
            <div
              className="contact-form-card"
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '2.5rem',
                border: '1px solid #eee',
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
              }}
            >
              <h2
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#111',
                  margin: '0 0 1.75rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Send a Message
              </h2>

              {submitted ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: '#e6faf6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                      fontSize: '1.75rem',
                    }}
                  >
                    <span style={{ color: '#EC1E79' }}>&#10003;</span>
                  </div>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: '#111',
                      margin: '0 0 0.5rem',
                    }}
                  >
                    Message Sent!
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
                    Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle} htmlFor="contact-name">Name</label>
                    <input
                      id="contact-name"
                      className="contact-input"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="contact-email">Email</label>
                    <input
                      id="contact-email"
                      className="contact-input"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="contact-subject">Subject</label>
                    <input
                      id="contact-subject"
                      className="contact-input"
                      name="subject"
                      type="text"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="What's this about?"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="contact-message">Message</label>
                    <textarea
                      id="contact-message"
                      className="contact-input"
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us what you need..."
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                    />
                  </div>
                  {error && (
                    <p
                      style={{
                        color: '#e53935',
                        fontSize: '0.875rem',
                        margin: 0,
                        padding: '0.6rem 0.9rem',
                        background: '#fff5f5',
                        borderRadius: '6px',
                        border: '1px solid #fecdd3',
                      }}
                    >
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="contact-submit"
                    style={{
                      background: '#EC1E79',
                      color: '#000',
                      border: 'none',
                      padding: '0.85rem 1.5rem',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      letterSpacing: '-0.01em',
                      width: '100%',
                    }}
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Right: Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Email card */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  border: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(236,30,121,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.1rem',
                  }}
                >
                  <span style={{ color: '#EC1E79' }}>&#9993;</span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: '#999',
                      margin: '0 0 0.3rem',
                    }}
                  >
                    Email
                  </p>
                  {loading ? (
                    <SkeletonBlock width="180px" height="1rem" />
                  ) : (
                    <a
                      href={`mailto:${get('contact_email')}`}
                      style={{ color: '#111', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {get('contact_email')}
                    </a>
                  )}
                </div>
              </div>

              {/* Phone card */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  border: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(236,30,121,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.1rem',
                  }}
                >
                  <span style={{ color: '#EC1E79' }}>&#128222;</span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: '#999',
                      margin: '0 0 0.3rem',
                    }}
                  >
                    Phone
                  </p>
                  {loading ? (
                    <SkeletonBlock width="140px" height="1rem" />
                  ) : (
                    <a
                      href={`tel:${get('contact_phone')}`}
                      style={{ color: '#111', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {get('contact_phone')}
                    </a>
                  )}
                </div>
              </div>

              {/* Address card */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  border: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(236,30,121,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.1rem',
                  }}
                >
                  <span style={{ color: '#EC1E79' }}>&#128205;</span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: '#999',
                      margin: '0 0 0.3rem',
                    }}
                  >
                    Address
                  </p>
                  {loading ? (
                    <SkeletonBlock width="160px" height="1rem" />
                  ) : (
                    <p style={{ color: '#111', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                      {get('contact_address')}
                    </p>
                  )}
                </div>
              </div>

              {/* Business hours card */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  border: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(236,30,121,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.1rem',
                  }}
                >
                  <span style={{ color: '#EC1E79' }}>&#128336;</span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: '#999',
                      margin: '0 0 0.3rem',
                    }}
                  >
                    Business Hours
                  </p>
                  <p style={{ color: '#111', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.2rem' }}>
                    Mon&ndash;Sat: 9am &ndash; 6pm
                  </p>
                  <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>
                    Sunday: Closed
                  </p>
                </div>
              </div>

              {/* Response time note */}
              <div
                style={{
                  background: 'rgba(236,30,121,0.07)',
                  borderRadius: '12px',
                  padding: '1.1rem 1.25rem',
                  border: '1px solid rgba(236,30,121,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}
              >
                <span style={{ color: '#EC1E79', fontSize: '1rem' }}>&#9679;</span>
                <p style={{ color: '#2a7a6a', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                  We aim to respond within 24 hours
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
