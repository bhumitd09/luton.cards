'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { KeyRound, MailCheck } from 'lucide-react'
import { useToast } from '@/components/admin/toast'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Particles } from '@/components/magicui/particles'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { BorderBeam } from '@/components/magicui/border-beam'

export default function ForgotPasswordPage() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Anti-enumeration: always show the same neutral confirmation.
      setSent(true)
    } catch {
      toast.error('Network error. Please try again.')
      setSubmitting(false)
    }
  }

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

            {sent ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#EC1E79]/20 bg-[#EC1E79]/10">
                  <MailCheck size={18} className="text-[#EC1E79]" />
                </div>
                <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em] text-white">Check your inbox</h1>
                <p className="m-0 mt-2 text-sm leading-relaxed text-white/55">
                  If an account exists for that email, we&apos;ve sent a reset link. Check your inbox.
                </p>
                <Link
                  href="/login"
                  className="mt-6 text-sm font-bold text-[#EC1E79] underline-offset-4 hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#EC1E79]/20 bg-[#EC1E79]/10">
                    <KeyRound size={18} className="text-[#EC1E79]" />
                  </div>
                  <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em] text-white">Forgot password</h1>
                  <p className="m-0 mt-1 text-sm text-white/45">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Field label="Email">
                    <input
                      className={darkInput}
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </Field>

                  <ShimmerButton
                    type="submit"
                    disabled={submitting}
                    className="mt-1 w-full px-6 py-3.5 text-sm"
                    background="linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)"
                  >
                    {submitting ? 'Sending…' : 'Send reset link'}
                  </ShimmerButton>

                  <p className="m-0 mt-2 text-center text-sm text-white/55">
                    Remembered it?{' '}
                    <Link
                      href="/login"
                      className="font-bold text-[#EC1E79] underline-offset-4 hover:underline"
                    >
                      Back to sign in
                    </Link>
                  </p>
                </form>
              </>
            )}
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
