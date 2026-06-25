'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getConsent, onConsentChange, type Consent } from '@/lib/consent'

/**
 * Google Analytics 4 — loads ONLY when:
 *   - NEXT_PUBLIC_GA_MEASUREMENT_ID is set, AND
 *   - the visitor has accepted cookies (UK/GDPR), AND
 *   - we're not in the back office (/admin is never tracked).
 *
 * afterInteractive so it never blocks first paint or LCP.
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const pathname = usePathname()
  const [consent, setConsentState] = useState<Consent>(null)

  useEffect(() => {
    setConsentState(getConsent())
    return onConsentChange(setConsentState)
  }, [])

  if (!id) return null
  if (consent !== 'accepted') return null
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  )
}
