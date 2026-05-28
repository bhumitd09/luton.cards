'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  BarChart2,
  Activity,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
}

interface RecentOrder {
  id: string
  name: string
  email: string
  total: number
  status: string
  createdAt: string
  items: OrderItem[]
}

interface AnalyticsData {
  totalProducts: number
  activeProducts: number
  featuredProducts: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  totalCustomers: number
  lowStockProducts: number
  outOfStockProducts: number
  productsByCategory: {
    single: number
    graded: number
    booster: number
    sealed: number
  }
  recentOrders: RecentOrder[]
  catalogueValue: number
}

interface LowStockItem {
  id: string
  name: string
  category: string
  stock: number
}

// ─── Animated Counter ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (!start || target === 0) { setCount(target); return }
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      }
    }
    frame.current = requestAnimationFrame(tick)
    return () => { if (frame.current) cancelAnimationFrame(frame.current) }
  }, [target, duration, start])

  return count
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  prefix = '',
  suffix = '',
  color,
  sub,
  delay,
  loading,
}: {
  icon: React.ElementType
  label: string
  value: number
  prefix?: string
  suffix?: string
  color: string
  sub?: string
  delay: number
  loading: boolean
}) {
  const [started, setStarted] = useState(false)
  const count = useCountUp(value, 1200, started && !loading)

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setStarted(true), delay * 1000)
      return () => clearTimeout(t)
    }
  }, [loading, delay])

  const displayValue = prefix === '£'
    ? `£${count.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `${prefix}${count.toLocaleString()}${suffix}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      style={{
        background: '#0f0f10',
        border: '1px solid #202022',
        borderRadius: '16px',
        padding: '1.25rem 1.35rem',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 120, height: 120,
        background: `radial-gradient(circle at top right, ${color}14 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{
          width: 44, height: 44,
          background: `${color}18`, border: `1px solid ${color}28`,
          borderRadius: '11px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
          <ArrowUpRight size={13} />
          <span>Live</span>
        </div>
      </div>

      {loading ? (
        <div>
          <div style={{ height: 36, background: 'linear-gradient(90deg, #161617 25%, #202022 50%, #161617 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 8, marginBottom: 8, width: '65%' }} />
          <div style={{ height: 14, background: '#161617', borderRadius: 6, width: '80%' }} />
        </div>
      ) : (
        <>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f4f4f5', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.3rem' }}>
            {displayValue}
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sub ? '0.3rem' : 0 }}>{label}</div>
          {sub && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{sub}</div>}
        </>
      )}
    </motion.div>
  )
}

// ─── Bar Row ───────────────────────────────────────────────────────────────────

function BarRow({ label, count, total, color, delay }: { label: string; count: number; total: number; color: string; delay: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: '1.125rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4f4f5' }}>{label}</span>
        </div>
        <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>
          {count} <span style={{ color: '#6b7280' }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: 8, background: '#161617', borderRadius: '999px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay, duration: 0.9, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: '999px',
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  )
}

// ─── SVG Donut Ring ────────────────────────────────────────────────────────────

function DonutRing({
  inStock,
  lowStock,
  outOfStock,
  total,
  loading,
}: {
  inStock: number
  lowStock: number
  outOfStock: number
  total: number
  loading: boolean
}) {
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const size = 144

  const segments = total > 0
    ? [
        { value: inStock,    color: '#EC1E79', label: 'In Stock' },
        { value: lowStock,   color: '#f59e0b', label: 'Low Stock' },
        { value: outOfStock, color: '#ef4444', label: 'Out of Stock' },
      ]
    : [{ value: 1, color: '#202022', label: 'No Data' }]

  const totalValue = segments.reduce((s, seg) => s + seg.value, 0) || 1
  let offset = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#202022" strokeWidth={16} />
          {loading ? (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="#161617"
              strokeWidth={16}
              strokeDasharray={circumference}
              strokeDashoffset={0}
            />
          ) : (
            segments.map((seg, i) => {
              const segLength = (seg.value / totalValue) * circumference
              const dashOffset = circumference - offset
              const el = (
                <motion.circle
                  key={i}
                  cx={size / 2} cy={size / 2} r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={16}
                  strokeDasharray={`${segLength} ${circumference - segLength}`}
                  strokeDashoffset={dashOffset}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${segLength} ${circumference - segLength}` }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 4px ${seg.color}66)` }}
                />
              )
              offset += segLength
              return el
            })
          )}
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          {loading ? (
            <div style={{ width: 40, height: 20, background: '#161617', borderRadius: 4 }} />
          ) : (
            <>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f4f4f5', lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, marginTop: 2 }}>total</div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1, minWidth: 100 }}>
        {[
          { label: 'In Stock',     value: inStock,    color: '#EC1E79' },
          { label: 'Low Stock',    value: lowStock,   color: '#f59e0b' },
          { label: 'Out of Stock', value: outOfStock, color: '#ef4444' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, display: 'block' }} />
              <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>{item.label}</span>
            </div>
            {loading ? (
              <div style={{ width: 30, height: 14, background: '#161617', borderRadius: 4 }} />
            ) : (
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: item.color }}>{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CSS Bar Chart ─────────────────────────────────────────────────────────────

function CategoryBarChart({
  data,
  loading,
}: {
  data: { label: string; count: number; color: string }[]
  loading: boolean
}) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: 120, padding: '0 0.5rem' }}>
      {loading
        ? [...Array(4)].map((_, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', background: 'linear-gradient(90deg, #161617 25%, #202022 50%, #161617 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: '4px 4px 0 0', height: `${40 + i * 15}px` }} />
              <div style={{ width: 40, height: 12, background: '#161617', borderRadius: 4 }} />
            </div>
          ))
        : data.map((item, i) => {
            const pct = (item.count / maxCount) * 100
            return (
              <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: item.color }}>{item.count}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 4)}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  style={{
                    width: '100%',
                    background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}88 100%)`,
                    borderRadius: '4px 4px 0 0',
                    minHeight: 4,
                    boxShadow: `0 0 10px ${item.color}44`,
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.label}</span>
              </div>
            )
          })
      }
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  paid:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  },
  shipped:   { color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
  delivered: { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] ?? { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.25)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.2rem 0.65rem', borderRadius: '999px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: '0.7rem', fontWeight: 700,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
      {status}
    </span>
  )
}

