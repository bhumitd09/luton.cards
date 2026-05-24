'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Package,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  PlusCircle,
  ArrowRight,
  FileText,
  DollarSign,
  Clock,
  LayoutGrid,
  Edit3,
} from 'lucide-react'
import { BorderBeam } from '@/components/magicui/border-beam'
import { NumberTicker } from '@/components/magicui/number-ticker'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  totalProducts: number
  activeProducts: number
  catalogueValue: number
  pendingOrders: number
  lowStockProducts: number
  outOfStockProducts: number
  totalRevenue: number
  totalOrders: number
  productsByCategory: Record<string, number>
  recentOrders: RecentOrder[]
}

interface RecentOrder {
  id: string
  name: string
  email: string
  total: number
  status: string
  createdAt: string
  items: { productName: string; quantity: number }[]
}

interface StockProduct {
  id: string
  name: string
  category: string
  stock: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ width = '100%', height = '16px', radius = '6px' }: { width?: string; height?: string; radius?: string }) {
  return (
    <div style={{
      width,
      height,
      background: 'linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%)',
      backgroundSize: '200% 100%',
      borderRadius: radius,
      animation: 'shimmer 1.5s infinite',
    }} />
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
  loading,
  badge,
  numericValue,
  prefix,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
  delay: number
  loading: boolean
  badge?: { text: string; color: string }
  numericValue?: number
  prefix?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#0f0f10',
        border: '1px solid #1f1f1f',
        borderRadius: '16px',
        padding: '1.5rem',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* corner glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 140,
        height: 140,
        background: `radial-gradient(circle at top right, ${color}1a 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* icon */}
      <div style={{
        width: 44,
        height: 44,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.25rem',
      }}>
        <Icon size={20} color={color} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton height="32px" width="55%" radius="8px" />
          <Skeleton height="14px" width="75%" />
          <Skeleton height="12px" width="50%" />
        </div>
      ) : (
        <>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '0.45rem' }}>
            {typeof numericValue === 'number' ? (
              <>
                {prefix}
                <NumberTicker value={numericValue} />
              </>
            ) : (
              value
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af' }}>{label}</span>
            {badge && (
              <span style={{
                background: `${badge.color}18`,
                color: badge.color,
                border: `1px solid ${badge.color}30`,
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '1px 7px',
              }}>
                {badge.text}
              </span>
            )}
          </div>
          {sub && <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.2rem' }}>{sub}</div>}
        </>
      )}

      {hovered && !loading && (
        <BorderBeam size={260} duration={11} colorFrom={color} colorTo="#FF80B8" borderWidth={1.5} />
      )}
    </motion.div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  pending:   { color: '#f59e0b', label: 'Pending' },
  paid:      { color: '#3b82f6', label: 'Paid' },
  shipped:   { color: '#818cf8', label: 'Shipped' },
  delivered: { color: '#34d399', label: 'Delivered' },
  cancelled: { color: '#ef4444', label: 'Cancelled' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { color: '#9ca3af', label: status }
  return (
    <span style={{
      background: `${cfg.color}18`,
      color: cfg.color,
      border: `1px solid ${cfg.color}28`,
      borderRadius: '999px',
      fontSize: '0.6875rem',
      fontWeight: 700,
      padding: '3px 9px',
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  )
}

// ─── Category Pill ─────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  single:  '#EC1E79',
  graded:  '#818cf8',
  booster: '#f59e0b',
  sealed:  '#34d399',
}

function CategoryPill({ category }: { category: string }) {
  const color = CAT_COLORS[category] ?? '#9ca3af'
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '6px',
      background: `${color}14`,
      border: `1px solid ${color}28`,
      color,
      fontSize: '0.7rem',
      fontWeight: 700,
      textTransform: 'capitalize',
    }}>
      {category}
    </span>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, linkHref, linkLabel }: { title: string; linkHref?: string; linkLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
      <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{title}</h2>
      {linkHref && linkLabel && (
        <Link href={linkHref} style={{ textDecoration: 'none' }}>
          <motion.span
            whileHover={{ x: 2 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#EC1E79', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {linkLabel} <ArrowRight size={13} />
          </motion.span>
        </Link>
      )}
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [stockAlerts, setStockAlerts] = useState<StockProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/analytics').then(r => r.json()),
      fetch('/api/admin/products?limit=100&active=true').then(r => r.json()).catch(() => ({ products: [] })),
    ])
      .then(([analyticsData, productsData]) => {
        if (!analyticsData.error) setAnalytics(analyticsData)
        const productList: StockProduct[] = (productsData.products ?? (Array.isArray(productsData) ? productsData : [])) ?? []
        const sorted = [...productList]
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5)
        setStockAlerts(sorted)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const ordersToday = analytics?.recentOrders?.filter(o => isToday(o.createdAt)).length ?? 0
  const last5Orders = analytics?.recentOrders?.slice(0, 5) ?? []

  const catCounts = analytics?.productsByCategory ?? {}
  const catPills = [
    { label: 'Singles',  key: 'single',  color: '#EC1E79' },
    { label: 'Graded',   key: 'graded',  color: '#818cf8' },
    { label: 'Boosters', key: 'booster', color: '#f59e0b' },
    { label: 'Sealed',   key: 'sealed',  color: '#34d399' },
  ]

  // ── Derived data for the sidebar/aggregates ─────────────────────────────
  const recentOrdersAll = analytics?.recentOrders ?? []
  const now = new Date()
  const last30: { date: string; revenue: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    last30.push({ date: d.toISOString().slice(0, 10), revenue: 0 })
  }
  recentOrdersAll.forEach(order => {
    const key = new Date(order.createdAt).toISOString().slice(0, 10)
    const entry = last30.find(e => e.date === key)
    if (entry) entry.revenue += order.total
  })
  const maxRev = Math.max(...last30.map(e => e.revenue), 1)
  const monthRevenue = last30
    .filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, e) => sum + e.revenue, 0)
  const allZeroRev = last30.every(e => e.revenue === 0)

  return (
    <div className="dash-padding" style={{ padding: '1.5rem', color: '#fff', maxWidth: '1500px', margin: '0 auto' }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .dash-card { background: #0f0f10; border: 1px solid #1f1f1f; border-radius: 14px; }
        .order-row:hover { background: #161616 !important; cursor: pointer; }
        .order-row { transition: background 0.15s ease; }
        .action-card:hover { border-color: #EC1E79 !important; transform: translateY(-1px); }
        .action-card { transition: all 0.15s ease; }
        .stock-row:hover { background: #161616 !important; }
        .stock-row { transition: background 0.15s ease; }
        .dash-main-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) 320px; gap: 1rem; align-items: stretch; }
        @media (max-width: 1280px) {
          .dash-main-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
          .dash-sidebar { grid-column: 1 / -1; }
          .dash-sidebar-inner { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .dash-main-grid { grid-template-columns: 1fr; }
          .dash-sidebar-inner { grid-template-columns: 1fr !important; }
          .dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-padding { padding: 1rem !important; }
        }
      `}</style>

      {/* ── Compact Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
            {getGreeting()}, Admin
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.8125rem', margin: '0.2rem 0 0' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/" target="_blank" style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.5rem 0.9rem', borderRadius: '8px',
              border: '1px solid #1f1f1f', background: '#111',
              fontSize: '0.8125rem', fontWeight: 700, color: '#9ca3af',
            }}>View Site →</span>
          </Link>
          <Link href="/admin/products" style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.5rem 0.9rem', borderRadius: '8px',
              background: '#EC1E79',
              fontSize: '0.8125rem', fontWeight: 800, color: '#fff',
            }}><PlusCircle size={13} /> Add Product</span>
          </Link>
        </div>
      </motion.div>

      {/* ── Top Stats Row ── */}
      <div className="dash-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.875rem',
        marginBottom: '1rem',
      }}>
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value="—"
          numericValue={analytics?.totalRevenue ?? 0}
          prefix="£"
          sub="All time"
          color="#EC1E79"
          delay={0.05}
          loading={loading}
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders Today"
          value={ordersToday}
          numericValue={ordersToday}
          sub="From recent orders"
          color="#818cf8"
          delay={0.1}
          loading={loading}
          badge={ordersToday > 0 ? { text: `+${ordersToday} new`, color: '#818cf8' } : undefined}
        />
        <StatCard
          icon={TrendingUp}
          label="Active Listings"
          value={analytics?.activeProducts ?? 0}
          numericValue={analytics?.activeProducts ?? 0}
          sub="Live products"
          color="#f59e0b"
          delay={0.15}
          loading={loading}
        />
        <StatCard
          icon={AlertTriangle}
          label="Out of Stock"
          value={analytics?.outOfStockProducts ?? 0}
          numericValue={analytics?.outOfStockProducts ?? 0}
          sub="Need restocking"
          color="#ef4444"
          delay={0.2}
          loading={loading}
          badge={(analytics?.outOfStockProducts ?? 0) > 0 ? { text: 'Action needed', color: '#ef4444' } : undefined}
        />
      </div>

      {/* ── Main 3-column grid: Orders | Stock | Sidebar (chart + categories + actions) ── */}
      <div className="dash-main-grid" style={{ marginBottom: '1rem' }}>
        {/* COLUMN 1 — Recent Orders (compact) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="dash-card"
          style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <SectionHeader title="Recent Orders" linkHref="/admin/orders" linkLabel="All orders" />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} height="32px" radius="6px" />)}
            </div>
          ) : last5Orders.length === 0 ? (
            <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: '#4b5563' }}>
              <ShoppingBag size={26} style={{ opacity: 0.4, marginBottom: 6 }} />
              <p style={{ fontSize: '0.825rem', color: '#9ca3af', fontWeight: 600, margin: 0 }}>No orders yet</p>
              <p style={{ fontSize: '0.7rem', margin: '2px 0 0' }}>Orders appear here when they come in</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {last5Orders.map((order, idx) => (
                <Link key={order.id} href="/admin/orders" style={{ textDecoration: 'none' }}>
                  <motion.div
                    className="order-row"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.04 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 1fr auto auto',
                      gap: '0.6rem',
                      alignItems: 'center',
                      padding: '0.55rem 0.5rem',
                      borderBottom: idx < last5Orders.length - 1 ? '1px solid #161616' : 'none',
                    }}
                  >
                    <span style={{
                      fontFamily: 'monospace', fontSize: '0.72rem', color: '#EC1E79',
                      fontWeight: 700, padding: '1px 6px', borderRadius: '5px',
                      background: 'rgba(236,30,121,0.08)', border: '1px solid rgba(236,30,121,0.15)',
                      textAlign: 'center',
                    }}>
                      #{order.id.slice(0, 6).toUpperCase()}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.825rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 1, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={9} /> {timeAgo(order.createdAt)}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                      £{order.total.toFixed(0)}
                    </span>
                    <StatusBadge status={order.status} />
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* COLUMN 2 — Stock Alerts (compact) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="dash-card"
          style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem', gap: '0.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={14} color="#f59e0b" /> Stock Alerts
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LowStockEmailButton enabled={stockAlerts.length > 0} />
              <Link href="/admin/products" style={{ textDecoration: 'none' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#EC1E79', fontSize: '0.75rem', fontWeight: 700 }}>
                  Manage <ArrowRight size={11} />
                </span>
              </Link>
            </div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} height="42px" radius="8px" />)}
            </div>
          ) : stockAlerts.length === 0 ? (
            <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: '#4b5563' }}>
              <Package size={26} style={{ opacity: 0.4, marginBottom: 6, color: '#34d399' }} />
              <p style={{ fontSize: '0.825rem', color: '#34d399', fontWeight: 700, margin: 0 }}>All well stocked</p>
              <p style={{ fontSize: '0.7rem', margin: '2px 0 0' }}>No critical stock issues</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {stockAlerts.slice(0, 5).map((product, idx) => (
                <Link key={product.id} href={`/admin/products/${product.id}`} style={{ textDecoration: 'none' }}>
                  <motion.div
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + idx * 0.04 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.55rem 0.7rem',
                      background: '#0a0a0a',
                      border: `1px solid ${product.stock === 0 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.name}
                      </div>
                      <CategoryPill category={product.category} />
                    </div>
                    <div style={{
                      fontSize: '0.95rem', fontWeight: 900, lineHeight: 1,
                      color: product.stock === 0 ? '#ef4444' : product.stock <= 2 ? '#f59e0b' : '#9ca3af',
                      padding: '4px 9px',
                      background: product.stock === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)',
                      borderRadius: '6px',
                      minWidth: 28,
                      textAlign: 'center',
                    }}>
                      {product.stock}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* COLUMN 3 — Sidebar (Revenue + Categories + Quick Actions) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="dash-sidebar"
        >
          <div className="dash-sidebar-inner" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.875rem', height: '100%' }}>
            {/* Revenue mini chart */}
            <div className="dash-card" style={{ padding: '1rem 1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  This month
                </span>
                <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>30d</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EC1E79', letterSpacing: '-0.025em', lineHeight: 1, marginBottom: '0.5rem' }}>
                {loading ? '—' : `£${monthRevenue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              </div>
              {loading ? (
                <div style={{ height: 38, background: '#1a1a1a', borderRadius: 6 }} />
              ) : allZeroRev ? (
                <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#4b5563' }}>
                  No sales yet
                </div>
              ) : (
                <svg viewBox="0 0 300 40" preserveAspectRatio="none" style={{ width: '100%', height: 38, display: 'block' }}>
                  {last30.map((entry, i) => {
                    const barH = entry.revenue > 0 ? Math.max((entry.revenue / maxRev) * 34, 3) : 2
                    const BAR_W = 300 / 30
                    return (
                      <rect
                        key={entry.date}
                        x={i * BAR_W + 1}
                        y={40 - barH - 2}
                        width={Math.max(BAR_W - 2, 1)}
                        height={barH}
                        rx={1.5}
                        fill={entry.revenue > 0 ? '#EC1E79' : '#1f1f1f'}
                        opacity={entry.revenue > 0 ? 0.9 : 0.4}
                      />
                    )
                  })}
                </svg>
              )}
            </div>

            {/* Category breakdown */}
            <div className="dash-card" style={{ padding: '1rem 1.1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                By Category
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {catPills.map(cat => {
                  const count = catCounts[cat.key] ?? 0
                  return (
                    <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color }} />
                        <span style={{ fontSize: '0.78rem', color: '#d1d5db', fontWeight: 600 }}>{cat.label}</span>
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: cat.color }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Actions (compact) */}
            <div className="dash-card" style={{ padding: '1rem 1.1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                Quick Actions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {[
                  { label: 'Add Product',  href: '/admin/products',           icon: PlusCircle,  color: '#EC1E79' },
                  { label: 'Bulk Import',  href: '/admin/import',             icon: FileText,    color: '#EC1E79' },
                  { label: 'Orders',       href: '/admin/orders?status=pending', icon: ShoppingBag, color: '#f59e0b' },
                  { label: 'Buy-back',     href: '/admin/sell',               icon: Package,     color: '#818cf8' },
                ].map((a) => (
                  <Link key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
                    <div
                      className="action-card"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.45rem',
                        padding: '0.6rem 0.7rem',
                        background: '#0a0a0a',
                        border: '1px solid #1f1f1f',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <a.icon size={13} color={a.color} />
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#d1d5db', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Hidden legacy sections below — collapsed into the grid above ── */}
      <div style={{ display: 'none' }}>
        <div className="dash-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
          {[
            { label: 'Add Product',         href: '/admin/products',           icon: PlusCircle,  color: '#EC1E79', brand: true  },
            { label: 'Bulk Import',         href: '/admin/import',             icon: FileText,    color: '#EC1E79', brand: true  },
            { label: 'View Pending Orders', href: '/admin/orders?status=pending', icon: ShoppingBag, color: '#f59e0b', brand: false },
            { label: 'Buy-back Submissions', href: '/admin/sell',              icon: Package,     color: '#818cf8', brand: false },
          ].map((action, i) => (
            <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                whileHover={{ y: -2 }}
                className="action-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  background: action.brand ? 'rgba(236,30,121,0.08)' : '#111',
                  border: action.brand ? '1px solid rgba(236,30,121,0.3)' : '1px solid #1f1f1f',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: `${action.color}18`,
                  border: `1px solid ${action.color}28`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <action.icon size={18} color={action.color} />
                </div>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: action.brand ? '#EC1E79' : '#d1d5db',
                }}>
                  {action.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>

      {/* ── Revenue Sparkline ── */}
      {(() => {
        const recentOrders = analytics?.recentOrders ?? []
        const now = new Date()
        const last30: { date: string; revenue: number }[] = []
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(now.getDate() - i)
          const dateKey = d.toISOString().slice(0, 10)
          last30.push({ date: dateKey, revenue: 0 })
        }
        recentOrders.forEach(order => {
          const key = new Date(order.createdAt).toISOString().slice(0, 10)
          const entry = last30.find(e => e.date === key)
          if (entry) entry.revenue += order.total
        })
        const maxRevenue = Math.max(...last30.map(e => e.revenue), 1)
        const totalThisMonth = last30
          .filter(e => {
            const d = new Date(e.date)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })
          .reduce((sum, e) => sum + e.revenue, 0)
        const allZero = last30.every(e => e.revenue === 0)
        const BAR_W = 300 / 30
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.5 }}
            style={{
              background: '#111',
              border: '1px solid #1f1f1f',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
            }}
          >
            <div style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Revenue — Last 30 Days
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#EC1E79', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {loading ? '—' : `£${totalThisMonth.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <div style={{ height: 60, background: '#1a1a1a', borderRadius: 8 }} />
              ) : allZero ? (
                <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#4b5563' }}>No sales data yet</span>
                </div>
              ) : (
                <svg
                  viewBox="0 0 300 60"
                  preserveAspectRatio="none"
                  style={{ width: '100%', height: 60, display: 'block' }}
                >
                  {last30.map((entry, i) => {
                    const barH = entry.revenue > 0 ? Math.max((entry.revenue / maxRevenue) * 52, 4) : 2
                    const x = i * BAR_W + 1
                    const y = 60 - barH - 4
                    return (
                      <rect
                        key={entry.date}
                        x={x}
                        y={y}
                        width={Math.max(BAR_W - 2, 1)}
                        height={barH}
                        rx={2}
                        fill={entry.revenue > 0 ? '#EC1E79' : '#1f1f1f'}
                        opacity={entry.revenue > 0 ? 0.85 : 0.5}
                      />
                    )
                  })}
                </svg>
              )}
            </div>
          </motion.div>
        )
      })()}

      {/* ── Top Products ── */}
      {(() => {
        const recentOrders = analytics?.recentOrders ?? []
        const productMap: Record<string, { name: string; units: number; revenue: number }> = {}
        recentOrders.forEach(order => {
          order.items?.forEach(item => {
            if (!productMap[item.productName]) {
              productMap[item.productName] = { name: item.productName, units: 0, revenue: 0 }
            }
            productMap[item.productName].units += item.quantity
            productMap[item.productName].revenue += 0
          })
        })
        const topProducts = Object.values(productMap)
          .sort((a, b) => b.units - a.units)
          .slice(0, 5)
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.5 }}
            style={{
              background: '#111',
              border: '1px solid #1f1f1f',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.75rem',
            }}
          >
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '1rem' }}>Top Products</h2>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ height: 40, background: '#1a1a1a', borderRadius: 8 }} />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.875rem' }}>
                No order data yet
              </div>
            ) : (
              <div>
                {topProducts.map((product, idx) => (
                  <div
                    key={product.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0',
                      borderBottom: idx < topProducts.length - 1 ? '1px solid #1a1a1a' : 'none',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#1f1f1f',
                        border: '1px solid rgba(236,30,121,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#EC1E79',
                      }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>
                        {product.units} unit{product.units !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )
      })()}

      {/* ── Main Content Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>

        {/* Recent Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '1.5rem', overflow: 'hidden' }}
        >
          <SectionHeader title="Recent Orders" linkHref="/admin/orders" linkLabel="View all" />

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.7fr 1fr 0.8fr 0.8fr', gap: '1rem', padding: '0.625rem 1rem', borderBottom: '1px solid #1a1a1a' }}>
                {[80, 120, 60, 60, 70, 50].map((w, i) => (
                  <Skeleton key={i} height="12px" width={`${w}px`} />
                ))}
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.7fr 1fr 0.8fr 0.8fr', gap: '1rem', padding: '0.875rem 1rem', borderBottom: '1px solid #161616' }}>
                  {[90, 130, 50, 70, 70, 55].map((w, j) => (
                    <Skeleton key={j} height="14px" width={`${w}px`} />
                  ))}
                </div>
              ))}
            </div>
          ) : last5Orders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(236,30,121,0.08)', border: '1px solid rgba(236,30,121,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={22} color="#EC1E79" />
              </div>
              <div style={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.9rem' }}>No orders yet</div>
              <div style={{ color: '#4b5563', fontSize: '0.8125rem' }}>Orders will appear here once customers start buying</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #1f1f1f' }}>
                    {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'When'].map((col, i) => (
                      <th key={i} style={{
                        padding: '0.625rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#4b5563',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {last5Orders.map((order, idx) => (
                    <motion.tr
                      key={order.id}
                      className="order-row"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + idx * 0.05 }}
                      style={{ background: '#111', borderBottom: '1px solid #161616', cursor: 'pointer' }}
                      onClick={() => { window.location.href = '/admin/orders' }}
                    >
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.8125rem',
                          color: '#EC1E79',
                          fontWeight: 700,
                          background: 'rgba(236,30,121,0.08)',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          border: '1px solid rgba(236,30,121,0.15)',
                        }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                          {order.name}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                          {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
                          £{order.total.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#6b7280', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                          <Clock size={12} />
                          {timeAgo(order.createdAt)}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '1.5rem' }}
        >
          <SectionHeader title="Category Breakdown" />

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} height="48px" radius="10px" />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {catPills.map((cat, i) => {
                const count = catCounts[cat.key] ?? 0
                return (
                  <motion.div
                    key={cat.key}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: '#0a0a0a',
                      border: `1px solid ${cat.color}20`,
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0, display: 'block' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d1d5db' }}>{cat.label}</span>
                    </div>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      color: cat.color,
                      background: `${cat.color}14`,
                      border: `1px solid ${cat.color}28`,
                      borderRadius: '8px',
                      padding: '2px 10px',
                    }}>
                      {count}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}

          {!loading && (
            <Link href="/admin/analytics" style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ y: -1 }}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(236,30,121,0.06)',
                  border: '1px solid rgba(236,30,121,0.2)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#EC1E79',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <LayoutGrid size={14} />
                Full Analytics
              </motion.div>
            </Link>
          )}
        </motion.div>
      </div>

      {/* ── Stock Alerts Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        style={{
          background: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: '14px',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={18} color="#f59e0b" />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Stock Alerts</h2>
              {!loading && (
                <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: 2 }}>
                  Lowest stock products
                </p>
              )}
            </div>
          </div>
          <Link href="/admin/products" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ y: -1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#f59e0b',
                padding: '0.45rem 0.875rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 700,
              }}
            >
              <Package size={13} />
              Manage
            </motion.div>
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height="52px" radius="10px" />
            ))}
          </div>
        ) : stockAlerts.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} color="#34d399" />
            </div>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>All products are well stocked</div>
            <div style={{ color: '#4b5563', fontSize: '0.8125rem' }}>No critical stock issues found</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.5rem' }}>
            {stockAlerts.map((product, idx) => (
              <motion.div
                key={product.id}
                className="stock-row"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  background: '#0a0a0a',
                  border: '1px solid #1f1f1f',
                  borderRadius: '10px',
                }}
              >
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '8px',
                  background: product.stock === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${product.stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <AlertTriangle size={15} color={product.stock === 0 ? '#ef4444' : '#f59e0b'} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.2rem' }}>
                    {product.name}
                  </div>
                  <CategoryPill category={product.category} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: 900,
                      color: product.stock === 0 ? '#ef4444' : product.stock <= 2 ? '#f59e0b' : '#9ca3af',
                      lineHeight: 1,
                    }}>
                      {product.stock}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 2 }}>in stock</div>
                  </div>

                  <Link href={`/admin/products/${product.id}`} style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: 'transparent',
                        border: '1px solid #2a2a2a',
                        borderRadius: '7px',
                        color: '#9ca3af',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Edit3 size={11} />
                      Edit
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      </div>{/* /hidden legacy block */}
    </div>
  )
}

