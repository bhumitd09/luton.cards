'use client'

/**
 * Renders a CMS-managed legal/static page on the public site, with the same
 * black-hero + white-content look the hardcoded pages already use.
 *
 * Body rendering is deliberately simple and safe: there is NO markdown
 * library and NO dangerouslySetInnerHTML. The raw stored text is split into
 * blocks on blank lines (\n\n); a block whose first line starts with "# "
 * becomes an <h2>, everything else becomes a <p>. React escapes all text
 * nodes for us, so stored HTML is shown literally and can't inject markup.
 *
 * Used by the public faq/privacy/terms/cookies pages: each fetches its slug
 * from /api/pages/[slug] and renders <CmsPage> when a published row exists,
 * otherwise falls back to its original hardcoded JSX.
 */
import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export interface CmsPageData {
  title: string
  body: string
  updatedAt?: string
}

type CmsState =
  | { status: 'loading' }
  | { status: 'cms'; page: CmsPageData }
  | { status: 'fallback' }

/**
 * Fetch a published CMS page by slug. Returns 'loading' until resolved, then
 * 'cms' with the page when one exists, or 'fallback' when there's no row
 * (404) or the request fails — letting the caller render its hardcoded JSX.
 */
export function useCmsPage(slug: string): CmsState {
  const [state, setState] = useState<CmsState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    fetch(`/api/pages/${slug}`)
      .then(async res => {
        if (!active) return
        if (!res.ok) {
          setState({ status: 'fallback' })
          return
        }
        const data = await res.json()
        if (!active) return
        if (data?.page?.title) {
          setState({ status: 'cms', page: data.page as CmsPageData })
        } else {
          setState({ status: 'fallback' })
        }
      })
      .catch(() => {
        if (active) setState({ status: 'fallback' })
      })
    return () => {
      active = false
    }
  }, [slug])

  return state
}

const h2Style: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 800,
  color: '#111',
  marginBottom: '0.75rem',
  marginTop: '2.5rem',
  borderBottom: '2px solid #EC1E79',
  paddingBottom: '0.4rem',
}

const bodyStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  color: '#4b5563',
  lineHeight: 1.8,
  margin: '0 0 1rem',
  whiteSpace: 'pre-wrap',
}

function renderBlocks(body: string) {
  return body
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map((block, i) => {
      if (block.startsWith('# ')) {
        return (
          <h2 key={i} style={h2Style}>
            {block.slice(2).trim()}
          </h2>
        )
      }
      return (
        <p key={i} style={bodyStyle}>
          {block}
        </p>
      )
    })
}

export function CmsPage({ page }: { page: CmsPageData }) {
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .legal-hero { padding: 2.5rem 1rem !important; }
          .legal-content { padding: 2rem 1rem !important; }
        }
      `}</style>
      <Header />

      {/* Hero */}
      <section
        className="legal-hero"
        style={{
          background: 'linear-gradient(135deg, #000 0%, #111 50%, #0d1a17 100%)',
          padding: '4rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(236,30,121,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.03em',
              margin: '0 0 0.75rem',
            }}
          >
            {page.title}
          </h1>
          {page.updatedAt && (
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Last updated:{' '}
              {new Date(page.updatedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <main
        className="legal-content"
        style={{ background: '#fff', padding: '4rem 1.5rem' }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>{renderBlocks(page.body)}</div>
      </main>

      <Footer />
    </>
  )
}
