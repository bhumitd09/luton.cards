'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, Users, TrendingUp, Calendar, Check, X, AlertCircle, ChevronDown,
  ChevronRight, ShieldCheck, Percent, PoundSterling,
} from 'lucide-react'

type PayoutRow = {
  vendorId: string
  vendorName: string | null
  vendorEmail: string | null
  commissionRate: number
  payoutNotes: string | null
  totalSales: number
  vendorPayoutOwed: number
  vendorPayoutPaid: number
  platformFeeTotal: number
  itemsCount: number
  lastSaleAt: string | null
}

type LineItem = {
  id: string
  orderId: string
  orderEmail: string
  orderStatus: string
  orderDate: string
  productName: string
  price: number
  quantity: number
  lineTotal: number
  vendorId: string
  vendorPayout: number
  platformFee: number
  payoutPaidAt: string | null
  payoutNote: string | null
}

export default function AdminPayoutsPage() {
  const [rows, setRows] = useState<PayoutRow[]>([])
  const [items, setItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [marking, setMarking] = useState(false)
  const [me, setMe] = useState<{ id: string; role: string } | null>(null)

  const load = async () => {
    setLoading(true)
    const [authRes, payRes] = await Promise.all([
      fetch('/api/admin/auth'),
      fetch('/api/admin/payouts?items=1'),
    ])
    const auth = await authRes.json().catch(() => null)
    setMe(auth?.user ? { id: auth.user.id, role: auth.user.role } : null)
    if (payRes.ok) {
      const data = await payRes.json()
      setRows(data.rows ?? [])
      setItems(data.items ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const isSuper = me?.role === 'superadmin'

  const toggleSelect = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const markPaid = async () => {
    if (selected.size === 0) return
    if (!confirm(`Mark ${selected.size} line item(s) as paid?`)) return
    setMarking(true)
    await fetch('/api/admin/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds: Array.from(selected) }),
    })
    setSelected(new Set())
    setMarking(false)
    load()
  }

  const totalOwed = rows.reduce((s, r) => s + r.vendorPayoutOwed, 0)
  const totalPaid = rows.reduce((s, r) => s + r.vendorPayoutPaid, 0)
  const platformTotal = rows.reduce((s, r) => s + r.platformFeeTotal, 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-[1180px]">
        {/* Header */}
        <div className="mb-6">
          <p className="m-0 mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#EC1E79]">
            <Wallet size={11} /> Crew
          </p>
          <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em]">
            {isSuper ? 'Payouts' : 'My Payouts'}
          </h1>
          <p className="m-0 mt-1 text-sm text-neutral-400">
            {isSuper
              ? 'Per-member sales totals and what each is owed. Select line items to mark them paid.'
              : 'What you have earned, what is owed, and what has been paid.'}
          </p>
        </div>

        {/* Top totals */}
        {!loading && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TotalCard icon={Users} label={isSuper ? 'Vendors' : 'You'} value={String(rows.length)} color="#a78bfa" />
            <TotalCard icon={PoundSterling} label="Owed" value={`£${totalOwed.toFixed(2)}`} color="#fbbf24" />
            <TotalCard icon={Check} label="Paid" value={`£${totalPaid.toFixed(2)}`} color="#34d399" />
            {isSuper && (
              <TotalCard icon={TrendingUp} label="Platform fees" value={`£${platformTotal.toFixed(2)}`} color="#EC1E79" />
            )}
            {!isSuper && rows[0] && (
              <TotalCard icon={Percent} label="Your commission" value={`${rows[0].commissionRate}%`} color="#EC1E79" />
            )}
          </div>
        )}

        {/* Bulk action bar */}
        {isSuper && selected.size > 0 && (
          <motion.div
            initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#EC1E79]/30 bg-[#EC1E79]/10 px-4 py-2.5"
          >
            <span className="text-[13px] font-bold text-[#FF80B8]">
              {selected.size} item{selected.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(new Set())} className="rounded-lg bg-neutral-800 px-3 py-1.5 text-[11px] font-bold text-neutral-300">
                Clear
              </button>
              <button
                onClick={markPaid}
                disabled={marking}
                className="inline-flex items-center gap-1 rounded-lg bg-[#EC1E79] px-3 py-1.5 text-[11px] font-extrabold text-white disabled:opacity-60"
              >
                <Check size={12} /> Mark paid
              </button>
            </div>
          </motion.div>
        )}

        {/* Body */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-900/40" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10 text-center">
            <Wallet size={28} className="mx-auto text-neutral-600" />
            <p className="m-0 mt-3 text-sm font-bold text-neutral-200">No sales yet</p>
            <p className="m-0 mt-1 text-xs text-neutral-500">
              {isSuper ? 'Once team members start selling, their balances will show here.' : 'Once your products start selling, your balance will show here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(row => {
              const isOpen = expanded === row.vendorId
              const vendorItems = items.filter(i => i.vendorId === row.vendorId)
              return (
                <div key={row.vendorId} className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
                  <button
                    onClick={() => setExpanded(isOpen ? null : row.vendorId)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-neutral-900/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#EC1E79] to-[#7e1247] text-[12px] font-black text-white">
                        {(row.vendorName || row.vendorEmail || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="m-0 truncate text-[14px] font-black">{row.vendorName || row.vendorEmail}</p>
                          <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                            {row.commissionRate}%
                          </span>
                        </div>
                        <p className="m-0 mt-0.5 text-[11px] text-neutral-500">
                          {row.itemsCount} item{row.itemsCount !== 1 ? 's' : ''}
                          {row.lastSaleAt && (
                            <> · last sale {new Date(row.lastSaleAt).toLocaleDateString('en-GB')}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Owed</div>
                        <div className="text-[15px] font-black text-amber-300">£{row.vendorPayoutOwed.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Paid</div>
                        <div className="text-[15px] font-black text-emerald-300">£{row.vendorPayoutPaid.toFixed(2)}</div>
                      </div>
                      {isOpen ? <ChevronDown size={16} className="text-neutral-500" /> : <ChevronRight size={16} className="text-neutral-500" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-neutral-800"
                      >
                        {row.payoutNotes && (
                          <div className="border-b border-neutral-800 bg-neutral-950/40 px-4 py-2.5 text-[12px] text-neutral-400">
                            <span className="font-bold text-neutral-300">Payout details: </span>
                            <span className="whitespace-pre-wrap">{row.payoutNotes}</span>
                          </div>
                        )}
                        <table className="w-full text-[12px]">
                          <thead className="bg-neutral-950/60 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            <tr>
                              {isSuper && <th className="w-8 px-3 py-2"></th>}
                              <th className="px-3 py-2">Order</th>
                              <th className="px-3 py-2">Product</th>
                              <th className="px-3 py-2 text-right">Sale</th>
                              <th className="px-3 py-2 text-right">Their cut</th>
                              <th className="px-3 py-2 text-right">Fee</th>
                              <th className="px-3 py-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vendorItems.map(item => (
                              <tr key={item.id} className="border-t border-neutral-800/60 hover:bg-neutral-950/40">
                                {isSuper && (
                                  <td className="px-3 py-2">
                                    {!item.payoutPaidAt && (
                                      <input
                                        type="checkbox"
                                        checked={selected.has(item.id)}
                                        onChange={() => toggleSelect(item.id)}
                                      />
                                    )}
                                  </td>
                                )}
                                <td className="px-3 py-2 font-mono text-[11px] text-neutral-400">
                                  #{item.orderId.slice(-6)}
                                  <div className="text-[10px] text-neutral-600">
                                    {new Date(item.orderDate).toLocaleDateString('en-GB')}
                                  </div>
                                </td>
                                <td className="max-w-[280px] truncate px-3 py-2 text-neutral-200">
                                  {item.productName} <span className="text-neutral-500">× {item.quantity}</span>
                                </td>
                                <td className="px-3 py-2 text-right text-neutral-300">£{item.lineTotal.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-bold text-emerald-300">£{item.vendorPayout.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right text-neutral-500">£{item.platformFee.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">
                                  {item.payoutPaidAt ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                      <Check size={9} /> Paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                      Owed
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function TotalCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="mt-1 text-[1.4rem] font-black tracking-[-0.025em] text-white">{value}</div>
    </div>
  )
}
