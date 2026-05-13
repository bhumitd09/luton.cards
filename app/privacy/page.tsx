'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Last updated: April 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <main
        className="legal-content"
        style={{
          background: '#fff',
          padding: '4rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={h2Style}>Who We Are</h2>
          <p style={bodyStyle}>
            Luton Cards is a UK-based online retailer selling Pokemon trading cards, including raw singles, graded slabs, and sealed booster boxes. Our website is operated from the United Kingdom and is subject to UK data protection law including the UK GDPR and the Data Protection Act 2018.
          </p>

          <h2 style={h2Style}>What Data We Collect</h2>
          <p style={bodyStyle}>
            When you place an order, we collect your name, email address, delivery address, and phone number to fulfil your purchase. We may also collect browsing data such as pages visited, time on site, and device information via cookies and analytics tools. Payment data is handled directly by our payment processor and we never store your full card details.
          </p>

          <h2 style={h2Style}>How We Use Your Data</h2>
          <p style={bodyStyle}>
            We use your personal data to process and fulfil your orders, send order confirmation and dispatch emails, improve the website experience, respond to your enquiries, and meet our legal and regulatory obligations. We do not use your data for automated decision-making or profiling.
          </p>

          <h2 style={h2Style}>Legal Basis</h2>
          <p style={bodyStyle}>
            We process your data on the following legal bases under UK GDPR: contract performance (to fulfil your order), legitimate interests (to improve our service and prevent fraud), and legal compliance (to meet obligations such as tax record-keeping). Where we send marketing emails, we rely on your consent which you may withdraw at any time.
          </p>

          <h2 style={h2Style}>Data Sharing</h2>
          <p style={bodyStyle}>
            We share data with a limited number of trusted third-party service providers strictly to operate our business: Stripe for payment processing, Resend for transactional email, and Railway for website hosting. These providers are contractually bound to protect your data and only process it for the purposes we specify. We never sell your data to third parties.
          </p>

          <h2 style={h2Style}>Data Retention</h2>
          <p style={bodyStyle}>
            Order data including invoices and transaction records is retained for 7 years in accordance with UK tax law (HMRC requirements). Account data is retained until you request deletion. You may request deletion of your account and associated personal data at any time by contacting us, subject to any legal retention obligations.
          </p>

          <h2 style={h2Style}>Your Rights</h2>
          <p style={bodyStyle}>
            Under UK GDPR you have the right to access the personal data we hold about you, request rectification of inaccurate data, request erasure of your data (the &ldquo;right to be forgotten&rdquo;), request portability of your data in a machine-readable format, and object to processing based on legitimate interests. To exercise any of these rights, please contact us at{' '}
            <a href="mailto:privacy@lutoncards.co.uk" style={{ color: '#EC1E79', textDecoration: 'none' }}>
              privacy@lutoncards.co.uk
            </a>
            . We will respond within 30 days. If you are unhappy with how we handle your data, you have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at ico.org.uk.
          </p>

          <h2 style={h2Style}>Cookies</h2>
          <p style={bodyStyle}>
            We use cookies on our website. For full details of the cookies we use and how to manage them, please see our{' '}
            <a href="/cookies" style={{ color: '#EC1E79', textDecoration: 'none' }}>
              Cookie Policy
            </a>
            .
          </p>

          <h2 style={h2Style}>Contact</h2>
          <p style={bodyStyle}>
            For any privacy-related queries, to exercise your rights, or to report a concern, please contact our data controller at:{' '}
            <a href="mailto:privacy@lutoncards.co.uk" style={{ color: '#EC1E79', textDecoration: 'none' }}>
              privacy@lutoncards.co.uk
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </>
  )
}
