'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Lock,
  Store,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  Download,
  Mail,
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

interface AdminProfile {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  lastLogin: string | null
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  icon: Icon,
  iconColor,
  children,
  borderColor,
}: {
  title: string
  icon: React.ElementType
  iconColor: string
  children: React.ReactNode
  borderColor?: string
}) {
  return (
    <div style={{
      background: '#111',
      border: `1px solid ${borderColor ?? '#1f1f1f'}`,
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '1.5rem',
    }}>
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: `1px solid ${borderColor ?? '#1f1f1f'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: `${iconColor}18`,
          border: `1px solid ${iconColor}30`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={16} color={iconColor} />
        </div>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff' }}>{title}</h2>
      </div>
      <div style={{ padding: '1.5rem' }}>
        {children}
      </div>
    </div>
  )
}

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  rightElement,
}: {
  label: string
  type?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  disabled?: boolean
  rightElement?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: '#9ca3af',
        marginBottom: '0.5rem',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: rightElement ? '0.75rem 2.75rem 0.75rem 0.875rem' : '0.75rem 0.875rem',
            background: disabled ? '#0f0f0f' : '#161616',
            border: '1px solid #1f1f1f',
            borderRadius: '10px',
            color: disabled ? '#6b7280' : '#fff',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          onFocus={e => { if (!disabled) e.target.style.borderColor = 'rgba(236,30,121,0.5)' }}
          onBlur={e => { e.target.style.borderColor = '#1f1f1f' }}
        />
        {rightElement && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({
  loading,
  disabled,
  onClick,
  label,
  variant = 'primary',
}: {
  loading: boolean
  disabled?: boolean
  onClick: () => void
  label: string
  variant?: 'primary' | 'danger'
}) {
  const isDisabled = loading || disabled
  const bg = isDisabled
    ? '#1a1a1a'
    : variant === 'danger'
    ? 'rgba(239,68,68,0.12)'
    : '#EC1E79'
  const color = isDisabled
    ? '#6b7280'
    : variant === 'danger'
    ? '#ef4444'
    : '#000'
  const border = variant === 'danger' ? '1px solid rgba(239,68,68,0.3)' : 'none'

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.7rem 1.25rem',
        background: bg,
        color,
        border,
        borderRadius: '10px',
        fontWeight: 700,
        fontSize: '0.875rem',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {loading && (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={14} />
        </motion.div>
      )}
      {label}
    </motion.button>
  )
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        background: type === 'success' ? 'rgba(236,30,121,0.15)' : 'rgba(239,68,68,0.15)',
        border: `1px solid ${type === 'success' ? 'rgba(236,30,121,0.3)' : 'rgba(239,68,68,0.3)'}`,
        color: type === 'success' ? '#EC1E79' : '#fca5a5',
        padding: '0.75rem 1.25rem',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        zIndex: 50,
        maxWidth: '360px',
        backdropFilter: 'blur(8px)',
      }}
    >
      {type === 'success' ? <CheckCircle size={15} /> : <XCircle size={15} />}
      {message}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  // Admin Profile
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

  // Account
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // Store Information
  const [siteName, setSiteName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [storeLoading, setStoreLoading] = useState(false)
  const [loadingStore, setLoadingStore] = useState(true)

  // Email notifications
  const [emailFrom, setEmailFrom] = useState('')
  const [emailFromLoading, setEmailFromLoading] = useState(false)
  const [loadingEmailFrom, setLoadingEmailFrom] = useState(true)
  const [resendConfigured, setResendConfigured] = useState<boolean | null>(null)
  const [testEmailLoading, setTestEmailLoading] = useState(false)

  // Export
  const [exportLoading, setExportLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type })

  // Load admin profile
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

  // Load admin user
  useEffect(() => {
    fetch('/api/admin/auth')
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user)
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false))
  }, [])

  // Load store content
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content/site_name').then(r => r.json()).catch(() => null),
      fetch('/api/admin/content/contact_email').then(r => r.json()).catch(() => null),
    ]).then(([siteRes, emailRes]) => {
      if (siteRes?.content?.value) setSiteName(siteRes.content.value)
      if (emailRes?.content?.value) setContactEmail(emailRes.content.value)
    }).finally(() => setLoadingStore(false))
  }, [])

  // Load email settings
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

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

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
        showToast('Name updated successfully', 'success')
      } else {
        showToast(data.error || 'Failed to update name', 'error')
      }
    } catch {
      showToast('Network error. Please try again.', 'error')
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
      setProfilePwError('New password must be at least 8 characters')
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
        showToast('Password updated successfully', 'success')
        setProfileCurrentPw('')
        setProfileNewPw('')
        setProfileConfirmPw('')
      } else {
        setProfilePwError(data.error || 'Failed to update password')
      }
    } catch {
      setProfilePwError('Network error. Please try again.')
    } finally {
      setProfilePwLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      showToast('All password fields are required', 'error')
      return
    }
    if (newPw !== confirmPw) {
      showToast('New passwords do not match', 'error')
      return
    }
    if (newPw.length < 8) {
      showToast('New password must be at least 8 characters', 'error')
      return
    }

    setPwLoading(true)
    try {
      const res = await fetch('/api/admin/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Password updated successfully', 'success')
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      } else {
        showToast(data.error || 'Failed to update password', 'error')
      }
    } catch {
      showToast('Network error. Please try again.', 'error')
    } finally {
      setPwLoading(false)
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
        showToast('Failed to save some settings', 'error')
      }
    } catch {
      showToast('Network error. Please try again.', 'error')
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
      if (res.ok) {
        showToast('Email from address saved', 'success')
      } else {
        showToast('Failed to save email from address', 'error')
      }
    } catch {
      showToast('Network error. Please try again.', 'error')
    } finally {
      setEmailFromLoading(false)
    }
  }

  const handleTestEmail = async () => {
    setTestEmailLoading(true)
    try {
      const res = await fetch('/api/admin/email/test', { method: 'POST' })
      const data = await res.json()
      if (data.sent) {
        showToast('Test email sent successfully', 'success')
      } else {
        showToast(data.reason || 'Failed to send test email', 'error')
      }
    } catch {
      showToast('Network error. Please try again.', 'error')
    } finally {
      setTestEmailLoading(false)
    }
  }

  const handleExportProducts = async () => {
    setExportLoading(true)
    try {
      const res = await fetch('/api/admin/products?limit=1000')
      if (!res.ok) throw new Error('Failed to fetch products')
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
      showToast('Products exported successfully', 'success')
    } catch {
      showToast('Failed to export products', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div style={{ padding: '2rem', color: '#fff', maxWidth: '700px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '2rem' }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
          Settings
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Manage your account, store configuration, and data
        </p>
      </motion.div>

      {/* 0. Admin Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <SectionCard title="Admin Profile" icon={User} iconColor="#EC1E79">
          {/* Name */}
          <InputField
            label="Name"
            value={profileName}
            onChange={setProfileName}
            placeholder="Your display name"
            disabled={profileLoading}
          />
          {/* Email (read-only) */}
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
            <input
              type="email"
              value={profileLoading ? '' : (profile?.email ?? '')}
              readOnly
              disabled
              placeholder="Loading..."
              style={{
                width: '100%',
                padding: '0.75rem 0.875rem',
                background: '#0f0f0f',
                border: '1px solid #1f1f1f',
                borderRadius: '10px',
                color: '#6b7280',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'not-allowed',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.35rem' }}>
              Email cannot be changed here
            </p>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <ActionButton
              label="Save Name"
              loading={saveNameLoading}
              disabled={profileLoading || !profileName.trim()}
              onClick={handleSaveProfileName}
            />
          </div>

          {/* Change Password sub-section */}
          <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db', marginBottom: '1rem' }}>
              Change Password
            </h3>
            <InputField
              label="Current Password"
              type={showProfileCurrentPw ? 'text' : 'password'}
              value={profileCurrentPw}
              onChange={v => { setProfileCurrentPw(v); setProfilePwError('') }}
              placeholder="Enter current password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowProfileCurrentPw(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}
                >
                  {showProfileCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            <InputField
              label="New Password"
              type={showProfileNewPw ? 'text' : 'password'}
              value={profileNewPw}
              onChange={v => { setProfileNewPw(v); setProfilePwError('') }}
              placeholder="Min 8 characters"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowProfileNewPw(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}
                >
                  {showProfileNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            <InputField
              label="Confirm New Password"
              type={showProfileConfirmPw ? 'text' : 'password'}
              value={profileConfirmPw}
              onChange={v => { setProfileConfirmPw(v); setProfilePwError('') }}
              placeholder="Repeat new password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowProfileConfirmPw(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}
                >
                  {showProfileConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            {profilePwError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                padding: '0.6rem 0.875rem',
                marginBottom: '1rem',
                fontSize: '0.8125rem',
                color: '#fca5a5',
              }}>
                <XCircle size={13} />
                {profilePwError}
              </div>
            )}
            <ActionButton
              label="Save Password"
              loading={profilePwLoading}
              disabled={!profileCurrentPw || !profileNewPw || !profileConfirmPw}
              onClick={handleProfilePasswordChange}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* 1. Account Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <SectionCard title="Account Settings" icon={User} iconColor="#EC1E79">
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem' }}>
              Email
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 500 }}>
                {loadingUser
                  ? <span style={{ color: '#4b5563' }}>Loading...</span>
                  : user?.email ?? 'admin@lutoncards.co.uk'}
              </span>
              <span style={{
                background: 'rgba(236,30,121,0.12)',
                color: '#EC1E79',
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                textTransform: 'uppercase',
              }}>
                {user?.role ?? 'admin'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem' }}>
            Name
          </div>
          <div style={{
            padding: '0.75rem 0.875rem',
            background: '#0f0f0f',
            border: '1px solid #1f1f1f',
            borderRadius: '10px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}>
            Admin
          </div>
        </SectionCard>
      </motion.div>

      {/* 2. Change Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard title="Change Password" icon={Lock} iconColor="#818cf8">
          <InputField
            label="Current Password"
            type={showCurrentPw ? 'text' : 'password'}
            value={currentPw}
            onChange={setCurrentPw}
            placeholder="Enter current password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowCurrentPw(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}
              >
                {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
          <InputField
            label="New Password"
            type={showNewPw ? 'text' : 'password'}
            value={newPw}
            onChange={setNewPw}
            placeholder="Min 8 characters"
            rightElement={
              <button
                type="button"
                onClick={() => setShowNewPw(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}
              >
                {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
          <InputField
            label="Confirm New Password"
            type={showConfirmPw ? 'text' : 'password'}
            value={confirmPw}
            onChange={setConfirmPw}
            placeholder="Repeat new password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPw(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}
              >
                {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
          <div style={{ marginTop: '0.5rem' }}>
            <ActionButton
              label="Update Password"
              loading={pwLoading}
              disabled={!currentPw || !newPw || !confirmPw}
              onClick={handlePasswordChange}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* 3. Store Information */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SectionCard title="Store Information" icon={Store} iconColor="#34d399">
          <InputField
            label="Site Name"
            value={siteName}
            onChange={setSiteName}
            placeholder="Luton Cards"
            disabled={loadingStore}
          />
          <InputField
            label="Contact Email"
            type="email"
            value={contactEmail}
            onChange={setContactEmail}
            placeholder="hello@lutoncards.co.uk"
            disabled={loadingStore}
          />
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem' }}>
              Currency
            </div>
            <div style={{
              padding: '0.75rem 0.875rem',
              background: '#0f0f0f',
              border: '1px solid #1f1f1f',
              borderRadius: '10px',
              color: '#6b7280',
              fontSize: '0.9rem',
            }}>
              £ GBP — British Pound Sterling
            </div>
          </div>
          <ActionButton
            label="Save Store Settings"
            loading={storeLoading}
            disabled={loadingStore}
            onClick={handleStoreSave}
          />
        </SectionCard>
      </motion.div>

      {/* 4. Email Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.175 }}>
        <SectionCard title="Email Notifications" icon={Mail} iconColor="#60a5fa">
          {/* Status badge */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {resendConfigured === null ? (
              <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Checking configuration...</span>
            ) : resendConfigured ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(236,30,121,0.12)', color: '#EC1E79',
                fontSize: '0.8125rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px',
              }}>
                <CheckCircle size={13} /> Configured
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                fontSize: '0.8125rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px',
              }}>
                <XCircle size={13} /> Not configured
              </span>
            )}
          </div>

          {/* Instructions */}
          {!resendConfigured && (
            <div style={{
              padding: '12px 16px', background: 'rgba(96,165,250,0.06)',
              border: '1px solid rgba(96,165,250,0.2)', borderRadius: '8px', marginBottom: '1.25rem',
            }}>
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0 0 6px 0', lineHeight: '1.5' }}>
                Add <code style={{ background: '#1a1a1a', padding: '1px 6px', borderRadius: '4px', color: '#60a5fa' }}>RESEND_API_KEY</code> to your Railway environment variables to enable email notifications.
              </p>
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.8125rem', color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}
              >
                Sign up at resend.com (free — 3,000 emails/month) &rarr;
              </a>
            </div>
          )}

          {/* EMAIL_FROM input */}
          <InputField
            label="From Address (EMAIL_FROM)"
            type="email"
            value={emailFrom}
            onChange={setEmailFrom}
            placeholder="orders@lutoncards.co.uk"
            disabled={loadingEmailFrom}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <ActionButton
              label="Save From Address"
              loading={emailFromLoading}
              disabled={loadingEmailFrom || !emailFrom}
              onClick={handleEmailFromSave}
            />
            <ActionButton
              label="Send Test Email"
              loading={testEmailLoading}
              disabled={!resendConfigured}
              onClick={handleTestEmail}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* 5. Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionCard title="Danger Zone" icon={AlertTriangle} iconColor="#ef4444" borderColor="rgba(239,68,68,0.3)">
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1.5rem',
            padding: '1rem',
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '10px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                Export All Products
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.5' }}>
                Downloads a JSON file containing all product data from the store. This action does not modify any data, but the file may contain sensitive pricing and inventory information — handle with care.
              </div>
            </div>
            <motion.button
              onClick={handleExportProducts}
              disabled={exportLoading}
              whileHover={!exportLoading ? { scale: 1.02 } : {}}
              whileTap={!exportLoading ? { scale: 0.98 } : {}}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                background: exportLoading ? '#1a1a1a' : 'rgba(239,68,68,0.12)',
                color: exportLoading ? '#6b7280' : '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: exportLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {exportLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Loader2 size={13} />
                </motion.div>
              ) : (
                <Download size={13} />
              )}
              Export JSON
            </motion.button>
          </div>
        </SectionCard>
      </motion.div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
