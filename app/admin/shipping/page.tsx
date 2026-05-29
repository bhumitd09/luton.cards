'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus, X, Check, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'

interface ShippingRate {
  id: string
  name: string
  price: number
  minDays: number
  maxDays: number
  freeAbove: number | null
  active: boolean
}

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  active: boolean
  rates: ShippingRate[]
}

const COUNTRY_PRESETS = [
  { label: 'UK (GB)', codes: ['GB'] },
  { label: 'Europe', codes: ['DE', 'FR', 'NL', 'BE', 'ES', 'IT', 'PT', 'IE'] },
  { label: 'Worldwide (*)', codes: ['*'] },
]

const COUNTRY_FLAGS: Record<string, string> = {
  GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', NL: '🇳🇱', BE: '🇧🇪',
  ES: '🇪🇸', IT: '🇮🇹', PT: '🇵🇹', IE: '🇮🇪', US: '🇺🇸',
  CA: '🇨🇦', AU: '🇦🇺', JP: '🇯🇵', '*': '🌍',
}

const DEFAULT_ZONES = [
  {
    name: 'UK Mainland',
    countries: ['GB'],
    rates: [
      { name: 'Standard', price: 3.99, minDays: 3, maxDays: 5, freeAbove: 50 },
      { name: 'Express', price: 7.99, minDays: 1, maxDays: 2, freeAbove: null },
    ],
  },
  {
    name: 'Europe',
    countries: ['DE', 'FR', 'NL', 'BE', 'ES', 'IT', 'PT', 'IE'],
    rates: [
      { name: 'International Standard', price: 9.99, minDays: 5, maxDays: 10, freeAbove: null },
    ],
  },
  {
    name: 'Worldwide',
    countries: ['*'],
    rates: [
      { name: 'International', price: 14.99, minDays: 7, maxDays: 14, freeAbove: null },
    ],
  },
]

function CountryPill({ code }: { code: string }) {
  const flag = COUNTRY_FLAGS[code] || '🏳️'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      background: 'rgba(236,30,121,0.12)',
      border: '1px solid rgba(236,30,121,0.25)',
      color: '#EC1E79',
      fontSize: '0.75rem',
      fontWeight: 700,
      padding: '2px 9px',
      borderRadius: '999px',
    }}>
      {flag} {code}
    </span>
  )
}

interface EditRateFormProps {
  rate: ShippingRate
  onSave: (updates: Partial<ShippingRate>) => void
  onCancel: () => void
}

