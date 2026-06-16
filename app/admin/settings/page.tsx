'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Store,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  Download,
  Database,
  Send,
  SlidersHorizontal,
  ShieldCheck,
  Copy,
} from 'lucide-react'

interface AdminProfile {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  lastLogin: string | null
}

type Tab = 'profile' | 'store' | 'email' | 'security' | 'data'

interface TwoFactorStatus {
  enabled: boolean
  pending: boolean
  recoveryCodesRemaining: number
}

// ───────────────────────────────────────────────────────────────────────────
// Settings page — single-screen tabbed layout
// ───────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')

  // Profile
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileName, setProfileName] = useState('')
  const [saveNameLoading, setSaveNameLoading] = useState(false)
  const [profileCurrentPw, setProfileCurrentPw] = useState('')
  const [profileNewPw, setProfileNewPw] = useState('')
  const [profileConfirmPw, setProfileConfirmPw] = useState('')
  const [profilePwLoading, setProfilePwLoading] = useState(false)
  const [profilePwError, setProfilePwError] = useState('')
  const [showProfileCurrentPw, setShowProfileCurrentPw] = useState(false)
  const [showProfileNewPw, setShowProfileNewPw] = useState(false)
  const [showProfileConfirmPw, setShowProfileConfirmPw] = useState(false)

  // Store
  const [siteName, setSiteName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [storeLoading, setStoreLoading] = useState(false)
  const [loadingStore, setLoadingStore] = useState(true)

  // Email
  const [emailFrom, setEmailFrom] = useState('')
  const [emailFromLoading, setEmailFromLoading] = useState(false)
  const [loadingEmailFrom, setLoadingEmailFrom] = useState(true)
  const [resendConfigured, setResendConfigured] = useState<boolean | null>(null)
  const [testEmailLoading, setTestEmailLoading] = useState(false)

  // Data
  const [exportLoading, setExportLoading] = useState(false)

  // Security (2FA)
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupData, setSetupData] = useState<{ secret: string; uri: string; qr: string } | null>(null)
  const [enableCode, setEnableCode] = useState('')
  const [enableLoading, setEnableLoading] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisablePassword, setShowDisablePassword] = useState(false)
  const [disablePrompt, setDisablePrompt] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Loaders ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setProfile(data)
          setProfileName(data.name ?? '')
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content/site_name').then(r => r.json()).catch(() => null),
      fetch('/api/admin/content/contact_email').then(r => r.json()).catch(() => null),
    ]).then(([siteRes, emailRes]) => {
      if (siteRes?.content?.value) setSiteName(siteRes.content.value)
      if (emailRes?.content?.value) setContactEmail(emailRes.content.value)
    }).finally(() => setLoadingStore(false))
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content/email_from_address').then(r => r.json()).catch(() => null),
      fetch('/api/admin/system/status').then(r => r.json()).catch(() => null),
    ]).then(([emailFromRes, statusRes]) => {
      if (emailFromRes?.content?.value) setEmailFrom(emailFromRes.content.value)
      if (statusRes?.resendConfigured !== undefined) {
        setResendConfigured(statusRes.resendConfigured)
      }
    }).finally(() => setLoadingEmailFrom(false))
  }, [])

  // ── Security (2FA) ───────────────────────────────────────────────────────
  const loadTwoFactorStatus = async () => {
    setTwoFactorLoading(true)
    try {
      const res = await fetch('/api/admin/auth/2fa')
      const data = await res.json()
      setTwoFactor({
        enabled: !!data.enabled,
        pending: !!data.pending,
        recoveryCodesRemaining: data.recoveryCodesRemaining ?? 0,
      })
    } catch {
      showToast('Failed to load two-factor status', 'error')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'security' && !twoFactor && !twoFactorLoading) {
      void loadTwoFactorStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const handleBeginSetup = async () => {
    setSetupLoading(true)
    setRecoveryCodes(null)
    setEnableCode('')
    try {
      const res = await fetch('/api/admin/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.qr) {
        setSetupData({ secret: data.secret, uri: data.uri, qr: data.qr })
      } else {
        showToast(data.error || 'Failed to start setup', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleConfirmEnable = async () => {
    setEnableLoading(true)
    try {
      const res = await fetch('/api/admin/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: enableCode }),
      })
      const data = await res.json()
      if (res.ok && data.enabled) {
        setRecoveryCodes(Array.isArray(data.recoveryCodes) ? data.recoveryCodes : [])
        setSetupData(null)
        setEnableCode('')
      } else {
        showToast(data.error || 'Invalid code', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setEnableLoading(false)
    }
  }

  const handleEnableDone = async () => {
    setRecoveryCodes(null)
    await loadTwoFactorStatus()
  }

  const handleDisable = async () => {
    if (!disablePassword) {
      showToast('Password is required', 'error')
      return
    }
    setDisableLoading(true)
    try {
      const res = await fetch('/api/admin/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      })
      const data = await res.json()
      if (res.ok && data.disabled) {
        setDisablePrompt(false)
        setDisablePassword('')
        showToast('Two-factor authentication disabled', 'success')
        await loadTwoFactorStatus()
      } else {
        showToast(data.error || 'Failed to disable', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setDisableLoading(false)
    }
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(`${label} copied`, 'success')
    } catch {
      showToast('Copy failed', 'error')
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSaveProfileName = async () => {
    if (!profileName.trim()) {
      showToast('Name cannot be empty', 'error')
      return
    }
    setSaveNameLoading(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
        showToast('Name updated', 'success')
      } else {
        showToast(data.error || 'Failed to update name', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSaveNameLoading(false)
    }
  }

  const handleProfilePasswordChange = async () => {
    setProfilePwError('')
    if (!profileCurrentPw || !profileNewPw || !profileConfirmPw) {
      setProfilePwError('All password fields are required')
      return
    }
    if (profileNewPw !== profileConfirmPw) {
      setProfilePwError('New passwords do not match')
      return
    }
    if (profileNewPw.length < 8) {
      setProfilePwError('Min 8 characters')
      return
    }
    setProfilePwLoading(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: profileCurrentPw, newPassword: profileNewPw }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Password updated', 'success')
        setProfileCurrentPw('')
        setProfileNewPw('')
        setProfileConfirmPw('')
      } else {
        setProfilePwError(data.error || 'Failed')
      }
    } catch {
      setProfilePwError('Network error')
    } finally {
      setProfilePwLoading(false)
    }
  }

  const handleStoreSave = async () => {
    setStoreLoading(true)
    try {
      const [siteRes, emailRes] = await Promise.all([
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'site_name', value: siteName, type: 'text', label: 'Site Name' }),
        }),
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'contact_email', value: contactEmail, type: 'text', label: 'Contact Email' }),
        }),
      ])
      if (siteRes.ok && emailRes.ok) {
        showToast('Store settings saved', 'success')
      } else {
        showToast('Save failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setStoreLoading(false)
    }
  }

  const handleEmailFromSave = async () => {
    setEmailFromLoading(true)
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'email_from_address', value: emailFrom, type: 'text', label: 'Email From Address' }),
      })
      if (res.ok) showToast('Saved', 'success')
      else showToast('Save failed', 'error')
    } catch {
      showToast('Network error', 'error')
    } finally {
      setEmailFromLoading(false)
    }
  }

  const handleTestEmail = async () => {
    setTestEmailLoading(true)
    try {
      const res = await fetch('/api/admin/email/test', { method: 'POST' })
      const data = await res.json()
      if (data.sent) showToast('Test email sent', 'success')
      else showToast(data.reason || 'Failed to send', 'error')
    } catch {
      showToast('Network error', 'error')
    } finally {
      setTestEmailLoading(false)
    }
  }

  const handleExportProducts = async () => {
    setExportLoading(true)
    try {
      const res = await fetch('/api/admin/products?limit=1000')
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      const products = data.products ?? data
      const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `luton-cards-products-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Products exported', 'success')
    } catch {
      showToast('Export failed', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
    { id: 'profile', label: 'Profile', icon: User, description: 'Name + password' },
    { id: 'store', label: 'Store', icon: Store, description: 'Site name + contact email' },
    { id: 'email', label: 'Email', icon: Mail, description: 'From address + test' },
    { id: 'security', label: 'Security', icon: ShieldCheck, description: 'Two-factor auth' },
    { id: 'data', label: 'Data', icon: Database, description: 'Export + danger zone' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-[#f4f4f5] sm:p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[#EC1E79]">
              <SlidersHorizontal size={13} />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">Settings</span>
            </div>
            <h1 className="m-0 text-[clamp(1.4rem,2.5vw,1.75rem)] font-black tracking-[-0.025em] text-white">Settings</h1>
            <p className="m-0 mt-1 text-[0.875rem] text-[#9ca3af]">
              {profile?.email ? <>Signed in as <span className="text-[#f4f4f5]">{profile.email}</span></> : 'Account & store config'}
            </p>
          </div>
        </div>

        {/* Two-column layout: tabs sidebar + active panel */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          {/* Tabs */}
          <nav className="flex flex-row gap-1 overflow-x-auto rounded-2xl border border-[#202022] bg-[#0f0f10] p-2 md:flex-col md:overflow-visible">
            {TABS.map(t => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={[
                    'group relative flex shrink-0 items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left transition-colors md:shrink',
                    active
                      ? 'bg-[rgba(236,30,121,0.12)] text-[#EC1E79] md:before:absolute md:before:left-0 md:before:top-1/2 md:before:h-5 md:before:w-[3px] md:before:-translate-y-1/2 md:before:rounded-full md:before:bg-[#EC1E79]'
                      : 'text-[#9ca3af] hover:bg-[#161617] hover:text-[#f4f4f5]',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  <div className="hidden md:block">
                    <div className="text-[13px] font-bold">{t.label}</div>
                    <div className={`text-[10.5px] ${active ? 'text-[#EC1E79]/70' : 'text-[#6b7280]'}`}>
                      {t.description}
                    </div>
                  </div>
                  <span className="md:hidden text-[13px] font-bold">{t.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Active panel */}
          <div className="rounded-2xl border border-[#202022] bg-[#0f0f10] p-6">
            <AnimatePresence mode="wait">
              {tab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-7 md:grid-cols-2"
                >
                  {/* Name + email */}
                  <section>
                    <h2 className="m-0 mb-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                      Profile details
                    </h2>
                    <Field label="Email (read-only)">
                      <input
                        readOnly
                        disabled
                        value={profileLoading ? '' : profile?.email ?? ''}
                        placeholder="Loading…"
                        className="w-full cursor-not-allowed rounded-[11px] border border-[#202022] bg-[#0c0c0d] px-3 py-2.5 text-[0.9rem] text-[#6b7280] outline-none"
                      />
                    </Field>
                    <Field label="Display name">
                      <input
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        disabled={profileLoading}
                        placeholder="Your name"
                        className={darkInput}
                      />
                    </Field>
                    <button
                      onClick={handleSaveProfileName}
                      disabled={profileLoading || saveNameLoading || !profileName.trim()}
                      className={primaryBtn}
                    >
                      {saveNameLoading && <Loader2 size={13} className="animate-spin" />}
                      Save name
                    </button>
                  </section>

                  {/* Change password */}
                  <section>
                    <h2 className="m-0 mb-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                      Change password
                    </h2>
                    <Field label="Current password">
                      <PasswordInput
                        value={profileCurrentPw}
                        onChange={v => { setProfileCurrentPw(v); setProfilePwError('') }}
                        show={showProfileCurrentPw}
                        toggle={() => setShowProfileCurrentPw(v => !v)}
                        placeholder="Current password"
                      />
                    </Field>
                    <Field label="New password">
                      <PasswordInput
                        value={profileNewPw}
                        onChange={v => { setProfileNewPw(v); setProfilePwError('') }}
                        show={showProfileNewPw}
                        toggle={() => setShowProfileNewPw(v => !v)}
                        placeholder="Min 8 characters"
                      />
                    </Field>
                    <Field label="Confirm new password">
                      <PasswordInput
                        value={profileConfirmPw}
                        onChange={v => { setProfileConfirmPw(v); setProfilePwError('') }}
                        show={showProfileConfirmPw}
                        toggle={() => setShowProfileConfirmPw(v => !v)}
                        placeholder="Repeat new password"
                      />
                    </Field>
                    {profilePwError && (
                      <div className="mb-3 rounded-[11px] border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-[12px] text-[#ef4444]">
                        {profilePwError}
                      </div>
                    )}
                    <button
                      onClick={handleProfilePasswordChange}
                      disabled={profilePwLoading || !profileCurrentPw || !profileNewPw || !profileConfirmPw}
                      className={primaryBtn}
                    >
                      {profilePwLoading && <Loader2 size={13} className="animate-spin" />}
                      Update password
                    </button>
                  </section>
                </motion.div>
              )}

              {tab === 'store' && (
                <motion.div
                  key="store"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="m-0 mb-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                    Store information
                  </h2>
                  <p className="m-0 mb-5 text-[13px] text-[#9ca3af]">
                    Public-facing site identity. These values appear in metadata and the contact page.
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Site name">
                      <input
                        value={siteName}
                        onChange={e => setSiteName(e.target.value)}
                        disabled={loadingStore}
                        placeholder="Luton Cards"
                        className={darkInput}
                      />
                    </Field>
                    <Field label="Contact email">
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        disabled={loadingStore}
                        placeholder="hello@lutoncards.com"
                        className={darkInput}
                      />
                    </Field>
                  </div>
                  <button onClick={handleStoreSave} disabled={storeLoading || loadingStore} className={primaryBtn}>
                    {storeLoading && <Loader2 size={13} className="animate-spin" />}
                    Save store settings
                  </button>
                </motion.div>
              )}

              {tab === 'email' && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="m-0 mb-1 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                        Email notifications
                      </h2>
                      <p className="m-0 text-[13px] text-[#9ca3af]">
                        Address used as the &ldquo;From&rdquo; on order emails. Send a test below.
                      </p>
                    </div>
                    <StatusPill ok={resendConfigured === true} loading={loadingEmailFrom} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                    <Field label="From address">
                      <input
                        type="email"
                        value={emailFrom}
                        onChange={e => setEmailFrom(e.target.value)}
                        disabled={loadingEmailFrom}
                        placeholder="orders@lutoncards.com"
                        className={darkInput}
                      />
                    </Field>
                    <div className="flex items-end gap-2 pb-1">
                      <button
                        onClick={handleEmailFromSave}
                        disabled={emailFromLoading || loadingEmailFrom}
                        className={primaryBtn}
                      >
                        {emailFromLoading && <Loader2 size={13} className="animate-spin" />}
                        Save
                      </button>
                      <button
                        onClick={handleTestEmail}
                        disabled={testEmailLoading || !resendConfigured}
                        className={secondaryBtn}
                        title={!resendConfigured ? 'Configure RESEND_API_KEY in env to enable test sends' : ''}
                      >
                        {testEmailLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        Send test
                      </button>
                    </div>
                  </div>

                  {!resendConfigured && !loadingEmailFrom && (
                    <div className="mt-4 rounded-[11px] border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-[12.5px] leading-[1.55] text-[#f59e0b]">
                      Email provider not configured. Set the <code className="rounded bg-black/40 px-1 py-0.5 text-[#f59e0b]">RESEND_API_KEY</code> env var
                      in Railway to enable transactional emails (order confirmation, admin notifications, test sends).
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-auto max-w-[520px]"
                >
                  <h2 className="m-0 mb-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                    Two-factor authentication
                  </h2>

                  {twoFactorLoading && !twoFactor ? (
                    <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
                      <Loader2 size={14} className="animate-spin" /> Loading…
                    </div>
                  ) : recoveryCodes ? (
                    // ── Just enabled: show recovery codes ──
                    <div>
                      <div className="mb-4 flex items-center gap-2 text-[#10b981]">
                        <CheckCircle size={16} />
                        <span className="text-[13px] font-bold">Two-factor authentication is on</span>
                      </div>
                      <div className="mb-3 rounded-[11px] border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-[12.5px] leading-[1.55] text-[#f59e0b]">
                        Save these now — each works once and they won&apos;t be shown again.
                      </div>
                      <div className="mb-3 grid grid-cols-2 gap-2 rounded-[11px] border border-[#202022] bg-[#0c0c0d] p-4 font-mono text-[13px] text-[#f4f4f5]">
                        {recoveryCodes.map(rc => (
                          <span key={rc} className="select-all">{rc}</span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleCopy(recoveryCodes.join('\n'), 'Recovery codes')}
                          className={secondaryBtn}
                        >
                          <Copy size={13} /> Copy all
                        </button>
                        <button onClick={handleEnableDone} className={primaryBtn}>
                          Done
                        </button>
                      </div>
                    </div>
                  ) : twoFactor?.enabled ? (
                    // ── Enabled state ──
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-[#10b981]">
                        <CheckCircle size={16} />
                        <span className="text-[13px] font-bold">Two-factor authentication is on</span>
                      </div>
                      <p className="m-0 mb-5 text-[13px] text-[#9ca3af]">
                        {twoFactor.recoveryCodesRemaining} recovery code{twoFactor.recoveryCodesRemaining === 1 ? '' : 's'} remaining
                      </p>

                      {disablePrompt ? (
                        <div className="rounded-[11px] border border-[#202022] bg-[#0c0c0d] p-4">
                          <p className="m-0 mb-3 text-[13px] text-[#9ca3af]">
                            Enter your account password to turn off two-factor authentication.
                          </p>
                          <Field label="Account password">
                            <PasswordInput
                              value={disablePassword}
                              onChange={setDisablePassword}
                              show={showDisablePassword}
                              toggle={() => setShowDisablePassword(v => !v)}
                              placeholder="Account password"
                            />
                          </Field>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={handleDisable}
                              disabled={disableLoading || !disablePassword}
                              className={primaryBtn}
                            >
                              {disableLoading && <Loader2 size={13} className="animate-spin" />}
                              Disable 2FA
                            </button>
                            <button
                              onClick={() => { setDisablePrompt(false); setDisablePassword('') }}
                              disabled={disableLoading}
                              className={secondaryBtn}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setDisablePrompt(true)} className={secondaryBtn}>
                          Disable 2FA
                        </button>
                      )}
                    </div>
                  ) : setupData ? (
                    // ── Setup in progress ──
                    <div>
                      <p className="m-0 mb-4 text-[13px] leading-[1.55] text-[#9ca3af]">
                        Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
                      </p>
                      <div className="mb-4 flex justify-center rounded-[11px] border border-[#202022] bg-white p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={setupData.qr} alt="Scan with your authenticator app" width={200} height={200} />
                      </div>
                      <Field label="Or enter this code manually">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 select-all break-all rounded-[11px] border border-[#202022] bg-[#0c0c0d] px-3 py-2.5 font-mono text-[13px] text-[#f4f4f5]">
                            {setupData.secret}
                          </div>
                          <button
                            onClick={() => handleCopy(setupData.secret, 'Secret')}
                            className={secondaryBtn}
                            title="Copy secret"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </Field>
                      <Field label="Verification code">
                        <input
                          value={enableCode}
                          onChange={e => setEnableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          autoComplete="one-time-code"
                          className={darkInput}
                        />
                      </Field>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleConfirmEnable}
                          disabled={enableLoading || enableCode.length !== 6}
                          className={primaryBtn}
                        >
                          {enableLoading && <Loader2 size={13} className="animate-spin" />}
                          Confirm
                        </button>
                        <button
                          onClick={() => { setSetupData(null); setEnableCode('') }}
                          disabled={enableLoading}
                          className={secondaryBtn}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ── Not enabled ──
                    <div>
                      <p className="m-0 mb-5 text-[13px] leading-[1.55] text-[#9ca3af]">
                        Add a second step at sign-in using an authenticator app (such as Google
                        Authenticator or 1Password). This protects your account even if your
                        password is compromised.
                      </p>
                      <button onClick={handleBeginSetup} disabled={setupLoading} className={primaryBtn}>
                        {setupLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                        Enable 2FA
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'data' && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-7 md:grid-cols-2"
                >
                  {/* Export */}
                  <section>
                    <h2 className="m-0 mb-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                      Export
                    </h2>
                    <p className="m-0 mb-4 text-[13px] leading-[1.55] text-[#9ca3af]">
                      Download the full product catalogue as JSON. Useful for backups or
                      re-importing via Bulk Import on another instance.
                    </p>
                    <button onClick={handleExportProducts} disabled={exportLoading} className={primaryBtn}>
                      {exportLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      Export products (JSON)
                    </button>
                  </section>

                  {/* Danger zone */}
                  <section>
                    <h2 className="m-0 mb-3 flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#ef4444]">
                      <AlertTriangle size={12} /> Danger zone
                    </h2>
                    <p className="m-0 mb-4 text-[13px] leading-[1.55] text-[#9ca3af]">
                      Database resets / destructive operations are intentionally not exposed in
                      the admin UI. If you need to wipe orders or products, use Railway&apos;s
                      Postgres data tab — that way the action is logged and intentional.
                    </p>
                    <div className="rounded-[11px] border border-[#ef4444]/20 bg-[#ef4444]/[0.08] px-4 py-3 text-[12.5px] text-[#ef4444]/80">
                      Need a hard reset? Drop the relevant table in Railway then redeploy —
                      migrations + seed will rebuild structure.
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-[11px] border bg-[#0f0f10] px-4 py-3 shadow-2xl"
            style={{
              borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)',
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={16} className="text-[#10b981]" />
            ) : (
              <XCircle size={16} className="text-[#ef4444]" />
            )}
            <span className="text-[13px] font-bold text-[#f4f4f5]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Small components ──────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
        {label}
      </label>
      {children}
    </div>
  )
}

function PasswordInput({
  value, onChange, show, toggle, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  toggle: () => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${darkInput} pr-10`}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#f4f4f5]"
        tabIndex={-1}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

function StatusPill({ ok, loading }: { ok: boolean; loading: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#202022] bg-[#161617] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
        <Loader2 size={10} className="animate-spin" /> Checking
      </span>
    )
  }
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
        ok
          ? 'border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]'
          : 'border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]',
      ].join(' ')}
    >
      <span className="size-1.5 rounded-full" style={{ background: ok ? '#10b981' : '#f59e0b' }} />
      {ok ? 'Email ready' : 'Not configured'}
    </span>
  )
}

const darkInput =
  'box-border w-full rounded-[11px] border border-[#202022] bg-[#0c0c0d] px-3 py-2.5 text-[0.9rem] font-medium text-white outline-none transition-colors placeholder:text-[#6b7280] disabled:cursor-not-allowed disabled:opacity-50'

const primaryBtn =
  'inline-flex items-center gap-1.5 rounded-[11px] bg-[linear-gradient(135deg,#EC1E79,#FF4DA6)] px-[1.1rem] py-2.5 text-[0.85rem] font-extrabold text-white shadow-[0_8px_22px_-10px_rgba(236,30,121,0.6)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'

const secondaryBtn =
  'inline-flex items-center gap-1.5 rounded-[11px] border border-[#202022] bg-[#161617] px-[1.1rem] py-2.5 text-[0.85rem] font-bold text-[#e4e4e7] transition-colors hover:bg-[#202022] disabled:cursor-not-allowed disabled:opacity-50'
