import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// One-time setup endpoint — creates admin user + seed data if DB is empty.
// Hit GET /api/admin/setup once after first deploy to bootstrap the database.
export async function GET() {
  try {
    const existingAdmin = await db.adminUser.count()
    if (existingAdmin > 0) {
      return NextResponse.json({ ok: true, message: 'Already set up — admin user exists.' })
    }

    const email = process.env.ADMIN_EMAIL || 'admin@lutoncards.co.uk'
    const password = process.env.ADMIN_PASSWORD || 'luton2025'
    const passwordHash = await bcrypt.hash(password, 12)

    // Create admin user
    await db.adminUser.create({
      data: {
        email,
        passwordHash,
        name: 'Admin',
        role: 'superadmin',
      },
    })

    // Seed default content
    const contents = [
      { key: 'hero_headline', value: 'Cardboard\nEnjoyers\nWelcome.', type: 'text', label: 'Hero Headline' },
      { key: 'hero_subtext', value: 'Rare singles, graded slabs and sealed product.\nProperly checked, properly priced.', type: 'text', label: 'Hero Subtext' },
      { key: 'marquee_items', value: JSON.stringify([
        'PSA Graded', 'Charizard G LV.X · PSA 8 · £300', 'CGC Certified',
        'Lugia EX Full Art · PSA 7 · £900', 'ACE Graded', 'Mew EX · PSA 8 · £400',
        'Same Day Dispatch', 'Kyogre & Groudon Legend · PSA 8 · £350', 'Free UK Shipping',
      ]), type: 'json', label: 'Marquee Ticker Items' },
      { key: 'site_tagline', value: 'Premium Pokemon Cards', type: 'text', label: 'Site Tagline' },
    ]

    for (const content of contents) {
      await db.content.upsert({
        where: { key: content.key },
        update: {},
        create: { ...content, updatedAt: new Date() },
      })
    }

    // Seed sample products
    const products = [
      { name: 'Lugia EX Full Art', slug: 'lugia-ex-full-art', category: 'graded', price: 900, stock: 1, grader: 'PSA', grade: 'PSA 7', featured: true, images: ['https://lutoncards.com/wp-content/uploads/2024/05/lugia-ex.jpg'] },
      { name: 'Charizard G LV.X', slug: 'charizard-g-lv-x', category: 'graded', price: 300, stock: 1, grader: 'PSA', grade: 'PSA 8', featured: true, images: ['https://lutoncards.com/wp-content/uploads/2024/05/charizard-g.jpg'] },
      { name: 'Mew EX', slug: 'mew-ex', category: 'graded', price: 400, stock: 1, grader: 'PSA', grade: 'PSA 8', featured: true, images: [] },
      { name: 'Kyogre & Groudon Legend', slug: 'kyogre-groudon-legend', category: 'graded', price: 350, stock: 1, grader: 'PSA', grade: 'PSA 8', featured: false, images: [] },
      { name: 'Darkness Ablaze Booster Box', slug: 'darkness-ablaze-booster-box', category: 'booster', price: 160, stock: 3, featured: true, images: [] },
      { name: 'Vivid Voltage Booster Box', slug: 'vivid-voltage-booster-box', category: 'booster', price: 320, stock: 2, featured: true, images: [] },
      { name: 'Fusion Strike Booster Box', slug: 'fusion-strike-booster-box', category: 'booster', price: 320, stock: 2, featured: false, images: [] },
      { name: 'Astral Radiance Booster Box', slug: 'astral-radiance-booster-box', category: 'booster', price: 170, stock: 4, featured: false, images: [] },
      { name: 'Lost Origin Booster Box', slug: 'lost-origin-booster-box', category: 'booster', price: 300, stock: 2, featured: false, images: [] },
    ]

    for (const product of products) {
      await db.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: { ...product, tags: [], active: true },
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Setup complete!',
      admin: { email },
      seeded: { contents: contents.length, products: products.length },
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Setup failed', detail: String(error) }, { status: 500 })
  }
}
