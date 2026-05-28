'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, X, TrendingUp, ShoppingBag, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
}

interface Order {
  id: string
  email: string
  name: string
  status: string
  total: number
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

interface Customer {
  email: string
  name: string
  totalOrders: number
  totalSpent: number
  firstOrderAt: string
  lastOrderAt: string
  orders: Order[]
}

type SortBy = 'spend' | 'orders' | 'recent'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`
}

function relativeDate(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getCustomerStatus(totalOrders: number): { label: string; color: string; bg: string } {
  if (totalOrders === 1) return { label: 'New', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' }
  if (totalOrders <= 4) return { label: 'Regular', color: '#EC1E79', bg: 'rgba(236,30,121,0.12)' }
  return { label: 'VIP', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
}

function getOrderStatusStyle(status: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    paid:      { color: '#EC1E79', bg: 'rgba(236,30,121,0.12)' },
    shipped:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    delivered: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  }
  return map[status] ?? { color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' }
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ElementType
}) {
  return (
    <div style={{
      background: '#0f0f10',
      border: '1px solid #202022',
      borderRadius: '16px',
      padding: '1.25rem 1.35rem',
      flex: 1,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '11px',
        background: 'rgba(236,30,121,0.12)',
        border: '1px solid rgba(236,30,121,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} color="#EC1E79" />
      </div>
      <div>
        <div style={{ color: '#9ca3af', fontSize: '0.6875rem', fontWeight: 800, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </div>
        <div style={{ color: '#f4f4f5', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

// ─── Slide-over ────────────────────────────────────────────────────────────────

function SlideOver({
  customer,
  onClose,
}: {
  customer: Customer
  onClose: () => void
}) {
  const avgOrder = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0
  const sortedOrders = [...customer.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(2px)',
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '460px',
          background: '#0f0f10',
          borderLeft: '1px solid #202022',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #202022',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div>
            <div style={{ color: '#f4f4f5', fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {customer.name}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              {customer.email}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#161617',
              border: '1px solid #202022',
              borderRadius: '11px',
              color: '#e4e4e7',
              cursor: 'pointer',
              padding: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Stats grid */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #202022',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
        }}>
          {[
            { label: 'Total Orders', value: String(customer.totalOrders) },
            { label: 'Total Spent', value: formatCurrency(customer.totalSpent) },
            { label: 'Avg. Order Value', value: formatCurrency(avgOrder) },
            { label: 'First Order', value: formatDate(customer.firstOrderAt) },
            { label: 'Last Order', value: formatDate(customer.lastOrderAt) },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: '#161617',
              border: '1px solid #202022',
              borderRadius: '11px',
              padding: '0.875rem 1rem',
            }}>
              <div style={{ color: '#9ca3af', fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
                {label}
              </div>
              <div style={{ color: '#f4f4f5', fontSize: '0.9375rem', fontWeight: 800 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Order history */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '1.25rem 1.5rem 0.75rem', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Order History
          </div>

          <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sortedOrders.map(order => {
              const statusStyle = getOrderStatusStyle(order.status)
              return (
                <div
                  key={order.id}
                  style={{
                    background: '#161617',
                    border: '1px solid #202022',
                    borderRadius: '11px',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <span style={{ color: '#9ca3af', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                        {order.id.slice(0, 8)}…
                      </span>
                      <span style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        textTransform: 'capitalize',
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <span style={{ color: '#f4f4f5', fontSize: '0.875rem', fontWeight: 800 }}>
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <div style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.625rem' }}>
                    {formatDate(order.createdAt)}
                  </div>

                  {order.items.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {order.items.map(item => (
                        <span
                          key={item.id}
                          style={{
                            background: '#0f0f10',
                            border: '1px solid #202022',
                            color: '#9ca3af',
                            fontSize: '0.6875rem',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '999px',
                          }}
                        >
                          {item.productName} &times; {item.quantity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('spend')
  const [page, setPage] = useState(1)

  // Reset to page 1 when filter/sort changes
  useEffect(() => { setPage(1) }, [search, sortBy])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/customers')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCustomers(data.customers ?? [])
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Filter
  const filtered = customers.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'spend') return b.totalSpent - a.totalSpent
    if (sortBy === 'orders') return b.totalOrders - a.totalOrders
    return new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Stats
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '1.75rem',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={13} color="#EC1E79" />
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#EC1E79' }}>
              Customers
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, letterSpacing: '-0.025em', margin: 0, marginBottom: '0.4rem' }}>
            Customer Directory
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
            {loading ? 'Loading…' : `${customers.length} customer${customers.length !== 1 ? 's' : ''} total`}
          </p>
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
          style={{
            background: '#161617',
            border: '1px solid #202022',
            borderRadius: '11px',
            color: '#e4e4e7',
            fontSize: '0.875rem',
            fontWeight: 600,
            padding: '0.5rem 0.875rem',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="spend">By Spend</option>
          <option value="orders">By Orders</option>
          <option value="recent">Most Recent</option>
        </select>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <StatCard
          label="Total Customers"
          value={loading ? '—' : String(customers.length)}
          icon={Users}
        />
        <StatCard
          label="Total Revenue"
          value={loading ? '—' : formatCurrency(totalRevenue)}
          icon={TrendingUp}
        />
        <StatCard
          label="Avg. Order Value"
          value={loading ? '—' : formatCurrency(avgOrderValue)}
          icon={DollarSign}
        />
      </div>

      {/* Search */}
      <div style={{
        position: 'relative',
        marginBottom: '1.25rem',
        maxWidth: '400px',
      }}>
        <Search
          size={16}
          color="#6b7280"
          style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            background: '#161617',
            border: '1px solid #202022',
            borderRadius: '11px',
            color: '#f4f4f5',
            fontSize: '0.875rem',
            padding: '0.625rem 0.875rem 0.625rem 2.375rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '4rem 0' }}>
          Loading customers…
        </div>
      ) : sorted.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '5rem 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#161617', border: '1px solid #202022',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShoppingBag size={20} color="#6b7280" />
          </div>
          <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#f4f4f5' }}>
            {search ? 'No customers match your search' : 'No customers yet'}
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#9ca3af' }}>
            {search ? 'Try a different name or email.' : 'Orders will appear here once placed.'}
          </p>
        </div>
      ) : (
        <div style={{
          background: '#0f0f10',
          border: '1px solid #202022',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 80px 120px 130px 100px 90px',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid #202022',
            background: '#161617',
          }}>
            {['Customer', 'Orders', 'Total Spent', 'Last Order', 'Status', ''].map(col => (
              <div key={col} style={{ color: '#6b7280', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {paged.map((customer, i) => {
            const status = getCustomerStatus(customer.totalOrders)
            return (
              <motion.div
                key={customer.email}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedCustomer(customer)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 80px 120px 130px 100px 90px',
                  padding: '0.6rem 1.25rem',
                  borderBottom: i < paged.length - 1 ? '1px solid #1a1a1c' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  alignItems: 'center',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161617' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {/* Customer */}
                <div>
                  <div style={{ color: '#f4f4f5', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.125rem' }}>
                    {customer.name}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                    {customer.email}
                  </div>
                </div>

                {/* Orders */}
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 600 }}>
                  {customer.totalOrders}
                </div>

                {/* Total Spent */}
                <div style={{ color: '#EC1E79', fontSize: '0.875rem', fontWeight: 800 }}>
                  {formatCurrency(customer.totalSpent)}
                </div>

                {/* Last Order */}
                <div style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>
                  {relativeDate(customer.lastOrderAt)}
                </div>

                {/* Status badge */}
                <div>
                  <span style={{
                    background: status.bg,
                    color: status.color,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}>
                    {status.label}
                  </span>
                </div>

                {/* Action */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedCustomer(customer) }}
                    style={{
                      background: '#161617',
                      border: '1px solid #202022',
                      borderRadius: '11px',
                      color: '#e4e4e7',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.625rem',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = '#EC1E79'
                      el.style.color = '#EC1E79'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = '#202022'
                      el.style.color = '#e4e4e7'
                    }}
                  >
                    View &rarr;
                  </button>
                </div>
              </motion.div>
            )
          })}

          {/* Pagination footer */}
          {sorted.length > PAGE_SIZE && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid #202022',
              background: '#161617',
            }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Showing <span style={{ color: '#f4f4f5', fontWeight: 700 }}>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)}
                </span> of {sorted.length} customers
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.35rem 0.7rem', borderRadius: '11px',
                    border: '1px solid #202022',
                    background: page <= 1 ? '#0f0f10' : '#1d1d1f',
                    color: page <= 1 ? '#6b7280' : '#e4e4e7',
                    fontSize: '0.75rem', fontWeight: 700,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', padding: '0 0.5rem' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.35rem 0.7rem', borderRadius: '11px',
                    border: '1px solid #202022',
                    background: page >= totalPages ? '#0f0f10' : '#1d1d1f',
                    color: page >= totalPages ? '#6b7280' : '#e4e4e7',
                    fontSize: '0.75rem', fontWeight: 700,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over */}
      <AnimatePresence>
        {selectedCustomer && (
          <SlideOver
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
