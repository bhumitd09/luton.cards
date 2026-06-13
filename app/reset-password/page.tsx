'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Particles } from '@/components/magicui/particles'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { BorderBeam } from '@/components/magicui/border-beam'

const MIN_PASSWORD = 8

function ResetPasswordContent() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => {
      router.replace('/login')
    }, 1500)
    return () => clearTimeout(t)
  }, [done, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Could not reset your password.')
        setSubmitting(false)
        return
      }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Shell>
      {!token ? (
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <AlertCircle size={18} className="text-red-300" />
          </div>
          <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em] text-white">Invalid link</h1>
          <p className="m-0 mt-2 text-sm leading-relaxed text-white/55">
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 text-sm font-bold text-[#EC1E79] underline-offset-4 hover:underline"
          >
            Request a new link
          </Link>
        </div>
      ) : done ? (
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#EC1E79]/20 bg-[#EC1E79]/10">
            <CheckCircle2 size={18} className="text-[#EC1E79]" />
          </div>
          <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em] text-white">Password updated</h1>
          <p className="m-0 mt-2 text-sm leading-relaxed text-white/55">
            Your password has been changed. Redirecting you to sign in…
          </p>
          <Link
            href="/login"
            className="mt-6 text-sm font-bold text-[#EC1E79] underline-offset-4 hover:underline"
          >
            Sign in now
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#EC1E79]/20 bg-[#EC1E79]/10">
              <KeyRound size={18} className="text-[#EC1E79]" />
            </div>
            <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em] text-white">Set a new password</h1>
            <p className="m-0 mt-1 text-sm text-white/45">Choose a strong password you don&apos;t use elsewhere.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="New password">
              <input
                className={darkInput}
                type="password"
                required
                autoFocus
                minLength={MIN_PASSWORD}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Confirm password">
              <input
                className={darkInput}
                type="password"
                required
                minLength={MIN_PASSWORD}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-[13px] text-red-300">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <ShimmerButton
              type="submit"
              disabled={submitting}
              className="mt-1 w-full px-6 py-3.5 text-sm"
              background="linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)"
            >
              {submitting ? 'Updating…' : 'Update password'}
            </ShimmerButton>

            <p className="m-0 mt-2 text-center text-sm text-white/55">
              Link expired?{' '}
              <Link
                href="/forgot-password"
                className="font-bold text-[#EC1E79] underline-offset-4 hover:underline"
              >
                Request a new one
              </Link>
            </p>
          </form>
        </>
      )}
    </Shell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Shell><div className="h-40" /></Shell>}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-[#070708] py-16 sm:py-20">
        <Particles className="absolute inset-0" quantity={50} color="#EC1E79" ease={70} size={0.5} staticity={50} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(50% 60% at 50% 0%, rgba(236,30,121,0.22) 0%, rgba(236,30,121,0.05) 35%, transparent 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative mx-auto max-w-[420px] px-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-7 backdrop-blur-xl sm:p-9">
            <BorderBeam size={300} duration={12} colorFrom="#EC1E79" colorTo="#FF80B8" borderWidth={1.5} />
            {children}
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  )
}

const darkInput =
  'box-border w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm font-medium text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#EC1E79] focus:bg-white/[0.06]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/60">{label}</label>
      {children}
    </div>
  )
}
