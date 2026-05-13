'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart } from '@/lib/cart-context'

interface ShippingRate {
  id: string
  name: string
  price: number
  minDays: number
  maxDays: number
  freeAbove: number | null
}

interface FieldErrors {
  firstName?: string
  lastName?: string
  email?: string
  shippingLine1?: string
  shippingCity?: string
  shippingPostcode?: string
  country?: string
  shippingMethod?: string
}

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
]

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const router = useRouter()

  // Contact
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Address
  const [shippingLine1, setShippingLine1] = useState('')
  const [shippingLine2, setShippingLine2] = useState('')
  const [shippingCity, setShippingCity] = useState('')
  const [shippingPostcode, setShippingPostcode] = useState('')
  const [country, setCountry] = useState('GB')

  // Shipping
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)
  const [noRates, setNoRates] = useState(false)

  // Discount
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState<{
    code: string
    type: string
    value: number
    savings: number
  } | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [applyingDiscount, setApplyingDiscount] = useState(false)

  // UI state
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState<'card' | 'invoice' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedRate = shippingRates.find(r => r.id === selectedRateId) ?? null
  const shippingCost = selectedRate ? selectedRate.price : 0
  const subtotal = totalPrice
  const discountSavings = discountApplied?.savings ?? 0
  const effectiveTotal = Math.max(0, subtotal + shippingCost - discountSavings)

  const fetchRates = useCallback(async (countryCode: string, sub: number) => {
    setLoadingRates(true)
    setNoRates(false)
    setShippingRates([])
    setSelectedRateId(null)
    try {
      const res = await fetch(`/api/shipping/rates?country=${encodeURIComponent(countryCode)}&total=${sub}`)
      if (!res.ok) throw new Error('Failed to fetch rates')
      const data = await res.json()
      const rates: ShippingRate[] = data.rates ?? []
      setShippingRates(rates)
      if (rates.length === 0) {
        setNoRates(true)
      } else {
        // Default cheapest
        const cheapest = [...rates].sort((a, b) => a.price - b.price)[0]
        setSelectedRateId(cheapest.id)
      }
    } catch {
      setNoRates(true)
    } finally {
      setLoadingRates(false)
    }
  }, [])

  useEffect(() => {
    if (country) {
      fetchRates(country, subtotal)
    }
  }, [country, subtotal, fetchRates])

  const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
    switch (field) {
      case 'firstName': return !value.trim() ? 'First name is required' : undefined
      case 'lastName': return !value.trim() ? 'Last name is required' : undefined
      case 'email': {
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
        return undefined
      }
      case 'shippingLine1': return !value.trim() ? 'Address line 1 is required' : undefined
      case 'shippingCity': return !value.trim() ? 'City is required' : undefined
      case 'shippingPostcode': return !value.trim() ? 'Postcode is required' : undefined
      case 'country': return !value.trim() ? 'Country is required' : undefined
      case 'shippingMethod': return !value ? 'Please select a shipping method' : undefined
    }
  }

  const handleBlur = (field: keyof FieldErrors, value: string) => {
    setFocusedField(null)
    const err = validateField(field, value)
    setFieldErrors(prev => ({ ...prev, [field]: err }))
  }

  const validateAll = (): boolean => {
    const checks: Array<[keyof FieldErrors, string]> = [
      ['firstName', firstName],
      ['lastName', lastName],
      ['email', email],
      ['shippingLine1', shippingLine1],
      ['shippingCity', shippingCity],
      ['shippingPostcode', shippingPostcode],
      ['country', country],
      ['shippingMethod', selectedRateId ?? ''],
    ]
    const newErrors: FieldErrors = {}
    for (const [field, value] of checks) {
      const err = validateField(field, value)
      if (err) newErrors[field] = err
    }
    setFieldErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return
    setApplyingDiscount(true)
    setDiscountError(null)
    setDiscountApplied(null)
    try {
      const res = await fetch(
        `/api/discounts/validate?code=${encodeURIComponent(discountCode.trim())}&total=${subtotal}`
      )
      const data = await res.json()
      if (data.valid) {
        setDiscountApplied({
          code: discountCode.trim().toUpperCase(),
          type: data.discount.type,
          value: data.discount.value,
          savings: data.discount.savings,
        })
        setDiscountError(null)
      } else {
        setDiscountError(data.reason || 'Invalid discount code')
      }
    } catch {
      setDiscountError('Could not validate code. Please try again.')
    } finally {
      setApplyingDiscount(false)
    }
  }

  const buildOrderPayload = () => ({
    name: `${firstName.trim()} ${lastName.trim()}`,
    email: email.trim(),
    phone: phone.trim() || undefined,
    shippingLine1: shippingLine1.trim(),
    shippingLine2: shippingLine2.trim() || undefined,
    shippingCity: shippingCity.trim(),
    shippingPostcode: shippingPostcode.trim(),
    shippingCountry: country,
    shippingMethod: selectedRate?.name ?? '',
    shippingCost,
    items: items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    })),
    total: effectiveTotal,
    discountCode: discountApplied?.code || undefined,
  })

  const handlePayWithCard = async () => {
    if (!validateAll()) {
      setError('Please fill in all required fields.')
      return
    }
    setError(null)
    setSubmitting('card')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: email.trim(),
          customerName: `${firstName.trim()} ${lastName.trim()}`,
          items: items.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
          shippingCost,
          shippingMethodName: selectedRate?.name ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not start payment. Please try again.')
        setSubmitting(null)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please check your connection and try again.')
      setSubmitting(null)
    }
  }

  const handlePayLater = async () => {
    if (!validateAll()) {
      setError('Please fill in all required fields.')
      return
    }
    setError(null)
    setSubmitting('invoice')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildOrderPayload()),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setSubmitting(null)
        return
      }
      clearCart()
      router.push(`/checkout/success?order_id=${data.orderId}`)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setSubmitting(null)
    }
  }

  const inputStyle = (field: string, hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '9px',
    border: `1.5px solid ${hasError ? '#ef4444' : focusedField === field ? '#EC1E79' : '#e5e7eb'}`,
    fontSize: '0.9375rem',
    color: '#111',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.4rem',
  }

  const sectionCardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1.5px solid #e5e7eb',
    borderRadius: '14px',
    padding: '1.5rem',
    marginBottom: '1rem',
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#9ca3af',
    marginBottom: '0.25rem',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#111',
    margin: '0 0 1.25rem',
  }

  const fieldErrorStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '0.3rem',
    fontWeight: 500,
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff' }}>
        <Header />
        <main>
          <div style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '5rem 1.5rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '72px', height: '72px',
              background: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.75rem',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111', marginBottom: '0.5rem' }}>
              Your cart is empty
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Add some cards before checking out.
            </p>
            <Link href="/products" style={{
              display: 'inline-block',
              background: '#EC1E79',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.9375rem',
              padding: '0.75rem 2rem',
              borderRadius: '10px',
              textDecoration: 'none',
            }}>
              Browse Cards
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header />
      <main>
        {/* Page header */}
        <div style={{
          background: 'linear-gradient(135deg, #000 0%, #111 50%, #0d1a17 100%)',
          padding: '3rem 0 2.5rem',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.025em',
              margin: 0,
            }}>
              Checkout
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
              Complete your order below
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="checkout-layout" style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '2.5rem 1.5rem 4rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
          gap: '2.5rem',
          alignItems: 'start',
        }}>

          {/* LEFT: Form sections */}
          <div className="checkout-form">
            <form onSubmit={e => e.preventDefault()}>

              {/* Section 1: Contact */}
              <div style={sectionCardStyle}>
                <p style={sectionLabelStyle}>Step 1</p>
                <h2 style={sectionTitleStyle}>Contact</h2>

                {/* First + Last name row */}
                <div className="checkout-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="firstName" style={labelStyle}>
                      First name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => handleBlur('firstName', firstName)}
                      placeholder="Jane"
                      style={inputStyle('firstName', !!fieldErrors.firstName)}
                    />
                    {fieldErrors.firstName && <p style={fieldErrorStyle}>{fieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" style={labelStyle}>
                      Last name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => handleBlur('lastName', lastName)}
                      placeholder="Smith"
                      style={inputStyle('lastName', !!fieldErrors.lastName)}
                    />
                    {fieldErrors.lastName && <p style={fieldErrorStyle}>{fieldErrors.lastName}</p>}
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="email" style={labelStyle}>
                    Email address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => handleBlur('email', email)}
                    placeholder="jane@example.com"
                    style={inputStyle('email', !!fieldErrors.email)}
                  />
                  {fieldErrors.email && <p style={fieldErrorStyle}>{fieldErrors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" style={labelStyle}>
                    Phone number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="+44 7700 900000"
                    style={inputStyle('phone')}
                  />
                </div>
              </div>

              {/* Section 2: Shipping address */}
              <div style={sectionCardStyle}>
                <p style={sectionLabelStyle}>Step 2</p>
                <h2 style={sectionTitleStyle}>Shipping address</h2>

                {/* Line 1 */}
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="shippingLine1" style={labelStyle}>
                    Address line 1 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="shippingLine1"
                    type="text"
                    value={shippingLine1}
                    onChange={e => setShippingLine1(e.target.value)}
                    onFocus={() => setFocusedField('shippingLine1')}
                    onBlur={() => handleBlur('shippingLine1', shippingLine1)}
                    placeholder="123 Example Street"
                    style={inputStyle('shippingLine1', !!fieldErrors.shippingLine1)}
                  />
                  {fieldErrors.shippingLine1 && <p style={fieldErrorStyle}>{fieldErrors.shippingLine1}</p>}
                </div>

                {/* Line 2 */}
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="shippingLine2" style={labelStyle}>
                    Address line 2 <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    id="shippingLine2"
                    type="text"
                    value={shippingLine2}
                    onChange={e => setShippingLine2(e.target.value)}
                    onFocus={() => setFocusedField('shippingLine2')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Apartment, suite, etc."
                    style={inputStyle('shippingLine2')}
                  />
                </div>

                {/* City + Postcode row */}
                <div className="checkout-city-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="shippingCity" style={labelStyle}>
                      City <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="shippingCity"
                      type="text"
                      value={shippingCity}
                      onChange={e => setShippingCity(e.target.value)}
                      onFocus={() => setFocusedField('shippingCity')}
                      onBlur={() => handleBlur('shippingCity', shippingCity)}
                      placeholder="London"
                      style={inputStyle('shippingCity', !!fieldErrors.shippingCity)}
                    />
                    {fieldErrors.shippingCity && <p style={fieldErrorStyle}>{fieldErrors.shippingCity}</p>}
                  </div>
                  <div>
                    <label htmlFor="shippingPostcode" style={labelStyle}>
                      Postcode <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="shippingPostcode"
                      type="text"
                      value={shippingPostcode}
                      onChange={e => setShippingPostcode(e.target.value)}
                      onFocus={() => setFocusedField('shippingPostcode')}
                      onBlur={() => handleBlur('shippingPostcode', shippingPostcode)}
                      placeholder="SW1A 1AA"
                      style={inputStyle('shippingPostcode', !!fieldErrors.shippingPostcode)}
                    />
                    {fieldErrors.shippingPostcode && <p style={fieldErrorStyle}>{fieldErrors.shippingPostcode}</p>}
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" style={labelStyle}>
                    Country <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="country"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    onFocus={() => setFocusedField('country')}
                    onBlur={() => handleBlur('country', country)}
                    style={{
                      ...inputStyle('country', !!fieldErrors.country),
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      paddingRight: '2.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  {fieldErrors.country && <p style={fieldErrorStyle}>{fieldErrors.country}</p>}
                </div>
              </div>

              {/* Section 3: Shipping method */}
              <div style={sectionCardStyle}>
                <p style={sectionLabelStyle}>Step 3</p>
                <h2 style={sectionTitleStyle}>Shipping method</h2>

                {loadingRates ? (
                  /* Loading skeleton */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[0, 1].map(i => (
                      <div key={i} style={{
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            height: '14px',
                            borderRadius: '6px',
                            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            width: '55%',
                            marginBottom: '0.5rem',
                          }} />
                          <div style={{
                            height: '11px',
                            borderRadius: '6px',
                            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            width: '35%',
                          }} />
                        </div>
                        <div style={{
                          height: '16px',
                          width: '48px',
                          borderRadius: '6px',
                          background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite',
                        }} />
                      </div>
                    ))}
                  </div>
                ) : noRates ? (
                  <div style={{
                    background: '#fff7ed',
                    border: '1.5px solid #fed7aa',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    fontSize: '0.875rem',
                    color: '#92400e',
                    fontWeight: 500,
                  }}>
                    We don&apos;t have standard shipping rates for this destination. Please{' '}
                    <a href="mailto:hello@example.com" style={{ color: '#EC1E79', fontWeight: 700 }}>contact us</a>
                    {' '}for shipping options.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {shippingRates.map(rate => {
                      const isSelected = selectedRateId === rate.id
                      const isFree = rate.price === 0
                      return (
                        <button
                          key={rate.id}
                          type="button"
                          onClick={() => {
                            setSelectedRateId(rate.id)
                            setFieldErrors(prev => ({ ...prev, shippingMethod: undefined }))
                          }}
                          style={{
                            border: `1.5px solid ${isSelected ? '#EC1E79' : isFree ? '#EC1E79' : '#e5e7eb'}`,
                            borderRadius: '10px',
                            padding: '1rem',
                            background: isSelected ? 'rgba(236,30,121,0.05)' : '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'left',
                            width: '100%',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* Radio indicator */}
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? '#EC1E79' : '#d1d5db'}`,
                              background: isSelected ? '#EC1E79' : '#fff',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {isSelected && (
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: '#fff',
                                }} />
                              )}
                            </div>
                            <div>
                              <p style={{
                                margin: 0,
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: '#111',
                                lineHeight: 1.3,
                              }}>
                                {rate.name}
                                {isFree && (
                                  <span style={{
                                    marginLeft: '0.5rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: '#EC1E79',
                                    background: 'rgba(236,30,121,0.1)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                  }}>
                                    Free
                                  </span>
                                )}
                              </p>
                              <p style={{
                                margin: '0.2rem 0 0',
                                fontSize: '0.8rem',
                                color: '#6b7280',
                              }}>
                                {rate.minDays === rate.maxDays
                                  ? `${rate.minDays} business day${rate.minDays !== 1 ? 's' : ''}`
                                  : `${rate.minDays}–${rate.maxDays} business days`}
                              </p>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.9375rem',
                            fontWeight: 800,
                            color: isFree ? '#EC1E79' : '#111',
                            whiteSpace: 'nowrap',
                            marginLeft: '0.75rem',
                          }}>
                            {rate.price === 0 ? 'Free' : `£${rate.price.toFixed(2)}`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {fieldErrors.shippingMethod && (
                  <p style={{ ...fieldErrorStyle, marginTop: '0.5rem' }}>{fieldErrors.shippingMethod}</p>
                )}
              </div>

              {/* Section 4: Discount code (collapsible) */}
              <div style={sectionCardStyle}>
                <button
                  type="button"
                  onClick={() => setDiscountOpen(prev => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    width: '100%',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: discountOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Got a discount code?
                </button>

                {discountOpen && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {discountApplied ? (
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#15803d' }}>
                            {discountApplied.type === 'percentage'
                              ? `${discountApplied.value}% off applied`
                              : `£${discountApplied.value.toFixed(2)} off applied`} — saving £{discountApplied.savings.toFixed(2)}
                          </p>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', color: '#16a34a' }}>
                            Code: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{discountApplied.code}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setDiscountApplied(null); setDiscountCode('') }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            padding: 0,
                            fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={discountCode}
                          onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(null) }}
                          onFocus={() => setFocusedField('discount')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Enter code"
                          style={{
                            ...inputStyle('discount'),
                            flex: 1,
                            fontFamily: 'monospace',
                            letterSpacing: '0.05em',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyDiscount}
                          disabled={applyingDiscount || !discountCode.trim()}
                          style={{
                            background: '#111',
                            color: '#fff',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '10px',
                            padding: '0 1.25rem',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            cursor: applyingDiscount || !discountCode.trim() ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                            fontFamily: 'inherit',
                            opacity: !discountCode.trim() ? 0.5 : 1,
                          }}
                        >
                          {applyingDiscount ? 'Checking...' : 'Apply'}
                        </button>
                      </div>
                    )}

                    {discountError && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: '#dc2626', fontWeight: 500 }}>
                        {discountError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Global error */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '0.75rem',
                }}>
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* RIGHT: Order summary (sticky) */}
          <div className="checkout-summary" style={{
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '14px',
            padding: '1.75rem',
            position: 'sticky',
            top: '90px',
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111', marginBottom: '1.25rem', margin: '0 0 1.25rem' }}>
              Your order
            </h2>

            {/* Cart items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
              {items.map(item => {
                const initial = item.product.name.charAt(0).toUpperCase()
                const hasImage = item.product.images && item.product.images.length > 0
                return (
                  <div key={item.product.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}>
                    {/* Image or initial */}
                    {hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1px solid #e5e7eb',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #EC1E7922, #EC1E7944)',
                        border: '1.5px solid #EC1E7944',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: '#EC1E79',
                        flexShrink: 0,
                      }}>
                        {initial}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#111',
                        margin: 0,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.product.name}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0.15rem 0 0' }}>
                        {item.quantity} &times; £{item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: '#111',
                      whiteSpace: 'nowrap',
                    }}>
                      £{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1.5px solid #e5e7eb', paddingTop: '1rem' }}>
              {/* Subtotal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111' }}>
                  £{subtotal.toFixed(2)}
                </span>
              </div>

              {/* Shipping */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {selectedRate ? selectedRate.name : 'Shipping'}
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: selectedRate && selectedRate.price === 0 ? '#EC1E79' : '#111' }}>
                  {selectedRate
                    ? selectedRate.price === 0 ? 'Free' : `£${selectedRate.price.toFixed(2)}`
                    : <span style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>Select shipping</span>}
                </span>
              </div>

              {/* Discount */}
              {discountApplied && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#15803d' }}>
                    Discount ({discountApplied.code})
                  </span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#16a34a' }}>
                    -£{discountApplied.savings.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: '1px', background: '#e5e7eb', margin: '0.75rem 0' }} />

              {/* Total */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111' }}>Total</span>
                <span style={{ fontSize: '1.375rem', fontWeight: 900, color: '#EC1E79' }}>
                  £{effectiveTotal.toFixed(2)}
                </span>
              </div>

              {/* Pay with Card */}
              <button
                type="button"
                onClick={handlePayWithCard}
                disabled={submitting !== null}
                style={{
                  background: submitting === 'card' ? '#99f0e0' : '#EC1E79',
                  color: '#000',
                  border: 'none',
                  padding: '0.9rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: submitting !== null ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  width: '100%',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                {submitting === 'card' ? (
                  'Redirecting to payment...'
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Pay with Card
                  </>
                )}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>

              {/* Pay Later */}
              <button
                type="button"
                onClick={handlePayLater}
                disabled={submitting !== null}
                style={{
                  background: 'transparent',
                  color: submitting === 'invoice' ? '#9ca3af' : '#374151',
                  border: `1.5px solid ${submitting === 'invoice' ? '#e5e7eb' : '#d1d5db'}`,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: submitting !== null ? 'not-allowed' : 'pointer',
                  transition: 'border-color 0.2s, color 0.2s',
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              >
                {submitting === 'invoice' ? 'Placing Order...' : 'Pay Later / Invoice'}
              </button>

              <p style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                textAlign: 'center',
                marginTop: '0.875rem',
                lineHeight: 1.5,
              }}>
                Pay securely by card, or choose Pay Later and we&apos;ll send an invoice.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr !important;
            padding: 1.5rem 1rem 3rem !important;
          }
          .checkout-form {
            width: 100% !important;
          }
          .checkout-summary {
            position: static !important;
            width: 100% !important;
            border-top: 1.5px solid #e5e7eb;
            border-radius: 0 !important;
            padding: 1.5rem 0 !important;
            background: transparent !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: none !important;
          }
        }

        @media (max-width: 480px) {
          .checkout-name-row {
            grid-template-columns: 1fr !important;
          }
          .checkout-city-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
