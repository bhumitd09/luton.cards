'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, Package } from 'lucide-react'
import { formatGrade } from '@/lib/utils'
import { highlightMatch } from '@/lib/highlight'

type SearchHit = {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  category: string
  game: string
  grade: string | null
  grader: string | null
  image: string
}

type Variant = 'header' | 'mobile'

export function SearchBar({ variant = 'header', onNavigate }: { variant?: Variant; onNavigate?: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(Array.isArray(data.results) ? data.results : [])
      setHighlighted(0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (open) fetchResults(query)
    }, 200)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query, open, fetchResults])

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Keyboard: ↑↓ to navigate, Enter to go, Esc to close
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(i => Math.min(i + 1, results.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted < results.length) {
        navigateTo(`/products/${results[highlighted].id}`)
      } else {
        submitFullSearch()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const submitFullSearch = () => {
    if (!query.trim()) return
    navigateTo(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const navigateTo = (href: string) => {
    setOpen(false)
    setQuery('')
    onNavigate?.()
    router.push(href)
  }

  const widthClass = variant === 'mobile' ? 'w-full' : 'w-[260px] focus-within:w-[340px]'

  return (
    <div ref={containerRef} className="relative">
      <div
        className={[
          'group flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-2 transition-all',
          widthClass,
          open ? '!border-[#EC1E79] !bg-white shadow-[0_4px_18px_-6px_rgba(236,30,121,0.3)]' : '',
        ].join(' ')}
      >
        <Search size={15} className="shrink-0 text-neutral-400 group-focus-within:text-[#EC1E79]" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search cards…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setOpen(true); fetchResults(query) }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-[13.5px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-700"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className={[
              'absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]',
              variant === 'mobile' ? '' : 'min-w-[340px]',
            ].join(' ')}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-[12.5px] text-neutral-500">
                <Loader2 size={13} className="animate-spin" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Package size={22} className="mx-auto mb-2 text-neutral-300" />
                <p className="m-0 text-[13px] font-bold text-neutral-700">
                  {query.trim() ? `No matches for "${query}"` : 'Start typing to search'}
                </p>
                {query.trim() && (
                  <p className="m-0 mt-1 text-[11.5px] text-neutral-400">Try a different name, set, or grade</p>
                )}
              </div>
            ) : (
              <>
                <div className="max-h-[420px] overflow-y-auto py-1.5">
                  {results.map((r, i) => (
                    <Link
                      key={r.id}
                      href={`/products/${r.id}`}
                      onClick={() => navigateTo(`/products/${r.id}`)}
                      onMouseEnter={() => setHighlighted(i)}
                      className={[
                        'flex items-center gap-3 px-3 py-2 transition-colors',
                        highlighted === i ? 'bg-[#fff0f7]' : 'hover:bg-neutral-50',
                      ].join(' ')}
                    >
                      <div className="flex aspect-square size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image} alt={r.name} className="size-full object-cover" />
                        ) : (
                          <Package size={16} className="text-neutral-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[13px] font-bold text-neutral-900">{highlightMatch(r.name, query)}</p>
                        <p className="m-0 mt-0.5 text-[11px] text-neutral-500">
                          {r.game === 'one-piece' ? 'One Piece' : 'Pokémon'} · {r.category}
                          {formatGrade(r.grade, r.grader) ? ` · ${formatGrade(r.grade, r.grader)}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="m-0 text-[13px] font-extrabold text-[#EC1E79]">£{r.price.toLocaleString()}</p>
                        <p
                          className={[
                            'm-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider',
                            r.stock === 0 ? 'text-red-500' : r.stock <= 2 ? 'text-amber-500' : 'text-emerald-500',
                          ].join(' ')}
                        >
                          {r.stock === 0 ? 'Sold out' : r.stock <= 2 ? `${r.stock} left` : 'In stock'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* See all results footer */}
                {query.trim() && (
                  <button
                    type="button"
                    onMouseEnter={() => setHighlighted(results.length)}
                    onClick={submitFullSearch}
                    className={[
                      'flex w-full items-center justify-center gap-1.5 border-t border-neutral-100 px-4 py-3 text-[12px] font-bold transition-colors',
                      highlighted === results.length
                        ? 'bg-[#EC1E79] text-white'
                        : 'text-[#EC1E79] hover:bg-[#fff0f7]',
                    ].join(' ')}
                  >
                    See all results for &ldquo;{query.trim()}&rdquo;
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
