'use client'

/**
 * Floating pill shown in the bottom-right corner whenever an admin is logged
 * in and browsing the public storefront. Two purposes:
 *
 *  1. Confirms to the admin that they're in edit mode — so the pencils
 *     appearing on the site aren't a surprise.
 *  2. Quick way back to the admin dashboard from any storefront page.
 *
 * Hidden completely for non-admin visitors. Dismissible per session if it
 * gets in the way (sessionStorage).
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Pencil, X, LayoutDashboard } from 'lucide-react'
import { useAdmin } from '@/lib/admin-context'

const HIDE_KEY = 'lc_edit_indicator_hidden'

export function EditModeIndicator() {
  // Only superadmin sees this — inline-edit pencils are superadmin-only,
  // so showing the indicator to a vendor would be misleading.
  const { isSuperadmin, admin, loading } = useAdmin()
  const pathname = usePathname() || ''
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setHidden(window.sessionStorage.getItem(HIDE_KEY) === '1')
  }, [])

  // Don't render on /admin routes — admin pages have their own chrome and
  // the indicator would just be visual noise on top of a back-office layout.
  if (loading || !isSuperadmin || hidden) return null
  if (pathname.startsWith('/admin')) return null

  const dismiss = () => {
    try { window.sessionStorage.setItem(HIDE_KEY, '1') } catch {}
    setHidden(true)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9998, // below editor modals (9999) but above everything else
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '0.55rem 0.65rem 0.55rem 0.85rem',
        background: 'rgba(15,15,16,0.92)',
        color: '#fff',
        border: '1px solid rgba(236,30,121,0.4)',
        borderRadius: 999,
        boxShadow: '0 14px 30px -10px rgba(0,0,0,0.6), 0 0 0 4px rgba(236,30,121,0.08)',
        backdropFilter: 'blur(12px)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '-0.005em',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22, height: 22,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)',
        }}
      >
        <Pencil size={11} color="#fff" />
      </span>

      <span style={{ paddingRight: 4 }}>
        Edit mode {admin?.name ? `· ${admin.name}` : ''}
      </span>

      <Link
        href="/admin"
        title="Go to admin dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26, height: 26,
          borderRadius: 7,
          color: '#FF80B8',
          textDecoration: 'none',
          background: 'rgba(236,30,121,0.12)',
          border: '1px solid rgba(236,30,121,0.25)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(236,30,121,0.22)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(236,30,121,0.12)')}
      >
        <LayoutDashboard size={13} />
      </Link>

      <button
        type="button"
        onClick={dismiss}
        title="Hide for this session"
        aria-label="Hide edit mode indicator"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22, height: 22,
          borderRadius: 6,
          background: 'transparent',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}
