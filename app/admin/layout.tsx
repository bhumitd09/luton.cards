'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ToastProvider } from '@/components/admin/toast'
import { ConfirmProvider } from '@/components/admin/confirm-dialog'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  Image,
  ShoppingBag,
  Home,
  Globe,
  Tag,
  Truck,
  Users,
  Boxes,
  Star,
  Plug,
  Upload,
  Instagram,
  UserCog,
  Wallet,
  BookText,
  Inbox,
  BellRing,
  BadgeCheck,
} from 'lucide-react'

interface AnalyticsBadges {
  outOfStockProducts: number
  pendingOrders: number
}

interface AdminInfo {
  name: string | null
  email: string
  role: string
}

// ─── Design tokens (single source of truth for the admin chrome) ──────────
const T = {
  bg: '#0a0a0a',
  panel: '#0f0f10',
  panelRaised: '#161617',
  border: '#202022',
  borderSoft: '#1a1a1c',
  pink: '#EC1E79',
  pinkSoft: 'rgba(236,30,121,0.12)',
  text: '#f4f4f5',
  textDim: '#9ca3af',
  textFaint: '#6b7280',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.625rem',
      fontWeight: 800,
      color: '#52525b',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      padding: '0 0.875rem',
      marginBottom: '0.4rem',
      marginTop: '0.25rem',
    }}>
      {children}
    </div>
  )
}

function NavSeparator() {
  return <div style={{ height: '1px', background: T.borderSoft, margin: '0.85rem 0.875rem' }} />
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  badge,
  badgeColor,
  onNavigate,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
  badgeColor?: string
  onNavigate?: () => void
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }} onClick={onNavigate}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '9px',
          marginBottom: '0.1rem',
          cursor: 'pointer',
          position: 'relative',
          background: isActive ? T.pinkSoft : 'transparent',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#161617' }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {isActive && (
          <span style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: '3px', height: '18px', borderRadius: '0 3px 3px 0', background: T.pink,
          }} />
        )}
        <Icon size={16.5} color={isActive ? T.pink : '#71717a'} style={{ flexShrink: 0 }} />
        <span style={{
          fontSize: '0.84rem',
          fontWeight: isActive ? 700 : 500,
          color: isActive ? '#fff' : T.textDim,
          flex: 1,
          letterSpacing: '-0.01em',
        }}>
          {label}
        </span>
        {badge !== undefined && badge > 0 && (
          <span style={{
            background: badgeColor || '#ef4444',
            color: '#fff',
            fontSize: '0.625rem',
            fontWeight: 800,
            padding: '1px 6px',
            borderRadius: '999px',
            lineHeight: '1.5',
            minWidth: '18px',
            textAlign: 'center',
          }}>
            {badge}
          </span>
        )}
      </motion.div>
    </Link>
  )
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])
  return <span style={{ color: T.textFaint, fontSize: '0.8125rem', fontWeight: 600 }}>{time}</span>
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.replace('/admin', '').split('/').filter(Boolean)
  const parts = ['Admin', ...segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '))]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      {parts.map((part, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {i > 0 && <span style={{ color: '#3f3f46', fontSize: '0.75rem' }}>/</span>}
          <span style={{
            color: i === parts.length - 1 ? '#fff' : T.textFaint,
            fontSize: '0.875rem',
            fontWeight: i === parts.length - 1 ? 700 : 500,
            letterSpacing: '-0.01em',
          }}>
            {part}
          </span>
        </span>
      ))}
    </div>
  )
}

// ─── Account avatar (real initial, pink gradient) ─────────────────────────
function Avatar({ initial, size = 36 }: { initial: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.4,
      boxShadow: '0 4px 12px -4px rgba(236,30,121,0.6)',
    }}>
      {initial}
    </div>
  )
}

