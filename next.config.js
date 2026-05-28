/** @type {import('next').NextConfig} */

// Security headers applied to every response. Notes:
//
//  - CSP is the big one. We allow self + Stripe + the image hosts we use.
//    `'unsafe-inline'` for scripts + styles is currently required by Next's
//    inline runtime + Framer Motion / Tailwind; tighten further when we
//    move to nonce-based CSP.
//  - HSTS is set to 2y + preload — only valid because the site is HTTPS-only
//    on Railway and our custom domain.
//  - X-Frame-Options DENY blocks clickjacking against admin / checkout pages.
//  - Referrer-Policy strict-origin-when-cross-origin stops leaking product
//    ids (cuids) to any third-party assets.
//  - X-Content-Type-Options is also set per-response on /api/uploads — the
//    global header is belt-and-braces.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Images: self + data: + any https (admin can paste arbitrary CDN URLs into product images)
      "img-src 'self' data: https: blob:",
      // Scripts: self + Stripe checkout iframe. unsafe-inline still needed
      // for Next's runtime + Framer Motion; tighten with nonces later.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://www.google-analytics.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'images.pokemontcg.io' },
      // Instagram CDN (Graph API media_url comes from these hosts)
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: 'scontent-**.cdninstagram.com' },
      // Cloudinary (admin product image uploads — legacy)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Placeholder portrait service (used for team photo previews)
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  // Compression handled by Railway / Vercel proxy
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
