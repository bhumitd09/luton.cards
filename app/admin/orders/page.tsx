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
  Zap,
  Plus,
  Trash2,
  Pencil,
  RotateCcw,
  Save,
} from 'lucide-react'
import { useToast } from '@/components/admin/toast'
import { useConfirm } from '@/components/admin/confirm-dialog'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
  variantId?: string | null
  variantCondition?: string | null
  variantFoil?: string | null
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
  refundedAmount?: number
  refundedAt?: string
  isManual?: boolean
  paymentProvider?: string
  paymentRef?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

// Product catalogue shape returned by GET /api/admin/products.
// Only the fields the line-item builder needs are typed here.
interface ProductVariant {
  id: string
  condition: string
  foil?: string | null
  price: number
  stock: number
  active: boolean
}

interface CatalogueProduct {
  id: string
  name: string
  price: number
  variants?: ProductVariant[]
}

// A single editable line in the manual-order / edit-items builders.
interface LineDraft {
  key: string
  product: CatalogueProduct | null
  variantId: string | null
  quantity: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const
// 'needs-action' is a virtual filter — maps to status='paid' (paid but not yet
// shipped = awaiting dispatch). It's the default view so the first thing you
// see is what actually needs doing.
type StatusFilter = (typeof STATUSES)[number] | 'needs-action'

const DATE_RANGES = ['Today', 'This week', 'This month', 'All time'] as const
type DateRange = (typeof DATE_RANGES)[number]

const CARRIERS = ['Royal Mail', 'DHL', 'DPD', 'Evri', 'Parcelforce', 'UPS', 'FedEx', 'Other'] as const

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; Icon: React.ElementType; label: string }> = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  Icon: Clock,        label: 'Pending'   },
  paid:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)',   border: 'rgba(16,185,129,0.3)',   Icon: CreditCard,   label: 'Paid'      },
  shipped:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  Icon: Truck,        label: 'Shipped'   },
  delivered: { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  Icon: CheckCircle,  label: 'Delivered' },
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