// ─── Low-stock email button ────────────────────────────────────────────────────

function LowStockEmailButton({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const send = async () => {
    if (!enabled || status === 'sending') return
    setStatus('sending')
    setMessage(null)
    try {
      const res = await fetch('/api/admin/alerts/low-stock', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (data?.sent) {
        setStatus('sent')
        setMessage(`Sent to ${data.to}`)
      } else {
        setStatus('error')
        setMessage(data?.reason || 'Could not send.')
      }
      setTimeout(() => { setStatus('idle'); setMessage(null) }, 4000)
    } catch {
      setStatus('error')
      setMessage('Network error')
      setTimeout(() => { setStatus('idle'); setMessage(null) }, 4000)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={send}
        disabled={!enabled || status === 'sending'}
        title={enabled ? 'Email this list to ADMIN_EMAIL' : 'No low-stock items to alert about'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          padding: '0.3rem 0.6rem', borderRadius: '6px',
          background: status === 'sent' ? 'rgba(52,211,153,0.15)' : status === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${status === 'sent' ? 'rgba(52,211,153,0.3)' : status === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}`,
          color: status === 'sent' ? '#34d399' : status === 'error' ? '#f87171' : '#f59e0b',
          fontSize: '0.7rem', fontWeight: 700,
          cursor: enabled && status !== 'sending' ? 'pointer' : 'not-allowed',
          opacity: enabled ? 1 : 0.4,
          whiteSpace: 'nowrap',
        }}
      >
        {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent ✓' : status === 'error' ? 'Failed' : '✉ Email me'}
      </button>
      {message && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          padding: '4px 8px', borderRadius: 6,
          background: '#0a0a0a', border: '1px solid #2a2a2a',
          fontSize: '0.65rem', color: status === 'sent' ? '#34d399' : '#f87171',
          whiteSpace: 'nowrap', zIndex: 5,
        }}>{message}</div>
      )}
    </div>
  )
}
