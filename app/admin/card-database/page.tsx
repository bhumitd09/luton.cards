'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Library,
  Search,
  ImageOff,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/components/admin/toast'
import { CONDITIONS } from '@/lib/conditions'

// ─── Types from /api/admin/ctcg/* ──────────────────────────────────────────

interface TcgEntry {
  tcg: string
  set_count: number | null
}

interface SetEntry {
  code: string
  name: string
  release_date: string | null
  card_count: number | null
  logo: string | null
}

// Browse result (no tcg field — uses the selected tcg)
interface BrowseCard {
  card_id: string
  name: string
  number: string | null
  rarity: string | null
  image: string | null
}

// Search result (carries its own tcg + set_code)
interface SearchCard {
  tcg: string
  card_id: string
  name: string
  number: string | null
  set_code: string | null
  rarity: string | null
  image: string | null
}

// A normalised card reference used to open the preview
interface CardRef {
  tcg: string
  cardId: string
  // The collector number is present on the search/browse list rows but the
  // per-card detail lookup sometimes omits it — carry it through as a fallback
  // so the listing form always has the number.
  number?: string | null
}

interface CardImage {
  url: string
  language: string | null
  variant: string | null
}

interface PrintingPrice {
  market: string | null
  currency: string | null
  amount: number | null
  raw: number | null
  url: string | null
}

interface Printing {
  label: string | null
  variant: string | null
  prices: PrintingPrice[]
}

type SuggestedGame = 'pokemon' | 'one-piece' | 'lorcana' | 'riftbound'

interface CardDetail {
  tcg: string
  card_id: string
  set_code: string | null
  set_name: string | null
  name: string
  category: string | null
  rarity: string | null
  effect: string | null
  number: string | null
  images: CardImage[]
  printings?: Printing[]
}

interface CardLookupResult {
  card: CardDetail
  suggestedGame: SuggestedGame
}

interface ImportedProduct {
  id: string
  name: string
}

interface SessionAddition {
  id: string
  name: string
}

// ─── TCG display helpers ────────────────────────────────────────────────────

const TCG_LABELS: Record<string, string> = {
  'one-piece': 'One Piece',
  pokemon: 'Pokémon',
  lorcana: 'Lorcana',
  riftbound: 'Riftbound',
  'pokemon-jp': 'Pokémon (JP)',
  'pokemon-intl': 'Pokémon (Intl)',
}

function tcgLabel(tcg: string): string {
  return TCG_LABELS[tcg] ?? tcg
}

const GAME_OPTIONS: { value: SuggestedGame; label: string }[] = [
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'one-piece', label: 'One Piece' },
  { value: 'lorcana', label: 'Lorcana' },
  { value: 'riftbound', label: 'Riftbound' },
]

const VALID_GAMES = new Set<SuggestedGame>(['pokemon', 'one-piece', 'lorcana', 'riftbound'])

function normaliseGame(value: string): SuggestedGame {
  return VALID_GAMES.has(value as SuggestedGame) ? (value as SuggestedGame) : 'pokemon'
}

const PAGE_SIZE_FALLBACK = 24

