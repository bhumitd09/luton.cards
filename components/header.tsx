'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Menu, X, ChevronDown, ChevronRight, User } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { SearchBar } from '@/components/search-bar'

type MegaMenuItem = { href: string; label: string; description?: string }

type MegaMenu = {
  id: string
  label: string
  items: MegaMenuItem[]
}

const MEGA_MENUS: MegaMenu[] = [
  {
    id: 'pokemon',
    label: 'Shop Pokémon',
    items: [
      { href: '/products?game=pokemon', label: 'All Pokémon', description: 'Every Pokémon card in stock' },
      { href: '/products?game=pokemon&category=single', label: 'Singles', description: 'Raw holos, ex, V, VMAX' },
      { href: '/products?game=pokemon&category=graded', label: 'Graded', description: 'PSA, CGC & ACE slabs' },
      { href: '/products?game=pokemon&category=sealed', label: 'Sealed', description: 'Booster boxes, ETBs, packs' },
    ],
  },
  {
    id: 'one-piece',
    label: 'Shop One Piece',
    items: [
      { href: '/products?game=one-piece', label: 'All One Piece', description: 'Every One Piece TCG card in stock' },
      { href: '/products?game=one-piece&category=single', label: 'Singles', description: 'Leaders, rares, alt arts' },
      { href: '/products?game=one-piece&category=graded', label: 'Graded', description: 'PSA & CGC slabs' },
      { href: '/products?game=one-piece&category=sealed', label: 'Sealed', description: 'Booster boxes & packs' },
    ],
  },
]

