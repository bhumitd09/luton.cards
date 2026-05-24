'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Package, LogOut, MapPin, Mail, Check, ArrowRight, Heart, Trash2 } from 'lucide-react'
import { formatGrade } from '@/lib/utils'

interface Profile {
  id: string
  email: string
  name: string | null
  phone: string | null
  marketingOptIn: boolean
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  postcode: string | null
  country: string | null
}

interface OrderItem {
  id: string
  productName: string
  price: number
  quantity: number
}

interface Order {
  id: string
  status: string
  total: number
  shippingCost: number | null
  trackingNumber: string | null
  trackingCarrier: string | null
  items: OrderItem[]
  createdAt: string
}

type Tab = 'orders' | 'wishlist' | 'profile' | 'address'

interface WishlistItem {
  id: string
  productId: string
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    stock: number
    category: string
    game: string
    grade: string | null
    grader: string | null
    image: string
    active: boolean
  }
}

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('orders')
  const [saved, setSaved] = useState(false)

  const removeFromWishlist = async (productId: string) => {
    await fetch(`/api/account/wishlist/${productId}`, { method: 'DELETE' })
    setWishlist(prev => prev.filter(w => w.productId !== productId))
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/account').then(r => (r.ok ? r.json() : null)),
      fetch('/api/account/orders').then(r => (r.ok ? r.json() : { orders: [] })),
      fetch('/api/account/wishlist').then(r => (r.ok ? r.json() : { items: [] })),
    ])
      .then(([profileData, ordersData, wishlistData]) => {
        if (!profileData?.user) {
          router.replace('/login')
          return
        }
        setProfile(profileData.user)
        setOrders(ordersData?.orders || [])
        setWishlist(wishlistData?.items || [])
        setLoading(false)
      })
      .catch(() => router.replace('/login'))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.replace('/')
    router.refresh()
  }

  const saveProfile = async (patch: Partial<Profile>) => {
    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(data.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }

  if (loading || !profile) {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center bg-[#fafafa]">
          <p className="text-sm text-neutral-500">Loading…</p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fafafa] py-10 sm:py-14">
        <div className="mx-auto max-w-[1100px] px-6">
          {/* header */}
          <div className="mb-8">
            <p className="m-0 mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#EC1E79]">
              My account
            </p>
            <h1 className="m-0 text-[clamp(1.6rem,3.5vw,2.1rem)] font-black tracking-[-0.03em] text-neutral-900">
              Hi{profile.name ? `, ${profile.name}` : ''}.
            </h1>
            <p className="m-0 mt-1 text-sm text-neutral-500">{profile.email}</p>
          </div>

          <div className="grid grid-cols-1 gap-7 md:grid-cols-[240px_1fr] md:items-start">
            {/* sidebar */}
            <nav className="flex flex-col gap-1 rounded-2xl border border-neutral-200 bg-white p-2.5">
              <TabButton
                icon={Package}
                label={`Orders (${orders.length})`}
                active={tab === 'orders'}
                onClick={() => setTab('orders')}
              />
              <TabButton
                icon={Heart}
                label={`Wishlist (${wishlist.length})`}
                active={tab === 'wishlist'}
                onClick={() => setTab('wishlist')}
              />
              <TabButton
                icon={Mail}
                label="Profile"
                active={tab === 'profile'}
                onClick={() => setTab('profile')}
              />
              <TabButton
                icon={MapPin}
                label="Address"
                active={tab === 'address'}
                onClick={() => setTab('address')}
              />
              <div className="my-1 h-px bg-neutral-100" />
              <TabButton icon={LogOut} label="Sign out" active={false} onClick={handleLogout} />
            </nav>

            {/* panel */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-8">
              {tab === 'orders' && (
                <>
                  <h2 className="m-0 mb-6 text-[1.15rem] font-black tracking-[-0.02em] text-neutral-900">
                    Order history
                  </h2>
                  {orders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 px-6 py-14 text-center">
                      <Package size={32} className="mx-auto mb-3 text-neutral-300" />
                      <p className="m-0 text-sm font-bold text-neutral-600">No orders yet.</p>
                      <Link
                        href="/products"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#EC1E79] hover:underline"
                      >
                        Start shopping <ArrowRight size={13} />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {orders.map(order => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === 'wishlist' && (
                <>
                  <h2 className="m-0 mb-6 text-[1.15rem] font-black tracking-[-0.02em] text-neutral-900">
                    Your wishlist
                  </h2>
                  {wishlist.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 px-6 py-14 text-center">
                      <Heart size={32} className="mx-auto mb-3 text-neutral-300" />
                      <p className="m-0 text-sm font-bold text-neutral-600">No saved products yet.</p>
                      <p className="m-0 mt-1 text-xs text-neutral-500">Tap the heart on any product to save it for later.</p>
                      <Link
                        href="/products"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#EC1E79] hover:underline"
                      >
                        Browse products <ArrowRight size={13} />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {wishlist.map(item => (
                        <div
                          key={item.id}
                          className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 transition-colors hover:border-[#EC1E79]"
                        >
                          <Link
                            href={`/products/${item.product.id}`}
                            className="flex aspect-square size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white"
                          >
                            {item.product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.product.image} alt={item.product.name} className="size-full object-contain p-1" />
                            ) : (
                              <Package size={20} className="text-neutral-300" />
                            )}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/products/${item.product.id}`}
                              className="m-0 line-clamp-2 text-[13.5px] font-bold leading-snug text-neutral-900 hover:text-[#EC1E79]"
                            >
                              {item.product.name}
                            </Link>
                            <p className="m-0 mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                              {item.product.game === 'one-piece' ? 'One Piece' : 'Pokémon'}
                              {formatGrade(item.product.grade, item.product.grader) ? ` · ${formatGrade(item.product.grade, item.product.grader)}` : ''}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <span className="text-[15px] font-extrabold tracking-tight text-[#EC1E79]">
                                £{item.product.price.toLocaleString()}
                              </span>
                              <span
                                className={[
                                  'text-[10px] font-bold uppercase tracking-wider',
                                  item.product.stock === 0
                                    ? 'text-red-500'
                                    : item.product.stock <= 2
                                    ? 'text-amber-500'
                                    : 'text-emerald-500',
                                ].join(' ')}
                              >
                                {item.product.stock === 0 ? 'Sold out' : item.product.stock <= 2 ? `${item.product.stock} left` : 'In stock'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromWishlist(item.productId)}
                            title="Remove from wishlist"
                            className="shrink-0 rounded-md bg-white p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === 'profile' && (
                <ProfileForm
                  profile={profile}
                  onSave={saveProfile}
                  saved={saved}
                  fields={['name', 'phone', 'marketingOptIn']}
                  title="Profile details"
                />
              )}
              {tab === 'address' && (
                <ProfileForm
                  profile={profile}
                  onSave={saveProfile}
                  saved={saved}
                  fields={['addressLine1', 'addressLine2', 'city', 'postcode', 'country']}
                  title="Shipping address"
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors',
        active
          ? 'bg-[#EC1E79] text-white shadow-[0_4px_14px_-4px_rgba(236,30,121,0.55)]'
          : 'text-neutral-600 hover:bg-[#fff0f7] hover:text-[#EC1E79]',
      ].join(' ')}
    >
      <Icon size={15} />
      <span className="truncate">{label}</span>
    </button>
  )
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-neutral-400">
            Order · {new Date(order.createdAt).toLocaleDateString('en-GB')}
          </p>
          <p className="m-0 mt-0.5 text-sm font-bold text-neutral-900">
            #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>
        <span
          className={[
            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]',
            statusClass(order.status),
          ].join(' ')}
        >
          {order.status}
        </span>
      </div>
      <ul className="m-0 mb-3 list-none p-0">
        {order.items.map(item => (
          <li key={item.id} className="py-0.5 text-[13px] text-neutral-600">
            {item.quantity}× {item.productName}{' '}
            <span className="text-neutral-400">· £{item.price.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-3">
        <span className="text-[13px] text-neutral-500">
          {order.trackingNumber
            ? `Tracking: ${order.trackingCarrier || ''} ${order.trackingNumber}`
            : 'No tracking yet'}
        </span>
        <span className="text-lg font-black tracking-tight text-[#EC1E79]">£{order.total.toFixed(2)}</span>
      </div>
    </div>
  )
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-blue-100 text-blue-800',
    shipped: 'bg-[#fff0f7] text-[#EC1E79]',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-neutral-200 text-neutral-700',
  }
  return map[status] || 'bg-neutral-200 text-neutral-700'
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  phone: 'Phone',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  city: 'City',
  postcode: 'Postcode',
  country: 'Country',
}

function ProfileForm({
  profile,
  onSave,
  saved,
  fields,
  title,
}: {
  profile: Profile
  onSave: (patch: Partial<Profile>) => Promise<void>
  saved: boolean
  fields: (keyof Profile)[]
  title: string
}) {
  const [draft, setDraft] = useState<Profile>(profile)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => setDraft(profile), [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const patch: Partial<Profile> = {}
    for (const field of fields) {
      ;(patch as Record<string, unknown>)[field] = draft[field]
    }
    await onSave(patch)
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="m-0 mb-2 text-[1.15rem] font-black tracking-[-0.02em] text-neutral-900">{title}</h2>
      {fields.map(field => {
        if (field === 'marketingOptIn') {
          return (
            <label
              key={field}
              className="flex cursor-pointer items-center gap-2 py-1.5 text-sm text-neutral-700"
            >
              <input
                type="checkbox"
                className="accent-[#EC1E79]"
                checked={Boolean(draft.marketingOptIn)}
                onChange={e => setDraft(prev => ({ ...prev, marketingOptIn: e.target.checked }))}
              />
              Email me about new drops and offers
            </label>
          )
        }
        return (
          <div key={field}>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-900">
              {FIELD_LABELS[field as string] || (field as string)}
            </label>
            <input
              className="box-border w-full rounded-xl border-[1.5px] border-neutral-200 bg-white px-3.5 py-3 text-sm font-medium text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#EC1E79]"
              value={(draft[field] as string) || ''}
              onChange={e => setDraft(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={FIELD_LABELS[field as string] || ''}
            />
          </div>
        )
      })}
      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-[#EC1E79] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_24px_-8px_rgba(236,30,121,0.55)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <Check size={13} /> Saved
          </span>
        )}
      </div>
    </form>
  )
}
