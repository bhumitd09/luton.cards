'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CmsPage, useCmsPage } from '@/components/cms-page'

export default function CookiesPage() {
  const cms = useCmsPage('cookies')
  if (cms.status === 'cms') return <CmsPage page={cms.page} />
  return <CookiesPageFallback />
}

function CookiesPageFallback() {
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
  }

  function handleUpdatePreferences() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cookie_consent')
      window.location.reload()
    }
  }

  const tableHeaderStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#111',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0.6rem 1rem',
    background: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  }

  const tableCellStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#4b5563',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f0f0f0',
    lineHeight: 1.6,
  }

  const cookies = [
    { name: 'luton_admin_token', purpose: 'Admin authentication', expires: 'Session' },
    { name: 'cookie_consent', purpose: 'Remembers your cookie choice', expires: '1 year' },
    { name: 'cart (localStorage)', purpose: 'Saves your shopping cart', expires: 'Persistent' },
    { name: '_ga, _gid', purpose: 'Google Analytics (only if you accept)', expires: '2 years / 24 hours' },
  ]

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .legal-hero { padding: 2.5rem 1rem !important; }
          .legal-content { padding: 2rem 1rem !important; }
          .cookie-table-row { grid-template-columns: 1fr !important; }
          .cookie-table-header { display: none !important; }
          .cookie-table-cell { border-bottom: 1px solid #f0f0f0; padding: 0.5rem 0.75rem !important; }
          .cookie-table-cell:last-child { border-bottom: 2px solid #e5e7eb; }
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
            Cookie Policy
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Last updated: April 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="legal-content" style={{ background: '#fff', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={h2Style}>What Are Cookies</h2>
          <p style={bodyStyle}>
            Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently and to provide information to site owners. Some cookies are essential for the site to function; others are optional and help us improve the experience. We also use localStorage (a similar browser technology) to store your cart data locally on your device.
          </p>

          <h2 style={h2Style}>Cookies We Use</h2>
          <p style={{ ...bodyStyle, marginBottom: '1rem' }}>
            The following cookies and local storage items may be set when you use our site:
          </p>

          {/* Cookie table using divs */}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '1.5rem',
            }}
          >
            {/* Header row */}
            <div className="cookie-table-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr' }}>
              <div style={tableHeaderStyle}>Name</div>
              <div style={tableHeaderStyle}>Purpose</div>
              <div style={tableHeaderStyle}>Expires</div>
            </div>
            {/* Data rows */}
            {cookies.map((cookie, i) => (
              <div
                key={i}
                className="cookie-table-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 2fr 1fr',
                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                }}
              >
                <div className="cookie-table-cell" style={{ ...tableCellStyle, fontFamily: 'monospace', fontSize: '0.8rem', color: '#111' }}>
                  {cookie.name}
                </div>
                <div className="cookie-table-cell" style={tableCellStyle}>{cookie.purpose}</div>
                <div className="cookie-table-cell" style={{ ...tableCellStyle, color: '#6b7280' }}>{cookie.expires}</div>
              </div>
            ))}
          </div>

          <h2 style={h2Style}>Managing Cookies</h2>
          <p style={bodyStyle}>
            You can control and delete cookies through your browser settings. Most browsers allow you to refuse new cookies, accept only certain cookies, or delete all cookies. Note that disabling cookies may affect the functionality of our site. For example, your shopping cart may not persist between sessions. For guidance on managing cookies in your specific browser, visit the browser&apos;s help pages or{' '}
            <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" style={{ color: '#EC1E79', textDecoration: 'none' }}>
              allaboutcookies.org
            </a>
            .
          </p>

          <h2 style={h2Style}>Third-Party Cookies</h2>
          <p style={bodyStyle}>
            With your consent, we use Google Analytics (GA4) to understand how visitors use our site. Google Analytics sets cookies (_ga, _gid) that collect anonymised data about page visits, traffic sources, and device types. This data helps us improve the site. Google Analytics cookies are only set if you click &ldquo;Accept All&rdquo; on our cookie banner. You can opt out of Google Analytics at any time via the button below, or by installing the{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#EC1E79', textDecoration: 'none' }}>
              Google Analytics Opt-out Browser Add-on
            </a>
            .
          </p>

          <h2 style={h2Style}>Changes</h2>
          <p style={bodyStyle}>
            We may update this Cookie Policy from time to time as the site or applicable law changes. Any updates will be posted on this page with a revised &ldquo;last updated&rdquo; date. We recommend checking back periodically.
          </p>

          <h2 style={h2Style}>Contact</h2>
          <p style={bodyStyle}>
            For any questions about our use of cookies, please contact us at{' '}
            <a href="mailto:privacy@lutoncards.co.uk" style={{ color: '#EC1E79', textDecoration: 'none' }}>
              privacy@lutoncards.co.uk
            </a>
          </p>

          {/* Update preferences button */}
          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Want to change your cookie preferences? Click below to reset your choice and the cookie banner will reappear.
            </p>
            <button
              onClick={handleUpdatePreferences}
              style={{
                background: '#EC1E79',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.875rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Update Cookie Preferences
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
