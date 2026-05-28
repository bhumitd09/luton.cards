import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { formatGrade } from '@/lib/utils'
import { escapeJsonForScriptTag } from '@/lib/html-escape'

/**
 * Server-side metadata + structured data for individual product pages.
 *
 * Why a separate layout file?
 *   The PDP itself is 'use client' (cart, hooks, motion). Metadata MUST be
 *   exported from a server component. Putting it here keeps the data-loading
 *   server-side while the page stays interactive.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lutoncards.com'

async function getProduct(id: string) {
  try {
    return await db.product.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, description: true,
        price: true, stock: true, images: true, grade: true, grader: true,
        category: true, game: true, active: true,
      },
    })
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const product = await getProduct(params.id)
  if (!product || !product.active) {
    return {
      title: 'Product not found',
      robots: { index: false, follow: false },
    }
  }

  const gameLabel = product.game === 'one-piece' ? 'One Piece' : 'Pokémon'
  const gradeLabel = formatGrade(product.grade, product.grader)
  const gradeBit = gradeLabel ? ` · ${gradeLabel}` : ''
  const title = `${product.name}${gradeBit} — £${product.price.toLocaleString('en-GB')}`
  const description = product.description
    ? product.description.slice(0, 155)
    : `${gameLabel} ${product.category}${gradeLabel ? ` (${gradeLabel})` : ''} for sale at Luton Cards. £${product.price.toLocaleString('en-GB')}. Properly checked, properly priced.`
  const image = product.images?.[0]
  const url = `${APP_URL}/products/${product.id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Luton Cards',
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: {
      index: product.active && product.stock > 0,
      follow: true,
    },
  }
}

export default async function ProductLayout(
  { params, children }: { params: { id: string }; children: React.ReactNode }
) {
  const product = await getProduct(params.id)

  // JSON-LD structured data — Google reads this for rich product results
  const jsonLd = product && product.active ? {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images?.length ? product.images : undefined,
    sku: product.slug,
    brand: {
      '@type': 'Brand',
      name: product.game === 'one-piece' ? 'One Piece TCG' : 'Pokémon TCG',
    },
    offers: {
      '@type': 'Offer',
      url: `${APP_URL}/products/${product.id}`,
      priceCurrency: 'GBP',
      price: product.price.toFixed(2),
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Luton Cards' },
    },
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // escapeJsonForScriptTag swaps </ → <\/, etc. so a vendor-supplied
          // product.name like 'pwn</script><script>alert(1)</script>' can't
          // break out of the script tag and execute on every PDP visit.
          dangerouslySetInnerHTML={{ __html: escapeJsonForScriptTag(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
