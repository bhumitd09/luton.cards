import Script from 'next/script'

/**
 * Google Analytics 4 — only renders when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * Add the env var (e.g. G-XXXXXXXXXX) in Railway → site goes live with GA
 * automatically; remove the var → no script loads, no tracking.
 *
 * Uses next/script with strategy='afterInteractive' so it doesn't block
 * first paint or LCP.
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (!id) return null

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
