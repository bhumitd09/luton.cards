'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Instagram, Plus, Trash2, GripVertical, Check, AlertCircle, ExternalLink, Image as ImageIcon, Key, RefreshCw, Zap } from 'lucide-react'

type IGPost = {
  url: string
  image: string
  caption?: string
}

type Status = 'idle' | 'saving' | 'saved' | 'error'
type Source = 'graph' | 'manual' | 'empty'

type Diagnostic = {
  ok: boolean
  step: 'no-token' | 'profile' | 'media' | 'success'
  message?: string
  profile?: {
    id?: string
    username?: string
    account_type?: string
    media_count?: number
    name?: string
  }
  postsReturned?: number
  rawProfileResponse?: unknown
  rawMediaResponse?: unknown
}

const MAX_POSTS = 12

export default function AdminInstagramPage() {
  const [handle, setHandle] = useState('')
  const [token, setToken] = useState('')
  const [tokenRefreshedAt, setTokenRefreshedAt] = useState<string | null>(null)
  const [posts, setPosts] = useState<IGPost[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [previewPosts, setPreviewPosts] = useState<IGPost[] | null>(null)
  const [previewSource, setPreviewSource] = useState<Source | null>(null)
  const [testing, setTesting] = useState(false)
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content/instagram_handle').then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/admin/content/instagram_access_token').then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/admin/content/instagram_token_refreshed_at').then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/admin/content/instagram_posts').then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([h, t, r, p]) => {
        if (h?.value) setHandle(String(h.value).replace(/^@/, ''))
        if (t?.value) setToken(String(t.value))
        if (r?.value) setTokenRefreshedAt(String(r.value))
        if (p?.value) {
          try {
            const parsed = JSON.parse(String(p.value))
            if (Array.isArray(parsed)) setPosts(parsed.filter(x => x && typeof x.url === 'string'))
          } catch {}
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const testConnection = async () => {
    setTesting(true)
    setError(null)
    setPreviewPosts(null)
    setPreviewSource(null)
    setDiagnostic(null)
    try {
      // Run both in parallel: public feed + admin diagnostic
      const [feedRes, diagRes] = await Promise.all([
        fetch('/api/instagram', { cache: 'no-store' }),
        fetch('/api/admin/instagram/diagnose', { cache: 'no-store' }),
      ])
      if (feedRes.ok) {
        const data = await feedRes.json()
        setPreviewPosts(Array.isArray(data.posts) ? data.posts : [])
        setPreviewSource(data.source as Source)
      }
      if (diagRes.ok) {
        const diag = await diagRes.json() as Diagnostic
        setDiagnostic(diag)
      }
    } catch {
      setError('Could not reach /api/instagram')
    } finally {
      setTesting(false)
    }
  }

  const updatePost = (i: number, patch: Partial<IGPost>) =>
    setPosts(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  const removePost = (i: number) => setPosts(prev => prev.filter((_, idx) => idx !== i))
  const addPost = () => posts.length < MAX_POSTS && setPosts(prev => [...prev, { url: '', image: '', caption: '' }])
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
    const cleanedPosts = posts
      .map(p => ({ url: p.url.trim(), image: p.image.trim(), caption: (p.caption || '').trim() }))
      .filter(p => p.url || p.image)
    for (const p of cleanedPosts) {
      if (!p.url || !p.image) {
        setError('Each manual post needs both Instagram URL and image URL.')
        setStatus('error')
        return
      }
    }
    try {
      const writes = [
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
      ]
      // Only write the token if it's been touched (avoid storing whitespace).
      // Uses the dedicated /api/admin/instagram/token route — the generic
      // content endpoint blocks token-like keys as "sensitive".
      if (token.trim()) {
        writes.push(
          fetch('/api/admin/instagram/token', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token.trim() }),
          }),
        )
      }
      const responses = await Promise.all(writes)
      const failed = responses.filter(r => !r.ok)
      if (failed.length > 0) {
        const first = failed[0]
        const body = await first.json().catch(() => ({}))
        setError(`Save failed (HTTP ${first.status}): ${body?.error || 'unknown error'}`)
        setStatus('error')
        return
      }
      setStatus('saved')
      setTokenRefreshedAt(token.trim() ? new Date().toISOString() : tokenRefreshedAt)
      setTimeout(() => setStatus('idle'), 1800)
    } catch {
      setError('Save failed. Network error.')
      setStatus('error')
    }
  }

  const sourceLabel = previewSource === 'graph' ? 'Live from Instagram (Graph API)' : previewSource === 'manual' ? 'Manual posts (fallback)' : 'No posts found'

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* header */}
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="m-0 mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#EC1E79]">
              <Instagram size={11} /> Content
            </p>
            <h1 className="m-0 text-[clamp(1.4rem,2.5vw,1.75rem)] font-black tracking-[-0.025em] text-[#f4f4f5]">Instagram Feed</h1>
            <p className="m-0 mt-1 text-[0.875rem] text-[#9ca3af]">
              Connect Instagram for auto-sync, or curate posts manually as a fallback.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status === 'saved' && (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#10b981]">
                <Check size={13} /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={status === 'saving' || loading}
              className="rounded-[11px] px-5 py-2.5 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)', fontWeight: 800, boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)' }}
            >
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          {/* left: forms */}
          <div className="flex flex-col gap-4">
            {/* Handle */}
            <Card>
              <Label>Instagram Handle</Label>
              <div className="mt-1.5 flex items-center gap-2 rounded-[11px] border border-[#202022] bg-[#0c0c0d] px-3 py-2">
                <span className="text-base font-bold text-[#6b7280]">@</span>
                <input
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder="lutoncards"
                  className="flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-[#6b7280]"
                />
              </div>
              {handle && (
                <a
                  href={`https://instagram.com/${handle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#EC1E79] hover:text-[#FF4DA6]"
                >
                  <ExternalLink size={11} /> instagram.com/{handle.replace(/^@/, '')}
                </a>
              )}
            </Card>

            {/* Auto-sync via Meta Graph API */}
            <Card accent>
              <div className="mb-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[#EC1E79]" />
                  <h3 className="m-0 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                    Auto-sync (Meta Graph API)
                  </h3>
                </div>
                {token && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#10b981]"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
                  >
                    <span className="size-1.5 rounded-full bg-[#10b981]" /> Connected
                  </span>
                )}
              </div>
              <p className="m-0 mb-3 text-[12.5px] leading-[1.55] text-[#9ca3af]">
                Paste a long-lived Instagram access token. Your homepage auto-updates with the latest posts.
                Tokens last 60 days — we auto-refresh after 50 days, no action needed.
              </p>
              <Label>Access token</Label>
              <div className="relative mt-1.5">
                <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <input
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="IGQVJ..."
                  className="w-full rounded-[11px] border border-[#202022] bg-[#0c0c0d] px-3 py-2.5 pl-9 text-[13px] font-mono text-white outline-none placeholder:text-[#6b7280]"
                />
              </div>
              {tokenRefreshedAt && (
                <p className="m-0 mt-2 flex items-center gap-1 text-[11px] text-[#6b7280]">
                  <RefreshCw size={10} /> Last refreshed {new Date(tokenRefreshedAt).toLocaleDateString('en-GB')}
                </p>
              )}

              <button
                onClick={testConnection}
                disabled={testing || loading}
                className="mt-3 inline-flex items-center gap-1.5 rounded-[11px] border border-[#202022] bg-[#161617] px-3 py-1.5 text-[12px] font-bold text-[#e4e4e7] transition-colors hover:bg-[#1c1c1e] disabled:opacity-50"
              >
                {testing ? 'Testing…' : 'Test live feed'}
              </button>

              <AnimatePresence>
                {previewPosts && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 rounded-[12px] border border-[#202022] bg-[#161617] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                        Source: <span className="text-[#EC1E79]">{sourceLabel}</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#6b7280]">
                        {previewPosts.length} posts
                      </span>
                    </div>
                    {previewPosts.length > 0 && (
                      <div className="grid grid-cols-6 gap-1.5">
                        {previewPosts.slice(0, 6).map((p, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={p.image}
                            alt=""
                            className="aspect-square w-full rounded-[12px] border border-[#202022] object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Diagnostic panel — shows what Meta's API actually says */}
              <AnimatePresence>
                {diagnostic && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 rounded-[12px] border border-[#202022] bg-[#161617] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                        Meta Graph API diagnostic
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={
                          diagnostic.ok
                            ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }
                            : { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }
                        }
                      >
                        {diagnostic.step}
                      </span>
                    </div>

                    {diagnostic.profile && (
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                        <dt className="text-[#6b7280]">Connected account</dt>
                        <dd className="font-mono font-bold text-[#f4f4f5]">@{diagnostic.profile.username || '—'}</dd>

                        <dt className="text-[#6b7280]">Account type</dt>
                        <dd className="font-bold" style={{ color: diagnostic.profile.account_type === 'PERSONAL' ? '#ef4444' : '#10b981' }}>
                          {diagnostic.profile.account_type || '—'}
                        </dd>

                        <dt className="text-[#6b7280]">Total posts on account</dt>
                        <dd className="font-mono font-bold text-[#f4f4f5]">
                          {diagnostic.profile.media_count ?? '—'}
                        </dd>

                        <dt className="text-[#6b7280]">Posts returned by API</dt>
                        <dd className="font-mono font-bold text-[#f4f4f5]">{diagnostic.postsReturned ?? 0}</dd>
                      </dl>
                    )}

                    {diagnostic.message && (
                      <p className="mt-2 text-[12px] text-[#f59e0b]">{diagnostic.message}</p>
                    )}

                    {/* Smart hints */}
                    {diagnostic.profile?.account_type === 'PERSONAL' && (
                      <div
                        className="mt-2 rounded-[11px] px-3 py-2 text-[12px] leading-[1.5] text-[#f59e0b]"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
                      >
                        <strong>This is a Personal account.</strong> Meta&apos;s Graph API does not return media for
                        Personal accounts. Convert <span className="font-mono">@{diagnostic.profile.username}</span> to
                        a Business or Creator account in Instagram (Settings &rarr; Account type and tools), then
                        click <em>Add account</em> in the Meta dashboard to get a fresh token.
                      </div>
                    )}

                    {diagnostic.ok && diagnostic.postsReturned === 0 && (diagnostic.profile?.media_count ?? 0) === 0 && (
                      <div
                        className="mt-2 rounded-[11px] px-3 py-2 text-[12px] leading-[1.5] text-[#f59e0b]"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
                      >
                        <strong>Account has 0 posts.</strong> Publish something on Instagram, wait a minute, then click
                        Test live feed again.
                      </div>
                    )}

                    {diagnostic.ok && diagnostic.postsReturned === 0 && (diagnostic.profile?.media_count ?? 0) > 0 && (
                      <div
                        className="mt-2 rounded-[11px] px-3 py-2 text-[12px] leading-[1.5] text-[#f59e0b]"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
                      >
                        <strong>Account has {diagnostic.profile?.media_count} posts but the API returned 0.</strong>{' '}
                        This usually means the account was converted to Business <em>after</em> the existing posts
                        were published — Meta sometimes doesn&apos;t backfill old posts to the Graph API. Publishing
                        one new post should make all posts appear.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Manual fallback posts */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="m-0 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                    Manual posts (fallback)
                  </h3>
                  <p className="m-0 mt-1 text-[11.5px] text-[#6b7280]">
                    Used if no access token, or as a backup. Up to {MAX_POSTS}.
                  </p>
                </div>
                <button
                  onClick={addPost}
                  disabled={posts.length >= MAX_POSTS}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-[#EC1E79] transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: 'rgba(236,30,121,0.12)' }}
                >
                  <Plus size={11} /> Add
                </button>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-[78px] animate-pulse rounded-[12px] bg-[#161617]" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-[#202022] px-5 py-8 text-center">
                  <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-[#161617]">
                    <ImageIcon size={18} className="text-[#6b7280]" />
                  </div>
                  <p className="m-0 text-[13px] font-bold text-[#f4f4f5]">No manual posts</p>
                  <p className="m-0 mt-0.5 text-[12px] text-[#6b7280]">Token-driven feed will be used.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {posts.map((post, i) => (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="grid grid-cols-[20px_60px_1fr_auto] items-start gap-2.5 rounded-[12px] border border-[#202022] bg-[#161617] p-2.5"
                      >
                        <div className="flex flex-col items-center gap-0.5 pt-1">
                          <button type="button" onClick={() => movePost(i, -1)} disabled={i === 0} className="text-[#6b7280] hover:text-[#EC1E79] disabled:opacity-30">▲</button>
                          <GripVertical size={10} className="text-[#6b7280]" />
                          <button type="button" onClick={() => movePost(i, 1)} disabled={i === posts.length - 1} className="text-[#6b7280] hover:text-[#EC1E79] disabled:opacity-30">▼</button>
                        </div>
                        <div className="flex aspect-square size-[60px] items-center justify-center overflow-hidden rounded-[11px] border border-[#202022] bg-[#0c0c0d]">
                          {post.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.image} alt="" className="size-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-[#6b7280]" />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <input
                            value={post.url}
                            onChange={e => updatePost(i, { url: e.target.value })}
                            placeholder="https://www.instagram.com/p/..."
                            className="w-full rounded-[11px] border border-[#202022] bg-[#0c0c0d] px-2.5 py-1.5 text-[11.5px] font-medium text-white outline-none placeholder:text-[#6b7280]"
                          />
                          <input
                            value={post.image}
                            onChange={e => updatePost(i, { image: e.target.value })}
                            placeholder="Image URL"
                            className="w-full rounded-[11px] border border-[#202022] bg-[#0c0c0d] px-2.5 py-1.5 text-[11.5px] font-medium text-white outline-none placeholder:text-[#6b7280]"
                          />
                          <input
                            value={post.caption || ''}
                            onChange={e => updatePost(i, { caption: e.target.value })}
                            placeholder="Caption (optional)"
                            maxLength={150}
                            className="w-full rounded-[11px] border border-[#202022] bg-[#0c0c0d] px-2.5 py-1.5 text-[11.5px] text-[#e4e4e7] outline-none placeholder:text-[#6b7280]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePost(i)}
                          className="rounded-[11px] p-1.5 text-[#ef4444] transition-colors hover:brightness-125"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </Card>

            {error && (
              <div
                className="flex items-start gap-2 rounded-[11px] px-4 py-3 text-sm text-[#ef4444]"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* right: setup guide */}
          <aside className="space-y-3">
            <Card>
              <h3 className="m-0 mb-2 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                Get a token (5 min)
              </h3>
              <ol className="m-0 list-decimal space-y-2 pl-4 text-[12px] leading-[1.55] text-[#9ca3af]">
                <li>Convert your Instagram to a <b>Business</b> or <b>Creator</b> account (Settings → Account).</li>
                <li>Connect it to a Facebook Page (any Page you admin).</li>
                <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="font-bold text-[#EC1E79] hover:underline">developers.facebook.com/apps</a>, create an app, add the <b>Instagram</b> product.</li>
                <li>In <b>Instagram → API Setup with Instagram Business Login</b>, generate a long-lived access token.</li>
                <li>Paste the token here, click <b>Save</b>, then <b>Test live feed</b>.</li>
              </ol>
            </Card>

            <Card>
              <h3 className="m-0 mb-2 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#f4f4f5]">
                Why both?
              </h3>
              <p className="m-0 text-[12px] leading-[1.55] text-[#9ca3af]">
                Token-based auto-sync is the default — homepage stays current automatically. Manual posts act as a
                fallback (and can be used for a hand-picked &ldquo;greatest hits&rdquo; feed) if you delete the token or
                Instagram has an outage.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className="rounded-2xl border bg-[#0f0f10] px-[1.35rem] py-[1.25rem]"
      style={{ borderColor: accent ? 'rgba(236,30,121,0.3)' : '#202022' }}
    >
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
      {children}
    </label>
  )
}
