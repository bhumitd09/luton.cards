'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'

interface AnalyticsBadges {
  outOfStockProducts: number
  pendingOrders: number
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.6875rem',
      fontWeight: 700,
      color: '#4b5563',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '0 0.875rem',
      marginBottom: '0.375rem',
      marginTop: '0.25rem',
    }}>
      {children}
    </div>
  )
}

function NavSeparator() {
  return (
    <div style={{
      height: '1px',
      background: '#1f1f1f',
      margin: '0.75rem 0.875rem',
    }} />
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  badge,
  badgeColor,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
  badgeColor?: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.625rem 0.875rem',
          borderRadius: '10px',
          marginBottom: '0.125rem',
          cursor: 'pointer',
          background: isActive ? 'rgba(236,30,121,0.1)' : 'transparent',
          borderLeft: isActive ? '3px solid #EC1E79' : '3px solid transparent',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => {
          if (!isActive) (e.currentTarget as HTMLElement).style.background = '#1a1a1a'
        }}
        onMouseLeave={e => {
          if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
        }}
      >
        <Icon size={17} color={isActive ? '#EC1E79' : '#6b7280'} style={{ flexShrink: 0 }} />
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: isActive ? '#EC1E79' : '#9ca3af',
          flex: 1,
        }}>
          {label}
        </span>
        {badge !== undefined && badge > 0 && (
          <span style={{
            background: badgeColor || '#ef4444',
            color: '#fff',
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '999px',
            lineHeight: '1.4',
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
    const update = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span style={{ color: '#6b7280', fontSize: '0.8125rem', fontWeight: 500 }}>
      {time}
    </span>
  )
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.replace('/admin', '').split('/').filter(Boolean)
  const parts = ['Admin', ...segments.map(s => s.charAt(0).toUpperCase() + s.slice(1))]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      {parts.map((part, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {i > 0 && (
            <span style={{ color: '#374151', fontSize: '0.75rem' }}>/</span>
          )}
          <span style={{
            color: i === parts.length - 1 ? '#fff' : '#6b7280',
            fontSize: '0.875rem',
            fontWeight: i === parts.length - 1 ? 600 : 400,
          }}>
            {part}
          </span>
        </span>
      ))}
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [badges, setBadges] = useState<AnalyticsBadges>({ outOfStockProducts: 0, pendingOrders: 0 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') return

    // Auth check — block rendering until resolved
    fetch('/api/admin/auth')
      .then(r => {
        if (r.ok) {
          setAuthenticated(true)
        } else {
          setAuthenticated(false)
          router.replace('/admin/login')
        }
      })
      .catch(() => {
        setAuthenticated(false)
        router.replace('/admin/login')
      })

    // Fetch badge counts (only runs if we're authenticated)
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

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.replace('/admin/login')
  }

  if (pathname === '/admin/login') return <>{children}</>

  // Show blank screen while checking auth (prevents crash from rendering unauthenticated)
  if (authenticated !== true) return null

  const navManage = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/admin/products', icon: Package, label: 'Products', badgeKey: 'outOfStockProducts' as const, badgeColor: '#ef4444' },
    { href: '/admin/import', icon: Upload, label: 'Bulk Import' },
    { href: '/admin/inventory', icon: Boxes, label: 'Inventory' },
    { href: '/admin/content', icon: FileText, label: 'Content' },
    { href: '/admin/pages', icon: Globe, label: 'Pages' },
    { href: '/admin/instagram', icon: Instagram, label: 'Instagram' },
    { href: '/admin/media', icon: Image, label: 'Media' },
    { href: '/admin/integrations', icon: Plug, label: 'Integrations' },
    { href: '/admin/shipping', icon: Truck, label: 'Shipping' },
  ]

  const navSales = [
    { href: '/admin/orders', icon: ShoppingBag, label: 'Orders', badgeKey: 'pendingOrders' as const, badgeColor: '#f59e0b' },
    { href: '/admin/sell', icon: Tag, label: 'Buy-back', badgeColor: '#EC1E79' },
    { href: '/admin/customers', icon: Users, label: 'Customers' },
    { href: '/admin/discounts', icon: Tag, label: 'Discounts' },
    { href: '/admin/reviews', icon: Star, label: 'Reviews' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ]

  const navSystem = [
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
      <style>{`
        @media (max-width: 900px) {
          .admin-sidebar {
            position: fixed !important;
            left: -260px !important;
            top: 0 !important;
            transition: left 0.3s ease !important;
            z-index: 200 !important;
            height: 100vh !important;
          }
          .admin-sidebar.open {
            left: 0 !important;
          }
          .admin-overlay {
            display: block !important;
          }
          .admin-mobile-header {
            display: flex !important;
          }
          .admin-topbar {
            display: none !important;
          }
          .admin-main-content {
            margin-left: 0 !important;
          }
        }
        @media (min-width: 901px) {
          .admin-mobile-header {
            display: none !important;
          }
          .admin-overlay {
            display: none !important;
          }
        }
      `}</style>

      {/* Mobile overlay backdrop */}
      <div
        className="admin-overlay"
        onClick={() => setMobileMenuOpen(false)}
        style={{
          display: 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 199,
        }}
      />

      {/* Sidebar */}
      <aside
        className={`admin-sidebar${mobileMenuOpen ? ' open' : ''}`}
        style={{
          width: '240px',
          background: '#111',
          borderRight: '1px solid #1f1f1f',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
          overflowY: 'auto',
        }}
      >
        {/* Logo + mobile close button */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #1f1f1f', position: 'relative' }}>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#9ca3af',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              fontSize: '1.1rem',
              lineHeight: 1,
            }}
            className="admin-sidebar-close"
          >
            ✕
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <img
              src="/logo/luton-cards.png"
              alt="Luton Cards"
              style={{ height: '120px', width: 'auto', display: 'block', objectFit: 'contain' }}
            />
            <span style={{ color: '#EC1E79', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Admin
            </span>
          </div>
        </div>
        <style>{`.admin-sidebar-close { display: none !important; } @media (max-width: 900px) { .admin-sidebar-close { display: flex !important; } }`}</style>

        {/* Nav */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          <SectionLabel>Manage</SectionLabel>
          {navManage.map(item => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const badge = item.badgeKey ? badges[item.badgeKey] : undefined
            return (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
                badge={badge}
                badgeColor={item.badgeColor}
              />
            )
          })}

          <NavSeparator />
          <SectionLabel>Sales</SectionLabel>
          {navSales.map(item => {
            const isActive = pathname.startsWith(item.href)
            const badge = item.badgeKey ? badges[item.badgeKey] : undefined
            return (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
                badge={badge}
                badgeColor={item.badgeColor}
              />
            )
          })}

          <NavSeparator />
          <SectionLabel>System</SectionLabel>
          {navSystem.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
              />
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{
          padding: '0.875rem 0.75rem',
          borderTop: '1px solid #1f1f1f',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.125rem',
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ x: 3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.875rem',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <Home size={17} color="#6b7280" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>Back to Site</span>
            </motion.div>
          </Link>

          <motion.button
            onClick={handleLogout}
            whileHover={{ x: 3 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 0.875rem',
              borderRadius: '10px',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              width: '100%',
              textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <LogOut size={17} color="#ef4444" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444' }}>Log Out</span>
          </motion.button>
        </div>
      </aside>

      {/* Right column */}
      <div className="admin-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile header bar — visible on mobile only */}
        <div
          className="admin-mobile-header"
          style={{
            display: 'none',
            height: '56px',
            background: '#111',
            borderBottom: '1px solid #1f1f1f',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '8px',
              borderRadius: '8px',
            }}
            aria-label="Open menu"
          >
            <span style={{ display: 'block', width: '20px', height: '2px', background: '#9ca3af', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', background: '#9ca3af', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', background: '#9ca3af', borderRadius: '2px' }} />
          </button>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
            Luton Cards Admin
          </span>
          <Clock />
        </div>

        {/* Desktop top header */}
        <div className="admin-topbar" style={{
          height: '56px',
          background: '#111',
          borderBottom: '1px solid #1f1f1f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Breadcrumb pathname={pathname} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Clock />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(236,30,121,0.15)',
                border: '1.5px solid rgba(236,30,121,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EC1E79',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}>
                A
              </div>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>Admin</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
