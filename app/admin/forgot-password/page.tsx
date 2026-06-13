'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, AlertCircle, Loader2, MailCheck } from 'lucide-react'

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await fetch('/api/admin/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Anti-enumeration: always show the same neutral confirmation.
      setSent(true)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const isDisabled = loading || !email

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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(236,30,121,0.1)',
              border: '1px solid rgba(236,30,121,0.2)',
            }}>
              {sent ? <MailCheck size={22} color="#EC1E79" /> : <Mail size={22} color="#EC1E79" />}
            </div>
          </div>
          <h1 style={{
            color: '#fff',
            fontWeight: 900,
            fontSize: '1.5rem',
            letterSpacing: '-0.02em',
            marginBottom: '0.375rem',
          }}>
            {sent ? 'Check your inbox' : 'Reset password'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {sent
              ? 'If an account exists for that email, we’ve sent a reset link.'
              : 'Enter your admin email to receive a reset link.'}
          </p>
        </div>

        {sent ? (
          <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8125rem' }}>
            <a href="/admin/login" style={{ color: '#6b7280', textDecoration: 'none' }}>
              &larr; Back to admin sign in
            </a>
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
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
                  Sending...
                </>
              ) : 'Send reset link'}
            </motion.button>

            <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.8125rem' }}>
              <a href="/admin/login" style={{ color: '#6b7280', textDecoration: 'none' }}>
                &larr; Back to admin sign in
              </a>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  )
}
