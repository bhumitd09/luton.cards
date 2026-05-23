'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Download, Copy, Check } from 'lucide-react'

type Format = 'csv' | 'json'
type Mode = 'create' | 'upsert'

type ImportResult = {
  ok: boolean
  created: number
  updated: number
  skipped: number
  errors: { row: number; name?: string; message: string }[]
}

const CSV_TEMPLATE = `name,game,category,price,stock,grade,grader,featured,active,description,image
Charizard ex Full Art,pokemon,single,180,2,,,true,true,"151 set, mint condition",https://example.com/charizard.jpg
Lugia VSTAR (PSA 10),pokemon,graded,420,1,PSA 10,PSA,true,true,Silver Tempest 213/195,
Romance Dawn Booster Box,one-piece,booster,180,3,,,false,true,OP-01 sealed,
Luffy Leader Alt Art,one-piece,single,120,1,,,true,true,OP-01-001 P-001,`

const JSON_TEMPLATE = `[
  {
    "name": "Charizard ex Full Art",
    "game": "pokemon",
    "category": "single",
    "price": 180,
    "stock": 2,
    "featured": true,
    "description": "151 set, mint condition",
    "images": ["https://example.com/charizard.jpg"]
  },
  {
    "name": "Lugia VSTAR (PSA 10)",
    "game": "pokemon",
    "category": "graded",
    "price": 420,
    "stock": 1,
    "grade": "PSA 10",
    "grader": "PSA",
    "featured": true,
    "description": "Silver Tempest 213/195"
  },
  {
    "name": "Romance Dawn Booster Box",
    "game": "one-piece",
    "category": "booster",
    "price": 180,
    "stock": 3
  }
]`