// Human label for a variant (e.g. "Near mint · Holofoil").
function variantLabel(v: Pick<ProductVariant, 'condition' | 'foil'>): string {
  const cond = v.condition.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const foil = v.foil ? ` · ${v.foil.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : ''
  return `${cond}${foil}`
}

// Unit price for a draft line: the selected variant's price, else the
// product base price. Display-only — the server re-prices on submit.
function draftUnitPrice(line: LineDraft): number {
  if (!line.product) return 0
  if (line.variantId) {
    const v = line.product.variants?.find(vr => vr.id === line.variantId)
    if (v) return v.price
  }
  return line.product.price
}

let lineKeySeq = 0
function nextLineKey(): string {
  lineKeySeq += 1
  return `line-${Date.now()}-${lineKeySeq}`
}

// ─── Line Item Builder (shared by manual create + edit items) ────────────────────
//
// Renders editable line rows: each has a product picker (search-filtered
// select), an optional variant select (required when the product has
// variants), a quantity input, and a remove button. Display-only unit
// price + subtotal are shown for the admin's reference — the server is
// always authoritative on price.

function LineItemBuilder({
  lines,
  products,
  loadingProducts,
  onChange,
}: {
  lines: LineDraft[]
  products: CatalogueProduct[]
  loadingProducts: boolean
  onChange: (lines: LineDraft[]) => void
}) {
  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    onChange(lines.map(l => (l.key === key ? { ...l, ...patch } : l)))
  }
  const removeLine = (key: string) => onChange(lines.filter(l => l.key !== key))
  const addLine = () => onChange([...lines, { key: nextLineKey(), product: null, variantId: null, quantity: 1 }])

  const inputStyle: React.CSSProperties = {
    background: '#0c0c0d', border: '1px solid #202022',
    borderRadius: '11px', color: '#f4f4f5',
    padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
    outline: 'none', boxSizing: 'border-box',
  }
  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
    padding: '0.5rem 2rem 0.5rem 0.75rem',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.6rem center',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {lines.length === 0 && (
        <div style={{ fontSize: '0.8125rem', color: '#6b7280', padding: '0.5rem 0' }}>
          No items yet — add at least one line.
        </div>
      )}
      {lines.map(line => {
        const hasVariants = !!line.product?.variants && line.product.variants.length > 0
        const unit = draftUnitPrice(line)
        return (
          <div key={line.key} style={{
            display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end',
            padding: '0.75rem',
            background: '#161617', border: '1px solid #202022', borderRadius: '11px',
          }}>
            {/* Product picker */}
            <div style={{ flex: 2, minWidth: 180 }}>
              <label style={{ fontSize: '0.625rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.3rem' }}>
                Product
              </label>
              <select
                value={line.product?.id ?? ''}
                disabled={loadingProducts}
                onChange={e => {
                  const product = products.find(p => p.id === e.target.value) ?? null
                  // Auto-select the first variant when the product has them.
                  const firstVariant = product?.variants?.find(v => v.active) ?? product?.variants?.[0] ?? null
                  updateLine(line.key, { product, variantId: firstVariant ? firstVariant.id : null })
                }}
                style={selectStyle}
              >
                <option value="" style={{ background: '#161617', color: '#f4f4f5' }}>
                  {loadingProducts ? 'Loading…' : 'Select a product'}
                </option>
                {products.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#161617', color: '#f4f4f5' }}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Variant picker (only when the product has variants) */}
            {hasVariants && (
              <div style={{ flex: 1.5, minWidth: 140 }}>
                <label style={{ fontSize: '0.625rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.3rem' }}>
                  Variant
                </label>
                <select
                  value={line.variantId ?? ''}
                  onChange={e => updateLine(line.key, { variantId: e.target.value || null })}
                  style={selectStyle}
                >
                  <option value="" style={{ background: '#161617', color: '#f4f4f5' }}>Select variant</option>
                  {line.product?.variants?.map(v => (
                    <option key={v.id} value={v.id} disabled={!v.active} style={{ background: '#161617', color: '#f4f4f5' }}>
                      {variantLabel(v)} — £{v.price.toFixed(2)}{v.stock <= 0 ? ' (out of stock)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div style={{ width: 72 }}>
              <label style={{ fontSize: '0.625rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.3rem' }}>
                Qty
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={line.quantity}
                onChange={e => {
                  const n = parseInt(e.target.value, 10)
                  updateLine(line.key, { quantity: Number.isFinite(n) && n > 0 ? n : 1 })
                }}
                style={{ ...inputStyle, width: '100%', textAlign: 'center' }}
              />
            </div>

            {/* Line subtotal (display only) */}
            <div style={{ minWidth: 76, textAlign: 'right', paddingBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.625rem', color: '#6b7280', fontWeight: 700 }}>
                {line.product ? `£${unit.toFixed(2)} ea` : '—'}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#EC1E79' }}>
                £{(unit * line.quantity).toFixed(2)}
              </div>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeLine(line.key)}
              aria-label="Remove line"
              style={{
                width: 34, height: 34, borderRadius: '11px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.1rem',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )
      })}

      <button
        type="button"
        onClick={addLine}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.5rem 0.875rem',
          background: '#161617', border: '1px dashed #2a2a2c',
          borderRadius: '11px', color: '#9ca3af',
          fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
        }}
      >
        <Plus size={14} /> Add line
      </button>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.3)', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.3rem 0.75rem', borderRadius: '999px',
      background: cfg.bg, color: cfg.color,
      fontSize: '0.75rem', fontWeight: 700,
      letterSpacing: '0.01em', textTransform: 'capitalize',
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
            background: 'linear-gradient(90deg, #161617 25%, #202022 50%, #161617 75%)',
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
                background: isActive ? cfg.bg : isCompleted ? 'rgba(16,185,129,0.12)' : '#161617',
                border: `2px solid ${isActive ? cfg.color : isCompleted ? '#10b981' : '#202022'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                <cfg.Icon size={14} color={isActive ? cfg.color : isCompleted ? '#10b981' : '#6b7280'} />
              </div>
              <span style={{
                fontSize: '0.6875rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? cfg.color : isCompleted ? '#10b981' : '#6b7280',
                whiteSpace: 'nowrap',
              }}>
                {cfg.label}
              </span>
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <div style={{
                height: 2, flex: 1, marginBottom: '1.25rem',
                background: isCompleted ? '#10b981' : '#202022',
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
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '999px', marginLeft: '0.75rem', flexShrink: 0,
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
  onApplyOrder,
}: {
  order: Order
  onClose: () => void
  // Persist status/notes/tracking via the shared PUT /orders/:id helper.
  onApplyOrder: (id: string, updates: Partial<Order>) => Promise<void>
}) {
  const toast = useToast()
  const [localStatus, setLocalStatus] = useState(order.status)
  const [localNotes, setLocalNotes] = useState(order.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  // ── Refund panel ──────────────────────────────────────────────────────
  const refundedSoFar = order.refundedAmount ?? 0
  const remainingRefund = Math.max(0, Math.round((order.total - refundedSoFar) * 100) / 100)
  const canRefund = ['paid', 'shipped', 'delivered'].includes(order.status) && refundedSoFar < order.total
  const [showRefund, setShowRefund] = useState(false)
  const [refundAmount, setRefundAmount] = useState<string>(remainingRefund.toFixed(2))
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)
  // ── Line-item editor ──────────────────────────────────────────────────
  const canEditItems = ['pending', 'paid'].includes(order.status)
  const [editingItems, setEditingItems] = useState(false)
  const [itemLines, setItemLines] = useState<LineDraft[]>([])
  const [itemProducts, setItemProducts] = useState<CatalogueProduct[]>([])
  const [loadingItemProducts, setLoadingItemProducts] = useState(false)
  const [savingItems, setSavingItems] = useState(false)
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
    await onApplyOrder(order.id, { status: localStatus, notes: localNotes })
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
    await onApplyOrder(order.id, { status: 'shipped', notes: localNotes })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveTracking = async () => {
    setTrackingSaving(true)
    await onApplyOrder(order.id, { trackingNumber, trackingCarrier })
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
      await onApplyOrder(order.id, { notes: localNotes })
      setNotesUpdatedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    }, 300)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose()
  }

  // ── Refund ──────────────────────────────────────────────────────────────
  const parsedRefund = Number(refundAmount)
  const refundValid = Number.isFinite(parsedRefund) && parsedRefund > 0 && parsedRefund <= remainingRefund + 0.001

  const handleRefund = async () => {
    if (!refundValid || refunding) return
    setRefunding(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(parsedRefund * 100) / 100, reason: refundReason.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Refund failed')
        return
      }
      // The refund endpoint returns the updated order (and flips status to
      // 'cancelled' on a full refund) — push it through the same applier the
      // status save uses so the list + selected order stay in sync.
      if (data.order) await onApplyOrder(order.id, data.order as Partial<Order>)
      toast.success(`Refunded £${Number(data.refunded ?? parsedRefund).toFixed(2)}${data.fullyRefunded ? ' — order cancelled' : ''}`)
      setShowRefund(false)
      setRefundReason('')
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setRefunding(false)
    }
  }

  // ── Line-item edit ───────────────────────────────────────────────────────
  // Lazily fetch the catalogue when the editor opens, then seed the draft
  // rows from the order's existing items (matching them to catalogue products
  // so the pickers + variants are pre-selected).
  const enterItemEdit = async () => {
    setEditingItems(true)
    setLoadingItemProducts(true)
    try {
      const res = await fetch('/api/admin/products?limit=200')
      const data = await res.json().catch(() => ({}))
      const products: CatalogueProduct[] = Array.isArray(data.products) ? data.products : []
      setItemProducts(products)
      setItemLines(order.items.map(it => {
        const product = products.find(p => p.id === it.productId)
          ?? { id: it.productId, name: it.productName, price: it.price, variants: [] }
        return {
          key: nextLineKey(),
          product,
          variantId: it.variantId ?? null,
          quantity: it.quantity,
        }
      }))
    } catch {
      toast.error('Could not load products')
      setItemProducts([])
      setItemLines(order.items.map(it => ({
        key: nextLineKey(),
        product: { id: it.productId, name: it.productName, price: it.price, variants: [] },
        variantId: it.variantId ?? null,
        quantity: it.quantity,
      })))
    } finally {
      setLoadingItemProducts(false)
    }
  }

  const cancelItemEdit = () => {
    setEditingItems(false)
    setItemLines([])
  }

  const itemsValid = itemLines.length > 0 && itemLines.every(l =>
    l.product && l.quantity > 0 &&
    // Require a variant choice whenever the product offers variants.
    (!(l.product.variants && l.product.variants.length > 0) || !!l.variantId)
  )

  const handleSaveItems = async () => {
    if (!itemsValid || savingItems) return
    setSavingItems(true)
    try {
      const payload = {
        items: itemLines.map(l => ({
          productId: l.product!.id,
          quantity: l.quantity,
          variantId: l.variantId ?? undefined,
        })),
      }
      const res = await fetch(`/api/admin/orders/${order.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to update items')
        return
      }
      if (data.order) await onApplyOrder(order.id, data.order as Partial<Order>)
      toast.success(`Items updated — total £${Number(data.total ?? order.total).toFixed(2)}`)
      setEditingItems(false)
      setItemLines([])
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSavingItems(false)
    }
  }

  const itemsDraftSubtotal = itemLines.reduce((s, l) => s + draftUnitPrice(l) * l.quantity, 0)

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
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: '0',
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Order #${order.id.slice(0, 8).toUpperCase()}`}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="orders-slide-over"
          style={{
            width: '100%', maxWidth: 640,
            height: '100vh',
            background: '#0a0a0a',
            borderLeft: '1px solid #202022',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #202022',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '11px',
                background: 'rgba(236,30,121,0.12)', border: '1px solid rgba(236,30,121,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShoppingBag size={18} color="#EC1E79" />
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 800, color: '#EC1E79' }}>
                  #{order.id.slice(0, 8).toUpperCase()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>
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
                  width: 36, height: 36, borderRadius: '11px',
                  background: '#161617', border: '1px solid #202022',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#e4e4e7',
                }}
              >
                <Printer size={15} />
              </button>
              <button
                onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: '11px',
                  background: '#161617', border: '1px solid #202022',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#e4e4e7',
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
              background: '#0f0f10', border: '1px solid #202022',
              borderRadius: '16px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Order Progress
              </div>
              <StatusStepper status={order.status} />
            </div>

            {/* Customer Info */}
            <div style={{
              padding: '1.25rem',
              background: '#0f0f10', border: '1px solid #202022',
              borderRadius: '16px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Customer
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <User size={14} color="#6b7280" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4f4f5' }}>{order.name}</span>
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
              background: '#0f0f10', border: '1px solid #202022',
              borderRadius: '16px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span>Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
                {/* Edit items — only for pending/paid orders (server rejects others). */}
                {canEditItems && !editingItems && (
                  <button
                    onClick={enterItemEdit}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.3rem 0.7rem',
                      background: '#161617', border: '1px solid #202022',
                      borderRadius: '999px', color: '#9ca3af',
                      fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer',
                      textTransform: 'none', letterSpacing: 0,
                    }}
                  >
                    <Pencil size={11} /> Edit items
                  </button>
                )}
              </div>

              {editingItems ? (
                <div style={{ marginBottom: '1rem' }}>
                  <LineItemBuilder
                    lines={itemLines}
                    products={itemProducts}
                    loadingProducts={loadingItemProducts}
                    onChange={setItemLines}
                  />
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 0.625rem 0', marginTop: '0.5rem',
                    borderTop: '1px solid #1a1a1c',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Items subtotal (est.)</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af' }}>
                      £{itemsDraftSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.875rem' }}>
                    <button
                      onClick={cancelItemEdit}
                      disabled={savingItems}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#161617', border: '1px solid #202022',
                        borderRadius: '11px', color: '#e4e4e7',
                        fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveItems}
                      disabled={!itemsValid || savingItems}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.5rem 1.125rem',
                        background: itemsValid && !savingItems ? 'linear-gradient(135deg,#EC1E79,#FF4DA6)' : '#161617',
                        border: itemsValid && !savingItems ? 'none' : '1px solid #202022',
                        borderRadius: '11px',
                        color: itemsValid && !savingItems ? '#fff' : '#6b7280',
                        fontSize: '0.8125rem', fontWeight: 800,
                        cursor: !itemsValid || savingItems ? 'not-allowed' : 'pointer',
                        boxShadow: itemsValid && !savingItems ? '0 8px 22px -10px rgba(236,30,121,0.6)' : 'none',
                      }}
                    >
                      <Save size={13} /> {savingItems ? 'Saving…' : 'Save items'}
                    </button>
                  </div>
                </div>
              ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 60px 80px 80px',
                  padding: '0.375rem 0.625rem',
                  fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280',
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
                    background: '#161617', border: '1px solid #202022',
                    borderRadius: '11px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: 'rgba(236,30,121,0.12)', border: '1px solid rgba(236,30,121,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Package size={12} color="#EC1E79" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.productName}
                        </span>
                        {(item.variantCondition || item.variantFoil) && (
                          <span style={{ display: 'block', fontSize: '0.6875rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {variantLabel({ condition: item.variantCondition ?? '', foil: item.variantFoil })}
                          </span>
                        )}
                      </div>
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
              )}
              {/* Shipping cost + total */}
              {order.shippingCost !== undefined && order.shippingCost !== null && order.shippingCost > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.625rem',
                  borderTop: '1px solid #1a1a1c',
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
                borderTop: '1px solid #1a1a1c',
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af' }}>Order Total</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#f4f4f5' }}>
                  £{order.total.toFixed(2)}
                </span>
              </div>
              {refundedSoFar > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.625rem',
                }}>
                  <span style={{ fontSize: '0.8125rem', color: '#ef4444', fontWeight: 700 }}>Refunded</span>
                  <span style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 800 }}>
                    −£{refundedSoFar.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Refund */}
            {canRefund && (
              <div style={{
                padding: '1.25rem',
                background: '#0f0f10', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <RotateCcw size={12} color="#ef4444" />
                      Refund
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.4rem' }}>
                      £{remainingRefund.toFixed(2)} refundable
                    </div>
                  </div>
                  {!showRefund && (
                    <button
                      onClick={() => { setRefundAmount(remainingRefund.toFixed(2)); setShowRefund(true) }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.55rem 1rem',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '11px', color: '#ef4444',
                        fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={13} /> Refund
                    </button>
                  )}
                </div>

                {showRefund && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '0 0 auto', minWidth: 140 }}>
                        <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                          Amount (£)
                        </label>
                        <input
                          type="number"
                          min={0.01}
                          step={0.01}
                          max={remainingRefund}
                          value={refundAmount}
                          onChange={e => setRefundAmount(e.target.value)}
                          style={{
                            width: 140, boxSizing: 'border-box',
                            background: '#0c0c0d', border: `1px solid ${refundValid ? '#202022' : 'rgba(239,68,68,0.45)'}`,
                            borderRadius: '11px', color: '#f4f4f5',
                            padding: '0.5rem 0.75rem', fontSize: '0.875rem',
                            outline: 'none', fontWeight: 700,
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                          Reason <span style={{ color: '#4b5563', fontWeight: 600 }}>— optional</span>
                        </label>
                        <input
                          type="text"
                          value={refundReason}
                          onChange={e => setRefundReason(e.target.value)}
                          placeholder="e.g. Damaged in transit"
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            background: '#0c0c0d', border: '1px solid #202022',
                            borderRadius: '11px', color: '#f4f4f5',
                            padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none',
                          }}
                        />
                      </div>
                    </div>
                    {!refundValid && (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                        Enter an amount between £0.01 and £{remainingRefund.toFixed(2)}.
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => { setShowRefund(false); setRefundReason('') }}
                        disabled={refunding}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#161617', border: '1px solid #202022',
                          borderRadius: '11px', color: '#e4e4e7',
                          fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRefund}
                        disabled={!refundValid || refunding}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.5rem 1.125rem',
                          background: refundValid && !refunding ? 'rgba(239,68,68,0.15)' : '#161617',
                          border: `1px solid ${refundValid && !refunding ? 'rgba(239,68,68,0.4)' : '#202022'}`,
                          borderRadius: '11px',
                          color: refundValid && !refunding ? '#ef4444' : '#6b7280',
                          fontSize: '0.8125rem', fontWeight: 800,
                          cursor: !refundValid || refunding ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <RotateCcw size={13} /> {refunding ? 'Refunding…' : `Refund £${refundValid ? parsedRefund.toFixed(2) : remainingRefund.toFixed(2)}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Update */}
            <div style={{
              padding: '1.25rem',
              background: '#0f0f10', border: '1px solid #202022',
              borderRadius: '16px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
                Update Status
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                  <select
                    value={localStatus}
                    onChange={e => handleStatusChange(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#161617',
                      border: `1px solid ${STATUS_CONFIG[localStatus]?.border ?? '#202022'}`,
                      borderRadius: '11px',
                      color: STATUS_CONFIG[localStatus]?.color ?? '#f4f4f5',
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
                      <option key={s} value={s} style={{ background: '#161617', color: '#f4f4f5' }}>
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
                      background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: '11px', color: '#3b82f6',
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
                background: '#0f0f10', border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: '16px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={12} color="#3b82f6" />
                  Tracking
                </div>

                {/* If tracking already saved — show chip */}
                {order.trackingNumber && !trackingSaving && (
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      background: 'rgba(236,30,121,0.12)', border: '1px solid rgba(236,30,121,0.25)',
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
                    <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                      Carrier
                    </label>
                    <select
                      value={trackingCarrier}
                      onChange={e => setTrackingCarrier(e.target.value)}
                      style={{
                        background: '#161617', border: '1px solid #202022',
                        borderRadius: '11px', color: '#f4f4f5',
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
                        <option key={c} value={c} style={{ background: '#161617', color: '#f4f4f5' }}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="e.g. JD000009999GB"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#161617', border: '1px solid #202022',
                        borderRadius: '11px', color: '#f4f4f5',
                        padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
                        outline: 'none', fontFamily: 'monospace',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#202022' }}
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
                      background: trackingNumber.trim() && !trackingSaving ? 'rgba(59,130,246,0.15)' : '#161617',
                      border: `1px solid ${trackingNumber.trim() && !trackingSaving ? 'rgba(59,130,246,0.4)' : '#202022'}`,
                      borderRadius: '11px',
                      color: trackingNumber.trim() && !trackingSaving ? '#3b82f6' : '#6b7280',
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
              background: '#0f0f10', border: '1px solid #202022',
              borderRadius: '16px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={12} color="#6b7280" />
                  Fulfillment Notes
                  <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontWeight: 600, background: '#161617', border: '1px solid #202022', borderRadius: '999px', padding: '0.1rem 0.5rem' }}>
                    Internal only
                  </span>
                </div>
                {notesUpdatedAt && (
                  <span style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 500 }}>
                    Saved at {notesUpdatedAt}
                  </span>
                )}
              </div>
              <textarea
                value={localNotes}
                onChange={e => setLocalNotes(e.target.value)}
                placeholder="Add internal fulfillment notes (not visible to customer)..."
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#161617', border: '1px solid #202022',
                  borderRadius: '11px', color: '#f4f4f5',
                  padding: '0.75rem', fontSize: '0.875rem',
                  resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.6,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(236,30,121,0.45)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#202022'; handleNotesBlur() }}
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
                  background: '#0f0f10', border: '1px solid #202022',
                  borderRadius: '11px',
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                }}>
                  <Icon size={14} color="#6b7280" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
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
            borderTop: '1px solid #202022',
            background: '#0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.6rem 1.1rem',
                background: '#161617', border: '1px solid #202022',
                borderRadius: '11px', color: '#e4e4e7',
                fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              style={{
                padding: '0.6rem 1.5rem',
                background: isDirty && !saving ? 'linear-gradient(135deg,#EC1E79,#FF4DA6)' : '#161617',
                border: isDirty && !saving ? 'none' : '1px solid #202022',
                borderRadius: '11px',
                color: isDirty && !saving ? '#fff' : '#6b7280',
                fontSize: '0.85rem', fontWeight: 800,
                cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
                boxShadow: isDirty && !saving ? '0 8px 22px -10px rgba(236,30,121,0.6)' : 'none',
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
  const toast = useToast()
  const confirm = useConfirm()
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 1 })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('needs-action')
  // Bulk selection (ids of ticked rows) + the one-click fulfil target.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [fulfilOrder, setFulfilOrder] = useState<Order | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('All time')
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [copyAddrFeedback, setCopyAddrFeedback] = useState<string | null>(null)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrders = useCallback(async (status: StatusFilter, page: number, searchQuery: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' })
      // 'needs-action' is a view over paid-but-unshipped orders.
      const apiStatus = status === 'needs-action' ? 'paid' : status
      if (apiStatus !== 'all') params.set('status', apiStatus)
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
    if (['shipped', 'delivered', 'cancelled'].includes(newStatus)) {
      toast.success(`Order marked ${newStatus} — customer emailed`)
    }
  }

  // ── Selection helpers ──────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const allVisibleSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id))
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (orders.every(o => prev.has(o.id))) {
        const next = new Set(prev)
        orders.forEach(o => next.delete(o.id))
        return next
      }
      const next = new Set(prev)
      orders.forEach(o => next.add(o.id))
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  // Drop any selected ids that aren't on the current page so the bulk bar
  // count always reflects what's actually visible + ticked.
  useEffect(() => {
    setSelectedIds(prev => {
      if (prev.size === 0) return prev
      const visible = new Set(orders.map(o => o.id))
      const next = new Set(Array.from(prev).filter(id => visible.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [orders])

  // ── Bulk status change ─────────────────────────────────────────────────
  const handleBulk = async (newStatus: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    if (newStatus === 'cancelled') {
      const ok = await confirm({
        title: `Cancel ${ids.length} order${ids.length > 1 ? 's' : ''}?`,
        message: 'Each customer will be emailed that their order was cancelled. This cannot be undone.',
        danger: true,
        confirmLabel: 'Cancel orders',
      })
      if (!ok) return
    }

    setBulkBusy(true)
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: newStatus }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Bulk update failed')
        return
      }
      const n = data.updated ?? 0
      const emailed = data.emailed ?? 0
      toast.success(
        `${n} order${n === 1 ? '' : 's'} marked ${newStatus}` +
        (emailed > 0 ? ` · ${emailed} customer${emailed === 1 ? '' : 's'} emailed` : ''),
      )
      clearSelection()
      await fetchOrders(statusFilter, pagination.page, search)
      fetchStatusCounts()
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setBulkBusy(false)
    }
  }

  // ── One-click fulfil (ship + tracking + auto-email) ──────────────────────
  const handleFulfil = async (orderId: string, trackingNumber: string, trackingCarrier: string) => {
    await handleOrderUpdate(orderId, {
      status: 'shipped',
      trackingNumber: trackingNumber.trim(),
      trackingCarrier,
    })
    setFulfilOrder(null)
    toast.success(
      trackingNumber.trim()
        ? 'Shipped — tracking saved + customer emailed'
        : 'Shipped — customer emailed',
    )
  }

  // Refresh the list + counts after a manual order is created.
  const handleOrderCreated = async () => {
    setShowNewOrder(false)
    await fetchOrders(statusFilter, pagination.page, search)
    fetchStatusCounts()
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
        .order-row:hover { background: #161617 !important; }
        .order-row { transition: background 0.15s ease; cursor: pointer; }
        .action-btn:hover { border-color: rgba(236,30,121,0.4) !important; color: #EC1E79 !important; }
        .copy-addr-btn:hover { border-color: rgba(236,30,121,0.35) !important; color: #EC1E79 !important; }
        select option { background: #161617; color: #f4f4f5; }
        .status-select:hover { border-color: #2a2a2c !important; }
        .status-chip:hover { filter: brightness(1.08); }
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

      <div className="orders-page-padding" style={{ padding: '2rem', color: '#f4f4f5', maxWidth: '1400px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="orders-header"
          style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
        >
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              color: '#EC1E79', marginBottom: '0.5rem',
            }}>
              <ShoppingBag size={13} color="#EC1E79" />
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                Order Management
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem,2.5vw,1.75rem)', fontWeight: 900, letterSpacing: '-0.025em', color: '#fff', marginBottom: '0.25rem' }}>
              Orders
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Manage and track customer orders</p>
          </div>
          {!loading && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: 'rgba(236,30,121,0.12)',
                color: '#EC1E79', borderRadius: '999px', padding: '0.3rem 0.875rem',
                fontSize: '0.8125rem', fontWeight: 800,
              }}
            >
              {statusCounts.all ?? pagination.total} total
            </motion.span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowNewOrder(true)}
              style={{
                background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
                border: 'none',
                color: '#fff',
                padding: '0.6rem 1.1rem',
                borderRadius: '11px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
              }}
            >
              <Plus size={14} />
              New Order
            </button>
            <button
              onClick={() => window.open('/api/admin/orders/export', '_blank')}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(236,30,121,0.4)'
                el.style.color = '#EC1E79'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = '#202022'
                el.style.color = '#e4e4e7'
              }}
              style={{
                background: '#161617',
                border: '1px solid #202022',
                color: '#e4e4e7',
                padding: '0.6rem 1.1rem',
                borderRadius: '11px',
                cursor: 'pointer',
                fontSize: '0.85rem',
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
          }}
        >
          {/* Needs action — paid orders awaiting dispatch. Default view. */}
          {(() => {
            const isActive = statusFilter === 'needs-action'
            const count = statusCounts['paid'] ?? 0
            return (
              <motion.button
                key="needs-action"
                className="status-chip"
                onClick={() => setStatusFilter('needs-action')}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '999px',
                  border: isActive ? 'none' : '1px solid rgba(236,30,121,0.3)',
                  background: isActive ? 'linear-gradient(135deg,#EC1E79,#FF4DA6)' : 'rgba(236,30,121,0.1)',
                  color: isActive ? '#fff' : '#EC1E79',
                  fontSize: '0.8125rem', fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  transition: 'background 0.15s, color 0.15s',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 8px 22px -10px rgba(236,30,121,0.6)' : 'none',
                }}
              >
                <Zap size={13} fill={isActive ? '#fff' : 'none'} />
                Needs action
                {count > 0 && (
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(236,30,121,0.25)',
                    color: isActive ? '#fff' : '#EC1E79',
                    borderRadius: '999px', padding: '0.1rem 0.45rem',
                    fontSize: '0.7rem', fontWeight: 800,
                  }}>
                    {count}
                  </span>
                )}
              </motion.button>
            )
          })()}

          {STATUSES.map(s => {
            const isActive = statusFilter === s
            const count = statusCounts[s] ?? 0
            return (
              <motion.button
                key={s}
                className="status-chip"
                onClick={() => setStatusFilter(s)}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: isActive ? 'rgba(236,30,121,0.12)' : '#161617',
                  color: isActive ? '#EC1E79' : '#9ca3af',
                  fontSize: '0.8125rem', fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'background 0.15s, color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {count > 0 && (
                  <span style={{
                    background: isActive ? 'rgba(236,30,121,0.2)' : '#202022',
                    color: isActive ? '#EC1E79' : '#6b7280',
                    borderRadius: '999px', padding: '0.1rem 0.45rem',
                    fontSize: '0.7rem', fontWeight: 800,
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
                  padding: '0.4rem 0.875rem',
                  borderRadius: '999px',
                  border: isActive ? '1px solid rgba(236,30,121,0.4)' : '1px solid #202022',
                  background: isActive ? 'rgba(236,30,121,0.12)' : '#161617',
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
            <Search size={16} color="#6b7280" />
          </div>
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#0f0f10', border: '1px solid #202022',
              borderRadius: '11px', color: '#f4f4f5',
              padding: '0.75rem 2.75rem 0.75rem 2.75rem',
              fontSize: '0.875rem', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(236,30,121,0.45)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#202022' }}
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
            background: '#0f0f10', border: '1px solid #202022',
            borderRadius: '16px', overflow: 'hidden',
          }}
        >
          <div className="orders-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #202022' }}>
                  {/* Select-all checkbox */}
                  <th style={{ padding: '0.875rem 0.5rem 0.875rem 1.25rem', width: 20 }}>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      aria-label={allVisibleSelected ? 'Deselect all' : 'Select all'}
                      style={{
                        width: 18, height: 18, borderRadius: 5, cursor: 'pointer',
                        border: `1.5px solid ${allVisibleSelected ? '#EC1E79' : '#3a3a3d'}`,
                        background: allVisibleSelected ? '#EC1E79' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, flexShrink: 0,
                      }}
                    >
                      {allVisibleSelected && <CheckCircle size={11} color="#fff" />}
                    </button>
                  </th>
                  {['Order #', 'Customer', 'Items', 'Shipping', 'Total', 'Status', 'Date', 'Actions'].map((col, i) => (
                    <th key={i} className={col === 'Shipping' ? 'orders-col-shipping' : col === 'Items' ? 'orders-col-items' : ''} style={{
                      padding: '0.875rem 1.25rem',
                      textAlign: 'left',
                      fontSize: '0.75rem', fontWeight: 700,
                      color: '#6b7280',
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
                    <td colSpan={9} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: statusFilter === 'needs-action' && !search ? 'rgba(16,185,129,0.12)' : '#161617',
                          border: `1px solid ${statusFilter === 'needs-action' && !search ? 'rgba(16,185,129,0.3)' : '#202022'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {statusFilter === 'needs-action' && !search
                            ? <CheckCircle size={20} color="#10b981" />
                            : <ShoppingBag size={20} color="#6b7280" />}
                        </div>
                        <div style={{ color: '#f4f4f5', fontSize: '0.9rem', fontWeight: 700 }}>
                          {search ? 'No orders match your search'
                            : statusFilter === 'needs-action' ? "You're all caught up"
                            : statusFilter !== 'all' ? `No ${statusFilter} orders found`
                            : 'No orders yet'}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>
                          {search
                            ? 'Try a different name or email address'
                            : statusFilter === 'needs-action'
                            ? 'No paid orders waiting to be shipped. Nice.'
                            : statusFilter !== 'all'
                            ? 'Try a different status filter'
                            : 'Orders will appear here when customers checkout'}
                        </div>
                        {(search || statusFilter !== 'all') && (
                          <button
                            onClick={() => { clearSearch(); setStatusFilter('all') }}
                            style={{
                              padding: '0.6rem 1.1rem',
                              background: '#161617', border: '1px solid #202022',
                              borderRadius: '11px', color: '#e4e4e7',
                              fontSize: '0.85rem', fontWeight: 600,
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
                        style={{
                          borderBottom: '1px solid #1a1a1c',
                          background: selectedIds.has(order.id) ? 'rgba(236,30,121,0.06)' : 'transparent',
                        }}
                      >
                        {/* Row select */}
                        <td style={{ padding: '1rem 0.5rem 1rem 1.25rem' }}>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); toggleSelect(order.id) }}
                            aria-label={selectedIds.has(order.id) ? 'Deselect order' : 'Select order'}
                            style={{
                              width: 18, height: 18, borderRadius: 5, cursor: 'pointer',
                              border: `1.5px solid ${selectedIds.has(order.id) ? '#EC1E79' : '#3a3a3d'}`,
                              background: selectedIds.has(order.id) ? '#EC1E79' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0, flexShrink: 0,
                            }}
                          >
                            {selectedIds.has(order.id) && <CheckCircle size={11} color="#fff" />}
                          </button>
                        </td>

                        {/* Order # */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{
                            fontFamily: 'monospace', fontSize: '0.8125rem',
                            color: '#EC1E79', fontWeight: 700,
                            background: 'rgba(236,30,121,0.12)', padding: '0.25rem 0.55rem',
                            borderRadius: '999px',
                          }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f4f4f5', marginBottom: '0.2rem' }}>
                            {order.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{order.email}</div>
                        </td>

                        {/* Items */}
                        <td className="orders-col-items" style={{ padding: '1rem 1.25rem' }}>
                          <span style={{
                            background: '#161617', border: '1px solid #202022',
                            borderRadius: '999px', padding: '0.2rem 0.65rem',
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
                          <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#f4f4f5' }}>
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
                            {/* One-click Fulfil — only for orders awaiting dispatch */}
                            {(order.status === 'paid' || order.status === 'pending') && (
                              <button
                                className="action-btn"
                                onClick={e => { e.stopPropagation(); setFulfilOrder(order) }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                  padding: '0.4rem 0.85rem',
                                  background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
                                  border: 'none', borderRadius: '11px', color: '#fff',
                                  fontSize: '0.8125rem', fontWeight: 800,
                                  cursor: 'pointer', whiteSpace: 'nowrap',
                                  boxShadow: '0 6px 16px -8px rgba(236,30,121,0.6)',
                                }}
                              >
                                <Truck size={13} /> Fulfil
                              </button>
                            )}

                            {/* View button */}
                            <button
                              className="action-btn"
                              onClick={() => setSelectedOrder(order)}
                              style={{
                                padding: '0.4rem 0.9rem',
                                background: 'rgba(236,30,121,0.12)',
                                border: '1px solid rgba(236,30,121,0.25)',
                                borderRadius: '11px', color: '#EC1E79',
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
                                  width: 32, height: 32,
                                  background: '#161617',
                                  border: '1px solid #202022',
                                  borderRadius: '11px', color: '#6b7280',
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
                                  background: '#161617',
                                  border: `1px solid #202022`,
                                  borderRadius: '11px',
                                  color: STATUS_CONFIG[order.status]?.color ?? '#f4f4f5',
                                  padding: '0.4rem 1.875rem 0.4rem 0.7rem',
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
                                  <option key={s} value={s} style={{ background: '#161617', color: '#f4f4f5' }}>
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
              padding: '1rem 1.5rem', borderTop: '1px solid #202022',
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
                    width: 36, height: 36, borderRadius: '11px',
                    background: '#161617', border: '1px solid #202022',
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
                    <span key={p} style={{ color: '#6b7280', padding: '0 0.25rem', fontSize: '0.875rem' }}>...</span>
                  ) : (
                    <motion.button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        width: 36, height: 36, borderRadius: '11px',
                        background: p === current ? 'linear-gradient(135deg,#EC1E79,#FF4DA6)' : '#161617',
                        border: p === current ? 'none' : '1px solid #202022',
                        color: p === current ? '#fff' : '#9ca3af',
                        fontSize: '0.875rem', fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: p === current ? '0 8px 22px -10px rgba(236,30,121,0.6)' : 'none',
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
                    width: 36, height: 36, borderRadius: '11px',
                    background: '#161617', border: '1px solid #202022',
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
            onApplyOrder={handleOrderUpdate}
          />
        )}
      </AnimatePresence>

      {/* Manual new-order modal */}
      <AnimatePresence>
        {showNewOrder && (
          <NewOrderModal
            onClose={() => setShowNewOrder(false)}
            onCreated={handleOrderCreated}
          />
        )}
      </AnimatePresence>

      {/* One-click fulfil modal */}
      <AnimatePresence>
        {fulfilOrder && (
          <FulfilModal
            order={fulfilOrder}
            busy={bulkBusy}
            onClose={() => setFulfilOrder(null)}
            onConfirm={handleFulfil}
          />
        )}
      </AnimatePresence>

      {/* Floating bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 60, display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: '#0f0f10', border: '1px solid #2a2a2e', borderRadius: 14,
              padding: '0.6rem 0.7rem 0.6rem 1rem',
              boxShadow: '0 24px 60px -16px rgba(0,0,0,0.8)',
              flexWrap: 'wrap', maxWidth: 'calc(100vw - 2rem)',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
              {selectedIds.size} selected
            </span>
            <span style={{ width: 1, height: 22, background: '#2a2a2e' }} />
            {[
              { label: 'Mark paid', status: 'paid', color: '#10b981' },
              { label: 'Mark shipped', status: 'shipped', color: '#3b82f6' },
              { label: 'Mark delivered', status: 'delivered', color: '#10b981' },
            ].map(b => (
              <button
                key={b.status}
                disabled={bulkBusy}
                onClick={() => handleBulk(b.status)}
                style={{
                  padding: '0.45rem 0.85rem', borderRadius: 10,
                  background: '#161617', border: '1px solid #2a2a2e',
                  color: '#e4e4e7', fontSize: '0.8rem', fontWeight: 700,
                  cursor: bulkBusy ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {b.label}
              </button>
            ))}
            <button
              disabled={bulkBusy}
              onClick={() => handleBulk('cancelled')}
              style={{
                padding: '0.45rem 0.85rem', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', fontSize: '0.8rem', fontWeight: 700,
                cursor: bulkBusy ? 'wait' : 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Cancel
            </button>
            <span style={{ width: 1, height: 22, background: '#2a2a2e' }} />
            <button
              onClick={clearSelection}
              aria-label="Clear selection"
              style={{
                width: 30, height: 30, borderRadius: 9, background: '#161617',
                border: '1px solid #2a2a2e', color: '#9ca3af', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── One-click Fulfil modal ──────────────────────────────────────────────
// Captures tracking + carrier, then ships the order (status → shipped) and
// the server auto-sends the customer their tracking email. Tracking is
// optional — you can ship + email without it and add tracking later.
function FulfilModal({
  order,
  busy,
  onClose,
  onConfirm,
}: {
  order: Order
  busy: boolean
  onClose: () => void
  onConfirm: (orderId: string, trackingNumber: string, trackingCarrier: string) => Promise<void>
}) {
  const [tracking, setTracking] = useState(order.trackingNumber ?? '')
  const [carrier, setCarrier] = useState(order.trackingCarrier ?? 'Royal Mail')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await onConfirm(order.id, tracking, carrier)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 460, background: '#0f0f10',
          border: '1px solid #202022', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 28px 80px -20px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ padding: '1.25rem 1.35rem', borderBottom: '1px solid #1a1a1c', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Truck size={19} color="#fff" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
              Fulfil order
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
              #{order.id.slice(0, 8).toUpperCase()} · {order.name}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Carrier
            </label>
            <select
              value={carrier}
              onChange={e => setCarrier(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 0.8rem', background: '#0c0c0d',
                border: '1px solid #202022', borderRadius: 11, color: '#fff',
                fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
              }}
            >
              {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Tracking number <span style={{ color: '#4b5563', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
            </label>
            <input
              value={tracking}
              onChange={e => setTracking(e.target.value)}
              placeholder="e.g. AB123456789GB"
              autoFocus
              style={{
                width: '100%', padding: '0.6rem 0.8rem', background: '#0c0c0d',
                border: '1px solid #202022', borderRadius: 11, color: '#fff',
                fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5 }}>
            Marks the order <strong style={{ color: '#3b82f6' }}>shipped</strong> and emails {order.email} their
            {tracking.trim() ? ' tracking details' : ' dispatch confirmation'} automatically.
          </p>
        </div>

        <div style={{ padding: '1rem 1.35rem', borderTop: '1px solid #1a1a1c', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            disabled={submitting || busy}
            style={{
              background: '#161617', border: '1px solid #202022', color: '#e4e4e7',
              fontSize: '0.85rem', fontWeight: 700, padding: '0.55rem 1rem', borderRadius: 11, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || busy}
            style={{
              background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)', border: 'none', color: '#fff',
              fontSize: '0.85rem', fontWeight: 800, padding: '0.55rem 1.1rem', borderRadius: 11,
              cursor: submitting ? 'wait' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 8px 22px -10px rgba(236,30,121,0.7)',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Truck size={14} /> {submitting ? 'Shipping…' : 'Ship & email'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Manual New Order modal ──────────────────────────────────────────────
// Records an offline / phone / in-person sale. Line prices are NEVER trusted
// from the client — items carry only { productId, quantity, variantId? } and
// the server re-prices via the shared pricer. The running totals shown here
// are display-only estimates.
function NewOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void | Promise<void>
}) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [postcode, setPostcode] = useState('')
  const [country, setCountry] = useState('GB')
  const [shippingMethod, setShippingMethod] = useState('')
  const [shippingCost, setShippingCost] = useState('0')
  const [status, setStatus] = useState('paid')
  const [lines, setLines] = useState<LineDraft[]>([{ key: nextLineKey(), product: null, variantId: null, quantity: 1 }])
  const [products, setProducts] = useState<CatalogueProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/products?limit=200')
        const data = await res.json().catch(() => ({}))
        if (active) setProducts(Array.isArray(data.products) ? data.products : [])
      } catch {
        if (active) toast.error('Could not load products')
      } finally {
        if (active) setLoadingProducts(false)
      }
    })()
    return () => { active = false }
  }, [toast])

  const shippingNum = (() => {
    const n = Number(shippingCost)
    return Number.isFinite(n) && n > 0 ? n : 0
  })()
  const itemsSubtotal = lines.reduce((s, l) => s + draftUnitPrice(l) * l.quantity, 0)
  const estTotal = itemsSubtotal + shippingNum

  const validLines = lines.filter(l => l.product && l.quantity > 0)
  const everyLineComplete = validLines.length === lines.length && lines.length > 0 && lines.every(l =>
    !(l.product?.variants && l.product.variants.length > 0) || !!l.variantId
  )
  const canSubmit = name.trim() !== '' && email.trim() !== '' && validLines.length > 0 && everyLineComplete && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        shippingLine1: line1.trim() || undefined,
        shippingLine2: line2.trim() || undefined,
        shippingCity: city.trim() || undefined,
        shippingPostcode: postcode.trim() || undefined,
        shippingCountry: country.trim() || 'GB',
        shippingMethod: shippingMethod.trim() || undefined,
        shippingCost: shippingNum,
        status,
        items: validLines.map(l => ({
          productId: l.product!.id,
          quantity: l.quantity,
          variantId: l.variantId ?? undefined,
        })),
      }
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to create order')
        return
      }
      toast.success(`Order created — total £${Number(data.total ?? estTotal).toFixed(2)}`)
      await onCreated()
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#0c0c0d', border: '1px solid #202022',
    borderRadius: '11px', color: '#f4f4f5',
    padding: '0.6rem 0.8rem', fontSize: '0.875rem', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem',
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="New manual order"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '2rem 1rem', overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 720, background: '#0f0f10',
          border: '1px solid #202022', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 28px 80px -20px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column', maxHeight: '100%',
        }}
      >
        <div style={{ padding: '1.25rem 1.35rem', borderBottom: '1px solid #1a1a1c', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#0f0f10', zIndex: 5 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={19} color="#fff" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
              New manual order
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
              Record an offline / phone sale — pricing is recomputed server-side.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          {/* Customer */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Customer
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" style={fieldStyle} />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Shipping
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Address line 1</label>
                <input value={line1} onChange={e => setLine1(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Address line 2</label>
                <input value={line2} onChange={e => setLine2(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Postcode</label>
                <input value={postcode} onChange={e => setPostcode(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input value={country} onChange={e => setCountry(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Shipping method</label>
                <input value={shippingMethod} onChange={e => setShippingMethod(e.target.value)} placeholder="Optional" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Shipping cost (£)</label>
                <input type="number" min={0} step={0.01} value={shippingCost} onChange={e => setShippingCost(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{
                    ...fieldStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
                    padding: '0.6rem 2rem 0.6rem 0.8rem',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center',
                  }}
                >
                  {['pending', 'paid', 'shipped', 'delivered'].map(s => (
                    <option key={s} value={s} style={{ background: '#161617', color: '#f4f4f5' }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Items
            </div>
            <LineItemBuilder
              lines={lines}
              products={products}
              loadingProducts={loadingProducts}
              onChange={setLines}
            />
          </div>

          {/* Running totals (display only) */}
          <div style={{
            padding: '0.875rem 1rem',
            background: '#161617', border: '1px solid #202022', borderRadius: '11px',
            display: 'flex', flexDirection: 'column', gap: '0.4rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#9ca3af' }}>
              <span>Subtotal (est.)</span><span>£{itemsSubtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#9ca3af' }}>
              <span>Shipping</span><span>{shippingNum > 0 ? `£${shippingNum.toFixed(2)}` : 'Free'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, color: '#f4f4f5', borderTop: '1px solid #202022', paddingTop: '0.4rem' }}>
              <span>Total (est.)</span><span>£{estTotal.toFixed(2)}</span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
              Final total is calculated server-side from live prices.
            </span>
          </div>
        </div>

        <div style={{ padding: '1rem 1.35rem', borderTop: '1px solid #1a1a1c', display: 'flex', justifyContent: 'flex-end', gap: 8, position: 'sticky', bottom: 0, background: '#0f0f10' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: '#161617', border: '1px solid #202022', color: '#e4e4e7',
              fontSize: '0.85rem', fontWeight: 700, padding: '0.55rem 1rem', borderRadius: 11, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? 'linear-gradient(135deg,#EC1E79,#FF4DA6)' : '#161617',
              border: canSubmit ? 'none' : '1px solid #202022',
              color: canSubmit ? '#fff' : '#6b7280',
              fontSize: '0.85rem', fontWeight: 800, padding: '0.55rem 1.1rem', borderRadius: 11,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: canSubmit ? '0 8px 22px -10px rgba(236,30,121,0.7)' : 'none',
            }}
          >
            <Plus size={14} /> {submitting ? 'Creating…' : 'Create order'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
