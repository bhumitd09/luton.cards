'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mail, Bell, Megaphone, Download, PackageSearch, Inbox } from 'lucide-react'
import { useToast } from '@/components/admin/toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface BackInStockRow {
  email: string
  productName: string
  productId: string
  createdAt: string
}

interface MarketingRow {
  email: string
  name: string
  createdAt: string
}

type TabKey = 'back-in-stock' | 'marketing'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
}) {
  return (
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
        <Icon size={20} color="#6b7280" />
      </div>
      <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#f4f4f5' }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#9ca3af' }}>
        {subtitle}
      </p>
    </div>
  )
}

// ─── Export button ──────────────────────────────────────────────────────────

function ExportButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: disabled ? '#161617' : 'linear-gradient(135deg, #EC1E79, #FF4DA6)',
        border: disabled ? '1px solid #202022' : 'none',
        borderRadius: '11px',
        color: disabled ? '#6b7280' : '#fff',
        fontSize: '0.8125rem',
        fontWeight: 800,
        padding: '0.55rem 0.95rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Download size={15} />
      Export CSV
    </button>
  )
}

// ─── Tab pill ──────────────────────────────────────────────────────────────

function TabPill({
  active,
  label,
  count,
  icon: Icon,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  icon: React.ElementType
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: active ? 'rgba(236,30,121,0.12)' : '#161617',
        border: `1px solid ${active ? 'rgba(236,30,121,0.3)' : '#202022'}`,
        borderRadius: '999px',
        color: active ? '#EC1E79' : '#9ca3af',
        fontSize: '0.8125rem',
        fontWeight: 700,
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
    >
      <Icon size={15} />
      {label}
      <span style={{
        background: active ? 'rgba(236,30,121,0.18)' : '#202022',
        color: active ? '#EC1E79' : '#9ca3af',
        fontSize: '0.6875rem',
        fontWeight: 800,
        padding: '1px 8px',
        borderRadius: '999px',
        minWidth: '1.25rem',
        textAlign: 'center',
      }}>
        {count}
      </span>
    </button>
  )
}

// ─── Table shell ──────────────────────────────────────────────────────────

function TableHeader({ columns, template }: { columns: string[]; template: string }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: template,
      padding: '0.75rem 1.25rem',
      borderBottom: '1px solid #202022',
      background: '#161617',
    }}>
      {columns.map(col => (
        <div key={col} style={{ color: '#6b7280', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {col}
        </div>
      ))}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SubscribersPage() {
  const toast = useToast()
  const [tab, setTab] = useState<TabKey>('back-in-stock')
  const [loading, setLoading] = useState(true)
  const [backInStock, setBackInStock] = useState<BackInStockRow[]>([])
  const [marketing, setMarketing] = useState<MarketingRow[]>([])

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscribers')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setBackInStock(data.backInStock ?? [])
      setMarketing(data.marketing ?? [])
    } catch {
      setBackInStock([])
      setMarketing([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  const handleExport = useCallback(async (type: TabKey) => {
    try {
      const res = await fetch(`/api/admin/subscribers?export=${type}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'marketing' ? 'marketing-subscribers.csv' : 'back-in-stock-subscribers.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('CSV export started')
    } catch {
      toast.error('Could not export CSV')
    }
  }, [toast])

  const currentList = tab === 'back-in-stock' ? backInStock : marketing

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Mail size={13} color="#EC1E79" />
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#EC1E79' }}>
            Subscribers
          </span>
        </div>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, letterSpacing: '-0.025em', margin: 0, marginBottom: '0.4rem' }}>
          Subscriber Lists
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
          {loading
            ? 'Loading…'
            : `${backInStock.length} awaiting restock · ${marketing.length} marketing opt-in${marketing.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <TabPill
          active={tab === 'back-in-stock'}
          label="Back in stock"
          count={backInStock.length}
          icon={Bell}
          onClick={() => setTab('back-in-stock')}
        />
        <TabPill
          active={tab === 'marketing'}
          label="Marketing opt-ins"
          count={marketing.length}
          icon={Megaphone}
          onClick={() => setTab('marketing')}
        />
      </div>

      {/* Export bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <ExportButton
          onClick={() => handleExport(tab)}
          disabled={loading || currentList.length === 0}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '4rem 0' }}>
          Loading subscribers…
        </div>
      ) : (
        <div style={{
          background: '#0f0f10',
          border: '1px solid #202022',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {tab === 'back-in-stock' ? (
            backInStock.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="No back-in-stock requests"
                subtitle="Customers waiting on restocks will appear here."
              />
            ) : (
              <>
                <TableHeader
                  columns={['Email', 'Product', 'Date Subscribed']}
                  template="1.6fr 1.4fr 130px"
                />
                {backInStock.map((row, i) => (
                  <motion.div
                    key={`${row.email}-${row.productId}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.6fr 1.4fr 130px',
                      padding: '0.7rem 1.25rem',
                      borderBottom: i < backInStock.length - 1 ? '1px solid #1a1a1c' : 'none',
                      alignItems: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161617' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div style={{ color: '#f4f4f5', fontSize: '0.875rem', fontWeight: 600 }}>
                      {row.email}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      {row.productName}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                      {formatDate(row.createdAt)}
                    </div>
                  </motion.div>
                ))}
              </>
            )
          ) : (
            marketing.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No marketing opt-ins"
                subtitle="Customers who opt into marketing will appear here."
              />
            ) : (
              <>
                <TableHeader
                  columns={['Email', 'Name', 'Date Joined']}
                  template="1.6fr 1.4fr 130px"
                />
                {marketing.map((row, i) => (
                  <motion.div
                    key={row.email}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.6fr 1.4fr 130px',
                      padding: '0.7rem 1.25rem',
                      borderBottom: i < marketing.length - 1 ? '1px solid #1a1a1c' : 'none',
                      alignItems: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161617' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div style={{ color: '#f4f4f5', fontSize: '0.875rem', fontWeight: 600 }}>
                      {row.email}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      {row.name || <span style={{ color: '#6b7280' }}>—</span>}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                      {formatDate(row.createdAt)}
                    </div>
                  </motion.div>
                ))}
              </>
            )
          )}
        </div>
      )}
    </div>
  )
}
