'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Particles } from '@/components/magicui/particles'
import { BorderBeam } from '@/components/magicui/border-beam'

type State = 'verifying' | 'done' | 'error'

function VerifyEmailContent() {
  const params = useSearchParams()
  const token = params.get('token')

  const [state, setState] = useState<State>('verifying')
  const [claimed, setClaimed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setState('error')
      setError('This verification link is missing or invalid.')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setState('error')
          setError(data?.error || 'Could not verify your email.')
          return
        }
        setClaimed(typeof data.claimed === 'number' ? data.claimed : 0)
        setState('done')
      } catch {
        if (!cancelled) {
          setState('error')
          setError('Network error. Please try again.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [token])

  return (
    <Shell>
      {state === 'verifying' && (
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#EC1E79]/20 bg-[#EC1E79]/10">
            <Loader2 size={18} className="animate-spin text-[#EC1E79]" />
          </div>
          <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em] text-white">Verifying…</h1>
          <p className="m-0 mt-2 text-sm leading-relaxed text-white/55">Just a moment while we confirm your email.</p>
        </div>
      )}

      {state === 'done' && (
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#EC1E79]/20 bg-[#EC1E79]/10">
            <MailCheck size={18} className="text-[#EC1E79]" />
          </div>
          <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em] text-white">Email verified!</h1>
          <p className="m-0 mt-2 text-sm leading-relaxed text-white/55">
            {claimed > 0
              ? `Your account is all set. We found ${claimed} order${claimed === 1 ? '' : 's'} placed with this email and added ${claimed === 1 ? 'it' : 'them'} to your account.`
              : 'Your email is confirmed and your account is all set.'}
          </p>
          <Link
            href="/account"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#EC1E79] px-5 py-3 text-sm font-bold text-black"
          >
            <CheckCircle2 size={16} /> Go to my account
          </Link>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <AlertCircle size={18} className="text-red-300" />
          </div>
          <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em] text-white">Verification failed</h1>
          <p className="m-0 mt-2 text-sm leading-relaxed text-white/55">{error}</p>
          <Link href="/account" className="mt-6 text-sm font-bold text-[#EC1E79] underline-offset-4 hover:underline">
            Go to my account
          </Link>
        </div>
      )}
    </Shell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Shell><div className="h-40" /></Shell>}>
      <VerifyEmailContent />
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
