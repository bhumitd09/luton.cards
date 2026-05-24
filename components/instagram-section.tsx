'use client'

import { useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Instagram, ExternalLink, Heart } from 'lucide-react'
import { useRef } from 'react'

type IGPost = {
  url: string
  image: string
  caption?: string
}

export function InstagramSection() {
  const [handle, setHandle] = useState<string>('lutoncards')
  const [posts, setPosts] = useState<IGPost[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    // Single endpoint — handles Graph API + manual fallback server-side.
    fetch('/api/instagram')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return
        if (typeof data.handle === 'string' && data.handle) setHandle(data.handle)
        if (Array.isArray(data.posts)) {
          setPosts(
            data.posts
              .filter((p: unknown): p is IGPost => {
                const p2 = p as IGPost
                return !!p2 && typeof p2.url === 'string' && typeof p2.image === 'string'
              })
              .slice(0, 8)
          )
        }
      })
      .catch(() => {})
  }, [])

  const profileUrl = `https://instagram.com/${handle}`

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#070708] py-16 sm:py-20">
      {/* brand glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(236,30,121,0.12) 0%, transparent 65%)',
        }}
      />

      <div className="relative mx-auto max-w-[1180px] px-6">
        {/* heading — tight horizontal layout with handle pill on the title line */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EC1E79]/25 bg-[#EC1E79]/[0.08] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#EC1E79]">
                <Instagram size={10} /> Instagram
              </span>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold tracking-tight text-white/40 transition-colors hover:text-white"
              >
                @{handle}
              </a>
              {posts.length > 0 && (
                <span className="text-[11px] text-white/30">· {posts.length} latest</span>
              )}
            </div>
            <h2 className="m-0 text-[clamp(1.5rem,3vw,2.25rem)] font-black leading-[1.05] tracking-[-0.03em] text-white">
              Follow the drop.
            </h2>
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-4 py-2 text-[12.5px] font-extrabold text-black transition-all hover:bg-[#EC1E79] hover:text-white sm:self-auto"
          >
            <Instagram size={13} className="transition-colors" />
            Follow
            <ExternalLink size={11} className="opacity-50 transition-opacity group-hover:opacity-100" />
          </a>
        </motion.div>

        {posts.length === 0 ? (
          <EmptyState profileUrl={profileUrl} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {posts.map((post, i) => (
              <PostTile key={post.url + i} post={post} index={i} isInView={isInView} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function PostTile({ post, index, isInView }: { post: IGPost; index: number; isInView: boolean }) {
  return (
    <motion.a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 14 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.45 }}
      className="group relative block aspect-square overflow-hidden rounded-2xl border border-white/[0.06] bg-neutral-900 transition-transform hover:-translate-y-1"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.image}
        alt={post.caption || 'Instagram post'}
        loading="lazy"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* overlay on hover */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <Instagram size={28} className="text-white" />
        {post.caption && (
          <p className="line-clamp-3 px-4 text-center text-xs font-medium leading-snug text-white/90">
            {post.caption}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs font-bold text-[#EC1E79]">
          <Heart size={12} fill="#EC1E79" /> View post
        </div>
      </div>
    </motion.a>
  )
}

function EmptyState({ profileUrl }: { profileUrl: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EC1E79] via-[#FF4DA6] to-[#7e1247] text-white shadow-[0_12px_30px_-10px_rgba(236,30,121,0.6)]">
        <Instagram size={22} />
      </div>
      <p className="m-0 text-sm font-bold text-white/70">No Instagram posts added yet</p>
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-extrabold text-black transition-transform hover:-translate-y-0.5"
      >
        <ExternalLink size={12} /> Visit our profile
      </a>
    </div>
  )
}