export default function AdminImportPage() {
  const [format, setFormat] = useState<Format>('csv')
  const [mode, setMode] = useState<Mode>('upsert')
  const [data, setData] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const template = format === 'csv' ? CSV_TEMPLATE : JSON_TEMPLATE

  const loadTemplate = () => {
    setData(template)
    setError(null)
    setResult(null)
  }

  const copyTemplate = async () => {
    await navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.trim()) {
      setError('Paste some data first.')
      return
    }
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, mode, data }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `Request failed (${res.status})`)
      } else {
        setResult(json)
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setData('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* header */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/products"
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-[#EC1E79]"
            >
              <ArrowLeft size={13} /> Back to Products
            </Link>
            <h1 className="m-0 text-[1.85rem] font-black tracking-[-0.025em]">Bulk Import Products</h1>
            <p className="m-0 mt-1.5 text-sm text-neutral-400">
              Paste a CSV or JSON list of cards to add them all in one go. Up to 500 per import.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* left: form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* format + mode pills */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Format">
                  <div className="flex gap-2">
                    <PillButton active={format === 'csv'} onClick={() => setFormat('csv')}>
                      CSV
                    </PillButton>
                    <PillButton active={format === 'json'} onClick={() => setFormat('json')}>
                      JSON
                    </PillButton>
                  </div>
                </Field>
                <Field label="On conflict">
                  <div className="flex gap-2">
                    <PillButton active={mode === 'upsert'} onClick={() => setMode('upsert')}>
                      Update if exists
                    </PillButton>
                    <PillButton active={mode === 'create'} onClick={() => setMode('create')}>
                      Skip if exists
                    </PillButton>
                  </div>
                </Field>
              </div>
            </div>

            {/* paste box */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                  Paste {format.toUpperCase()} here
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={loadTemplate}
                    className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    <Download size={11} /> Load template
                  </button>
                  <button
                    type="button"
                    onClick={copyTemplate}
                    className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy template'}
                  </button>
                </div>
              </div>
              <textarea
                value={data}
                onChange={e => setData(e.target.value)}
                placeholder={template}
                spellCheck={false}
                className="block w-full resize-y rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-3 font-mono text-[12.5px] leading-[1.55] text-neutral-200 outline-none transition-colors placeholder:text-neutral-700 focus:border-[#EC1E79]"
                style={{ minHeight: 320 }}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#EC1E79]/15 text-[#EC1E79]">
                      <CheckCircle2 size={18} />
                    </div>
                    <h3 className="m-0 text-base font-extrabold tracking-[-0.01em]">Import complete</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <Stat label="Created" value={result.created} color="text-emerald-400" />
                    <Stat label="Updated" value={result.updated} color="text-blue-400" />
                    <Stat label="Skipped" value={result.skipped} color="text-amber-400" />
                  </div>
                  {result.errors.length > 0 && (
                    <details className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3" open>
                      <summary className="cursor-pointer text-[12px] font-bold uppercase tracking-[0.08em] text-amber-300">
                        {result.errors.length} {result.errors.length === 1 ? 'error' : 'errors'} (click to expand)
                      </summary>
                      <ul className="mt-2.5 max-h-[260px] overflow-y-auto text-[12.5px] text-amber-200/90">
                        {result.errors.map((err, i) => (
                          <li key={i} className="border-t border-amber-500/10 py-1.5 first:border-t-0">
                            <span className="font-mono text-amber-400">Row {err.row}</span>
                            {err.name && <span className="ml-1 text-amber-300/80">· {err.name}</span>}
                            <span className="ml-1.5 text-amber-100/90">— {err.message}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="mt-5 flex gap-2">
                    <Link
                      href="/admin/products"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#EC1E79] px-4 py-2 text-[13px] font-extrabold text-white transition-colors hover:bg-[#c81c6b]"
                    >
                      View Products
                    </Link>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 px-4 py-2 text-[13px] font-bold text-neutral-300 transition-colors hover:bg-neutral-800"
                    >
                      Import another batch
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!result && (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EC1E79] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_8px_24px_-8px_rgba(236,30,121,0.55)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? (
                  <>Importing…</>
                ) : (
                  <>
                    <Upload size={15} /> Import {data.trim() ? `(${countRows(data, format)} rows)` : ''}
                  </>
                )}
              </button>
            )}
          </form>

          {/* right: cheatsheet */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <div className="mb-3 flex items-center gap-2">
                <FileText size={14} className="text-[#EC1E79]" />
                <h3 className="m-0 text-[12px] font-extrabold uppercase tracking-[0.1em] text-neutral-300">
                  Field reference
                </h3>
              </div>
              <dl className="space-y-2.5 text-[12.5px]">
                <FieldRef name="name" required>Product display name</FieldRef>
                <FieldRef name="price" required>Number, in GBP (no £ symbol needed)</FieldRef>
                <FieldRef name="game">pokemon (default) or one-piece</FieldRef>
                <FieldRef name="category">single (default), graded, booster, sealed</FieldRef>
                <FieldRef name="stock">Integer, defaults to 0</FieldRef>
                <FieldRef name="grade">e.g. &ldquo;PSA 10&rdquo;</FieldRef>
                <FieldRef name="grader">PSA, CGC, ACE, BGS</FieldRef>
                <FieldRef name="featured">true / false</FieldRef>
                <FieldRef name="active">true (default) / false</FieldRef>
                <FieldRef name="description">Free text</FieldRef>
                <FieldRef name="image">Single image URL (CSV)</FieldRef>
                <FieldRef name="images">Array of URLs (JSON) or pipe-separated (CSV)</FieldRef>
                <FieldRef name="tags">Comma or pipe-separated</FieldRef>
                <FieldRef name="slug">Auto-generated from name if omitted</FieldRef>
              </dl>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h3 className="m-0 mb-2 text-[12px] font-extrabold uppercase tracking-[0.1em] text-neutral-300">
                On conflict
              </h3>
              <p className="m-0 mb-3 text-[12.5px] leading-[1.55] text-neutral-400">
                Products are matched by <span className="font-mono text-neutral-300">slug</span>.
              </p>
              <ul className="space-y-1.5 text-[12.5px] text-neutral-400">
                <li>
                  <span className="font-bold text-emerald-400">Update if exists</span> — re-importing the same
                  cards updates price/stock/etc.
                </li>
                <li>
                  <span className="font-bold text-amber-400">Skip if exists</span> — only creates new ones,
                  duplicates fail.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">{label}</span>
      {children}
    </div>
  )
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition-colors',
        active
          ? 'bg-[#EC1E79] text-white shadow-[0_4px_14px_-4px_rgba(236,30,121,0.55)]'
          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-4">
      <div className={`text-[1.75rem] font-black tracking-[-0.03em] ${color}`}>{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500">{label}</div>
    </div>
  )
}

function FieldRef({
  name,
  required,
  children,
}: {
  name: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-2">
      <code className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[11.5px] text-[#EC1E79]">{name}</code>
      {required && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">req</span>}
      <span className="text-neutral-400">— {children}</span>
    </div>
  )
}

function countRows(data: string, format: Format): number {
  if (format === 'csv') {
    const lines = data.split(/\r?\n/).filter(l => l.trim().length > 0)
    return Math.max(0, lines.length - 1)
  }
  try {
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}