function RolePill({ role }: { role: string }) {
  const isSuper = role === 'superadmin'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: isSuper ? T.pink : '#a1a1aa',
      background: isSuper ? T.pinkSoft : '#1f1f22',
      border: `1px solid ${isSuper ? 'rgba(236,30,121,0.3)' : '#2a2a2e'}`,
      padding: '2px 7px', borderRadius: '6px',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSuper ? T.pink : '#71717a' }} />
      {isSuper ? 'Superadmin' : 'Vendor'}
    </span>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [badges, setBadges] = useState<AnalyticsBadges>({ outOfStockProducts: 0, pendingOrders: 0 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') return

    fetch('/api/admin/auth')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.user) {
          setAuthenticated(true)
          setAdmin({
            name: data.user.name ?? null,
            email: data.user.email ?? '',
            role: data.user.role || 'vendor',
          })
        } else {
          setAuthenticated(false)
          router.replace('/admin/login')
        }
      })
      .catch(() => {
        setAuthenticated(false)
        router.replace('/admin/login')
      })

    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setBadges({
            outOfStockProducts: data.outOfStockProducts ?? 0,
            pendingOrders: data.pendingOrders ?? 0,
          })
        }
      })
      .catch(() => {})
  }, [pathname, router])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.replace('/admin/login')
  }

  if (pathname === '/admin/login') return <>{children}</>
  if (authenticated !== true) {
    // Lightweight loading state instead of a blank flash.
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

  const role = admin?.role || 'vendor'
  const displayName = admin?.name?.trim() || admin?.email?.split('@')[0] || 'Admin'
  const initial = (admin?.name?.trim()?.[0] || admin?.email?.[0] || 'A').toUpperCase()

  const isSuper = role === 'superadmin'

  // superadminOnly items are store-wide config / integrations / moderation —
  // matched 1:1 with the server-side verifySuperadminSession gates. Vendors
  // never see them in the nav (and would get 401 if they hit the route).
  const navManage = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/admin/products', icon: Package, label: 'Products', badgeKey: 'outOfStockProducts' as const, badgeColor: '#ef4444' },
    { href: '/admin/import', icon: Upload, label: 'Bulk Import' },
    { href: '/admin/psa', icon: BadgeCheck, label: 'Add from PSA' },
    { href: '/admin/inventory', icon: Boxes, label: 'Inventory' },
    { href: '/admin/media', icon: Image, label: 'Media' },
    { href: '/admin/content', icon: FileText, label: 'Content', superadminOnly: true },
    { href: '/admin/pages', icon: Globe, label: 'Pages', superadminOnly: true },
    { href: '/admin/legal', icon: BookText, label: 'Legal Pages', superadminOnly: true },
    { href: '/admin/instagram', icon: Instagram, label: 'Instagram', superadminOnly: true },
    { href: '/admin/team', icon: Users, label: 'Team / About', superadminOnly: true },
    { href: '/admin/integrations', icon: Plug, label: 'Integrations', superadminOnly: true },
    { href: '/admin/shipping', icon: Truck, label: 'Shipping', superadminOnly: true },
  ].filter(item => isSuper || !('superadminOnly' in item))

  const navSales = [
    { href: '/admin/orders', icon: ShoppingBag, label: 'Orders', badgeKey: 'pendingOrders' as const, badgeColor: '#f59e0b' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/sell', icon: Tag, label: 'Buy-back', badgeColor: '#EC1E79', superadminOnly: true },
    { href: '/admin/customers', icon: Users, label: 'Customers', superadminOnly: true },
    { href: '/admin/discounts', icon: Tag, label: 'Discounts', superadminOnly: true },
    { href: '/admin/reviews', icon: Star, label: 'Reviews', superadminOnly: true },
    { href: '/admin/contact', icon: Inbox, label: 'Contact Inbox', superadminOnly: true },
    { href: '/admin/subscribers', icon: BellRing, label: 'Subscribers', superadminOnly: true },
  ].filter(item => isSuper || !('superadminOnly' in item))
  const navCrew = isSuper
    ? [
        { href: '/admin/members', icon: UserCog, label: 'Team Members' },
        { href: '/admin/payouts', icon: Wallet, label: 'Payouts' },
      ]
    : [{ href: '/admin/payouts', icon: Wallet, label: 'My Payouts' }]
  const navSystem = [{ href: '/admin/settings', icon: Settings, label: 'Settings' }]

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <ConfirmProvider>
    <ToastProvider>
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
      <style>{`
        @media (max-width: 900px) {
          .admin-sidebar { position: fixed !important; left: -280px !important; top: 0 !important; transition: left 0.28s ease !important; z-index: 200 !important; height: 100vh !important; }
          .admin-sidebar.open { left: 0 !important; }
          .admin-overlay { display: block !important; }
          .admin-mobile-header { display: flex !important; }
          .admin-topbar { display: none !important; }
          .admin-main-content { margin-left: 0 !important; }
        }
        @media (min-width: 901px) {
          .admin-mobile-header { display: none !important; }
          .admin-overlay { display: none !important; }
        }
        .admin-sidebar::-webkit-scrollbar { width: 6px; }
        .admin-sidebar::-webkit-scrollbar-thumb { background: #26262a; border-radius: 3px; }
        .admin-sidebar::-webkit-scrollbar-track { background: transparent; }

        /* ─── Global admin polish — normalises inline-styled pages to one look ─── */
        .admin-main-content table { border-collapse: separate !important; border-spacing: 0 !important; }
        .admin-main-content table thead { position: sticky !important; top: 0 !important; z-index: 5 !important; }
        .admin-main-content table th {
          padding: 0.6rem 0.9rem !important;
          font-size: 0.68rem !important;
          letter-spacing: 0.06em !important;
          text-transform: uppercase !important;
        }
        .admin-main-content table td { padding: 0.65rem 0.9rem !important; font-size: 0.84rem !important; }
        .admin-main-content table tbody tr { transition: background 0.12s ease; }
        /* Consistent focus ring on every admin input/textarea/select */
        .admin-main-content input:focus,
        .admin-main-content textarea:focus,
        .admin-main-content select:focus {
          outline: none !important;
          border-color: ${T.pink} !important;
          box-shadow: 0 0 0 3px rgba(236,30,121,0.12) !important;
        }
        .admin-main-content [role="dialog"] { max-height: 90vh !important; overflow-y: auto !important; }
      `}</style>

      {/* Mobile overlay backdrop */}
      <div
        className="admin-overlay"
        onClick={closeMobile}
        style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', zIndex: 199 }}
      />

      {/* Sidebar */}
      <aside
        className={`admin-sidebar${mobileMenuOpen ? ' open' : ''}`}
        style={{
          width: '248px',
          background: T.panel,
          borderRight: `1px solid ${T.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
          overflowY: 'auto',
        }}
      >
        {/* Brand header */}
        <div style={{ padding: '1.1rem 1rem 0.9rem', borderBottom: `1px solid ${T.borderSoft}`, position: 'relative' }}>
          <button
            onClick={closeMobile}
            className="admin-sidebar-close"
            style={{
              position: 'absolute', top: '0.9rem', right: '0.9rem',
              background: '#1a1a1c', border: `1px solid ${T.border}`, borderRadius: '8px',
              color: T.textDim, cursor: 'pointer', display: 'none',
              alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px',
              fontSize: '1rem', lineHeight: 1,
            }}
          >
            ✕
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <img
              src="/logo/luton-cards.png"
              alt="Luton Cards"
              style={{ height: '54px', width: 'auto', display: 'block', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                Luton Cards
              </span>
              <span style={{ color: T.pink, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Back Office
              </span>
            </div>
          </div>
        </div>
        <style>{`.admin-sidebar-close { display: none !important; } @media (max-width: 900px) { .admin-sidebar-close { display: flex !important; } }`}</style>

        {/* Nav */}
        <nav style={{ padding: '0.9rem 0.65rem', flex: 1 }}>
          <SectionLabel>Manage</SectionLabel>
          {navManage.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
              badge={item.badgeKey ? badges[item.badgeKey] : undefined}
              badgeColor={item.badgeColor}
              onNavigate={closeMobile}
            />
          ))}

          <NavSeparator />
          <SectionLabel>Sales</SectionLabel>
          {navSales.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname.startsWith(item.href)}
              badge={item.badgeKey ? badges[item.badgeKey] : undefined}
              badgeColor={item.badgeColor}
              onNavigate={closeMobile}
            />
          ))}

          <NavSeparator />
          <SectionLabel>Crew</SectionLabel>
          {navCrew.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} isActive={pathname.startsWith(item.href)} onNavigate={closeMobile} />
          ))}

          <NavSeparator />
          <SectionLabel>System</SectionLabel>
          {navSystem.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} isActive={pathname.startsWith(item.href)} onNavigate={closeMobile} />
          ))}
        </nav>

        {/* Account card — fills the footer with real identity + actions */}
        <div style={{ padding: '0.75rem', borderTop: `1px solid ${T.borderSoft}` }}>
          <div style={{ background: T.panelRaised, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 0.75rem' }}>
              <Avatar initial={initial} size={36} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  color: '#fff', fontSize: '0.84rem', fontWeight: 700, letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {displayName}
                </div>
                <div style={{ marginTop: '3px' }}><RolePill role={role} /></div>
              </div>
            </div>
            <div style={{ height: '1px', background: T.border }} />
            <div style={{ display: 'flex' }}>
              <Link href="/" onClick={closeMobile} style={{ flex: 1, textDecoration: 'none' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', color: T.textDim, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.12s, color 0.12s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#1d1d20'; el.style.color = '#fff' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = T.textDim }}
                >
                  <Home size={14} /> Site
                </div>
              </Link>
              <div style={{ width: '1px', background: T.border }} />
              <button
                onClick={handleLogout}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Right column */}
      <div className="admin-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile header */}
        <div
          className="admin-mobile-header"
          style={{
            display: 'none', height: '56px', background: T.panel, borderBottom: `1px solid ${T.border}`,
            alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', flexShrink: 0,
            position: 'sticky', top: 0, zIndex: 10,
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDim, display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', borderRadius: '8px' }}
          >
            <span style={{ display: 'block', width: '20px', height: '2px', background: T.textDim, borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', background: T.textDim, borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', background: T.textDim, borderRadius: '2px' }} />
          </button>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>Luton Cards</span>
          <Avatar initial={initial} size={30} />
        </div>

        {/* Desktop topbar */}
        <div className="admin-topbar" style={{
          height: '58px', background: T.panel, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem',
          flexShrink: 0, position: 'sticky', top: 0, zIndex: 10,
        }}>
          <Breadcrumb pathname={pathname} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Clock />
            <div style={{ width: '1px', height: '20px', background: T.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span style={{ color: '#fff', fontSize: '0.84rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{displayName}</span>
              <Avatar initial={initial} size={30} />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
    </ToastProvider>
    </ConfirmProvider>
  )
}
