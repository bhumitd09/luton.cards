'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Could not sign in.')
        setSubmitting(false)
        return
      }
      router.replace('/account')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main style={{ background: '#fafafa', minHeight: '100vh', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '420px', margin: '0 auto', background: '#fff', borderRadius: '20px', border: '1.5px solid #eee', padding: '2.5rem 2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#111', letterSpacing: '-0.025em', margin: '0 0 0.5rem' }}>
            Sign in
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 2rem' }}>
            Welcome back to Luton Cards.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={lbl}>Email</label>
              <input
                style={inp}
                type="email"
                required
                autoFocus
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input
                style={inp}
                type="password"
                required
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Your password"
              />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', padding: '0.75rem 0.9rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={submitting} style={btn(submitting)}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center', margin: '0.5rem 0 0' }}>
              New here?{' '}
              <Link href="/register" style={{ color: '#EC1E79', fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}

const lbl: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }
const inp: React.CSSProperties = { width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const btn = (loading: boolean): React.CSSProperties => ({
  background: loading ? '#c81c6b' : '#EC1E79',
  color: '#fff', border: 'none',
  padding: '0.9rem 1.4rem', borderRadius: '12px',
  fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em',
  cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
  marginTop: '0.5rem',
})