const SIMPLE_LINKS: MegaMenuItem[] = [
  { href: '/sell', label: 'Sell to Us' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openMega, setOpenMega] = useState<string | null>(null)
  const [openMobileMega, setOpenMobileMega] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { totalItems } = useCart()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleMegaEnter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMega(id)
  }
  const handleMegaLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenMega(null), 120)
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        borderBottom: scrolled ? '1px solid #e5e7eb' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.06)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <style>{`
        /* Phone + tablet: shrink the header so the hamburger drawer is the
           star. Desktop nav does not render here so we do not reserve space
           for it. */
        @media (max-width: 1023px) {
          .header-content { height: auto !important; padding: 0.65rem 1rem !important; }
          .header-logo-img { height: 56px !important; }
          .header-actions { gap: 0.15rem !important; }
        }
        .lc-nav-trigger {
          background: none;
          border: none;
          font: inherit;
          color: #111;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.5rem 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          letter-spacing: -0.01em;
          transition: color 0.15s;
        }
        .lc-nav-trigger:hover { color: #EC1E79; }
        .lc-nav-link {
          color: #111;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: color 0.15s;
        }
        .lc-nav-link:hover { color: #EC1E79; }
        .lc-mega {
          position: absolute;
          top: 100%;
          left: 0;
          background: #fff;
          border: 1px solid #ececec;
          border-radius: 14px;
          padding: 0.5rem;
          min-width: 280px;
          box-shadow: 0 18px 40px -12px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.04);
          margin-top: 0.5rem;
          z-index: 110;
        }
        .lc-mega-item {
          display: block;
          padding: 0.7rem 0.85rem;
          border-radius: 9px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .lc-mega-item:hover { background: #fff0f7; }
        .lc-mega-item-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.01em;
        }
        .lc-mega-item-desc {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 2px;
        }
        .lc-mega-item:hover .lc-mega-item-title { color: #EC1E79; }
      `}</style>
      <div className="container">
        <div className="header-content">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <motion.img
              src="/logo/luton-cards.png"
              alt="Luton Cards"
              className="header-logo-img"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{ height: '90px', width: 'auto', display: 'block' }}
            />
          </Link>

          {/* nav-desktop visibility + layout lives in globals.css so the inline
              style can't override `display: none` at mobile widths. */}
          <nav className="nav-desktop">
            {MEGA_MENUS.map((menu, i) => (
              <div
                key={menu.id}
                onMouseEnter={() => handleMegaEnter(menu.id)}
                onMouseLeave={handleMegaLeave}
                style={{ position: 'relative' }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                >
                  <button
                    type="button"
                    className="lc-nav-trigger"
                    onClick={() => setOpenMega(openMega === menu.id ? null : menu.id)}
                    aria-expanded={openMega === menu.id}
                  >
                    {menu.label}
                    <ChevronDown
                      size={14}
                      style={{
                        transition: 'transform 0.2s',
                        transform: openMega === menu.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                </motion.div>
                <AnimatePresence>
                  {openMega === menu.id && (
                    <motion.div
                      key={menu.id}
                      className="lc-mega"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                    >
                      {menu.items.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="lc-mega-item"
                          onClick={() => setOpenMega(null)}
                        >
                          <div className="lc-mega-item-title">{item.label}</div>
                          {item.description && <div className="lc-mega-item-desc">{item.description}</div>}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {SIMPLE_LINKS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
              >
                <Link href={link.href} className="lc-nav-link">{link.label}</Link>
              </motion.div>
            ))}
          </nav>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="hidden lg:block">
              <SearchBar />
            </div>
            <Link href="/account" style={{ textDecoration: 'none' }} aria-label="Account">
              <motion.button
                className="btn-icon"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <User size={20} color="#111" />
              </motion.button>
            </Link>
            <Link href="/cart" style={{ textDecoration: 'none' }}>
              <motion.button
                className="btn-icon"
                style={{ position: 'relative' }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Cart"
              >
                <ShoppingCart size={20} color="#111" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      style={{
                        position: 'absolute', top: '2px', right: '2px',
                        width: '17px', height: '17px',
                        background: '#EC1E79', color: '#fff',
                        fontSize: '0.625rem', fontWeight: 800,
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </Link>

            <motion.button
              className="btn-icon btn-menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.92 }}
              aria-label="Menu"
            >
              <AnimatePresence mode="wait">
                {isMenuOpen
                  ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.12 }}><X size={22} color="#111" /></motion.span>
                  : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.12 }}><Menu size={22} color="#111" /></motion.span>
                }
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', borderTop: '1px solid #f0f0f0' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 1rem 1rem' }}>
                <div className="lg:hidden" style={{ padding: '0.5rem 0 1rem' }}>
                  <SearchBar variant="mobile" onNavigate={() => setIsMenuOpen(false)} />
                </div>

                {/* Shop section label */}
                <div style={{
                  fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                  padding: '0.5rem 0 0.25rem',
                }}>
                  Shop
                </div>

                {MEGA_MENUS.map((menu, i) => {
                  const isOpen = openMobileMega === menu.id
                  return (
                    <motion.div
                      key={menu.id}
                      initial={{ x: -12, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid #f5f5f5' }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenMobileMega(isOpen ? null : menu.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          font: 'inherit',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 0',
                          color: '#111',
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {menu.label}
                        <ChevronDown
                          size={16}
                          style={{
                            transition: 'transform 0.2s',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: isOpen ? '#EC1E79' : '#9ca3af',
                          }}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ paddingBottom: '0.5rem' }}>
                              {menu.items.map(item => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '0.6rem 0.75rem',
                                    margin: '0.15rem 0',
                                    color: '#374151',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    background: '#fafafa',
                                  }}
                                  onClick={() => { setIsMenuOpen(false); setOpenMobileMega(null) }}
                                >
                                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>
                                    {item.label}
                                  </span>
                                  {item.description && (
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                                      {item.description}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}

                {/* More section label */}
                <div style={{
                  fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                  padding: '1.25rem 0 0.25rem',
                }}>
                  More
                </div>

                {SIMPLE_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ x: -12, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: (MEGA_MENUS.length + i) * 0.04 }}
                    style={{ borderBottom: '1px solid #f5f5f5' }}
                  >
                    <Link
                      href={link.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 0',
                        color: '#111',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        letterSpacing: '-0.01em',
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                      <ChevronRight size={16} style={{ color: '#d1d5db' }} />
                    </Link>
                  </motion.div>
                ))}

                {/* Account quick link at bottom */}
                <motion.div
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: (MEGA_MENUS.length + SIMPLE_LINKS.length) * 0.04 }}
                  style={{ marginTop: '1rem' }}
                >
                  <Link
                    href="/account"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      textDecoration: 'none',
                      letterSpacing: '-0.01em',
                      boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
                    }}
                  >
                    <User size={16} />
                    My Account
                  </Link>
                </motion.div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
