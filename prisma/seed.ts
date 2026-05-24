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
    { key: 'instagram_handle', value: 'lutoncards', type: 'text', label: 'Instagram Handle' },
    { key: 'instagram_posts', value: '[]', type: 'json', label: 'Instagram Posts' },
    {
      key: 'team_members',
      value: JSON.stringify([
        { name: 'Bhumit', role: 'Vintage Pokémon Specialist', tag: 'Base Set & Beyond', photo: '', bio: 'The vintage hunter. Hand picks pre-2003 Pokémon, Base Set holos, gold stars and sealed wax that\'s older than most of the people buying it.' },
        { name: 'Bash', role: 'One Piece Specialist', tag: 'OP-01 to Now', photo: '', bio: 'Lives and breathes One Piece TCG. Knows every set, every alt art, every leader meta. If it\'s an OP card, Bash has an opinion on it.' },
        { name: 'Ramz', role: 'Pokémon & One Piece Specialist', tag: 'Modern Sets Master', photo: '', bio: 'The all rounder. Tracks modern Pokémon sets and One Piece releases side by side. First to know what\'s about to spike.' },
        { name: 'Allan', role: 'Grading & Sealed Specialist', tag: 'PSA · CGC · ACE', photo: '', bio: 'Years of PSA, CGC and ACE submissions plus a sealed vault that\'s the envy of UK collectors. Every slab on the site has been through his hands.' },
      ]),
      type: 'json',
      label: 'Team Members',
    },
    { key: 'about_group_photo', value: '', type: 'text', label: 'About: Group Photo' },
  ]

  for (const content of contents) {
    await prisma.content.upsert({
      where: { key: content.key },
      update: {},
      create: { ...content, updatedAt: new Date() },
    })
  }

  // No example products — admin adds real stock via /admin/products or
  // the bulk import tool at /admin/import. Storefront starts empty.

  console.log('Seed complete.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
