'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CmsPage, useCmsPage } from '@/components/cms-page'

interface FaqItem {
  question: string
  answer: string
}

interface FaqSection {
  title: string
  items: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Orders & Shipping',
    items: [
      {
        question: 'How long does shipping take?',
        answer:
          'UK orders are dispatched within 24 hours of payment. Royal Mail 2nd Class typically delivers within 2–4 working days. Tracked and next-day options are available at checkout for an additional fee.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'Yes, we ship to most of Europe and many countries beyond. International shipping rates and estimated delivery times are calculated at checkout based on your location.',
      },
      {
        question: 'Can I track my order?',
        answer:
          'Yes. If you select a tracked shipping option at checkout, you will receive a tracking number by email once your order has been dispatched. Standard untracked postage is also available at a lower cost.',
      },
      {
        question: 'What if my order arrives damaged?',
        answer:
          'Please contact us within 48 hours of receiving the order with clear photos of the damage. We will assess the situation and work to resolve it for you, whether that is a replacement, refund, or another solution.',
      },
    ],
  },
  {
    title: 'Products & Grading',
    items: [
      {
        question: 'What does PSA/CGC/ACE grading mean?',
        answer:
          'PSA, CGC, and ACE are independent third-party grading companies that assess the condition of Pokemon cards on a numeric scale. PSA 10 (Gem Mint) is the highest grade. The grade is assessed by the grading company and is printed on the label of the plastic slab (holder) that encases the card.',
      },
      {
        question: 'Are your grades genuine?',
        answer:
          'Absolutely. Every graded card we sell has been authenticated and encapsulated by the grading company. The grade is printed on the slab itself. We do not alter, tamper with, or misrepresent any grade.',
      },
      {
        question: 'Do you sell raw (ungraded) cards?',
        answer:
          "Yes, our Singles range consists of raw (ungraded) cards that we have carefully inspected and handled. These are great for players, collectors looking to grade themselves, or those who prefer raw cards.",
      },
      {
        question: 'What condition are raw cards in?',
        answer:
          'We describe each raw card honestly in the listing. If we say a card is NM (Near Mint), it is Near Mint, with no surprises. We will always point out any flaws we notice. If you want more photos or details on a specific card, just ask.',
      },
    ],
  },
  {
    title: 'Returns & Refunds',
    items: [
      {
        question: "What's your returns policy?",
        answer:
          'You have 14 days from the date of delivery to return an unwanted item, provided it is in its original, unopened, and undamaged condition. Faulty or misdescribed items are covered under the UK Consumer Rights Act 2015 regardless of when the fault is discovered.',
      },
      {
        question: 'Can I return a graded card?',
        answer:
          'Yes, as long as the slab is returned undamaged and the card inside is in the same condition as when we listed it. We cannot accept returns where the slab has been cracked or tampered with, as this affects the integrity of the grade.',
      },
      {
        question: 'How long do refunds take?',
        answer:
          'Once we receive and inspect the returned item, refunds are processed within 5 working days. Funds typically appear in your account within 3–5 business days after processing, depending on your bank.',
      },
    ],
  },
  {
    title: 'Payments & Discounts',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit and debit cards (Visa, Mastercard, and American Express) processed securely via Stripe. A Pay Later/Invoice option may be available for verified customers. Contact us for more details.',
      },
      {
        question: 'Do you have discount codes?',
        answer:
          'Yes! Sign up to our newsletter (at the bottom of the page) for exclusive discount codes and early access to new stock. We also share codes and special offers on our Instagram page.',
      },
      {
        question: 'Is the site secure?',
        answer:
          'Yes. All payments are handled by Stripe, which is PCI DSS Level 1 compliant, the highest standard of payment security. We never see or store your full card details.',
      },
    ],
  },
  {
    title: 'General',
    items: [
      {
        question: 'Where are you based?',
        answer:
          'We are a UK-based business. All prices are displayed in Great British Pounds (GBP) including VAT where applicable.',
      },
      {
        question: 'Can I sell cards to you?',
        answer:
          "We don't currently have a formal buying programme, but we're open to it, especially for quality singles or collections. Drop us a message via the Contact page and we'll see what we can do.",
      },
      {
        question: 'I have a question not listed here',
        answer:
          "No problem. Head to our Contact page and send us a message. We aim to respond to all enquiries quickly, usually within a few hours during business days.",
      },
    ],
  },
]

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={i}
            style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
            onClick={() => setOpenIndex(isOpen ? null : i)}
          >
            <div
              style={{
                padding: '1.25rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: '#111',
                userSelect: 'none',
              }}
            >
              <span>{item.question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ flexShrink: 0, marginLeft: '1rem', color: isOpen ? '#EC1E79' : '#6b7280' }}
              >
                <ChevronDown size={18} />
              </motion.span>
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: '#4b5563',
                      lineHeight: 1.8,
                      padding: '0 0 1.25rem',
                      margin: 0,
                    }}
                  >
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export default function FaqPage() {
  const cms = useCmsPage('faq')
  if (cms.status === 'cms') return <CmsPage page={cms.page} />
  return <FaqPageFallback />
}

function FaqPageFallback() {
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .faq-hero { padding: 2.5rem 1rem !important; }
          .faq-content { padding: 2rem 1rem !important; }
        }
      `}</style>
      <Header />

      {/* Hero */}
      <section
        className="faq-hero"
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
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Everything you need to know about Luton Cards
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="faq-content" style={{ background: '#fff', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {FAQ_SECTIONS.map((section, si) => (
            <div key={si} style={{ marginBottom: '3rem' }}>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#111',
                  marginBottom: '0.75rem',
                  marginTop: si === 0 ? 0 : '2.5rem',
                  borderBottom: '2px solid #EC1E79',
                  paddingBottom: '0.4rem',
                }}
              >
                {section.title}
              </h2>
              <FaqAccordion items={section.items} />
            </div>
          ))}

          <div
            style={{
              marginTop: '3rem',
              padding: '1.75rem',
              background: '#fafafa',
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.9375rem', color: '#4b5563', margin: '0 0 1rem', lineHeight: 1.6 }}>
              Still have a question?
            </p>
            <a
              href="/contact"
              style={{
                display: 'inline-block',
                background: '#EC1E79',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.875rem',
                padding: '0.75rem 1.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
