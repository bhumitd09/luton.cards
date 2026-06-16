'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'

type Step = 'password' | 'two-factor'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Two-factor step
  const [step, setStep] = useState<Step>('password')
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      // Password correct but a second factor is required.
      if (!data.success && data.twoFactorRequired) {
        setStep('two-factor')
        setCode('')
        setUseRecovery(false)
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Invalid credentials. Try again.')
        setLoading(false)
        return
      }

      router.push('/admin')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const body = useRecovery
        ? { email, password, recoveryCode: code }
        : { email, password, code }

      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || (useRecovery ? 'Invalid recovery code. Try again.' : 'Invalid code. Try again.'))
        setLoading(false)
        return
      }

      router.push('/admin')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const handleBackToPassword = () => {
    setStep('password')
    setCode('')
    setError('')
    setUseRecovery(false)
  }

  const toggleRecovery = () => {
    setUseRecovery(v => !v)
    setCode('')
    setError('')
  }

  const isDisabled = loading || !email || !password
  const isVerifyDisabled = loading || !code || (!useRecovery && code.length !== 6)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      {/* Background glow */}
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <img
              src="/logo/luton-cards.png"
              alt="Luton Cards"
              style={{
                height: '120px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 24px rgba(236,30,121,0.35))',
              }}
            />
          </div>
          <h1 style={{
            color: '#fff',
            fontWeight: 900,
            fontSize: '1.5rem',
            letterSpacing: '-0.02em',
            marginBottom: '0.375rem',
          }}>
            {step === 'two-factor' ? 'Two-factor authentication' : 'Admin Access'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {step === 'two-factor'
              ? (useRecovery ? 'Enter a recovery code' : 'Enter the 6-digit code from your authenticator app')
              : 'Luton Cards · Staff only'}
          </p>
        </div>

        {step === 'two-factor' ? (
          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#9ca3af',
                marginBottom: '0.5rem',
              }}>
                {useRecovery ? 'Recovery code' : 'Authentication code'}
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck
                  size={15}
                  color="#6b7280"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={code}
                  onChange={e => {
                    const v = useRecovery
                      ? e.target.value
                      : e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCode(v)
                    setError('')
                  }}
                  placeholder={useRecovery ? 'ab12c-d34ef' : '123456'}
                  autoFocus
                  inputMode={useRecovery ? 'text' : 'numeric'}
                  maxLength={useRecovery ? 32 : 6}
                  autoComplete="one-time-code"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    background: '#161616',
                    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : '#1f1f1f'}`,
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: useRecovery ? '0.9375rem' : '1.25rem',
                    letterSpacing: useRecovery ? 'normal' : '0.3em',
                    fontFamily: useRecovery ? 'inherit' : 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
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

              <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={toggleRecovery}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#EC1E79',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  {useRecovery ? 'Use a 6-digit code instead' : 'Use a recovery code instead'}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isVerifyDisabled}
              whileHover={!isVerifyDisabled ? { scale: 1.02, y: -1 } : {}}
              whileTap={!isVerifyDisabled ? { scale: 0.98 } : {}}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: isVerifyDisabled ? '#1a1a1a' : '#EC1E79',
                color: isVerifyDisabled ? '#6b7280' : '#000',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: isVerifyDisabled ? 'not-allowed' : 'pointer',
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
                  Verifying...
                </>
              ) : 'Verify'}
            </motion.button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={handleBackToPassword}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={13} />
                Back
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={handleLogin}>
          {/* Email field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#9ca3af',
              marginBottom: '0.5rem',
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={15}
                color="#6b7280"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="admin@lutoncards.co.uk"
                autoFocus
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  background: '#161616',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : '#1f1f1f'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(236,30,121,0.5)' }}
                onBlur={e => { if (!error) e.target.style.borderColor = '#1f1f1f' }}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#9ca3af',
              marginBottom: '0.5rem',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                color="#6b7280"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Enter password"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.75rem 0.75rem 2.5rem',
                  background: '#161616',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : '#1f1f1f'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
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

            {/* Error */}
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

            <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
              <a
                href="/admin/forgot-password"
                style={{ color: '#EC1E79', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}
              >
                Forgot password?
              </a>
            </div>
          </div>

          {/* Submit */}
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
                Signing in...
              </>
            ) : 'Sign In'}
          </motion.button>
        </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.8125rem' }}>
          <a href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>
            &larr; Back to site
          </a>
        </p>
      </motion.div>
    </div>
  )
}
