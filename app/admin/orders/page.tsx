'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Search,
  X,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  ArrowRight,
  Copy,
  Printer,
  Download,
} from 'lucide-react'

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
  phone?: string
  address?: string
  status: string
  total: number
  notes?: string
  shippingLine1?: string
  shippingLine2?: string
  shippingCity?: string
  shippingPostcode?: string
  shippingCountry?: string
  shippingMethod?: string
  shippingCost?: number
  trackingNumber?: string
  trackingCarrier?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const
type StatusFilter = (typeof STATUSES)[number]

const DATE_RANGES = ['Today', 'This week', 'This month', 'All time'] as const
type DateRange = (typeof DATE_RANGES)[number]

const CARRIERS = ['Royal Mail', 'DHL', 'DPD', 'Evri', 'Parcelforce', 'UPS', 'FedEx', 'Other'] as const

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; Icon: React.ElementType; label: string }> = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  Icon: Clock,        label: 'Pending'   },
  paid:      { color: '#EC1E79', bg: 'rgba(236,30,121,0.12)',   border: 'rgba(236,30,121,0.3)',   Icon: CreditCard,   label: 'Paid'      },
  shipped:   { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)', Icon: Truck,        label: 'Shipped'   },
  delivered: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  Icon: CheckCircle,  label: 'Delivered' },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   Icon: XCircle,      label: 'Cancelled' },
}

const STATUS_FLOW = ['pending', 'paid', 'shipped', 'delivered'] as const

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatAddress(order: Order): string {
  if (order.shippingLine1) {
    const parts = [
      order.shippingLine1,
      order.shippingLine2,
      order.shippingCity,
      order.shippingPostcode,
      order.shippingCountry,
    ].filter(Boolean)
    return parts.join(', ')
  }
  return order.address ?? ''
}

function getDateRangeFilter(range: DateRange): { from?: Date; to?: Date } {
  const now = new Date()
  if (range === 'Today') {
    const from = new Date(now)
    from.setHours(0, 0, 0, 0)
    return { from }
  }
  if (range === 'This week') {
    const from = new Date(now)
    from.setDate(now.getDate() - now.getDay())
    from.setHours(0, 0, 0, 0)
    return { from }
  }
  if (range === 'This month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from }
  }
  return {}
}

