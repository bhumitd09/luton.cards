'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Check, AlertCircle, Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'

type Member = {
  name: string
  role: string
  bio: string
  tag: string
  photo?: string
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

const MAX_MEMBERS = 8

const DEFAULT_MEMBERS: Member[] = [
  { name: 'Bhumit', role: 'Vintage Pokémon Specialist', tag: 'Base Set & Beyond', photo: '', bio: 'The vintage hunter. Hand picks pre-2003 Pokémon, Base Set holos, gold stars and sealed wax that\'s older than most of the people buying it.' },
  { name: 'Bash', role: 'One Piece Specialist', tag: 'OP-01 to Now', photo: '', bio: 'Lives and breathes One Piece TCG. Knows every set, every alt art, every leader meta. If it\'s an OP card, Bash has an opinion on it.' },
  { name: 'Ramz', role: 'Pokémon & One Piece Specialist', tag: 'Modern Sets Master', photo: '', bio: 'The all rounder. Tracks modern Pokémon sets and One Piece releases side by side. First to know what\'s about to spike.' },
  { name: 'Allan', role: 'Grading & Sealed Specialist', tag: 'PSA · CGC · ACE', photo: '', bio: 'Years of PSA, CGC and ACE submissions plus a sealed vault that\'s the envy of UK collectors. Every slab on the site has been through his hands.' },
]

export default function AdminTeamPage() {
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS)
  const [groupPhoto, setGroupPhoto] = useState<string>('')
  const [groupStatus, setGroupStatus] = useState<Status>('idle')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load team members
    fetch('/api/admin/content/team_members')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(data => {
        if (data?.content?.value) {
          try {
            const parsed = JSON.parse(String(data.content.value))
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMembers(parsed.filter((m: unknown): m is Member => {
                const x = m as Member
                return !!x && typeof x.name === 'string'
              }))
            }
          } catch {}
        }
        setLoading(false)
      })

    // Load group photo (separate fetch, non-blocking)
    fetch('/api/admin/content/about_group_photo')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(data => {
        if (data?.content?.value) {
          setGroupPhoto(String(data.content.value).trim())
        }
      })
  }, [])

  const saveGroupPhoto = async (url: string) => {
    setGroupPhoto(url)
    setGroupStatus('saving')
    try {
      const res = await fetch('/api/admin/content/about_group_photo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: url,
          type: 'text',
          label: 'About: Group Photo',
        }),
      })
      if (!res.ok) {
        setGroupStatus('error')
        return
      }
      setGroupStatus('saved')
      setTimeout(() => setGroupStatus('idle'), 1500)
    } catch {
      setGroupStatus('error')
    }
  }

  const update = (i: number, patch: Partial<Member>) =>
    setMembers(prev => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))

  const remove = (i: number) => setMembers(prev => prev.filter((_, idx) => idx !== i))

  const addMember = () => {
    if (members.length >= MAX_MEMBERS) return
    setMembers(prev => [...prev, { name: '', role: '', bio: '', tag: '', photo: '' }])
  }

  const move = (i: number, dir: -1 | 1) => {
    setMembers(prev => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const handleSave = async () => {
    setStatus('saving')
    setError(null)

    const cleaned = members
      .map(m => ({
        name: m.name.trim(),
        role: m.role.trim(),
        bio: m.bio.trim(),
        tag: m.tag.trim(),
        photo: (m.photo || '').trim(),
      }))
      .filter(m => m.name)

    for (const m of cleaned) {
      if (!m.role) {
        setError(`"${m.name}" is missing a role.`)
        setStatus('error')
        return
      }
    }

    try {
      const res = await fetch('/api/admin/content/team_members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: JSON.stringify(cleaned),
          type: 'json',
          label: 'Team Members',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(`Save failed (HTTP ${res.status}): ${data?.error || 'unknown'}`)
        setStatus('error')
        return
      }
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1800)
    } catch {
      setError('Network error. Try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="m-0 mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#EC1E79]">
              <Users size={11} /> Content
            </p>
            <h1 className="m-0 text-[1.6rem] font-black tracking-[-0.025em]">Team / About Page</h1>
            <p className="m-0 mt-1 text-sm text-neutral-400">
              Manage the founders shown on the public About page. Up to {MAX_MEMBERS}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status === 'saved' && (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-400">
                <Check size={13} /> Saved
              </span>
            )}
            <button
              onClick={addMember}
              disabled={members.length >= MAX_MEMBERS}
              className="inline-flex items-center gap-1 rounded-lg bg-neutral-800 px-3 py-2 text-[12px] font-bold text-neutral-200 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={12} /> Add member
            </button>
            <button
              onClick={handleSave}
              disabled={status === 'saving' || loading}
              className="rounded-xl bg-[#EC1E79] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_6px_18px_-6px_rgba(236,30,121,0.55)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Group photo card (separate from member grid) */}
        <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="m-0 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#EC1E79]">
                <ImageIcon size={11} /> About Page
              </p>
              <h2 className="m-0 mt-1 text-[1.05rem] font-black tracking-[-0.02em]">Group Photo</h2>
              <p className="m-0 mt-1 text-[12.5px] text-neutral-500">
                Shown in the About hero. Landscape 5:4 works best. Replace any time.
              </p>
            </div>
            {groupStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-400">
                <Check size={13} /> Saved
              </span>
            )}
            {groupStatus === 'saving' && (
              <span className="text-[12px] font-bold text-neutral-400">Saving…</span>
            )}
            {groupStatus === 'error' && (
              <span className="text-[12px] font-bold text-red-400">Save failed</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[280px_1fr]">
            <div>
              {groupPhoto ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={groupPhoto}
                    alt="Group"
                    className="aspect-[5/4] w-full rounded-xl border border-neutral-800 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => saveGroupPhoto('')}
                    className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-red-500 text-white"
                    title="Remove photo"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950">
                  <ImageUploader
                    images={[]}
                    onChange={imgs => imgs[0] && saveGroupPhoto(imgs[0])}
                    max={1}
                    label=""
                  />
                </div>
              )}
            </div>
            <div className="text-[13px] leading-[1.6] text-neutral-400">
              <p className="m-0 mb-2 font-bold text-neutral-200">Tips</p>
              <ul className="m-0 space-y-1.5 pl-4">
                <li>Use a landscape shot of all four together if you can.</li>
                <li>Aspect ratio: roughly 5:4 (e.g. 1400×1120). Anything wider crops top/bottom.</li>
                <li>Front-lit, bright, decent resolution. JPG or PNG up to 5 MB.</li>
                <li>This image is public the moment you upload it.</li>
              </ul>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[380px] animate-pulse rounded-2xl bg-neutral-900/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AnimatePresence initial={false}>
              {members.map((m, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4"
                >
                  {/* Card header: position + actions */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      <GripVertical size={12} />
                      Position {i + 1}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        title="Move up"
                        className="rounded-md p-1 text-neutral-600 hover:bg-neutral-800 hover:text-[#EC1E79] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === members.length - 1}
                        title="Move down"
                        className="rounded-md p-1 text-neutral-600 hover:bg-neutral-800 hover:text-[#EC1E79] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        title="Remove"
                        className="ml-1 rounded-md bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Two-column layout: photo + fields */}
                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    {/* Photo */}
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500">
                        Photo
                      </label>
                      {m.photo ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.photo}
                            alt={m.name}
                            className="aspect-square w-full rounded-xl border border-neutral-800 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => update(i, { photo: '' })}
                            className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-red-500 text-white"
                            title="Remove photo"
                          >
                            <Trash2 size={9} />
                          </button>
                        </div>
                      ) : (
                        <SinglePhotoUploader
                          value=""
                          onChange={url => update(i, { photo: url })}
                        />
                      )}
                    </div>

                    {/* Fields */}
                    <div className="flex min-w-0 flex-col gap-2">
                      <Input
                        label="Name *"
                        value={m.name}
                        onChange={v => update(i, { name: v })}
                        placeholder="Bhumit"
                      />
                      <Input
                        label="Role *"
                        value={m.role}
                        onChange={v => update(i, { role: v })}
                        placeholder="Co-Founder & Developer"
                      />
                      <Input
                        label="Tag (small badge)"
                        value={m.tag}
                        onChange={v => update(i, { tag: v })}
                        placeholder="Tech & Operations"
                        maxLength={32}
                      />
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500">
                          Bio
                        </label>
                        <textarea
                          value={m.bio}
                          onChange={e => update(i, { bio: e.target.value })}
                          placeholder="Short bio (1–2 sentences)"
                          rows={3}
                          maxLength={400}
                          className="w-full resize-y rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-[12px] leading-[1.5] text-neutral-100 outline-none transition-colors placeholder:text-neutral-700 focus:border-[#EC1E79]"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500">
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-[12.5px] font-medium text-white outline-none transition-colors placeholder:text-neutral-700 focus:border-[#EC1E79]"
      />
    </div>
  )
}

/** Wraps the existing ImageUploader for single-image use. */
function SinglePhotoUploader({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const images = value ? [value] : []
  return (
    <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950">
      <ImageUploader
        images={images}
        onChange={imgs => onChange(imgs[0] || '')}
        max={1}
        label=""
      />
    </div>
  )
}
