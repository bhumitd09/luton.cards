'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { ExternalLink, Youtube } from 'lucide-react'

type Video = {
  id: string
  title: string
  thumbnail: string
  date: string
}

export function YouTubeSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [videos, setVideos] = useState<Video[]>([])
  const [selected, setSelected] = useState<Video | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/youtube')
      .then(r => r.json())
      .then((data: Video[]) => {
        setVideos(data)
        setSelected(data[0] ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSelect = (v: Video) => {
    setSelected(v)
    setIsPlaying(false)
  }

  return (
    <section ref={ref} className="yt-section" style={{ padding: '5rem 0', background: '#0a0a0a' }}>
      <style>{`
        @media (max-width: 768px) {
          .yt-section { padding: 3rem 0 !important; }
          .yt-grid { grid-template-columns: 1fr !important; }
          .yt-loading-grid { grid-template-columns: 1fr !important; }
          .yt-thumb { width: 80px !important; }
        }
      `}</style>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Youtube size={18} color="#EC1E79" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#EC1E79', letterSpacing: '0.08em', textTransform: 'uppercase' }}>YouTube</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
              Latest Videos
            </h2>
            <motion.a
              href="https://www.youtube.com/@LutonCardsTCG"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: '#fff', color: '#000',
                padding: '0.55rem 1.1rem', borderRadius: '9999px',
                fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none',
              }}
            >
              <ExternalLink size={14} />
              Subscribe
            </motion.a>
          </div>
        </motion.div>

        {loading ? (
          <div className="yt-loading-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ aspectRatio: '16/9', borderRadius: '14px', background: '#1a1a1a' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...Array(4)].map((_, i) => <div key={i} style={{ height: '72px', borderRadius: '10px', background: '#1a1a1a' }} />)}
            </div>
          </div>
        ) : selected ? (
          <div className="yt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Main Player */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.15, duration: 0.5 }}
              style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '14px', overflow: 'hidden', background: '#111' }}
            >
              {isPlaying ? (
                <iframe
                  src={`https://www.youtube.com/embed/${selected.id}?autoplay=1`}
                  title={selected.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <motion.div
                  onClick={() => setIsPlaying(true)}
                  whileHover="hover"
                  style={{ position: 'absolute', inset: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  <img
                    src={selected.thumbnail}
                    alt={selected.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }}
                  />
                  <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '1rem' }}>
                    <motion.div
                      variants={{ hover: { scale: 1.15, boxShadow: '0 0 28px rgba(236,30,121,0.6)' } }}
                      style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: 'rgba(236,30,121,0.9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                      }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="black">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </motion.div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem', margin: 0, lineHeight: 1.3 }}>{selected.title}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Video List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', overflowY: 'auto', maxHeight: '400px' }}
            >
              {videos.map((v, i) => (
                <motion.div
                  key={v.id}
                  onClick={() => handleSelect(v)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.4 }}
                  whileHover={{ x: 4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                  style={{
                    display: 'flex', gap: '0.75rem', alignItems: 'center',
                    padding: '0.625rem',
                    borderRadius: '10px',
                    background: selected.id === v.id ? '#1a1a1a' : 'transparent',
                    border: `1px solid ${selected.id === v.id ? '#333' : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div className="yt-thumb" style={{ position: 'relative', flexShrink: 0, width: '110px', aspectRatio: '16/9', borderRadius: '7px', overflow: 'hidden', background: '#222' }}>
                    <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {selected.id === v.id && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(236,30,121,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EC1E79', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', margin: '0 0 0.25rem', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {v.title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{v.date}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
