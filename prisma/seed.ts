import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin user — always sync to current env vars so rotating ADMIN_PASSWORD
  // (or changing ADMIN_EMAIL) works by just redeploying. update path resets
  // the password hash and role; create path is identical for new DBs.
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lutoncards.co.uk'
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'luton2025', 12)
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'superadmin',
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Admin',
      role: 'superadmin',
    },
  })
  console.log(`Admin user synced for ${adminEmail}`)

  // Default content (matches new Luton hero / marquee in components)
  const contents = [
    { key: 'hero_headline', value: 'Pokémon.\nOne Piece.\nProperly sourced.', type: 'text', label: 'Hero Headline' },
    { key: 'hero_subtext', value: 'Singles, graded slabs and sealed product from Luton, UK.\nProperly checked, properly priced.', type: 'text', label: 'Hero Subtext' },
    { key: 'hero_cta_text', value: 'Shop Pokémon', type: 'text', label: 'Hero CTA (Primary)' },
    { key: 'hero_cta_link', value: '/products?game=pokemon', type: 'text', label: 'Hero CTA Link (Primary)' },
    { key: 'hero_cta2_text', value: 'Shop One Piece', type: 'text', label: 'Hero CTA (Secondary)' },
    { key: 'hero_cta2_link', value: '/products?game=one-piece', type: 'text', label: 'Hero CTA Link (Secondary)' },
    { key: 'marquee_items', value: JSON.stringify([
      'PSA Graded', 'Pokémon TCG', 'CGC Certified',
      'One Piece TCG', 'ACE Graded', 'Same Day Dispatch',
      'Booster Boxes', 'Sealed Product', 'Free UK Shipping',
    ]), type: 'json', label: 'Marquee Ticker Items' },
    { key: 'site_tagline', value: 'Pokémon & One Piece TCG, Luton UK', type: 'text', label: 'Site Tagline' },
    { key: 'footer_tagline', value: 'Pokémon and One Piece trading cards from Luton, UK. Properly sourced, properly priced.', type: 'text', label: 'Footer Tagline' },
  ]

  for (const content of contents) {
    await prisma.content.upsert({
      where: { key: content.key },
      update: {},
      create: { ...content, updatedAt: new Date() },
    })
  }

  // Seed example products — only on a truly empty product table.
  // After the first run, never re-create them so admin deletions/edits stick.
  const existingProductCount = await prisma.product.count()
  if (existingProductCount > 0) {
    console.log(`Skipping product seed — ${existingProductCount} products already in DB.`)
    console.log('Seed complete.')
    return
  }

  const products = [
    // Pokémon — Graded
    { name: 'Charizard G LV.X Holo', slug: 'charizard-g-lvx-holo', game: 'pokemon', category: 'graded', price: 300, stock: 1, grader: 'PSA', grade: 'PSA 8', featured: true, images: [] },
    { name: 'Lugia EX Full Art', slug: 'lugia-ex-full-art', game: 'pokemon', category: 'graded', price: 900, stock: 1, grader: 'PSA', grade: 'PSA 7', featured: true, images: [] },
    { name: 'Mew EX Full Art', slug: 'mew-ex-full-art', game: 'pokemon', category: 'graded', price: 400, stock: 1, grader: 'PSA', grade: 'PSA 8', featured: true, images: [] },
    { name: 'Kyogre & Groudon Legend', slug: 'kyogre-groudon-legend', game: 'pokemon', category: 'graded', price: 350, stock: 1, grader: 'PSA', grade: 'PSA 8', featured: false, images: [] },
    // Pokémon — Booster boxes
    { name: 'Darkness Ablaze Booster Box', slug: 'darkness-ablaze-booster-box', game: 'pokemon', category: 'booster', price: 160, stock: 3, featured: true, images: [] },
    { name: 'Vivid Voltage Booster Box', slug: 'vivid-voltage-booster-box', game: 'pokemon', category: 'booster', price: 320, stock: 2, featured: true, images: [] },
    { name: 'Lost Origin Booster Box', slug: 'lost-origin-booster-box', game: 'pokemon', category: 'booster', price: 300, stock: 2, featured: false, images: [] },
    // One Piece — placeholders so the One Piece category isn't empty on launch
    { name: 'Monkey D. Luffy Leader (Alt Art)', slug: 'luffy-leader-alt-art', game: 'one-piece', category: 'single', price: 120, stock: 2, featured: true, images: [] },
    { name: 'Roronoa Zoro Super Rare', slug: 'zoro-super-rare', game: 'one-piece', category: 'single', price: 45, stock: 4, featured: true, images: [] },
    { name: 'Eustass Kid Secret Rare (CGC 9)', slug: 'kid-secret-rare-cgc-9', game: 'one-piece', category: 'graded', price: 220, stock: 1, grader: 'CGC', grade: 'CGC 9', featured: true, images: [] },
    { name: 'OP-01 Romance Dawn Booster Box', slug: 'op01-romance-dawn-booster-box', game: 'one-piece', category: 'booster', price: 180, stock: 3, featured: true, images: [] },
    { name: 'OP-02 Paramount War Booster Box', slug: 'op02-paramount-war-booster-box', game: 'one-piece', category: 'booster', price: 220, stock: 2, featured: false, images: [] },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...product,
        tags: [],
        active: true,
      },
    })
  }

  console.log('Seed complete.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