function matchesDateRange(createdAt: string, range: DateRange): boolean {
  if (range === 'All time') return true
  const { from } = getDateRangeFilter(range)
  if (!from) return true
  return new Date(createdAt) >= from
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.3)', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      padding: '0.25rem 0.75rem', borderRadius: '999px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: '0.75rem', fontWeight: 700,
      letterSpacing: '0.02em', textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label ?? status}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i} style={{ padding: '1rem 1.25rem' }}>
          <div style={{
            height: 16, borderRadius: 6,
            background: 'linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            width: i === 0 ? '80px' : i === 1 ? '120px' : '60px',
          }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Status Flow Stepper ───────────────────────────────────────────────────────

function StatusStepper({ status }: { status: string }) {
  const isCancelled = status === 'cancelled'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
      {STATUS_FLOW.map((step, idx) => {
        const cfg = STATUS_CONFIG[step]
        const stepIndex = STATUS_FLOW.indexOf(step)
        const currentIndex = STATUS_FLOW.indexOf(status as typeof STATUS_FLOW[number])
        const isActive = step === status
        const isCompleted = !isCancelled && currentIndex > stepIndex
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: isActive ? cfg.bg : isCompleted ? 'rgba(52,211,153,0.12)' : 'rgba(26,26,26,0.8)',
                border: `2px solid ${isActive ? cfg.color : isCompleted ? '#34d399' : '#2a2a2a'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                <cfg.Icon size={14} color={isActive ? cfg.color : isCompleted ? '#34d399' : '#4b5563'} />
              </div>
              <span style={{
                fontSize: '0.6875rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? cfg.color : isCompleted ? '#34d399' : '#4b5563',
                whiteSpace: 'nowrap',
              }}>
                {cfg.label}
              </span>
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <div style={{
                height: 2, flex: 1, marginBottom: '1.25rem',
                background: isCompleted ? '#34d399' : '#1f1f1f',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
      {isCancelled && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.375rem 0.75rem',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '8px', marginLeft: '0.75rem', flexShrink: 0,
        }}>
          <XCircle size={14} color="#ef4444" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>Cancelled</span>
        </div>
      )}
    </div>
  )
}

// ─── Print Export ──────────────────────────────────────────────────────────────

function openPrintWindow(order: Order) {
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const addrLines = order.shippingLine1
    ? [
        order.shippingLine1,
        order.shippingLine2,
        order.shippingCity,
        order.shippingPostcode,
        order.shippingCountry ?? 'GB',
      ].filter(Boolean)
    : [order.address].filter(Boolean)

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">£${item.price.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">£${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shippingCost = order.shippingCost ?? 0

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Order #${order.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 40px; font-size: 14px; line-height: 1.6; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #111; }
    .order-id { font-family: monospace; font-size: 18px; font-weight: 700; color: #059669; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .section { margin-bottom: 24px; }
    p { margin-bottom: 4px; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
    thead th:not(:first-child) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    .totals { margin-left: auto; width: 280px; }
    .totals tr td { padding: 6px 12px; }
    .totals .grand-total td { font-weight: 800; font-size: 16px; border-top: 2px solid #111; }
    .tracking { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Order Summary</h1>
      <div class="order-id">#${order.id.slice(0, 8).toUpperCase()}</div>
      <p style="color:#6b7280;font-size:13px;">${formatDate(order.createdAt)}</p>
    </div>
    <div style="text-align:right;">
      <div style="font-size:22px;font-weight:900;">£${order.total.toFixed(2)}</div>
      <div style="font-size:13px;color:#6b7280;text-transform:capitalize;margin-top:4px;">${order.status}</div>
    </div>
  </div>

  <div class="grid">
    <div class="section">
      <h2>Customer</h2>
      <p><strong>${order.name}</strong></p>
      <p>${order.email}</p>
      ${order.phone ? `<p>${order.phone}</p>` : ''}
    </div>
    <div class="section">
      <h2>Shipping Address</h2>
      ${addrLines.map(l => `<p>${l}</p>`).join('')}
      ${order.shippingMethod ? `<p style="margin-top:8px;color:#6b7280;font-size:13px;">${order.shippingMethod}${shippingCost > 0 ? ` — £${shippingCost.toFixed(2)}` : ' — Free'}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Items</h2>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal</td><td style="text-align:right;">£${subtotal.toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td style="text-align:right;">${shippingCost > 0 ? `£${shippingCost.toFixed(2)}` : 'Free'}</td></tr>
      <tr class="grand-total"><td>Total</td><td style="text-align:right;">£${order.total.toFixed(2)}</td></tr>
    </table>
  </div>

  ${order.trackingNumber ? `
  <div class="tracking">
    <h2 style="border:none;margin-bottom:6px;">Tracking</h2>
    <p><strong>${order.trackingCarrier ?? 'Carrier'}</strong> — ${order.trackingNumber}</p>
  </div>
  ` : ''}

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// ─── Order Detail Modal ────────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
  onUpdate,
}: {
  order: Order
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Order>) => Promise<void>
}) {
  const [localStatus, setLocalStatus] = useState(order.status)
  const [localNotes, setLocalNotes] = useState(order.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showTracking, setShowTracking] = useState(
    order.status === 'shipped' || !!order.trackingNumber
  )
  const [trackingCarrier, setTrackingCarrier] = useState(order.trackingCarrier ?? 'Royal Mail')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '')
  const [trackingSaving, setTrackingSaving] = useState(false)
  const [trackingSaved, setTrackingSaved] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [notesUpdatedAt, setNotesUpdatedAt] = useState<string | null>(null)
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(order.id, { status: localStatus, notes: localNotes })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleStatusChange = (newStatus: string) => {
    setLocalStatus(newStatus)
    if (newStatus === 'shipped') setShowTracking(true)
  }

  const handleMarkShipped = async () => {
    setLocalStatus('shipped')
    setShowTracking(true)
    setSaving(true)
    await onUpdate(order.id, { status: 'shipped', notes: localNotes })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveTracking = async () => {
    setTrackingSaving(true)
    await onUpdate(order.id, { trackingNumber, trackingCarrier })
    setTrackingSaving(false)
    setTrackingSaved(true)
    setTimeout(() => setTrackingSaved(false), 2500)
  }

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(trackingNumber)
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 1500)
  }

  const handleNotesBlur = () => {
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current)
    notesDebounceRef.current = setTimeout(async () => {
      await onUpdate(order.id, { notes: localNotes })
      setNotesUpdatedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    }, 300)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose()
  }

  const isDirty = localStatus !== order.status

  const addrBlock = order.shippingLine1
    ? [
        order.shippingLine1,
        order.shippingLine2,
        order.shippingCity,
        order.shippingPostcode,
        order.shippingCountry ?? 'GB',
      ].filter(Boolean)
    : order.address
    ? [order.address]
    : []

  return (
    <AnimatePresence>
      <motion.div
        ref={backdropRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: '0',
        }}
      >
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="orders-slide-over"
          style={{
            width: '100%', maxWidth: 640,
            height: '100vh',
            background: '#0d0d0d',
            borderLeft: '1px solid #1f1f1f',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, background: '#0d0d0d', zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'rgba(236,30,121,0.1)', border: '1px solid rgba(236,30,121,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShoppingBag size={18} color="#EC1E79" />
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#EC1E79' }}>
                  #{order.id.slice(0, 8).toUpperCase()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>
                  {formatDate(order.createdAt)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Print / Export */}
              <button
                onClick={() => openPrintWindow(order)}
                title="Print / Export"
                style={{
                  width: 36, height: 36, borderRadius: '8px',
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#9ca3af',
                }}
              >
                <Printer size={15} />
              </button>
              <button
                onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: '8px',
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#9ca3af',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Status Flow Stepper */}
            <div style={{
              padding: '1.25rem',
              background: '#111', border: '1px solid #1f1f1f',
              borderRadius: '14px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Order Progress
              </div>
              <StatusStepper status={order.status} />
            </div>

            {/* Customer Info */}
            <div style={{
              padding: '1.25rem',
              background: '#111', border: '1px solid #1f1f1f',
              borderRadius: '14px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Customer
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <User size={14} color="#6b7280" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{order.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Mail size={14} color="#6b7280" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{order.email}</span>
                </div>
                {order.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Phone size={14} color="#6b7280" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{order.phone}</span>
                  </div>
                )}
                {addrBlock.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <MapPin size={14} color="#6b7280" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      {addrBlock.map((line, i) => (
                        <div key={i} style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.65 }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Shipping method + cost */}
                {order.shippingMethod && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.25rem' }}>
                    <Truck size={14} color="#6b7280" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                      {order.shippingMethod}
                      {order.shippingCost !== undefined && order.shippingCost !== null && (
                        <span style={{ color: '#6b7280' }}>
                          {' '}—{' '}
                          {order.shippingCost > 0 ? `£${order.shippingCost.toFixed(2)}` : 'Free'}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div style={{
              padding: '1.25rem',
              background: '#111', border: '1px solid #1f1f1f',
              borderRadius: '14px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 60px 80px 80px',
                  padding: '0.375rem 0.625rem',
                  fontSize: '0.6875rem', fontWeight: 700, color: '#4b5563',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  <span>Product</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                  <span style={{ textAlign: 'right' }}>Unit</span>
                  <span style={{ textAlign: 'right' }}>Total</span>
                </div>
                {order.items.map(item => (
                  <div key={item.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 60px 80px 80px',
                    alignItems: 'center',
                    padding: '0.75rem 0.625rem',
                    background: '#161616', border: '1px solid #1f1f1f',
                    borderRadius: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: 'rgba(236,30,121,0.08)', border: '1px solid rgba(236,30,121,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Package size={12} color="#EC1E79" />
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.productName}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'center', fontWeight: 600 }}>
                      {item.quantity}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'right' }}>
                      £{item.price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#EC1E79', textAlign: 'right' }}>
                      £{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              {/* Shipping cost + total */}
              {order.shippingCost !== undefined && order.shippingCost !== null && order.shippingCost > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.625rem',
                  borderTop: '1px solid #1f1f1f',
                }}>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Shipping</span>
                  <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                    £{order.shippingCost.toFixed(2)}
                  </span>
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 0.625rem',
                borderTop: '1px solid #1f1f1f',
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af' }}>Order Total</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#fff' }}>
                  £{order.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Status Update */}
            <div style={{
              padding: '1.25rem',
              background: '#111', border: '1px solid #1f1f1f',
              borderRadius: '14px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
                Update Status
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                  <select
                    value={localStatus}
                    onChange={e => handleStatusChange(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#161616',
                      border: `1px solid ${STATUS_CONFIG[localStatus]?.border ?? '#2a2a2a'}`,
                      borderRadius: '10px',
                      color: STATUS_CONFIG[localStatus]?.color ?? '#fff',
                      padding: '0.625rem 2.25rem 0.625rem 0.875rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                    }}
                  >
                    {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
                      <option key={s} value={s} style={{ background: '#161616', color: '#fff' }}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <button
                    onClick={handleMarkShipped}
                    disabled={saving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.625rem 1rem',
                      background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)',
                      borderRadius: '10px', color: '#818cf8',
                      fontSize: '0.8125rem', fontWeight: 700,
                      cursor: saving ? 'wait' : 'pointer',
                      whiteSpace: 'nowrap',
                      opacity: saving ? 0.6 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Truck size={14} />
                    Mark as Shipped
                  </button>
                )}
              </div>
            </div>

            {/* Tracking Section — shown when status is shipped or being set to shipped */}
            {(localStatus === 'shipped' || showTracking) && (
              <div style={{
                padding: '1.25rem',
                background: '#111', border: '1px solid rgba(129,140,248,0.25)',
                borderRadius: '14px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={12} color="#818cf8" />
                  Tracking
                </div>

                {/* If tracking already saved — show chip */}
                {order.trackingNumber && !trackingSaving && (
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      background: 'rgba(236,30,121,0.1)', border: '1px solid rgba(236,30,121,0.25)',
                      borderRadius: '999px',
                    }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#EC1E79', fontFamily: 'monospace' }}>
                        {order.trackingNumber}
                      </span>
                      <button
                        onClick={handleCopyTracking}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: copyFeedback ? '#EC1E79' : '#6b7280',
                          display: 'flex', alignItems: 'center', padding: 0,
                          transition: 'color 0.15s',
                        }}
                        title="Copy tracking number"
                      >
                        {copyFeedback ? <CheckCircle size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                    {order.trackingCarrier && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{order.trackingCarrier}</span>
                    )}
                    <button
                      onClick={() => setTrackingNumber(order.trackingNumber ?? '')}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6b7280', fontSize: '0.75rem', fontWeight: 600,
                        textDecoration: 'underline', padding: 0,
                      }}
                    >
                      Update
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 auto', minWidth: 160 }}>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                      Carrier
                    </label>
                    <select
                      value={trackingCarrier}
                      onChange={e => setTrackingCarrier(e.target.value)}
                      style={{
                        background: '#161616', border: '1px solid #2a2a2a',
                        borderRadius: '10px', color: '#fff',
                        padding: '0.5rem 2rem 0.5rem 0.75rem',
                        fontSize: '0.8125rem', fontWeight: 600,
                        cursor: 'pointer', outline: 'none',
                        appearance: 'none', WebkitAppearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                      }}
                    >
                      {CARRIERS.map(c => (
                        <option key={c} value={c} style={{ background: '#161616', color: '#fff' }}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="e.g. JD000009999GB"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#161616', border: '1px solid #2a2a2a',
                        borderRadius: '10px', color: '#fff',
                        padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
                        outline: 'none', fontFamily: 'monospace',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#2a2a2a' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={handleSaveTracking}
                    disabled={trackingSaving || !trackingNumber.trim()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 1.125rem',
                      background: trackingNumber.trim() && !trackingSaving ? 'rgba(129,140,248,0.15)' : '#1a1a1a',
                      border: `1px solid ${trackingNumber.trim() && !trackingSaving ? 'rgba(129,140,248,0.4)' : '#2a2a2a'}`,
                      borderRadius: '10px',
                      color: trackingNumber.trim() && !trackingSaving ? '#818cf8' : '#4b5563',
                      fontSize: '0.8125rem', fontWeight: 700,
                      cursor: trackingSaving || !trackingNumber.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {trackingSaved ? <><CheckCircle size={13} /> Saved</> : trackingSaving ? 'Saving...' : 'Save Tracking'}
                  </button>
                </div>
              </div>
            )}

            {/* Fulfillment Notes */}
            <div style={{
              padding: '1.25rem',
              background: '#111', border: '1px solid #1f1f1f',
              borderRadius: '14px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={12} color="#4b5563" />
                  Fulfillment Notes
                  <span style={{ fontSize: '0.625rem', color: '#4b5563', fontWeight: 500, background: '#1a1a1a', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>
                    Internal only
                  </span>
                </div>
                {notesUpdatedAt && (
                  <span style={{ fontSize: '0.6875rem', color: '#4b5563', fontWeight: 500 }}>
                    Saved at {notesUpdatedAt}
                  </span>
                )}
              </div>
              <textarea
                value={localNotes}
                onChange={e => setLocalNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add internal fulfillment notes (not visible to customer)..."
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#161616', border: '1px solid #2a2a2a',
                  borderRadius: '10px', color: '#fff',
                  padding: '0.75rem', fontSize: '0.875rem',
                  resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.6,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(236,30,121,0.4)' }}
              />
            </div>

            {/* Timestamps */}
            <div style={{
              display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
            }}>
              {[
                { label: 'Created', value: formatDate(order.createdAt), Icon: Calendar },
                { label: 'Updated', value: formatDate(order.updatedAt), Icon: Calendar },
              ].map(({ label, value, Icon }) => (
                <div key={label} style={{
                  flex: 1, minWidth: 180,
                  padding: '0.875rem',
                  background: '#111', border: '1px solid #1f1f1f',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                }}>
                  <Icon size={14} color="#4b5563" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Footer */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #1a1a1a',
            background: '#0d0d0d',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'transparent', border: '1px solid #2a2a2a',
                borderRadius: '10px', color: '#9ca3af',
                fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              style={{
                padding: '0.625rem 1.5rem',
                background: isDirty && !saving ? '#EC1E79' : '#1a1a1a',
                border: `1px solid ${isDirty && !saving ? '#EC1E79' : '#2a2a2a'}`,
                borderRadius: '10px',
                color: isDirty && !saving ? '#000' : '#4b5563',
                fontSize: '0.875rem', fontWeight: 700,
                cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              {saved ? (
                <>
                  <CheckCircle size={14} />
                  Saved
                </>
              ) : saving ? (
                'Saving...'
              ) : (
                <>
                  Save Changes
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 1 })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateRange, setDateRange] = useState<DateRange>('All time')
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [copyAddrFeedback, setCopyAddrFeedback] = useState<string | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrders = useCallback(async (status: StatusFilter, page: number, searchQuery: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status !== 'all') params.set('status', status)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      const res = await fetch(`/api/admin/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data.orders ?? [])
      setPagination(data.pagination ?? { page: 1, limit: 12, total: 0, totalPages: 1 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStatusCounts = useCallback(async () => {
    try {
      const results = await Promise.all(
        ['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s =>
          fetch(`/api/admin/orders?status=${s}&limit=1`).then(r => r.json()).then(d => [s, d.pagination?.total ?? 0])
        )
      )
      const allRes = await fetch('/api/admin/orders?limit=1').then(r => r.json())
      const counts: Record<string, number> = { all: allRes.pagination?.total ?? 0 }
      results.forEach(([s, c]) => { counts[s as string] = c as number })
      setStatusCounts(counts)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    fetchOrders(statusFilter, 1, search)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [statusFilter, search, fetchOrders])

  useEffect(() => {
    fetchStatusCounts()
  }, [fetchStatusCounts])

  const handleSearchInput = (val: string) => {
    setSearchInput(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearch(val)
    }, 350)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
  }

  const handleOrderUpdate = async (orderId: string, updates: Partial<Order>) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update order')
      const data = await res.json()
      const updated = data.order
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o))
      if (selectedOrder?.id === orderId) setSelectedOrder(updated)
      fetchStatusCounts()
    } catch (err) {
      console.error(err)
    }
  }

  const handleQuickStatusChange = async (order: Order, newStatus: string) => {
    await handleOrderUpdate(order.id, { status: newStatus, notes: order.notes ?? '' })
  }

  const handleCopyAddress = (order: Order) => {
    const addr = formatAddress(order)
    if (!addr) return
    navigator.clipboard.writeText(addr)
    setCopyAddrFeedback(order.id)
    setTimeout(() => setCopyAddrFeedback(null), 1500)
  }

  const handlePageChange = (newPage: number) => {
    fetchOrders(statusFilter, newPage, search)
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Client-side date range filter
  const visibleOrders = orders.filter(o => matchesDateRange(o.createdAt, dateRange))

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .order-row:hover { background: #161616 !important; }
        .order-row { transition: background 0.15s ease; cursor: pointer; }
        .action-btn:hover { border-color: rgba(236,30,121,0.4) !important; color: #EC1E79 !important; }
        .copy-addr-btn:hover { border-color: rgba(236,30,121,0.35) !important; color: #EC1E79 !important; }
        select option { background: #161616; color: #fff; }
        .status-select:hover { border-color: #3a3a3a !important; }
        .date-pill:hover { border-color: rgba(236,30,121,0.3) !important; color: #9ca3af !important; }
        @media (max-width: 768px) {
          .orders-header { flex-direction: column !important; align-items: flex-start !important; }
          .orders-page-padding { padding: 1.25rem !important; }
          .orders-table { min-width: 600px; }
          .orders-table-wrap { overflow-x: auto !important; }
          .orders-col-shipping { display: none !important; }
          .orders-col-items { display: none !important; }
          .orders-slide-over { width: 100vw !important; max-width: 100vw !important; }
        }
      `}</style>

      <div className="orders-page-padding" style={{ padding: '2rem', color: '#fff', maxWidth: '1400px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="orders-header"
          style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
        >
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
              Orders
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Manage and track customer orders</p>
          </div>
          {!loading && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: 'rgba(236,30,121,0.12)', border: '1px solid rgba(236,30,121,0.3)',
                color: '#EC1E79', borderRadius: '999px', padding: '0.3rem 0.875rem',
                fontSize: '0.8125rem', fontWeight: 700,
              }}
            >
              {statusCounts.all ?? pagination.total} total
            </motion.span>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => window.open('/api/admin/orders/export', '_blank')}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = '#EC1E79'
                el.style.color = '#EC1E79'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = '#333'
                el.style.color = '#9ca3af'
              }}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#9ca3af',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'border-color 0.2s, color 0.2s',
              }}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </motion.div>

        {/* Status Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          style={{
            display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
            marginBottom: '1rem',
            background: '#111', border: '1px solid #1f1f1f',
            borderRadius: '14px', padding: '0.5rem',
          }}
        >
          {STATUSES.map(s => {
            const isActive = statusFilter === s
            const cfg = s !== 'all' ? STATUS_CONFIG[s] : null
            const count = statusCounts[s] ?? 0
            return (
              <motion.button
                key={s}
                onClick={() => setStatusFilter(s)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  border: isActive ? `1px solid ${cfg?.border ?? 'rgba(236,30,121,0.3)'}` : '1px solid transparent',
                  background: isActive ? (cfg?.bg ?? 'rgba(236,30,121,0.12)') : 'transparent',
                  color: isActive ? (cfg?.color ?? '#EC1E79') : '#9ca3af',
                  fontSize: '0.8125rem', fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {count > 0 && (
                  <span style={{
                    background: isActive ? (cfg?.color ?? '#EC1E79') + '22' : '#1f1f1f',
                    color: isActive ? (cfg?.color ?? '#EC1E79') : '#6b7280',
                    borderRadius: '999px', padding: '0.1rem 0.45rem',
                    fontSize: '0.7rem', fontWeight: 800,
                    border: isActive ? `1px solid ${cfg?.color ?? '#EC1E79'}40` : '1px solid transparent',
                  }}>
                    {count}
                  </span>
                )}
              </motion.button>
            )
          })}
        </motion.div>

        {/* Date Range Pills + Search Row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}
        >
          {DATE_RANGES.map(r => {
            const isActive = dateRange === r
            return (
              <button
                key={r}
                className="date-pill"
                onClick={() => setDateRange(r)}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '999px',
                  border: isActive ? '1px solid rgba(236,30,121,0.4)' : '1px solid #1f1f1f',
                  background: isActive ? 'rgba(236,30,121,0.1)' : '#111',
                  color: isActive ? '#EC1E79' : '#6b7280',
                  fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {r}
              </button>
            )
          })}
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          style={{ marginBottom: '1.25rem', position: 'relative' }}
        >
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Search size={16} color="#4b5563" />
          </div>
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#111', border: '1px solid #1f1f1f',
              borderRadius: '12px', color: '#fff',
              padding: '0.75rem 2.75rem 0.75rem 2.75rem',
              fontSize: '0.875rem', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(236,30,121,0.35)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1f1f1f' }}
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              style={{
                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            background: '#111', border: '1px solid #1f1f1f',
            borderRadius: '16px', overflow: 'hidden',
          }}
        >
          <div className="orders-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                  {['Order #', 'Customer', 'Items', 'Shipping', 'Total', 'Status', 'Date', 'Actions'].map((col, i) => (
                    <th key={i} className={col === 'Shipping' ? 'orders-col-shipping' : col === 'Items' ? 'orders-col-items' : ''} style={{
                      padding: '0.875rem 1.25rem',
                      textAlign: 'left',
                      fontSize: '0.75rem', fontWeight: 700,
                      color: '#4b5563',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                ) : visibleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                      >
                        <div style={{
                          width: 64, height: 64, borderRadius: '16px',
                          background: 'rgba(156,163,175,0.08)', border: '1px solid #1f1f1f',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ShoppingBag size={28} color="#4b5563" />
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>
                          {search ? 'No orders match your search' : statusFilter !== 'all' ? `No ${statusFilter} orders found` : 'No orders yet'}
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '0.8125rem' }}>
                          {search
                            ? 'Try a different name or email address'
                            : statusFilter !== 'all'
                            ? 'Try a different status filter'
                            : 'Orders will appear here when customers checkout'}
                        </div>
                        {(search || statusFilter !== 'all') && (
                          <button
                            onClick={() => { clearSearch(); setStatusFilter('all') }}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'transparent', border: '1px solid #2a2a2a',
                              borderRadius: '8px', color: '#9ca3af',
                              fontSize: '0.8125rem', fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Clear filters
                          </button>
                        )}
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  visibleOrders.map((order, idx) => {
                    const itemQty = order.items.reduce((sum, i) => sum + i.quantity, 0)
                    const addrForCopy = formatAddress(order)
                    return (
                      <motion.tr
                        key={order.id}
                        className="order-row"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025, duration: 0.25 }}
                        style={{ borderBottom: '1px solid #1a1a1a' }}
                      >
                        {/* Order # */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{
                            fontFamily: 'monospace', fontSize: '0.8125rem',
                            color: '#EC1E79', fontWeight: 700,
                            background: 'rgba(236,30,121,0.08)', padding: '0.25rem 0.5rem',
                            borderRadius: '6px', border: '1px solid rgba(236,30,121,0.15)',
                          }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff', marginBottom: '0.2rem' }}>
                            {order.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{order.email}</div>
                        </td>

                        {/* Items */}
                        <td className="orders-col-items" style={{ padding: '1rem 1.25rem' }}>
                          <span style={{
                            background: '#1a1a1a', border: '1px solid #2a2a2a',
                            borderRadius: '6px', padding: '0.2rem 0.6rem',
                            fontSize: '0.8125rem', fontWeight: 700, color: '#9ca3af',
                          }}>
                            {itemQty}
                          </span>
                        </td>

                        {/* Shipping Method */}
                        <td className="orders-col-shipping" style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {order.shippingMethod ?? '—'}
                          </span>
                        </td>

                        {/* Total */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#fff' }}>
                            £{order.total.toFixed(2)}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Date */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            {formatDate(order.createdAt)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* View button */}
                            <button
                              className="action-btn"
                              onClick={() => setSelectedOrder(order)}
                              style={{
                                padding: '0.375rem 0.875rem',
                                background: 'rgba(236,30,121,0.08)',
                                border: '1px solid rgba(236,30,121,0.2)',
                                borderRadius: '8px', color: '#EC1E79',
                                fontSize: '0.8125rem', fontWeight: 700,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                              }}
                            >
                              View
                            </button>

                            {/* Copy Address */}
                            {addrForCopy && (
                              <button
                                className="copy-addr-btn"
                                onClick={e => { e.stopPropagation(); handleCopyAddress(order) }}
                                title="Copy shipping address"
                                style={{
                                  width: 30, height: 30,
                                  background: '#1a1a1a',
                                  border: '1px solid #2a2a2a',
                                  borderRadius: '7px', color: '#6b7280',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', flexShrink: 0,
                                  transition: 'all 0.15s',
                                }}
                              >
                                {copyAddrFeedback === order.id
                                  ? <CheckCircle size={12} color="#EC1E79" />
                                  : <Copy size={12} />}
                              </button>
                            )}

                            {/* Quick status dropdown */}
                            <div style={{ position: 'relative' }}>
                              <select
                                className="status-select"
                                value={order.status}
                                onChange={async e => {
                                  e.stopPropagation()
                                  await handleQuickStatusChange(order, e.target.value)
                                }}
                                onClick={e => e.stopPropagation()}
                                style={{
                                  background: '#1a1a1a',
                                  border: `1px solid #2a2a2a`,
                                  borderRadius: '8px',
                                  color: STATUS_CONFIG[order.status]?.color ?? '#fff',
                                  padding: '0.375rem 1.875rem 0.375rem 0.625rem',
                                  fontSize: '0.75rem', fontWeight: 700,
                                  cursor: 'pointer', outline: 'none',
                                  appearance: 'none', WebkitAppearance: 'none',
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 0.5rem center',
                                  transition: 'border-color 0.15s',
                                }}
                              >
                                {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
                                  <option key={s} value={s} style={{ background: '#161616', color: '#fff' }}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.5rem', borderTop: '1px solid #1f1f1f',
              flexWrap: 'wrap', gap: '0.75rem',
            }}>
              <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                Page {pagination.page} of {pagination.totalPages} &bull; {pagination.total} orders
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <motion.button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  whileHover={{ scale: pagination.page <= 1 ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 36, height: 36, borderRadius: '8px',
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: pagination.page <= 1 ? 0.4 : 1,
                    color: '#9ca3af',
                  }}
                >
                  <ChevronLeft size={16} />
                </motion.button>

                {(() => {
                  const total = pagination.totalPages
                  const current = pagination.page
                  const pages: number[] = []
                  if (total <= 7) {
                    for (let i = 1; i <= total; i++) pages.push(i)
                  } else {
                    pages.push(1)
                    if (current > 3) pages.push(-1)
                    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
                    if (current < total - 2) pages.push(-2)
                    pages.push(total)
                  }
                  return pages.map((p) => p < 0 ? (
                    <span key={p} style={{ color: '#4b5563', padding: '0 0.25rem', fontSize: '0.875rem' }}>...</span>
                  ) : (
                    <motion.button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        width: 36, height: 36, borderRadius: '8px',
                        background: p === current ? '#EC1E79' : '#1a1a1a',
                        border: `1px solid ${p === current ? '#EC1E79' : '#2a2a2a'}`,
                        color: p === current ? '#000' : '#9ca3af',
                        fontSize: '0.875rem', fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {p}
                    </motion.button>
                  ))
                })()}

                <motion.button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  whileHover={{ scale: pagination.page >= pagination.totalPages ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 36, height: 36, borderRadius: '8px',
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                    opacity: pagination.page >= pagination.totalPages ? 0.4 : 1,
                    color: '#9ca3af',
                  }}
                >
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={handleOrderUpdate}
          />
        )}
      </AnimatePresence>
    </>
  )
}