function EditRateForm({ rate, onSave, onCancel }: EditRateFormProps) {
  const [name, setName] = useState(rate.name)
  const [price, setPrice] = useState(String(rate.price))
  const [minDays, setMinDays] = useState(String(rate.minDays))
  const [maxDays, setMaxDays] = useState(String(rate.maxDays))
  const [freeAbove, setFreeAbove] = useState(rate.freeAbove !== null ? String(rate.freeAbove) : '')

  const inputStyle = {
    background: '#0c0c0d',
    border: '1px solid #202022',
    borderRadius: '11px',
    color: '#fff',
    padding: '0.5rem 0.7rem',
    fontSize: '0.8125rem',
    width: '100%',
    outline: 'none',
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
      gap: '0.5rem',
      alignItems: 'center',
      padding: '0.7rem 0.8rem',
      background: 'rgba(236,30,121,0.08)',
      borderRadius: '12px',
      border: '1px solid rgba(236,30,121,0.25)',
    }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Rate name" style={inputStyle} />
      <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price £" type="number" step="0.01" style={inputStyle} />
      <input value={minDays} onChange={e => setMinDays(e.target.value)} placeholder="Min days" type="number" style={inputStyle} />
      <input value={maxDays} onChange={e => setMaxDays(e.target.value)} placeholder="Max days" type="number" style={inputStyle} />
      <input value={freeAbove} onChange={e => setFreeAbove(e.target.value)} placeholder="Free above £" type="number" step="0.01" style={inputStyle} />
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <button
          onClick={() => onSave({
            name,
            price: parseFloat(price),
            minDays: parseInt(minDays),
            maxDays: parseInt(maxDays),
            freeAbove: freeAbove ? parseFloat(freeAbove) : null,
          })}
          style={{ background: 'rgba(236,30,121,0.12)', border: '1px solid rgba(236,30,121,0.25)', borderRadius: '11px', padding: '0.5rem', cursor: 'pointer', color: '#EC1E79', display: 'flex', alignItems: 'center' }}
        >
          <Check size={14} />
        </button>
        <button
          onClick={onCancel}
          style={{ background: '#161617', border: '1px solid #202022', borderRadius: '11px', padding: '0.5rem', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

interface AddRateFormProps {
  onAdd: (rate: { name: string; price: number; minDays: number; maxDays: number; freeAbove: number | null }) => void
  onCancel: () => void
}

function AddRateForm({ onAdd, onCancel }: AddRateFormProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [minDays, setMinDays] = useState('1')
  const [maxDays, setMaxDays] = useState('5')
  const [freeAbove, setFreeAbove] = useState('')

  const inputStyle = {
    background: '#0c0c0d',
    border: '1px solid #202022',
    borderRadius: '11px',
    color: '#fff',
    padding: '0.5rem 0.7rem',
    fontSize: '0.8125rem',
    width: '100%',
    outline: 'none',
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
      gap: '0.5rem',
      alignItems: 'center',
      padding: '0.7rem 0.8rem',
      background: '#0c0c0d',
      borderRadius: '12px',
      border: '1px dashed #2a2a2e',
    }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Rate name" style={inputStyle} />
      <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price £" type="number" step="0.01" style={inputStyle} />
      <input value={minDays} onChange={e => setMinDays(e.target.value)} placeholder="Min days" type="number" style={inputStyle} />
      <input value={maxDays} onChange={e => setMaxDays(e.target.value)} placeholder="Max days" type="number" style={inputStyle} />
      <input value={freeAbove} onChange={e => setFreeAbove(e.target.value)} placeholder="Free above £" type="number" step="0.01" style={inputStyle} />
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <button
          onClick={() => {
            if (!name || !price) return
            onAdd({
              name,
              price: parseFloat(price),
              minDays: parseInt(minDays),
              maxDays: parseInt(maxDays),
              freeAbove: freeAbove ? parseFloat(freeAbove) : null,
            })
          }}
          style={{ background: 'rgba(236,30,121,0.12)', border: '1px solid rgba(236,30,121,0.25)', borderRadius: '11px', padding: '0.5rem', cursor: 'pointer', color: '#EC1E79', display: 'flex', alignItems: 'center' }}
        >
          <Check size={14} />
        </button>
        <button
          onClick={onCancel}
          style={{ background: '#161617', border: '1px solid #202022', borderRadius: '11px', padding: '0.5rem', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default function ShippingPage() {
  const confirm = useConfirm()
  const toast = useToast()
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [loading, setLoading] = useState(true)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [addingRateZoneId, setAddingRateZoneId] = useState<string | null>(null)
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set())
  const [seedingDefaults, setSeedingDefaults] = useState(false)

  // New zone form state
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneCountries, setNewZoneCountries] = useState<string[]>([])
  const [newZoneCustomCode, setNewZoneCustomCode] = useState('')
  const [savingZone, setSavingZone] = useState(false)

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/admin/shipping')
      const data = await res.json()
      setZones(data.zones || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  const toggleZoneCollapse = (id: string) => {
    setCollapsedZones(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleZoneActive = async (zone: ShippingZone) => {
    await fetch(`/api/admin/shipping/${zone.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !zone.active }),
    })
    fetchZones()
  }

  const handleDeleteZone = async (id: string) => {
    const ok = await confirm({ title: 'Delete zone?', message: 'Delete this zone and all its rates? This cannot be undone.', danger: true, confirmLabel: 'Delete' })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/shipping/${id}`, { method: 'DELETE' })
      if (res.ok) toast.success('Zone deleted')
      else toast.error('Could not delete zone')
    } catch {
      toast.error('Could not delete zone')
    }
    fetchZones()
  }

  const handleDeleteRate = async (rateId: string) => {
    const ok = await confirm({ title: 'Delete rate?', message: 'Delete this rate?', danger: true, confirmLabel: 'Delete' })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/shipping/rates/${rateId}`, { method: 'DELETE' })
      if (res.ok) toast.success('Rate deleted')
      else toast.error('Could not delete rate')
    } catch {
      toast.error('Could not delete rate')
    }
    fetchZones()
  }

  const handleSaveRate = async (rateId: string, updates: Partial<ShippingRate>) => {
    try {
      const res = await fetch(`/api/admin/shipping/rates/${rateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) toast.success('Rate saved')
      else toast.error('Could not save rate')
    } catch {
      toast.error('Could not save rate')
    }
    setEditingRateId(null)
    fetchZones()
  }

  const handleAddRate = async (zoneId: string, data: { name: string; price: number; minDays: number; maxDays: number; freeAbove: number | null }) => {
    try {
      const res = await fetch(`/api/admin/shipping/${zoneId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) toast.success('Rate added')
      else toast.error('Could not add rate')
    } catch {
      toast.error('Could not add rate')
    }
    setAddingRateZoneId(null)
    fetchZones()
  }

  const handleAddZone = async () => {
    if (!newZoneName || newZoneCountries.length === 0) return
    setSavingZone(true)
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newZoneName, countries: newZoneCountries }),
      })
      if (res.ok) {
        setNewZoneName('')
        setNewZoneCountries([])
        setSlideOverOpen(false)
        toast.success('Zone saved')
      } else {
        toast.error('Could not save zone')
      }
      fetchZones()
    } catch {
      toast.error('Could not save zone')
    } finally {
      setSavingZone(false)
    }
  }

  const handleSeedDefaults = async () => {
    setSeedingDefaults(true)
    try {
      for (const zone of DEFAULT_ZONES) {
        const res = await fetch('/api/admin/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: zone.name, countries: zone.countries }),
        })
        const data = await res.json()
        if (data.zone) {
          for (const rate of zone.rates) {
            await fetch(`/api/admin/shipping/${data.zone.id}/rates`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(rate),
            })
          }
        }
      }
      fetchZones()
    } finally {
      setSeedingDefaults(false)
    }
  }

  const togglePresetCountry = (codes: string[]) => {
    const allPresent = codes.every(c => newZoneCountries.includes(c))
    if (allPresent) {
      setNewZoneCountries(prev => prev.filter(c => !codes.includes(c)))
    } else {
      setNewZoneCountries(prev => [...new Set([...prev, ...codes])])
    }
  }

  const addCustomCode = () => {
    const code = newZoneCustomCode.trim().toUpperCase()
    if (code && !newZoneCountries.includes(code)) {
      setNewZoneCountries(prev => [...prev, code])
    }
    setNewZoneCustomCode('')
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#EC1E79', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '0.55rem' }}>
            <Globe size={12} />
            Logistics
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem,2.5vw,1.75rem)', fontWeight: 900, letterSpacing: '-0.025em', color: '#fff', margin: 0 }}>Shipping</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
            Manage zones, rates and delivery options
          </p>
        </div>
        <button
          onClick={() => setSlideOverOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
            color: '#fff',
            border: 'none',
            borderRadius: '11px',
            padding: '0.625rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={16} />
          Add Zone
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '3rem' }}>Loading...</div>
      )}

      {/* Empty state */}
      {!loading && zones.length === 0 && (
        <div style={{
          background: '#0f0f10',
          border: '1px solid #202022',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '999px',
            background: '#161617',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Globe size={20} color="#6b7280" />
          </div>
          <p style={{ color: '#f4f4f5', fontWeight: 700, fontSize: '1rem', margin: '0 0 0.35rem' }}>No shipping zones set up yet.</p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>Start with sensible defaults or add a zone manually.</p>
          <button
            onClick={handleSeedDefaults}
            disabled={seedingDefaults}
            style={{
              background: '#161617',
              border: '1px solid #202022',
              color: '#e4e4e7',
              borderRadius: '11px',
              padding: '0.625rem 1.5rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: seedingDefaults ? 'not-allowed' : 'pointer',
              opacity: seedingDefaults ? 0.6 : 1,
            }}
          >
            {seedingDefaults ? 'Setting up...' : 'Set up defaults'}
          </button>
        </div>
      )}

      {/* Zone cards */}
      {!loading && zones.map(zone => {
        const isCollapsed = collapsedZones.has(zone.id)
        return (
          <div
            key={zone.id}
            style={{
              background: '#0f0f10',
              border: '1px solid #202022',
              borderRadius: '16px',
              marginBottom: '1.25rem',
              overflow: 'hidden',
            }}
          >
            {/* Zone header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.35rem',
              borderBottom: isCollapsed ? 'none' : '1px solid #1a1a1c',
            }}>
              <button
                onClick={() => toggleZoneCollapse(zone.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#f4f4f5', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>{zone.name}</span>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {zone.countries.map(c => <CountryPill key={c} code={c} />)}
                  </div>
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.8125rem', marginTop: '0.3rem' }}>
                  {zone.rates.length} rate{zone.rates.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Active toggle */}
              <button
                onClick={() => handleToggleZoneActive(zone)}
                style={{
                  background: zone.active ? 'rgba(16,185,129,0.1)' : '#161617',
                  border: `1px solid ${zone.active ? 'rgba(16,185,129,0.25)' : '#202022'}`,
                  color: zone.active ? '#10b981' : '#6b7280',
                  borderRadius: '999px',
                  padding: '0.25rem 0.875rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {zone.active ? 'ACTIVE' : 'INACTIVE'}
              </button>

              <button
                onClick={() => setAddingRateZoneId(zone.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  background: '#161617',
                  border: '1px solid #202022',
                  color: '#e4e4e7',
                  borderRadius: '11px',
                  padding: '0.45rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                Add Rate
              </button>

              <button
                onClick={() => handleDeleteZone(zone.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0.375rem', borderRadius: '9px', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b7280' }}
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Rates */}
            {!isCollapsed && (
              <div style={{ padding: '0.85rem 1.35rem 1rem' }}>
                {/* Rate table header */}
                {zone.rates.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                    gap: '0.5rem',
                    padding: '0 0.8rem 0.5rem',
                    borderBottom: '1px solid #1a1a1c',
                    marginBottom: '0.5rem',
                  }}>
                    {['Name', 'Price', 'Min days', 'Max days', 'Free above', ''].map(h => (
                      <span key={h} style={{ color: '#6b7280', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                    ))}
                  </div>
                )}

                {zone.rates.map(rate => (
                  <div key={rate.id} style={{ marginBottom: '0.375rem' }}>
                    {editingRateId === rate.id ? (
                      <EditRateForm
                        rate={rate}
                        onSave={updates => handleSaveRate(rate.id, updates)}
                        onCancel={() => setEditingRateId(null)}
                      />
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        padding: '0.55rem 0.8rem',
                        borderRadius: '11px',
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161617' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <span style={{ color: '#f4f4f5', fontWeight: 600, fontSize: '0.875rem' }}>{rate.name}</span>
                        <span style={{ color: '#EC1E79', fontWeight: 800, fontSize: '0.875rem' }}>
                          {rate.price === 0 ? 'FREE' : `£${rate.price.toFixed(2)}`}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{rate.minDays}d</span>
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{rate.maxDays}d</span>
                        <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                          {rate.freeAbove !== null ? `£${rate.freeAbove.toFixed(2)}` : '—'}
                        </span>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button
                            onClick={() => setEditingRateId(rate.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0.3rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EC1E79' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b7280' }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRate(rate.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0.3rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b7280' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {addingRateZoneId === zone.id && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <AddRateForm
                      onAdd={data => handleAddRate(zone.id, data)}
                      onCancel={() => setAddingRateZoneId(null)}
                    />
                  </div>
                )}

                {zone.rates.length === 0 && addingRateZoneId !== zone.id && (
                  <div style={{ color: '#6b7280', fontSize: '0.875rem', padding: '0.85rem', textAlign: 'center' }}>
                    No rates yet. Click &quot;Add Rate&quot; to add one.
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Slide-over overlay */}
      {slideOverOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setSlideOverOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div role="dialog" aria-modal="true" style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '420px',
        background: '#0f0f10',
        borderLeft: '1px solid #202022',
        zIndex: 50,
        transform: slideOverOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Slide-over header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #1a1a1c' }}>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em', margin: 0 }}>Add Zone</h2>
          <button
            onClick={() => setSlideOverOpen(false)}
            style={{ background: '#161617', border: '1px solid #202022', borderRadius: '9px', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.3rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Slide-over body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Zone Name
            </label>
            <input
              value={newZoneName}
              onChange={e => setNewZoneName(e.target.value)}
              placeholder="e.g. UK Mainland"
              style={{
                background: '#0c0c0d',
                border: '1px solid #202022',
                borderRadius: '11px',
                color: '#fff',
                padding: '0.6rem 0.8rem',
                fontSize: '0.9375rem',
                width: '100%',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Country Presets
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {COUNTRY_PRESETS.map(preset => {
                const selected = preset.codes.every(c => newZoneCountries.includes(c))
                return (
                  <button
                    key={preset.label}
                    onClick={() => togglePresetCountry(preset.codes)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: selected ? 'rgba(236,30,121,0.12)' : '#161617',
                      border: `1px solid ${selected ? 'rgba(236,30,121,0.25)' : '#202022'}`,
                      borderRadius: '11px',
                      padding: '0.625rem 1rem',
                      color: selected ? '#EC1E79' : '#9ca3af',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ flex: 1 }}>{preset.label}</span>
                    {selected && <Check size={14} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Custom Country Code
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={newZoneCustomCode}
                onChange={e => setNewZoneCustomCode(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCustomCode() }}
                placeholder="e.g. US, AU"
                style={{
                  flex: 1,
                  background: '#0c0c0d',
                  border: '1px solid #202022',
                  borderRadius: '11px',
                  color: '#fff',
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={addCustomCode}
                style={{
                  background: '#161617',
                  border: '1px solid #202022',
                  color: '#e4e4e7',
                  borderRadius: '11px',
                  padding: '0.6rem 1rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected countries preview */}
          {newZoneCountries.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Selected Countries
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {newZoneCountries.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewZoneCountries(prev => prev.filter(x => x !== c))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'rgba(236,30,121,0.12)',
                      border: '1px solid rgba(236,30,121,0.25)',
                      color: '#EC1E79',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                    }}
                  >
                    {COUNTRY_FLAGS[c] || '🏳️'} {c} <X size={10} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Slide-over footer */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1a1a1c' }}>
          <button
            onClick={handleAddZone}
            disabled={savingZone || !newZoneName || newZoneCountries.length === 0}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
              color: '#fff',
              border: 'none',
              borderRadius: '11px',
              padding: '0.75rem',
              fontWeight: 800,
              fontSize: '0.9375rem',
              boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
              cursor: savingZone || !newZoneName || newZoneCountries.length === 0 ? 'not-allowed' : 'pointer',
              opacity: savingZone || !newZoneName || newZoneCountries.length === 0 ? 0.5 : 1,
            }}
          >
            {savingZone ? 'Saving...' : 'Save Zone'}
          </button>
        </div>
      </div>
    </div>
  )
}