// ─── Category Badge ────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  single:  '#EC1E79',
  graded:  '#818cf8',
  booster: '#f59e0b',
  sealed:  '#34d399',
}

function CategoryBadge({ category }: { category: string }) {
  const color = CAT_COLORS[category] ?? '#9ca3af'
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '6px',
      background: `${color}14`, border: `1px solid ${color}28`,
      color, fontSize: '0.7rem', fontWeight: 700,
      textTransform: 'capitalize',
    }}>
      {category}
    </span>
  )
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ background: '#0f0f10', border: '1px solid #202022', borderRadius: '16px', padding: '1.25rem 1.35rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: '#161617', marginBottom: '1.25rem' }} />
      <div style={{ height: 36, background: 'linear-gradient(90deg, #161617 25%, #202022 50%, #161617 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 8, marginBottom: 8, width: '60%' }} />
      <div style={{ height: 14, background: '#161617', borderRadius: 6, width: '80%' }} />
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, productsRes] = await Promise.all([
          fetch('/api/admin/analytics'),
          fetch('/api/admin/products?limit=100'),
        ])
        const analyticsJson = await analyticsRes.json()
        const productsJson = await productsRes.json()

        const low: LowStockItem[] = (productsJson.products ?? [])
          .filter((p: { stock: number }) => p.stock <= 2)
          .map((p: { id: string; name: string; category: string; stock: number }) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            stock: p.stock,
          }))
          .slice(0, 10)

        setData(analyticsJson)
        setLowStockItems(low)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const totalInventory = data?.totalProducts ?? 0
  const outOfStock = data?.outOfStockProducts ?? 0
  const lowStock = data?.lowStockProducts ?? 0
  const inStock = Math.max(0, totalInventory - lowStock - outOfStock)

  const catTotal = data
    ? (data.productsByCategory.single + data.productsByCategory.graded + data.productsByCategory.booster + data.productsByCategory.sealed)
    : 0

  const avgOrderValue = data && data.totalOrders > 0
    ? data.totalRevenue / data.totalOrders
    : 0

  const catBarData = [
    { label: 'Singles',  count: data?.productsByCategory.single ?? 0,  color: '#EC1E79' },
    { label: 'Graded',   count: data?.productsByCategory.graded ?? 0,  color: '#818cf8' },
    { label: 'Boosters', count: data?.productsByCategory.booster ?? 0, color: '#f59e0b' },
    { label: 'Sealed',   count: data?.productsByCategory.sealed ?? 0,  color: '#34d399' },
  ]

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .recent-row:hover  { background: #161617 !important; }
        .recent-row        { transition: background 0.15s ease; }
        .low-stock-row:hover { background: #161617 !important; }
        .low-stock-row     { transition: background 0.15s ease; }
      `}</style>

      <div style={{ padding: '2rem', color: '#f4f4f5', maxWidth: '1400px', minHeight: '100vh', background: '#0a0a0a' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Activity size={13} color="#EC1E79" />
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#EC1E79' }}>
              Analytics
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, letterSpacing: '-0.025em', color: '#fff', margin: 0 }}>
            Store Overview
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.4rem', marginBottom: 0 }}>
            Store performance, inventory health and revenue overview
          </p>
        </motion.div>

        {/* ── Row 1: Top Metrics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {loading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                icon={TrendingUp}
                label="Total Revenue"
                value={data?.totalRevenue ?? 0}
                prefix="£"
                color="#EC1E79"
                sub="Paid, shipped & delivered"
                delay={0.05}
                loading={loading}
              />
              <StatCard
                icon={ShoppingCart}
                label="Total Orders"
                value={data?.totalOrders ?? 0}
                color="#818cf8"
                sub={`${data?.pendingOrders ?? 0} pending`}
                delay={0.1}
                loading={loading}
              />
              <StatCard
                icon={Users}
                label="Customers"
                value={data?.totalCustomers ?? 0}
                color="#f59e0b"
                sub="Unique buyers"
                delay={0.15}
                loading={loading}
              />
              <StatCard
                icon={BarChart2}
                label="Avg Order Value"
                value={Math.round(avgOrderValue)}
                prefix="£"
                color="#34d399"
                sub="Revenue ÷ orders"
                delay={0.2}
                loading={loading}
              />
            </>
          )}
        </div>

        {/* ── Row 2: Category bar chart + Stock donut ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Category Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            style={{ background: '#0f0f10', border: '1px solid #202022', borderRadius: '16px', padding: '1.25rem 1.35rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#f4f4f5', margin: 0 }}>Category Performance</h2>
                {!loading && <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: 4, marginBottom: 0 }}>{catTotal} total products</p>}
              </div>
              {!loading && (
                <span style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8', borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  {catTotal} total
                </span>
              )}
            </div>

            {/* Bar chart */}
            <div style={{ marginBottom: '1.5rem' }}>
              <CategoryBarChart data={catBarData} loading={loading} />
            </div>

            {/* Bar rows */}
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} style={{ marginBottom: '1.125rem' }}>
                  <div style={{ height: 14, background: '#161617', borderRadius: 6, marginBottom: 8, width: '70%' }} />
                  <div style={{ height: 8, background: '#161617', borderRadius: 999 }} />
                </div>
              ))
            ) : (
              <>
                <BarRow label="Graded"   count={data?.productsByCategory.graded  ?? 0} total={catTotal} color="#818cf8" delay={0.4} />
                <BarRow label="Singles"  count={data?.productsByCategory.single  ?? 0} total={catTotal} color="#EC1E79" delay={0.5} />
                <BarRow label="Boosters" count={data?.productsByCategory.booster ?? 0} total={catTotal} color="#f59e0b" delay={0.6} />
                <BarRow label="Sealed"   count={data?.productsByCategory.sealed  ?? 0} total={catTotal} color="#34d399" delay={0.7} />
              </>
            )}

            {!loading && data && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1a1a1c' }}>
                {catBarData.map(item => (
                  <div key={item.label} style={{
                    flex: 1, minWidth: 60, padding: '0.625rem 0.5rem',
                    background: `${item.color}0d`, border: `1px solid ${item.color}20`,
                    borderRadius: '11px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 900, color: item.color }}>{item.count}</div>
                    <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600, marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Stock Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ background: '#0f0f10', border: '1px solid #202022', borderRadius: '16px', padding: '1.25rem 1.35rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#f4f4f5', margin: 0 }}>Stock Health</h2>
                {!loading && <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: 4, marginBottom: 0 }}>Inventory distribution</p>}
              </div>
              {!loading && (
                <span style={{ background: 'rgba(236,30,121,0.1)', border: '1px solid rgba(236,30,121,0.2)', color: '#EC1E79', borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  {totalInventory} total
                </span>
              )}
            </div>

            {/* Donut ring */}
            <div style={{ marginBottom: '1.5rem' }}>
              <DonutRing
                inStock={inStock}
                lowStock={lowStock}
                outOfStock={outOfStock}
                total={totalInventory}
                loading={loading}
              />
            </div>

            {/* Summary pills */}
            {!loading && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1a1a1c' }}>
                {[
                  { label: 'In Stock',  value: inStock,    color: '#EC1E79' },
                  { label: 'Low Stock', value: lowStock,   color: '#f59e0b' },
                  { label: 'Out',       value: outOfStock, color: '#ef4444' },
                ].map(item => (
                  <div key={item.label} style={{
                    flex: 1, minWidth: 70, padding: '0.625rem 0.75rem',
                    background: `${item.color}0d`, border: `1px solid ${item.color}20`,
                    borderRadius: '11px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Revenue metrics */}
            {!loading && data && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #1a1a1c', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>Catalogue Value</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f4f4f5' }}>
                    £{(data.catalogueValue ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>Avg Order Value</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>
                    £{avgOrderValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>Featured Products</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#818cf8' }}>{data.featuredProducts ?? 0}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Row 3: Recent Orders ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{ background: '#0f0f10', border: '1px solid #202022', borderRadius: '16px', padding: '1.25rem 1.35rem', marginBottom: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#f4f4f5', margin: 0 }}>Recent Orders</h2>
            <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 3 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#EC1E79', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
              >
                View all <ArrowRight size={13} />
              </motion.div>
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr style={{ background: '#161617', borderBottom: '1px solid #202022' }}>
                  {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map((col, i) => (
                    <th key={i} style={{
                      padding: '0.625rem 1rem',
                      textAlign: 'left', fontSize: '0.7rem', fontWeight: 700,
                      color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em',
                      whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((_, j) => (
                        <td key={j} style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ height: 14, background: 'linear-gradient(90deg, #161617 25%, #202022 50%, #161617 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 6, width: j === 0 ? 80 : j === 1 ? 120 : 70 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !data?.recentOrders?.length ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div style={{ padding: '3rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#161617', border: '1px solid #202022', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingCart size={20} color="#6b7280" />
                        </div>
                        <div style={{ color: '#f4f4f5', fontWeight: 700, fontSize: '0.9rem' }}>No orders yet</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>Orders will appear here as they come in</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order, idx) => (
                    <motion.tr
                      key={order.id}
                      className="recent-row"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.05 }}
                      style={{ background: '#0f0f10', borderBottom: '1px solid #1a1a1c' }}
                    >
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '0.8125rem',
                          color: '#EC1E79', fontWeight: 700,
                          background: 'rgba(236,30,121,0.12)', padding: '0.2rem 0.5rem',
                          borderRadius: '6px', border: '1px solid rgba(236,30,121,0.2)',
                        }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f4f4f5' }}>{order.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{order.email}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f4f4f5' }}>
                          £{order.total.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Row 4: Low Stock Alert ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          style={{ background: '#0f0f10', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '1.25rem 1.35rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '11px',
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={18} color="#f59e0b" />
              </div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#f4f4f5', margin: 0 }}>Low Stock Alert</h2>
                {!loading && (
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: 4, marginBottom: 0 }}>
                    {lowStockItems.length} product{lowStockItems.length !== 1 ? 's' : ''} with stock &le; 2
                  </p>
                )}
              </div>
            </div>
            <Link href="/admin/products" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                  color: '#f59e0b', padding: '0.5rem 1rem', borderRadius: '11px',
                  cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                <Package size={14} />
                Manage Stock
              </motion.button>
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: 52, background: 'linear-gradient(90deg, #161617 25%, #202022 50%, #161617 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 11 }} />
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div style={{
              padding: '2.5rem', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={20} color="#10b981" />
              </div>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>All products are well stocked</div>
              <div style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>No products have critically low stock</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {lowStockItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  className="low-stock-row"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.04 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    background: '#161617', border: '1px solid #202022',
                    borderRadius: '11px', flexWrap: 'wrap', gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: item.stock === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${item.stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <AlertTriangle size={14} color={item.stock === 0 ? '#ef4444' : '#f59e0b'} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ marginTop: 3 }}>
                        <CategoryBadge category={item.category} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 900, color: item.stock === 0 ? '#ef4444' : '#f59e0b', lineHeight: 1.1 }}>
                        {item.stock}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>in stock</div>
                    </div>

                    <Link href={`/admin/products/${item.id}`} style={{ textDecoration: 'none' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '0.4rem 0.875rem',
                          background: '#0f0f10', border: '1px solid #202022',
                          borderRadius: '11px', color: '#e4e4e7',
                          fontSize: '0.75rem', fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Edit Stock <ArrowRight size={12} />
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </>
  )
}