// ─── Shared styles (admin dark theme) ──────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 700,
  display: 'block',
  marginBottom: '0.5rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  background: '#0c0c0d',
  border: '1px solid #202022',
  borderRadius: '11px',
  color: '#fff',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.65rem 1.2rem',
  background: 'linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%)',
  border: 'none',
  borderRadius: '11px',
  color: '#fff',
  fontSize: '0.85rem',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.45rem',
  whiteSpace: 'nowrap',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '0.65rem 1.2rem',
  background: '#161617',
  border: '1px solid #202022',
  borderRadius: '11px',
  color: '#e4e4e7',
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const cardStyle: React.CSSProperties = {
  background: '#0f0f10',
  border: '1px solid #202022',
  borderRadius: '16px',
  padding: '1.5rem',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '0.85rem',
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminCardDatabasePage() {
  const toast = useToast()

  // Status
  const [configured, setConfigured] = useState<boolean | null>(null)

  // Search by name
  const [searchQuery, setSearchQuery] = useState('')
  const [searchTcg, setSearchTcg] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchCard[] | null>(null)

  // Browse
  const [tcgs, setTcgs] = useState<TcgEntry[]>([])
  const [browseTcg, setBrowseTcg] = useState('')
  const [sets, setSets] = useState<SetEntry[]>([])
  const [setsLoading, setSetsLoading] = useState(false)
  const [browseSet, setBrowseSet] = useState('')
  const [browseFilter, setBrowseFilter] = useState('')
  const [browsePage, setBrowsePage] = useState(1)
  const [browseTotal, setBrowseTotal] = useState(0)
  const [browsePageSize, setBrowsePageSize] = useState(PAGE_SIZE_FALLBACK)
  const [browseCards, setBrowseCards] = useState<BrowseCard[] | null>(null)
  const [browseLoading, setBrowseLoading] = useState(false)

  // Preview + listing form
  const [loadingCard, setLoadingCard] = useState(false)
  const [result, setResult] = useState<CardLookupResult | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [category, setCategory] = useState('single')
  const [game, setGame] = useState<SuggestedGame>('pokemon')
  const [condition, setCondition] = useState('near-mint')
  const [cardNumber, setCardNumber] = useState('')
  const [stock, setStock] = useState('1')
  const [featured, setFeatured] = useState(false)
  const [active, setActive] = useState(true)
  const [importing, setImporting] = useState(false)

  // Added this session
  const [added, setAdded] = useState<SessionAddition[]>([])

  // ── Initial loads ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/ctcg/status', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => setConfigured(!!data?.configured))
      .catch(() => setConfigured(null))

    fetch('/api/admin/ctcg/tcgs', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => setTcgs(Array.isArray(data?.tcgs) ? (data.tcgs as TcgEntry[]) : []))
      .catch(() => setTcgs([]))
  }, [])

  // ── Search by name ─────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) {
      toast.error('Enter a card name to search')
      return
    }
    setSearching(true)
    try {
      const params = new URLSearchParams({ q, page: '1' })
      if (searchTcg) params.set('tcg', searchTcg)
      const res = await fetch(`/api/admin/ctcg/search?${params.toString()}`, {
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || `Search failed (${res.status})`)
        return
      }
      const cards = Array.isArray(data?.cards) ? (data.cards as SearchCard[]) : []
      setSearchResults(cards)
      if (cards.length === 0) {
        // First search for a game builds the index in the background — tell the
        // user to retry rather than implying the card doesn't exist.
        if (data?.indexing) {
          toast.info('Preparing the search index for this game — give it a few seconds and search again.')
        } else if (!searchTcg) {
          toast.info('No matches. Tip: pick a game (the first search per game builds its index).')
        } else {
          toast.info('No cards matched that name or number.')
        }
      }
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSearching(false)
    }
  }

  // ── Browse: pick a game → load sets ────────────────────────────────────────
  const handleBrowseTcgChange = async (tcg: string) => {
    setBrowseTcg(tcg)
    setSets([])
    setBrowseSet('')
    setBrowseCards(null)
    setBrowsePage(1)
    setBrowseTotal(0)
    if (!tcg) return
    setSetsLoading(true)
    try {
      const res = await fetch(`/api/admin/ctcg/sets?tcg=${encodeURIComponent(tcg)}`, {
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || `Could not load sets (${res.status})`)
        return
      }
      setSets(Array.isArray(data?.sets) ? (data.sets as SetEntry[]) : [])
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSetsLoading(false)
    }
  }

  // ── Browse: load cards for a set/page/filter ───────────────────────────────
  const loadBrowseCards = async (code: string, page: number, q: string) => {
    if (!browseTcg || !code) return
    setBrowseLoading(true)
    try {
      const params = new URLSearchParams({
        tcg: browseTcg,
        code,
        page: String(page),
      })
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/admin/ctcg/cards?${params.toString()}`, {
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || `Could not load cards (${res.status})`)
        return
      }
      setBrowseCards(Array.isArray(data?.cards) ? (data.cards as BrowseCard[]) : [])
      setBrowseTotal(typeof data?.total === 'number' ? data.total : 0)
      setBrowsePageSize(
        typeof data?.page_size === 'number' && data.page_size > 0 ? data.page_size : PAGE_SIZE_FALLBACK,
      )
      setBrowsePage(typeof data?.page === 'number' && data.page > 0 ? data.page : page)
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setBrowseLoading(false)
    }
  }

  const handleBrowseSetChange = (code: string) => {
    setBrowseSet(code)
    setBrowseFilter('')
    setBrowsePage(1)
    setBrowseCards(null)
    setBrowseTotal(0)
    if (code) void loadBrowseCards(code, 1, '')
  }

  const handleBrowseFilter = () => {
    if (browseSet) void loadBrowseCards(browseSet, 1, browseFilter)
  }

  const totalPages = browsePageSize > 0 ? Math.max(1, Math.ceil(browseTotal / browsePageSize)) : 1
  const canPrev = browsePage > 1
  const canNext = browsePage < totalPages

  const goToPage = (page: number) => {
    if (browseSet) void loadBrowseCards(browseSet, page, browseFilter)
  }

  // ── Open a card preview ────────────────────────────────────────────────────
  const openCard = async (ref: CardRef) => {
    setLoadingCard(true)
    try {
      const params = new URLSearchParams({ tcg: ref.tcg, cardId: ref.cardId })
      const res = await fetch(`/api/admin/ctcg/card?${params.toString()}`, {
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || `Could not load card (${res.status})`)
        return
      }
      const lookup = data as CardLookupResult
      // Work out the real collector number. The detail lookup has no number
      // field, so we derive it from the row we clicked: for clean entries the
      // card_id is "<set>-<number>" (e.g. "pl3-106"). Scraped TCGs
      // (pokemon-intl/jp) instead use a bare internal id as both the card_id
      // AND the "number" (e.g. "4874") — that is NOT a collector number, so we
      // leave it blank rather than auto-fill garbage.
      const collectorNo = collectorNumber(ref.cardId, ref.number)
      const card = { ...lookup.card, number: collectorNo }
      setResult({ ...lookup, card })
      setName(buildDefaultName(card))
      setDescription(buildDefaultDescription(card))
      setCardNumber(collectorNo ?? '')
      setPrice('')
      setComparePrice('')
      setCategory('single')
      setGame(normaliseGame(lookup.suggestedGame))
      setCondition('near-mint')
      setStock('1')
      setFeatured(false)
      setActive(true)
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setLoadingCard(false)
    }
  }

  const closePreview = () => {
    setResult(null)
    setName('')
    setDescription('')
    setPrice('')
    setComparePrice('')
    setCategory('single')
    setGame('pokemon')
    setCondition('near-mint')
    setCardNumber('')
    setStock('1')
    setFeatured(false)
    setActive(true)
  }

  // ── Import / list for sale ─────────────────────────────────────────────────
  const priceValue = Number(price)
  const canImport = price.trim() !== '' && Number.isFinite(priceValue) && priceValue > 0

  const handleImport = async () => {
    if (!result || !canImport) return
    setImporting(true)
    try {
      const compareValue = Number(comparePrice)
      const stockValue = Number(stock)
      const res = await fetch('/api/admin/ctcg/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          tcg: result.card.tcg,
          cardId: result.card.card_id,
          price: priceValue,
          comparePrice:
            comparePrice.trim() !== '' && Number.isFinite(compareValue) ? compareValue : undefined,
          category: category.trim() || undefined,
          game,
          condition: condition || undefined,
          cardNumber: cardNumber.trim() || undefined,
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          stock:
            stock.trim() !== '' && Number.isFinite(stockValue) ? Math.max(0, Math.floor(stockValue)) : undefined,
          featured,
          active,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || `Could not list (${res.status})`)
        return
      }
      const product = data?.product as ImportedProduct | undefined
      const productName = product?.name || name.trim() || 'Card'
      toast.success(`Listed: ${productName}`)
      if (product?.id) {
        setAdded(prev => [{ id: product.id, name: productName }, ...prev])
      }
      closePreview()
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setImporting(false)
    }
  }

  const card = result?.card
  const firstPrice = card ? firstMarketPrice(card) : null

  return (
    <div style={{ padding: '2rem', color: '#fff', background: '#0a0a0a' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#EC1E79',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            marginBottom: '0.5rem',
          }}
        >
          <Library size={12} /> Card database
        </div>
        <h1
          style={{
            fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.025em',
            margin: 0,
          }}
        >
          List from card database
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '0.4rem 0 1.5rem' }}>
          Find a card by name or browse a set, then list it for sale with a price and stock.
        </p>

        {/* Not-configured notice */}
        {configured === false && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              color: '#f59e0b',
              fontSize: '0.825rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Card database isn&apos;t connected — set{' '}
              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '0.05rem 0.3rem', borderRadius: 5 }}>
                CTCG_API_BASE
              </code>{' '}
              +{' '}
              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '0.05rem 0.3rem', borderRadius: 5 }}>
                CTCG_API_KEY
              </code>{' '}
              in Railway, then redeploy.
            </span>
          </div>
        )}

        {/* Preview overlay takes over once a card is opened */}
        {result && card ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Images + facts */}
            <div style={cardStyle}>
              <label style={labelStyle}>Card preview</label>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {/* Images */}
                <div>
                  {card.images.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#6b7280',
                        fontSize: '0.85rem',
                        width: 200,
                        height: 280,
                        justifyContent: 'center',
                        background: '#161617',
                        border: '1px solid #202022',
                        borderRadius: '12px',
                      }}
                    >
                      <ImageOff size={16} /> No image
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {card.images.map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${img.url}-${i}`}
                          src={img.url}
                          alt={`${card.name}${img.variant ? ` (${img.variant})` : ''}`}
                          style={{
                            width: 200,
                            height: 280,
                            objectFit: 'contain',
                            background: '#161617',
                            border: '1px solid #202022',
                            borderRadius: '12px',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Facts */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 240,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '0.9rem 1.5rem',
                    alignContent: 'start',
                  }}
                >
                  <Fact label="Name" value={card.name} />
                  <Fact label="Game" value={tcgLabel(card.tcg)} />
                  <Fact label="Set" value={card.set_name || card.set_code} />
                  <Fact label="Number" value={card.number} />
                  <Fact label="Rarity" value={card.rarity} />
                  <Fact label="Category" value={card.category} />
                  {firstPrice !== null && (
                    <Fact label="Market price (hint)" value={formatPrice(firstPrice)} />
                  )}
                  {card.effect && <Fact label="Effect" value={card.effect} span />}
                </div>
              </div>
            </div>

            {/* Listing form */}
            <div style={cardStyle}>
              <label style={labelStyle}>Listing</label>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={labelStyle} htmlFor="cd-name">
                  Name
                </label>
                <input
                  id="cd-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Listing name"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={labelStyle} htmlFor="cd-card-number">
                  Card number
                </label>
                <input
                  id="cd-card-number"
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  placeholder="e.g. 6/12 or 100"
                  style={inputStyle}
                />
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                  Auto-filled from the card database — buyers can search the store by this number.
                </p>
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={labelStyle} htmlFor="cd-description">
                  Description
                </label>
                <textarea
                  id="cd-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Listing description"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.1rem',
                  marginBottom: '1.1rem',
                }}
              >
                <div>
                  <label style={labelStyle} htmlFor="cd-price">
                    Price (GBP)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={poundPrefixStyle}>£</span>
                    <input
                      id="cd-price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                      aria-label="Price in pounds"
                      style={{ ...inputStyle, paddingLeft: '1.6rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle} htmlFor="cd-compare">
                    Compare-at price (optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={poundPrefixStyle}>£</span>
                    <input
                      id="cd-compare"
                      type="number"
                      min={0}
                      step="0.01"
                      value={comparePrice}
                      onChange={e => setComparePrice(e.target.value)}
                      placeholder="0.00"
                      aria-label="Compare-at price in pounds"
                      style={{ ...inputStyle, paddingLeft: '1.6rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle} htmlFor="cd-category">
                    Category
                  </label>
                  <select
                    id="cd-category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="single">Single</option>
                    <option value="graded">Graded</option>
                    <option value="booster">Booster</option>
                    <option value="sealed">Sealed</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle} htmlFor="cd-game">
                    Game
                  </label>
                  <select
                    id="cd-game"
                    value={game}
                    onChange={e => setGame(normaliseGame(e.target.value))}
                    style={inputStyle}
                  >
                    {GAME_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle} htmlFor="cd-condition">
                    Condition
                  </label>
                  <select
                    id="cd-condition"
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    aria-label="Card condition"
                    style={inputStyle}
                  >
                    {CONDITIONS.map(c => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle} htmlFor="cd-stock">
                    Stock
                  </label>
                  <input
                    id="cd-stock"
                    type="number"
                    min={0}
                    step="1"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    placeholder="1"
                    aria-label="Stock quantity"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.4rem' }}>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={e => setFeatured(e.target.checked)}
                    style={{ accentColor: '#EC1E79' }}
                  />
                  Featured
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    style={{ accentColor: '#EC1E79' }}
                  />
                  Active / visible
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={!canImport || importing}
                  style={{
                    ...primaryBtnStyle,
                    opacity: !canImport || importing ? 0.5 : 1,
                    cursor: !canImport || importing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {importing ? 'Adding…' : 'Add for sale'}
                </button>
                <button type="button" onClick={closePreview} disabled={importing} style={secondaryBtnStyle}>
                  Back
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Search by name */}
            <div style={cardStyle}>
              <label style={labelStyle} htmlFor="cd-search">
                Search by name
              </label>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                <input
                  id="cd-search"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleSearch()
                    }
                  }}
                  placeholder="e.g. Charizard"
                  disabled={searching}
                  aria-label="Card name"
                  style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                />
                <select
                  value={searchTcg}
                  onChange={e => setSearchTcg(e.target.value)}
                  aria-label="Filter by game"
                  style={{ ...inputStyle, width: 'auto', minWidth: 160, flex: '0 0 auto' }}
                >
                  <option value="">All games</option>
                  {tcgs.map(t => (
                    <option key={t.tcg} value={t.tcg}>
                      {tcgLabel(t.tcg)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleSearch()}
                  disabled={searching}
                  style={{
                    ...primaryBtnStyle,
                    opacity: searching ? 0.6 : 1,
                    cursor: searching ? 'wait' : 'pointer',
                  }}
                >
                  <Search size={15} />
                  {searching ? 'Searching…' : 'Search'}
                </button>
              </div>

              {searchResults !== null && (
                <div style={{ marginTop: '1.25rem' }}>
                  {searchResults.length === 0 ? (
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>No results.</div>
                  ) : (
                    <div style={gridStyle}>
                      {searchResults.map(c => (
                        <CardTile
                          key={`${c.tcg}-${c.card_id}`}
                          image={c.image}
                          name={c.name}
                          subtitle={[c.set_code, c.rarity].filter(Boolean).join(' · ')}
                          disabled={loadingCard}
                          onClick={() => void openCard({ tcg: c.tcg, cardId: c.card_id, number: c.number })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Browse */}
            <div style={cardStyle}>
              <label style={labelStyle}>Browse a set</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div>
                  <label style={labelStyle} htmlFor="cd-browse-game">
                    Game
                  </label>
                  <select
                    id="cd-browse-game"
                    value={browseTcg}
                    onChange={e => void handleBrowseTcgChange(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Choose a game…</option>
                    {tcgs.map(t => (
                      <option key={t.tcg} value={t.tcg}>
                        {tcgLabel(t.tcg)}
                        {typeof t.set_count === 'number' ? ` (${t.set_count} sets)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle} htmlFor="cd-browse-set">
                    Set
                  </label>
                  <select
                    id="cd-browse-set"
                    value={browseSet}
                    onChange={e => handleBrowseSetChange(e.target.value)}
                    disabled={!browseTcg || setsLoading}
                    style={{
                      ...inputStyle,
                      opacity: !browseTcg || setsLoading ? 0.6 : 1,
                    }}
                  >
                    <option value="">
                      {setsLoading ? 'Loading sets…' : browseTcg ? 'Choose a set…' : 'Pick a game first'}
                    </option>
                    {sets.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                        {typeof s.card_count === 'number' ? ` (${s.card_count})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {browseSet && (
                <div style={{ marginTop: '1.25rem' }}>
                  {/* In-set filter */}
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={browseFilter}
                      onChange={e => setBrowseFilter(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleBrowseFilter()
                        }
                      }}
                      placeholder="Filter by card id within this set"
                      aria-label="Filter cards in set"
                      style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                    />
                    <button
                      type="button"
                      onClick={handleBrowseFilter}
                      disabled={browseLoading}
                      style={{
                        ...secondaryBtnStyle,
                        opacity: browseLoading ? 0.6 : 1,
                        cursor: browseLoading ? 'wait' : 'pointer',
                      }}
                    >
                      <Search size={14} /> Filter
                    </button>
                  </div>

                  {/* Cards grid */}
                  <div style={{ marginTop: '1.1rem' }}>
                    {browseLoading && !browseCards ? (
                      <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Loading cards…</div>
                    ) : browseCards && browseCards.length === 0 ? (
                      <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>No cards in this view.</div>
                    ) : browseCards ? (
                      <div style={gridStyle}>
                        {browseCards.map(c => (
                          <CardTile
                            key={c.card_id}
                            image={c.image}
                            name={c.name}
                            subtitle={[c.number ? `#${c.number}` : '', c.rarity || '']
                              .filter(Boolean)
                              .join(' · ')}
                            disabled={loadingCard}
                            onClick={() => void openCard({ tcg: browseTcg, cardId: c.card_id, number: c.number })}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Pagination */}
                  {browseCards && browseTotal > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        marginTop: '1.1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                        {browseTotal} card{browseTotal === 1 ? '' : 's'} · page {browsePage} of {totalPages}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => goToPage(browsePage - 1)}
                          disabled={!canPrev || browseLoading}
                          style={{
                            ...secondaryBtnStyle,
                            opacity: !canPrev || browseLoading ? 0.4 : 1,
                            cursor: !canPrev || browseLoading ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <ChevronLeft size={14} /> Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => goToPage(browsePage + 1)}
                          disabled={!canNext || browseLoading}
                          style={{
                            ...secondaryBtnStyle,
                            opacity: !canNext || browseLoading ? 0.4 : 1,
                            cursor: !canNext || browseLoading ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Added this session */}
        {added.length > 0 && (
          <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={13} color="#10b981" /> Added this session ({added.length})
            </label>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              {added.map(item => (
                <li key={item.id} style={{ fontSize: '0.875rem' }}>
                  <Link
                    href={`/admin/products/${item.id}`}
                    style={{ color: '#EC1E79', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Defaults + formatting helpers ──────────────────────────────────────────

/**
 * Real collector number for a card row. Clean entries carry it as the card_id
 * suffix ("pl3-106" → "106") and in the `number` field. Scraped catalogues
 * (pokemon-intl / pokemon-jp) instead use a bare internal id as BOTH the
 * card_id and the number (e.g. "4874") — that is not a collector number, so we
 * return null and let the admin type the real one.
 */
function collectorNumber(cardId: string, number?: string | null): string | null {
  const id = String(cardId ?? '')
  // Bare all-digit ids are internal scrape ids, never printed collector numbers.
  if (/^\d+$/.test(id)) return null
  const num = (number ?? '').toString().trim()
  if (num) return num
  // Fallback: the suffix after the set code ("pl3-106" → "106", "sma-SV38" → "SV38").
  const dash = id.lastIndexOf('-')
  return dash > 0 ? id.slice(dash + 1) || null : null
}

function buildDefaultName(card: CardDetail): string {
  const set = card.set_name || card.set_code
  const parts = [card.name]
  if (set) parts.push(`(${set})`)
  if (card.number) parts.push(`#${card.number}`)
  return parts.join(' ')
}

function buildDefaultDescription(card: CardDetail): string {
  const bits: string[] = []
  if (card.rarity) bits.push(card.rarity)
  const set = card.set_name || card.set_code
  if (set) bits.push(set)
  if (card.category) bits.push(card.category)
  const header = bits.join(' · ')
  return card.effect ? (header ? `${header}\n\n${card.effect}` : card.effect) : header
}

function firstMarketPrice(card: CardDetail): number | null {
  const printing = card.printings?.[0]
  const priceEntry = printing?.prices?.[0]
  if (priceEntry && typeof priceEntry.amount === 'number') return priceEntry.amount
  if (priceEntry && typeof priceEntry.raw === 'number') return priceEntry.raw
  return null
}

function formatPrice(amount: number): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
  } catch {
    return `£${amount.toFixed(2)}`
  }
}

// ─── Shared style fragments ─────────────────────────────────────────────────

const poundPrefixStyle: React.CSSProperties = {
  position: 'absolute',
  left: '0.8rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#9ca3af',
  fontSize: '0.9rem',
  pointerEvents: 'none',
}

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
  color: '#e4e4e7',
  fontSize: '0.85rem',
  fontWeight: 600,
}

// ─── Small components ──────────────────────────────────────────────────────

function CardTile({
  image,
  name,
  subtitle,
  onClick,
  disabled,
}: {
  image: string | null
  name: string
  subtitle?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        padding: '0.6rem',
        background: '#111',
        border: '1px solid #1f1f1f',
        borderRadius: '12px',
        cursor: disabled ? 'wait' : 'pointer',
        textAlign: 'left',
        color: '#f4f4f5',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '5 / 7',
          background: '#161617',
          border: '1px solid #202022',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <ImageOff size={20} color="#6b7280" />
        )}
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#f4f4f5',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {name}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: '0.7rem',
            color: '#9ca3af',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {subtitle}
        </div>
      )}
    </button>
  )
}

function Fact({
  label,
  value,
  span,
}: {
  label: string
  value: string | number | null | undefined
  span?: boolean
}) {
  const text = value === null || value === undefined ? '' : String(value)
  if (!text.trim()) return null
  return (
    <div style={span ? { gridColumn: '1 / -1' } : undefined}>
      <div
        style={{
          fontSize: '0.65rem',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 700,
          marginBottom: '0.2rem',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '0.9rem', color: '#f4f4f5', fontWeight: 600, lineHeight: 1.5 }}>{text}</div>
    </div>
  )
}
