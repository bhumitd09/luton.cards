'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Wallet,
  ShieldCheck,
  KeyRound,
  Check,
  Copy,
  Loader2,
  ArrowRight,
} from 'lucide-react'

// ─── Theme (matches the admin chrome) ────────────────────────────────────
const T = {
  bg: '#0a0a0a',
  panel: '#0f0f10',
  panelRaised: '#161617',
  border: '#202022',
  pink: '#EC1E79',
  pinkSoft: 'rgba(236,30,121,0.12)',
  text: '#f4f4f5',
  textDim: '#9ca3af',
  textFaint: '#6b7280',
  green: '#10b981',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.85rem',
  background: '#0c0c0d',
  border: `1px solid ${T.border}`,
  borderRadius: 11,
  color: '#fff',
  fontSize: '0.92rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: T.textDim,
  marginBottom: '0.4rem',
}

type Profile = {
  name: string | null
  email: string
  payoutNotes: string | null
  totpEnabled: boolean
  mustOnboard: boolean
}

const STEPS = [
  { key: 'payout', label: 'Payout details', icon: Wallet },
  { key: 'twofa', label: 'Two-factor', icon: ShieldCheck },
  { key: 'password', label: 'New password', icon: KeyRound },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => (r.ok ? r.json() : null))
      .then((data: Profile | null) => {
        if (!data) {
          router.replace('/admin/login')
          return
        }
        // Already onboarded — nothing to do here.
        if (!data.mustOnboard) {
          router.replace('/admin')
          return
        }
        setProfile(data)
        setLoading(false)
      })
      .catch(() => router.replace('/admin/login'))
  }, [router])

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          style={{ width: 28, height: 28, borderRadius: '50%', border: `2.5px solid ${T.border}`, borderTopColor: T.pink }}
        />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1.25rem 4rem' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.75rem', justifyContent: 'center' }}>
          <img src="/logo/luton-cards.png" alt="Luton Cards" style={{ height: 46, width: 'auto', objectFit: 'contain' }} />
        </div>

        {done ? (
          <CompletePanel onGo={() => router.replace('/admin/login')} />
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <h1 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                Welcome{profile.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
              </h1>
              <p style={{ margin: '0.5rem 0 0', color: T.textDim, fontSize: '0.9rem' }}>
                Three quick steps to secure your account before you start.
              </p>
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
              {STEPS.map((s, i) => {
                const state = i < step ? 'done' : i === step ? 'active' : 'todo'
                const Icon = s.icon
                return (
                  <div key={s.key} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.45rem',
                      padding: '0.4rem 0.6rem', borderRadius: 9, flex: 1,
                      background: state === 'active' ? T.pinkSoft : 'transparent',
                      border: `1px solid ${state === 'todo' ? T.border : 'rgba(236,30,121,0.35)'}`,
                    }}>
                      {state === 'done'
                        ? <Check size={15} color={T.green} />
                        : <Icon size={15} color={state === 'active' ? T.pink : T.textFaint} />}
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700,
                        color: state === 'todo' ? T.textFaint : '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 18, padding: '1.5rem' }}>
              {step === 0 && (
                <PayoutStep
                  initial={profile.payoutNotes ?? ''}
                  onNext={() => setStep(1)}
                />
              )}
              {step === 1 && (
                <TwoFactorStep
                  alreadyEnabled={profile.totpEnabled}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <PasswordStep onDone={() => setDone(true)} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Step 1: payout details ───────────────────────────────────────────────
function PayoutStep({ initial, onNext }: { initial: string; onNext: () => void }) {
  const [notes, setNotes] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!notes.trim()) { setError('Please add your payout details so we know where to send your money.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutNotes: notes }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Could not save')
      }
      onNext()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <StepHeading icon={Wallet} title="How should we pay you?" sub="Tell us how to send your share when your cards sell. You can update this any time in Settings." />
      <label style={labelStyle}>Payout details</label>
      <textarea
        style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder={'e.g. PayPal: you@email.com\nor Bank: 12-34-56 / 12345678 (Name)'}
      />
      {error && <ErrorLine msg={error} />}
      <NextButton onClick={save} busy={saving} label="Save & continue" />
    </div>
  )
}

// ─── Step 2: two-factor ────────────────────────────────────────────────────
function TwoFactorStep({ alreadyEnabled, onNext }: { alreadyEnabled: boolean; onNext: () => void }) {
  const [qr, setQr] = useState('')
  const [secret, setSecret] = useState('')
  const [starting, setStarting] = useState(false)
  const [code, setCode] = useState('')
  const [enabling, setEnabling] = useState(false)
  const [error, setError] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  if (alreadyEnabled) {
    return (
      <div>
        <StepHeading icon={ShieldCheck} title="Two-factor is on" sub="Your account already has an authenticator enrolled. Nothing to do here." />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: T.green, fontWeight: 700, fontSize: '0.9rem', margin: '0.5rem 0 0.25rem' }}>
          <Check size={18} /> 2FA enabled
        </div>
        <NextButton onClick={onNext} label="Continue" />
      </div>
    )
  }

  const start = async () => {
    setStarting(true); setError('')
    try {
      const res = await fetch('/api/admin/auth/2fa/setup', { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Could not start 2FA setup')
      setQr(d.qr); setSecret(d.secret)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start 2FA setup')
    } finally {
      setStarting(false)
    }
  }

  const enable = async () => {
    if (code.trim().length < 6) { setError('Enter the 6-digit code from your app.'); return }
    setEnabling(true); setError('')
    try {
      const res = await fetch('/api/admin/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'That code was not valid')
      setRecoveryCodes(d.recoveryCodes || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That code was not valid')
    } finally {
      setEnabling(false)
    }
  }

  // After enabling, show recovery codes before moving on.
  if (recoveryCodes.length > 0) {
    return (
      <div>
        <StepHeading icon={ShieldCheck} title="Save your recovery codes" sub="Store these somewhere safe. Each one logs you in once if you lose your authenticator." />
        <RecoveryCodes codes={recoveryCodes} />
        <NextButton onClick={onNext} label="I've saved them — continue" />
      </div>
    )
  }

  return (
    <div>
      <StepHeading icon={ShieldCheck} title="Set up two-factor" sub="Add an extra layer of security with an authenticator app (Google Authenticator, 1Password, Authy…)." />
      {!qr ? (
        <NextButton onClick={start} busy={starting} label="Generate my QR code" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0 1rem' }}>
            <img src={qr} alt="2FA QR code" style={{ width: 180, height: 180, borderRadius: 12, background: '#fff', padding: 8 }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: T.textFaint }}>Can&apos;t scan? Enter this key manually:</p>
              <code style={{ fontSize: '0.8rem', color: T.text, wordBreak: 'break-all', letterSpacing: '0.05em' }}>{secret}</code>
            </div>
          </div>
          <label style={labelStyle}>Enter the 6-digit code from your app</label>
          <input
            style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.1rem' }}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="000000"
          />
          {error && <ErrorLine msg={error} />}
          <NextButton onClick={enable} busy={enabling} label="Verify & enable" />
        </>
      )}
      {!qr && error && <ErrorLine msg={error} />}
    </div>
  )
}

// ─── Step 3: new password ──────────────────────────────────────────────────
function PasswordStep({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!current) { setError('Enter the temporary password you signed in with.'); return }
    if (next.length < 12) { setError('Your new password must be at least 12 characters.'); return }
    if (next !== confirm) { setError('The two new passwords don’t match.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Could not change password')
      // Password change invalidates the session — the completion panel sends
      // the user to the login screen to sign in with their new password.
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <StepHeading icon={KeyRound} title="Choose your own password" sub="Replace the temporary password you were given. Use at least 12 characters." />
      <label style={labelStyle}>Temporary password</label>
      <input type="password" style={inputStyle} value={current} onChange={e => setCurrent(e.target.value)} placeholder="The one you just logged in with" autoComplete="current-password" />
      <div style={{ height: '0.85rem' }} />
      <label style={labelStyle}>New password</label>
      <input type="password" style={inputStyle} value={next} onChange={e => setNext(e.target.value)} placeholder="At least 12 characters" autoComplete="new-password" />
      <div style={{ height: '0.85rem' }} />
      <label style={labelStyle}>Confirm new password</label>
      <input type="password" style={inputStyle} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
      {error && <ErrorLine msg={error} />}
      <NextButton onClick={save} busy={saving} label="Finish setup" />
    </div>
  )
}

// ─── Completion ─────────────────────────────────────────────────────────────
function CompletePanel({ onGo }: { onGo: () => void }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 18, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1rem',
        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Check size={28} color={T.green} />
      </div>
      <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: 900 }}>You&apos;re all set</h2>
      <p style={{ margin: '0.6rem 0 1.5rem', color: T.textDim, fontSize: '0.9rem' }}>
        Your account is secured. Sign in again with your new password to get started.
      </p>
      <button onClick={onGo} style={primaryBtn}>
        Go to login <ArrowRight size={16} />
      </button>
    </div>
  )
}

// ─── Shared bits ────────────────────────────────────────────────────────────
function StepHeading({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
        <Icon size={18} color={T.pink} />
        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      <p style={{ margin: 0, color: T.textDim, fontSize: '0.85rem', lineHeight: 1.5 }}>{sub}</p>
    </div>
  )
}

function ErrorLine({ msg }: { msg: string }) {
  return (
    <p style={{ margin: '0.85rem 0 0', color: '#f87171', fontSize: '0.82rem', fontWeight: 600 }}>{msg}</p>
  )
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
  width: '100%', marginTop: '1.25rem',
  background: T.pink, color: '#fff', border: 'none', borderRadius: 11,
  padding: '0.75rem 1rem', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer',
  fontFamily: 'inherit',
}

function NextButton({ onClick, busy, label }: { onClick: () => void; busy?: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1, cursor: busy ? 'wait' : 'pointer' }}>
      {busy ? <Loader2 size={16} className="spin" /> : null}
      {label} {!busy && <ArrowRight size={16} />}
      <style>{`.spin{animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )
}

function RecoveryCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard blocked — codes are still visible to copy by hand */ }
  }
  return (
    <div style={{ margin: '0.25rem 0 0' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem',
        background: '#0c0c0d', border: `1px solid ${T.border}`, borderRadius: 12, padding: '0.85rem',
      }}>
        {codes.map((c, i) => (
          <code key={i} style={{ fontSize: '0.82rem', color: T.text, letterSpacing: '0.04em' }}>{c}</code>
        ))}
      </div>
      <button
        onClick={copy}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.7rem',
          background: T.panelRaised, border: `1px solid ${T.border}`, color: T.textDim,
          borderRadius: 9, padding: '0.45rem 0.8rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
        }}
      >
        {copied ? <Check size={14} color={T.green} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy all'}
      </button>
    </div>
  )
}
