'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

const MIN_PASSWORD = 12

function AdminResetPasswordContent() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => {
      router.replace('/admin/login')
    }, 1500)
    return () => clearTimeout(t)
  }, [done, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Could not reset your password.')
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const isDisabled = loading || !password || !confirm

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: '#161616',
    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : '#1f1f1f'}`,
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.9375rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  let body: React.ReactNode

  if (!token) {
    body = (
      <>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <IconBadge variant="error" />
          <Title>Invalid link</Title>
          <Subtitle>This reset link is missing or invalid. Please request a new one.</Subtitle>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
          <a href="/admin/forgot-password" style={{ color: '#EC1E79', textDecoration: 'none', fontWeight: 700 }}>
            Request a new link
          </a>
        </p>
      </>
    )
  } else if (done) {
    body = (
      <>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <IconBadge variant="success" />
          <Title>Password updated</Title>
          <Subtitle>Your password has been changed. Redirecting you to sign in…</Subtitle>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
          <a href="/admin/login" style={{ color: '#EC1E79', textDecoration: 'none', fontWeight: 700 }}>
            Sign in now
          </a>
        </p>
      </>
    )
  } else {
    body = (
      <>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <IconBadge variant="accent" />
          <Title>Set a new password</Title>
          <Subtitle>Choose a strong password of at least {MIN_PASSWORD} characters.</Subtitle>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <FieldLabel>New password</FieldLabel>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                color="#6b7280"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Enter new password"
                autoFocus
                autoComplete="new-password"
                style={{ ...inputBase, padding: '0.75rem 2.75rem 0.75rem 2.5rem' }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(236,30,121,0.5)' }}
                onBlur={e => { if (!error) e.target.style.borderColor = '#1f1f1f' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  padding: '2px',
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <FieldLabel>Confirm password</FieldLabel>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                color="#6b7280"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                style={{ ...inputBase, padding: '0.75rem 1rem 0.75rem 2.5rem' }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(236,30,121,0.5)' }}
                onBlur={e => { if (!error) e.target.style.borderColor = '#1f1f1f' }}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#fca5a5',
                  fontSize: '0.8125rem',
                  marginTop: '0.5rem',
                }}
              >
                <AlertCircle size={13} />
                {error}
              </motion.div>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: isDisabled ? '#1a1a1a' : '#EC1E79',
              color: isDisabled ? '#6b7280' : '#000',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.9375rem',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 size={16} />
                </motion.div>
                Updating...
              </>
            ) : 'Update password'}
          </motion.button>

          <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.8125rem' }}>
            <a href="/admin/forgot-password" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Link expired? Request a new one
            </a>
          </p>
        </form>
      </>
    )
  }

  return <AdminShell>{body}</AdminShell>
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<AdminShell><div style={{ height: '200px' }} /></AdminShell>}>
      <AdminResetPasswordContent />
    </Suspense>
  )
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        position: 'fixed',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '500px',
        background: 'radial-gradient(ellipse, rgba(236,30,121,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: '24px',
          padding: '2.5rem',
          position: 'relative',
          boxShadow: '0 0 60px rgba(236,30,121,0.05)',
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

function IconBadge({ variant }: { variant: 'accent' | 'success' | 'error' }) {
  const colour = variant === 'error' ? '#fca5a5' : '#EC1E79'
  const ring = variant === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(236,30,121,0.2)'
  const fill = variant === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(236,30,121,0.1)'
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: fill,
        border: `1px solid ${ring}`,
      }}>
        {variant === 'error'
          ? <AlertCircle size={22} color={colour} />
          : variant === 'success'
            ? <CheckCircle2 size={22} color={colour} />
            : <Lock size={22} color={colour} />}
      </div>
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      color: '#fff',
      fontWeight: 900,
      fontSize: '1.5rem',
      letterSpacing: '-0.02em',
      marginBottom: '0.375rem',
    }}>
      {children}
    </h1>
  )
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{children}</p>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block',
      fontSize: '0.8125rem',
      fontWeight: 600,
      color: '#9ca3af',
      marginBottom: '0.5rem',
    }}>
      {children}
    </label>
  )
}
