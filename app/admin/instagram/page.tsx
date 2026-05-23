'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Instagram, Plus, Trash2, GripVertical, Check, AlertCircle, ExternalLink, Image as ImageIcon } from 'lucide-react'

type IGPost = {
  url: string
  image: string
  caption?: string
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

const MAX_POSTS = 8

export default function AdminInstagramPage() {
  const [handle, setHandle] = useState('')
  const [posts, setPosts] = useState<IGPost[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content/instagram_handle').then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/admin/content/instagram_posts').then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([handleRes, postsRes]) => {
        if (handleRes?.value) setHandle(String(handleRes.value).replace(/^@/, ''))
        if (postsRes?.value) {
          try {
            const parsed = JSON.parse(String(postsRes.value))
            if (Array.isArray(parsed)) {
              setPosts(parsed.filter(p => p && typeof p.url === 'string'))
            }
          } catch {
            // ignore
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const updatePost = (i: number, patch: Partial<IGPost>) => {
    setPosts(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  const removePost = (i: number) => setPosts(prev => prev.filter((_, idx) => idx !== i))
  const addPost = () => {
    if (posts.length >= MAX_POSTS) return
    setPosts(prev => [...prev, { url: '', image: '', caption: '' }])
  }
  const movePost = (i: number, dir: -1 | 1) => {
    setPosts(prev => {
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

    // Validate
    const cleanedPosts = posts
      .map(p => ({ url: p.url.trim(), image: p.image.trim(), caption: (p.caption || '').trim() }))
      .filter(p => p.url || p.image)
    for (const p of cleanedPosts) {
      if (!p.url || !p.image) {
        setError('Each post needs both an Instagram URL and an image URL.')
        setStatus('error')
        return
      }
      if (!p.url.startsWith('http')) {
        setError(`Invalid Instagram URL: "${p.url}"`)
        setStatus('error')
        return
      }
      if (!p.image.startsWith('http')) {
        setError(`Invalid image URL: "${p.image}"`)
        setStatus('error')
        return
      }
    }

    try {
      await Promise.all([
        fetch('/api/admin/content/instagram_handle', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: handle.replace(/^@/, '').trim(), type: 'text', label: 'Instagram Handle' }),
        }),
        fetch('/api/admin/content/instagram_posts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: JSON.stringify(cleanedPosts), type: 'json', label: 'Instagram Posts' }),
        }),
      ])
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1800)
    } catch {
      setError('Failed to save. Try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* header */}
        <div className="mb-7 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="m-0 mb-2 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#EC1E79]">
              <Instagram size={11} /> Content
            </p>
            <h1 className="m-0 text-[1.85rem] font-black tracking-[-0.025em]">Instagram Feed</h1>
            <p className="m-0 mt-1.5 text-sm text-neutral-400">
              Curate which Instagram posts appear on the homepage. Up to {MAX_POSTS} posts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status === 'saved' && (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-400">
                <Check size={13} /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={status === 'saving' || loading}
              className="rounded-xl bg-[#EC1E79] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_24px_-8px_rgba(236,30,121,0.55)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              {status === 'saving' ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* left: form */}
          <div className="flex flex-col gap-5">
            {/* handle */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
                Instagram Handle (used for the &ldquo;Follow&rdquo; button)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 focus-within:border-[#EC1E79]">
                <span className="text-base font-bold text-neutral-500">@</span>
                <input
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder="lutoncards"
                  className="flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-neutral-700"
                />
              </div>
              {handle && (
                <a
                  href={`https://instagram.com/${handle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-bold text-[#EC1E79] transition-colors hover:text-[#FF80B8]"
                >
                  <ExternalLink size={11} /> instagram.com/{handle.replace(/^@/, '')}
                </a>
              )}
            </div>

            {/* posts list */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="m-0 text-[12px] font-bold uppercase tracking-[0.1em] text-neutral-300">
                  Posts ({posts.length}/{MAX_POSTS})
                </h2>
                <button
                  onClick={addPost}
                  disabled={posts.length >= MAX_POSTS}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#EC1E79]/15 px-2.5 py-1 text-[11px] font-bold text-[#EC1E79] transition-colors hover:bg-[#EC1E79]/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={11} /> Add Post
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-[120px] animate-pulse rounded-xl bg-neutral-800/40" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-800 px-6 py-12 text-center">
                  <Instagram size={28} className="mx-auto mb-3 text-neutral-600" />
                  <p className="m-0 text-sm font-bold text-neutral-400">No posts added yet</p>
                  <p className="m-0 mt-1 text-xs text-neutral-500">
                    Click &ldquo;Add Post&rdquo; to curate what appears on the homepage.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {posts.map((post, i) => (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="grid grid-cols-[24px_72px_1fr_auto] items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3"
                      >
                        {/* reorder */}
                        <div className="flex flex-col items-center gap-0.5 pt-1.5">
                          <button
                            type="button"
                            onClick={() => movePost(i, -1)}
                            disabled={i === 0}
                            className="text-neutral-600 hover:text-[#EC1E79] disabled:cursor-not-allowed disabled:opacity-30"
                            title="Move up"
                          >
                            ▲
                          </button>
                          <GripVertical size={11} className="text-neutral-700" />
                          <button
                            type="button"
                            onClick={() => movePost(i, 1)}
                            disabled={i === posts.length - 1}
                            className="text-neutral-600 hover:text-[#EC1E79] disabled:cursor-not-allowed disabled:opacity-30"
                            title="Move down"
                          >
                            ▼
                          </button>
                        </div>

                        {/* preview */}
                        <div className="flex aspect-square size-[72px] items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
                          {post.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.image} alt="Preview" className="size-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-neutral-700" />
                          )}
                        </div>

                        {/* inputs */}
                        <div className="space-y-2">
                          <input
                            value={post.url}
                            onChange={e => updatePost(i, { url: e.target.value })}
                            placeholder="https://www.instagram.com/p/SHORTCODE/"
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-[12px] font-medium text-white outline-none transition-colors placeholder:text-neutral-700 focus:border-[#EC1E79]"
                          />
                          <input
                            value={post.image}
                            onChange={e => updatePost(i, { image: e.target.value })}
                            placeholder="Image URL (.jpg / .png) — Cloudinary or any CDN"
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-[12px] font-medium text-white outline-none transition-colors placeholder:text-neutral-700 focus:border-[#EC1E79]"
                          />
                          <input
                            value={post.caption || ''}
                            onChange={e => updatePost(i, { caption: e.target.value })}
                            placeholder="Optional caption (shown on hover)"
                            maxLength={150}
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-[12px] text-neutral-200 outline-none transition-colors placeholder:text-neutral-700 focus:border-[#EC1E79]"
                          />
                        </div>

                        {/* delete */}
                        <button
                          type="button"
                          onClick={() => removePost(i)}
                          className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* right: cheatsheet */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h3 className="m-0 mb-3 text-[12px] font-extrabold uppercase tracking-[0.1em] text-neutral-300">
                How to use
              </h3>
              <ol className="m-0 list-decimal space-y-2.5 pl-4 text-[12.5px] leading-[1.55] text-neutral-400">
                <li>Open an Instagram post on the web (instagram.com/p/...) and copy the URL.</li>
                <li>
                  Get the image: right-click the post image → &ldquo;Copy image address&rdquo;. Or upload to Cloudinary via the
                  Media tab and paste that URL.
                </li>
                <li>Optionally add a short caption (shown on hover).</li>
                <li>Save. Posts appear on the homepage Instagram section in the order shown here.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h3 className="m-0 mb-2 text-[12px] font-extrabold uppercase tracking-[0.1em] text-neutral-300">
                Why manual?
              </h3>
              <p className="m-0 text-[12.5px] leading-[1.55] text-neutral-400">
                Instagram&apos;s API requires OAuth tokens and weekly re-auth. Manual curation is more
                reliable and lets you pick your <em>best</em> posts instead of just the latest.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
