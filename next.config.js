/** @type {import('next').NextConfig} */
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
      // Cloudinary (admin product image uploads)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Placeholder portrait service (used for team photo previews)
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  // Compression handled by Railway / Vercel proxy
  poweredByHeader: false,
}

module.exports = nextConfig
