'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function TermsPage() {
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
            Terms &amp; Conditions
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
          <h2 style={h2Style}>About These Terms</h2>
          <p style={bodyStyle}>
            These Terms and Conditions govern your use of the Luton Cards website and any purchase you make from us. By using our website or placing an order, you accept these terms in full. These terms are governed by the laws of England and Wales, and any disputes will be subject to the exclusive jurisdiction of the English courts.
          </p>

          <h2 style={h2Style}>Our Products</h2>
          <p style={bodyStyle}>
            We take care to accurately describe all Pokemon trading cards listed on our website. Product images are provided for illustration purposes and, while we aim to represent cards faithfully, slight variations in colour or appearance may occur depending on screen settings. Grades issued by third-party grading companies (PSA, CGC, ACE, and others) are as stated on the slab label and as accurately represented in our listings.
          </p>

          <h2 style={h2Style}>Pricing</h2>
          <p style={bodyStyle}>
            All prices on our website are displayed in Great British Pounds (GBP) and are inclusive of VAT where applicable. We reserve the right to change prices at any time without prior notice. The price applicable to your order is the price displayed at the time you place the order. In the event of a pricing error, we reserve the right to cancel an order and offer a full refund.
          </p>

          <h2 style={h2Style}>Ordering</h2>
          <p style={bodyStyle}>
            Placing an order on our website constitutes an offer to purchase goods. Your order is not accepted until we send you an order confirmation email. We reserve the right to decline any order at our discretion, including in cases of suspected fraud, pricing errors, or stock discrepancies. If we decline your order after payment has been taken, we will issue a full refund promptly.
          </p>

          <h2 style={h2Style}>Payment</h2>
          <p style={bodyStyle}>
            Payment is processed securely via Stripe, accepting all major credit and debit cards (Visa, Mastercard, American Express). Invoice payment options may be available for verified business customers. Full payment is due at the time of placing your order. We do not store your card details; all payment data is handled directly by Stripe in accordance with PCI DSS standards.
          </p>

          <h2 style={h2Style}>Shipping</h2>
          <p style={bodyStyle}>
            UK orders are typically dispatched within 24 hours of payment and delivered via Royal Mail or equivalent courier within 2&ndash;5 working days. International shipping is available to most European and other countries; delivery times and costs vary and are calculated at checkout. Risk of loss or damage passes to you upon delivery. We are not responsible for delays caused by postal services or customs.
          </p>

          <h2 style={h2Style}>Returns &amp; Refunds</h2>
          <p style={bodyStyle}>
            You have the right to return any unwanted item within 14 days of delivery, provided it is returned in its original, unopened, and undamaged condition. This right exists in accordance with the UK Consumer Rights Act 2015 and the Consumer Contracts Regulations 2013. Graded cards must be returned in their original unaltered slab and cannot be accepted if the slab has been tampered with or cracked. To initiate a return, please contact us at{' '}
            <a href="mailto:returns@lutoncards.co.uk" style={{ color: '#EC1E79', textDecoration: 'none' }}>
              returns@lutoncards.co.uk
            </a>
            . Return postage costs are the responsibility of the customer unless the item is faulty or misdescribed.
          </p>

          <h2 style={h2Style}>Graded Cards</h2>
          <p style={bodyStyle}>
            Grades assigned to cards are determined by independent third-party grading companies including PSA, CGC, and ACE. We accurately represent the grade as printed on the slab label. We are not responsible for any disputes you may have with a grading company regarding the grade assigned to a card. By purchasing a graded card, you accept that the grade is as stated and that grading disputes must be raised directly with the relevant grading company.
          </p>

          <h2 style={h2Style}>Intellectual Property</h2>
          <p style={bodyStyle}>
            All original site content, branding, and design elements are &copy; Luton Cards. Pokemon and all related names, characters, and imagery are trademarks and copyrights of Nintendo, Creatures Inc., and GAME FREAK inc. We use these marks solely for the purpose of accurately describing the products we sell and make no claim of ownership over them.
          </p>

          <h2 style={h2Style}>Limitation of Liability</h2>
          <p style={bodyStyle}>
            To the fullest extent permitted by applicable law, Luton Cards shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of our website or products. Our total liability to you in connection with any order shall not exceed the amount paid for that order. Nothing in these terms limits our liability for death or personal injury caused by negligence, fraud, or any other matter that cannot be excluded by law.
          </p>

          <h2 style={h2Style}>Contact</h2>
          <p style={bodyStyle}>
            For legal queries regarding these terms, please contact us at{' '}
            <a href="mailto:legal@lutoncards.co.uk" style={{ color: '#EC1E79', textDecoration: 'none' }}>
              legal@lutoncards.co.uk
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </>
  )
}
