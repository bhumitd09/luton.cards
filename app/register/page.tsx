'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { useToast } from '@/components/admin/toast'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Particles } from '@/components/magicui/particles'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { BorderBeam } from '@/components/magicui/border-beam'

function RegisterContent() {
  const router = useRouter()
  const params = useSearchParams()
  const nextUrl = params.get('next')
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', marketingOptIn: false })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Could not create account.')
        setSubmitting(false)
        return
      }
      toast.success('Account created — check your email to verify and link any past orders.')
      const dest = nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//') ? nextUrl : '/account'
      router.replace(dest)
      router.refresh()
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
          className="relative mx-auto max-w-[460px] px-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-7 backdrop-blur-xl sm:p-9">
            <BorderBeam size={300} duration={12} colorFrom="#EC1E79" colorTo="#FF80B8" borderWidth={1.5} />

            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#EC1E79]/20 bg-[#EC1E79]/10">
                <UserPlus size={18} className="text-[#EC1E79]" />
              </div>
              <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em] text-white">Create your account</h1>
              <p className="m-0 mt-1 text-sm text-white/45">
                Save your address, see order history, get first dibs on drops.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Name">
                <input
                  className={darkInput}
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  maxLength={120}
                />
              </Field>
              <Field label="Email *">
                <input
                  className={darkInput}
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Password * (min 8 chars)">
                <input
                  className={darkInput}
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-[1.5] text-white/65">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[#EC1E79]"
                  checked={form.marketingOptIn}
                  onChange={e => setForm(prev => ({ ...prev, marketingOptIn: e.target.checked }))}
                />
                Email me about new drops, restocks and offers.
              </label>

              <ShimmerButton
                type="submit"
                disabled={submitting}
                className="mt-1 w-full px-6 py-3.5 text-sm"
                background="linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)"
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </ShimmerButton>

              <p className="m-0 mt-2 text-center text-sm text-white/55">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-[#EC1E79] underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
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
