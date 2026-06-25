'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Package, Loader2, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
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

function SearchContent() {
  const params = useSearchParams()
  const router = useRouter()
  const q = params.get('q') || ''
  const [results, setResults] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState(q)

  useEffect(() => { setInput(q) }, [q])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}&full=1`)
      .then(r => r.json())
      .then(data => {
        setResults(Array.isArray(data.results) ? data.results : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [q])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) router.push(`/search?q=${encodeURIComponent(input.trim())}`)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fafafa]">
        {/* Hero strip */}
        <section className="border-b border-neutral-200 bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-[1180px] px-6">
            <Link
              href="/products"
              className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-[#EC1E79]"
            >
              <ArrowLeft size={11} /> All products
            </Link>
            <h1 className="m-0 mb-1 text-[clamp(1.5rem,3vw,2.1rem)] font-black tracking-[-0.025em] text-neutral-900">
              Search
            </h1>
            <p className="m-0 mb-5 text-sm text-neutral-500">
              {q ? <>Results for <span className="font-bold text-neutral-900">&ldquo;{q}&rdquo;</span></> : 'What are you looking for?'}
            </p>
            <form onSubmit={submit} className="flex items-center gap-2 rounded-full border-2 border-neutral-200 bg-neutral-50 px-4 py-2.5 focus-within:border-[#EC1E79] focus-within:bg-white focus-within:shadow-[0_4px_18px_-6px_rgba(236,30,121,0.3)]">
              <Search size={16} className="text-neutral-400" />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Search cards, sets, grades…"
                autoFocus
                className="w-full bg-transparent text-[15px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              {input && (
                <button
                  type="submit"
                  className="rounded-full bg-[#EC1E79] px-4 py-1.5 text-[12px] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(236,30,121,0.55)] transition-transform hover:-translate-y-0.5"
                >
                  Go
                </button>
              )}
            </form>
          </div>
        </section>

        {/* Results */}
        <section className="mx-auto max-w-[1180px] px-6 py-10">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-neutral-500">
              <Loader2 size={16} className="animate-spin" /> Searching…
            </div>
          ) : !q ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center">
              <Search size={32} className="mx-auto mb-3 text-neutral-300" />
              <p className="m-0 text-sm font-bold text-neutral-600">Start typing above to search</p>
              <p className="m-0 mt-1 text-xs text-neutral-400">Card name, set, grade, or anything that comes to mind</p>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center">
              <Package size={32} className="mx-auto mb-3 text-neutral-300" />
              <p className="m-0 text-sm font-bold text-neutral-600">No matches for &ldquo;{q}&rdquo;</p>
              <p className="m-0 mt-1 text-xs text-neutral-400">Try a different name, set, grade, or check spelling</p>
              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#EC1E79] px-5 py-2 text-xs font-extrabold text-white"
              >
                Browse all products
              </Link>
            </div>
          ) : (
            <>
              <p className="m-0 mb-5 text-sm text-neutral-500">
                <span className="font-bold text-neutral-900">{results.length}</span>{' '}
                {results.length === 1 ? 'result' : 'results'}
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {results.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
                  >
                    <Link
                      href={`/products/${r.id}`}
                      className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(236,30,121,0.3)]"
                    >
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.image}
                            alt={r.name}
                            className="aspect-[4/3] size-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <Package size={32} className="text-neutral-300" />
                        )}
                        {formatGrade(r.grade, r.grader) && (
                          <span className="absolute left-2 top-2 rounded-md bg-black px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#EC1E79]">
                            {formatGrade(r.grade, r.grader)}
                          </span>
                        )}
                        {r.stock === 0 && (
                          <span className="absolute right-2 top-2 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                            Sold out
                          </span>
                        )}
                      </div>
                      <div className="p-3.5">
                        <p className="m-0 mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                          {r.game === 'one-piece' ? 'One Piece' : 'Pokémon'} · {r.category}
                        </p>
                        <h3 className="m-0 mb-2 line-clamp-2 text-sm font-bold leading-snug text-neutral-900">
                          {highlightMatch(r.name, q)}
                        </h3>
                        <p className="m-0 text-lg font-black tracking-tight text-[#EC1E79]">
                          £{r.price.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
          <Loader2 size={20} className="animate-spin text-[#EC1E79]" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
