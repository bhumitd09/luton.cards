'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCog, Plus, Mail, ShieldCheck, Percent, Wallet, Trash2,
  Check, AlertCircle, Eye, EyeOff, Power, X, KeyRound, Package,
} from 'lucide-react'

type Member = {
  id: string
  email: string
  name: string | null
  role: 'superadmin' | 'vendor'
  commissionRate: number
  payoutNotes: string | null
  avatarUrl: string | null
  active: boolean
  createdAt?: string
  lastLogin?: string | null
  _count?: { products: number }
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/members')
    if (res.status === 403) {
      setForbidden(true)
      setLoading(false)
      return
    }
    const data = await res.json()
    setMembers(data.members ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6 text-white sm:p-8">
        <div className="mx-auto max-w-[640px] rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
          <AlertCircle size={28} className="mx-auto text-red-400" />
          <h1 className="mt-3 text-xl font-black">Superadmin only</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Team member management is only visible to superadmins. Ask Bhumit if you need access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="m-0 mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#EC1E79]">
              <UserCog size={11} /> Crew
            </p>
            <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em]">Team Members</h1>
            <p className="m-0 mt-1 max-w-[640px] text-sm text-neutral-400">
              Add team members so they can sign in to the back office and manage their own stock.
              Each member can only edit their own products. Commission rate sets the platform&apos;s cut on their sales.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#EC1E79] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_6px_18px_-6px_rgba(236,30,121,0.55)] transition-transform hover:-translate-y-0.5"
          >
            <Plus size={14} /> Add member
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-neutral-900/40" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10 text-center">
            <UserCog size={28} className="mx-auto text-neutral-600" />
            <p className="m-0 mt-3 text-sm font-bold text-neutral-200">No team members yet</p>
            <p className="m-0 mt-1 text-xs text-neutral-500">Click &ldquo;Add member&rdquo; to invite your first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {members.map(m => (
              <MemberCard
                key={m.id}
                member={m}
                onEdit={() => setEditingId(m.id)}
                onChanged={load}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateMemberModal
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); load() }}
          />
        )}
        {editingId && (
          <EditMemberModal
            member={members.find(m => m.id === editingId)!}
            onClose={() => setEditingId(null)}
            onSaved={() => { setEditingId(null); load() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Member card ────────────────────────────────────────────────────────────

function MemberCard({
  member, onEdit, onChanged,
}: { member: Member; onEdit: () => void; onChanged: () => void }) {
  const toggleActive = async () => {
    const next = !member.active
    if (!next && !confirm(`Disable ${member.name || member.email}? They won't be able to log in.`)) return
    await fetch(`/api/admin/members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: next }),
    })
    onChanged()
  }

  const initials = (member.name || member.email).split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${
      member.active ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-900 bg-neutral-950/40 opacity-60'
    }`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative size-12 shrink-0">
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatarUrl} alt="" className="size-full rounded-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#EC1E79] to-[#7e1247] text-sm font-black text-white">
              {initials}
            </div>
          )}
          {member.role === 'superadmin' && (
            <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-amber-500" title="Superadmin">
              <ShieldCheck size={10} className="text-black" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="m-0 truncate text-[15px] font-black text-white">
              {member.name || member.email.split('@')[0]}
            </p>
            {!member.active && (
              <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                Disabled
              </span>
            )}
          </div>
          <p className="m-0 mt-0.5 inline-flex items-center gap-1 text-[12px] text-neutral-500">
            <Mail size={10} /> {member.email}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <Stat icon={ShieldCheck} label="Role" value={member.role === 'superadmin' ? 'Super' : 'Vendor'} />
            <Stat icon={Percent} label="Commission" value={`${member.commissionRate}%`} />
            <Stat icon={Package} label="Products" value={String(member._count?.products ?? 0)} />
          </div>

          {member.payoutNotes && (
            <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950/50 p-2 text-[11px] leading-[1.5] text-neutral-400">
              <span className="font-bold text-neutral-300">Payout:</span> {member.payoutNotes}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-neutral-800 pt-3">
        <button
          onClick={toggleActive}
          title={member.active ? 'Disable' : 'Enable'}
          className="rounded-lg bg-neutral-800 px-2.5 py-1.5 text-[11px] font-bold text-neutral-300 hover:bg-neutral-700"
        >
          <Power size={11} className="inline" /> {member.active ? 'Disable' : 'Enable'}
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg bg-[#EC1E79]/15 px-3 py-1.5 text-[11px] font-bold text-[#EC1E79] hover:bg-[#EC1E79]/25"
        >
          Edit
        </button>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-neutral-500">
        <Icon size={9} /> {label}
      </div>
      <div className="mt-0.5 text-[12px] font-black text-white">{value}</div>
    </div>
  )
}

// ─── Create modal ──────────────────────────────────────────────────────────

function CreateMemberModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'vendor' | 'superadmin'>('vendor')
  const [commissionRate, setCommissionRate] = useState(10)
  const [payoutNotes, setPayoutNotes] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving'); setError(null)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, commissionRate, payoutNotes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create')
        setStatus('error')
        return
      }
      setStatus('saved')
      onCreated()
    } catch {
      setError('Network error')
      setStatus('error')
    }
  }

  return (
    <ModalShell title="Add team member" subtitle="They'll be able to log in and manage their own stock." onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Name">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Bash" className={inputCls} />
        </Field>
        <Field label="Email *">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="bash@lutoncards.co.uk" />
        </Field>
        <Field label="Temporary password * (min 8 chars)">
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required minLength={8}
              className={inputCls + ' pr-9'}
              placeholder="At least 8 characters"
            />
            <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <select value={role} onChange={e => setRole(e.target.value as 'vendor' | 'superadmin')} className={inputCls}>
              <option value="vendor">Vendor</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </Field>
          <Field label="Commission rate (%)">
            <input type="number" min={0} max={100} step={0.5} value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
        <Field label="Payout details (free text)">
          <textarea value={payoutNotes} onChange={e => setPayoutNotes(e.target.value)} rows={3} className={inputCls} placeholder={'PayPal: bash@example.com\nor Bank: 12-34-56 / 12345678'} />
        </Field>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-neutral-800 px-3 py-2 text-[12px] font-bold text-neutral-300">Cancel</button>
          <button type="submit" disabled={status === 'saving'} className="rounded-lg bg-[#EC1E79] px-4 py-2 text-[12px] font-extrabold text-white disabled:opacity-60">
            {status === 'saving' ? 'Creating…' : 'Create member'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ─── Edit modal ────────────────────────────────────────────────────────────

function EditMemberModal({
  member, onClose, onSaved,
}: { member: Member; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(member.name || '')
  const [role, setRole] = useState<'vendor' | 'superadmin'>(member.role)
  const [commissionRate, setCommissionRate] = useState(member.commissionRate)
  const [payoutNotes, setPayoutNotes] = useState(member.payoutNotes || '')
  const [avatarUrl, setAvatarUrl] = useState(member.avatarUrl || '')
  const [active, setActive] = useState(member.active)
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving'); setError(null)
    const body: Record<string, unknown> = {
      name, role, commissionRate, payoutNotes, avatarUrl, active,
    }
    if (newPassword) body.password = newPassword
    const res = await fetch(`/api/admin/members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save')
      setStatus('error')
      return
    }
    setStatus('saved')
    onSaved()
  }

  const hardDelete = async () => {
    if (!confirm(`Disable ${member.email}? Their products stay live and they can no longer log in.`)) return
    await fetch(`/api/admin/members/${member.id}`, { method: 'DELETE' })
    onSaved()
  }

  return (
    <ModalShell title={`Edit ${member.name || member.email}`} subtitle={member.email} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Name">
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <select value={role} onChange={e => setRole(e.target.value as 'vendor' | 'superadmin')} className={inputCls}>
              <option value="vendor">Vendor</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </Field>
          <Field label="Commission rate (%)">
            <input type="number" min={0} max={100} step={0.5} value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
        <Field label="Avatar URL">
          <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className={inputCls} placeholder="/api/uploads/…" />
        </Field>
        <Field label="Payout details">
          <textarea value={payoutNotes} onChange={e => setPayoutNotes(e.target.value)} rows={3} className={inputCls} />
        </Field>
        <Field label="Reset password (optional, min 8)">
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current"
            minLength={8}
            className={inputCls}
          />
        </Field>
        <label className="flex items-center gap-2 text-[13px] text-neutral-300">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
          Account is active
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={hardDelete}
            className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] font-bold text-red-400 hover:bg-red-500/20"
          >
            <Trash2 size={11} /> Disable
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="rounded-lg bg-neutral-800 px-3 py-2 text-[12px] font-bold text-neutral-300">Cancel</button>
            <button type="submit" disabled={status === 'saving'} className="inline-flex items-center gap-1 rounded-lg bg-[#EC1E79] px-4 py-2 text-[12px] font-extrabold text-white disabled:opacity-60">
              {status === 'saved' ? <><Check size={12} /> Saved</> : status === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-[13px] text-white outline-none placeholder:text-neutral-700 focus:border-[#EC1E79]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500">{label}</label>
      {children}
    </div>
  )
}

function ModalShell({
  title, subtitle, children, onClose,
}: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
        className="my-10 w-full max-w-[500px] rounded-2xl border border-neutral-800 bg-[#111] p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="m-0 text-[1.15rem] font-black tracking-[-0.02em] text-white">{title}</h2>
            {subtitle && <p className="m-0 mt-0.5 text-[12px] text-neutral-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-800 hover:text-white">
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
