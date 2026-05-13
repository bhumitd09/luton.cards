'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Package, LogOut, MapPin, Mail, Check } from 'lucide-react'

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

type Tab = 'orders' | 'profile' | 'address'

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('orders')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/account').then(r => r.ok ? r.json() : null),
      fetch('/api/account/orders').then(r => r.ok ? r.json() : { orders: [] }),
    ])
      .then(([profileData, ordersData]) => {
        if (!profileData?.user) {
          router.replace('/login')
          return
        }
        setProfile(profileData.user)
        setOrders(ordersData?.orders || [])
        setLoading(false)
      })
      .catch(() => {
        router.replace('/login')
      })
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
        <main style={{ background: '#fafafa', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#6b7280' }}>Loading…</p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main style={{ background: '#fafafa', minHeight: '100vh', padding: '3rem 1.5rem 5rem' }}>
        <style>{`
          .acc-wrap { max-width: 1000px; margin: 0 auto; }
          .acc-grid { display: grid; grid-template-columns: 240px 1fr; gap: 2rem; align-items: start; }
          .acc-tab { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 0.9rem; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #444; background: transparent; border: none; text-align: left; width: 100%; font-family: inherit; transition: background 0.15s, color 0.15s; }
          .acc-tab:hover { background: #fff0f7; color: #EC1E79; }
          .acc-tab.active { background: #EC1E79; color: #fff; }
          .acc-card { background: #fff; border: 1.5px solid #eee; border-radius: 18px; padding: 2rem; }
          @media (max-width: 800px) { .acc-grid { grid-template-columns: 1fr; } }
          .acc-input { width: 100%; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1.5px solid #e5e7eb; font-size: 0.95rem; outline: none; font-family: inherit; box-sizing: border-box; }
          .acc-input:focus { border-color: #EC1E79; }
          .acc-label { font-size: 0.75rem; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.4rem; }
          .order-card { padding: 1.25rem; border-radius: 12px; border: 1px solid #eee; background: #fafafa; margin-bottom: 1rem; }
          .status-pill { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
        `}</style>

        <div className="acc-wrap">
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#EC1E79', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, margin: '0 0 0.5rem' }}>
              My account
            </p>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: 0 }}>
              Hi{profile.name ? `, ${profile.name}` : ''}.
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.4rem 0 0' }}>{profile.email}</p>
          </div>

          <div className="acc-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button className={`acc-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
                <Package size={16} /> Orders ({orders.length})
              </button>
              <button className={`acc-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
                <Mail size={16} /> Profile
              </button>
              <button className={`acc-tab ${tab === 'address' ? 'active' : ''}`} onClick={() => setTab('address')}>
                <MapPin size={16} /> Address
              </button>
              <button className="acc-tab" onClick={handleLogout} style={{ marginTop: '0.5rem', color: '#9ca3af' }}>
                <LogOut size={16} /> Sign out
              </button>
            </div>

            <div className="acc-card">
              {tab === 'orders' && (
                <>
                  <h2 style={h2}>Order history</h2>
                  {orders.length === 0 ? (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#666', margin: '0 0 0.5rem' }}>No orders yet.</p>
                      <Link href="/products" style={{ color: '#EC1E79', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>
                        Start shopping →
                      </Link>
                    </div>
                  ) : (
                    orders.map(order => (
                      <div key={order.id} className="order-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '0 0 0.25rem' }}>
                              Order · {new Date(order.createdAt).toLocaleDateString('en-GB')}
                            </p>
                            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111', margin: 0 }}>
                              #{order.id.slice(-8).toUpperCase()}
                            </p>
                          </div>
                          <span className="status-pill" style={statusStyle(order.status)}>
                            {order.status}
                          </span>
                        </div>
                        <ul style={{ margin: '0 0 0.75rem', padding: 0, listStyle: 'none' }}>
                          {order.items.map(item => (
                            <li key={item.id} style={{ fontSize: '0.85rem', color: '#444', padding: '0.2rem 0' }}>
                              {item.quantity}× {item.productName} <span style={{ color: '#9ca3af' }}>· £{item.price.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #eee', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#666' }}>
                            {order.trackingNumber ? `Tracking: ${order.trackingCarrier || ''} ${order.trackingNumber}` : 'No tracking yet'}
                          </span>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#EC1E79' }}>£{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {tab === 'profile' && (
                <ProfileForm
                  profile={profile}
                  onSave={saveProfile}
                  saved={saved}
                  fields={['name', 'phone', 'marketingOptIn']}
                />
              )}
              {tab === 'address' && (
                <ProfileForm
                  profile={profile}
                  onSave={saveProfile}
                  saved={saved}
                  fields={['addressLine1', 'addressLine2', 'city', 'postcode', 'country']}
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

const h2: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 900, color: '#111', letterSpacing: '-0.02em', margin: '0 0 1.25rem' }

function statusStyle(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#fef3c7', color: '#92400e' },
    paid: { bg: '#dbeafe', color: '#1e40af' },
    shipped: { bg: '#fff0f7', color: '#EC1E79' },
    delivered: { bg: '#d1fae5', color: '#065f46' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
    refunded: { bg: '#f3f4f6', color: '#374151' },
  }
  const c = map[status] || { bg: '#f3f4f6', color: '#374151' }
  return { background: c.bg, color: c.color, textTransform: 'capitalize' }
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
}: {
  profile: Profile
  onSave: (patch: Partial<Profile>) => Promise<void>
  saved: boolean
  fields: (keyof Profile)[]
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={h2}>{fields.includes('addressLine1' as keyof Profile) ? 'Shipping address' : 'Profile details'}</h2>
      {fields.map(field => {
        if (field === 'marketingOptIn') {
          return (
            <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#444', cursor: 'pointer', padding: '0.5rem 0' }}>
              <input
                type="checkbox"
                checked={Boolean(draft.marketingOptIn)}
                onChange={e => setDraft(prev => ({ ...prev, marketingOptIn: e.target.checked }))}
              />
              Email me about new drops and offers
            </label>
          )
        }
        return (
          <div key={field}>
            <label className="acc-label">{FIELD_LABELS[field as string] || (field as string)}</label>
            <input
              className="acc-input"
              value={(draft[field] as string) || ''}
              onChange={e => setDraft(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={FIELD_LABELS[field as string] || ''}
            />
          </div>
        )
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? '#c81c6b' : '#EC1E79',
            color: '#fff', border: 'none',
            padding: '0.75rem 1.5rem', borderRadius: '10px',
            fontSize: '0.875rem', fontWeight: 800,
            cursor: submitting ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontSize: '0.825rem', fontWeight: 700 }}>
            <Check size={14} /> Saved
          </span>
        )}
      </div>
    </form>
  )
}
