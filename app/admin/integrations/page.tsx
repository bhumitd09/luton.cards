'use client'

import { useEffect, useState } from 'react'
import { Plug } from 'lucide-react'

interface SyncLog {
  id: string
  source: string
  status: string
  message: string | null
  created: number
  updated: number
  skipped: number
  duration: number
  createdAt: string
}

interface TestResult {
  connected: boolean
  productCount?: number
  error?: string
}

interface SyncResult {
  created: number
  updated: number
  skipped: number
  errors: string[]
  duration: number
  error?: string
}

interface ProviderStatus {
  name: 'stripe' | 'square'
  label: string
  active: boolean
  configured: boolean
  envVars: { key: string; present: boolean; required: boolean }[]
}

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings')

  // Settings state
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [copied, setCopied] = useState(false)

  // Payment gateways (Stripe / Square) status
  const [payProviders, setPayProviders] = useState<ProviderStatus[]>([])
  const [activeProvider, setActiveProvider] = useState<string>('stripe')

  // Derive the webhook URL from the actual origin so it's correct on any
  // domain (was hardcoded to lutoncards.com).
  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || '')}/api/webhooks/collecttcg`

  useEffect(() => {
    // Load saved settings via the superadmin content collection. The public
    // /api/content endpoint now filters to an allowlist (collecttcg_* keys are
    // intentionally NOT public), so we read them from the authenticated
    // admin collection instead — secrets never hit a public endpoint.
    fetch('/api/admin/content')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const rows: { key: string; value: string }[] = data?.content ?? []
        const byKey: Record<string, string> = {}
        rows.forEach(r => { byKey[r.key] = r.value })
        if (byKey.collecttcg_api_url) setApiUrl(byKey.collecttcg_api_url)
        if (byKey.collecttcg_api_key) setApiKey(byKey.collecttcg_api_key)
        if (byKey.collecttcg_webhook_secret) setWebhookSecret(byKey.collecttcg_webhook_secret)
      })
      .catch(() => {})

    // Load payment gateway status (Stripe / Square)
    fetch('/api/admin/payments/status')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.providers) {
          setPayProviders(data.providers)
          setActiveProvider(data.active ?? 'stripe')
        }
      })
      .catch(() => {})

    // Load sync logs
    fetchLogs()
  }, [])

  function fetchLogs() {
    fetch('/api/admin/sync/collecttcg')
      .then(r => r.json())
      .then(data => {
        if (data.logs) setLogs(data.logs)
      })
      .catch(() => {})
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      // fetch only rejects on network failure, so a 401/400/500 would still
      // fall through to "saved" — check res.ok on every response.
      const responses = await Promise.all([
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'collecttcg_api_url', value: apiUrl, label: 'CollectTCG API URL' }),
        }),
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'collecttcg_api_key', value: apiKey, label: 'CollectTCG API Key' }),
        }),
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'collecttcg_webhook_secret', value: webhookSecret, label: 'CollectTCG Webhook Secret' }),
        }),
      ])
      if (responses.every((r) => r.ok)) {
        setSaveMsg('Settings saved.')
      } else {
        const failed = responses.find((r) => !r.ok)
        setSaveMsg(failed?.status === 403 ? 'Only a superadmin can save these.' : 'Failed to save settings.')
      }
    } catch {
      setSaveMsg('Failed to save settings.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/sync/collecttcg/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl: apiUrl.replace(/\/$/, ''), apiKey }),
      })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ connected: false, error: 'Network error' })
    } finally {
      setTesting(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/admin/sync/collecttcg', { method: 'POST' })
      const data = await res.json()
      setSyncResult(data)
      fetchLogs()
    } catch {
      setSyncResult({ created: 0, updated: 0, skipped: 0, errors: [], duration: 0, error: 'Network error' })
    } finally {
      setSyncing(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const isConfigured = !!apiKey

  const lastLog = logs[0]

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function statusBadge(status: string) {
    const colors: Record<string, { bg: string; color: string; border: string }> = {
      success: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
      partial: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
      error: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    }
    const c = colors[status] || { bg: '#161617', color: '#9ca3af', border: '#202022' }
    return (
      <span style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontSize: '0.6875rem',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: '999px',
        textTransform: 'capitalize',
        letterSpacing: '0.02em',
      }}>
        {status}
      </span>
    )
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#9ca3af',
    marginBottom: '0.5rem',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0c0c0d',
    border: '1px solid #202022',
    borderRadius: '11px',
    color: '#fff',
    padding: '0.6rem 0.8rem',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    fontWeight: 800,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #1a1a1c',
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Plug size={12} color="#EC1E79" />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#EC1E79', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
            Integrations
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.025em' }}>
          Integrations
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
          Connect external platforms to sync inventory and data.
        </p>
      </div>

      {/* Integration card */}
      <div style={{
        background: '#0f0f10',
        border: '1px solid #202022',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          padding: '1.25rem 1.35rem',
          borderBottom: '1px solid #1a1a1c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#161617',
              border: '1px solid #202022',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              <img
                src="https://collecttcg.co.uk/logo/CollectTCG.png"
                alt="CollectTCG"
                style={{ maxHeight: '28px', maxWidth: '32px', width: 'auto', display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#f4f4f5', fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
                CollectTCG Inventory Sync
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                collecttcg.co.uk
              </div>
            </div>
          </div>
          <span style={{
            background: isConfigured ? 'rgba(16,185,129,0.1)' : '#161617',
            color: isConfigured ? '#10b981' : '#9ca3af',
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '999px',
            letterSpacing: '0.02em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            border: isConfigured ? '1px solid rgba(16,185,129,0.25)' : '1px solid #202022',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: isConfigured ? '#10b981' : '#6b7280',
            }} />
            {isConfigured ? 'Connected' : 'Not configured'}
          </span>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #1a1a1c',
          padding: '0 1.35rem',
        }}>
          {(['settings', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.875rem 1rem 0.875rem 0',
                marginRight: '1.5rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: activeTab === tab ? '#f4f4f5' : '#6b7280',
                borderBottom: activeTab === tab ? '2px solid #EC1E79' : '2px solid transparent',
                textTransform: 'capitalize',
                transition: 'color 0.15s',
              }}
            >
              {tab === 'settings' ? 'Settings' : 'Sync Logs'}
            </button>
          ))}
        </div>

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div style={{ padding: '1.35rem' }}>

            {/* ── Payment gateways (Stripe / Square) ── */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={sectionTitleStyle}>Payment gateways</div>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 1rem' }}>
                Luton Cards supports two gateways. The active one is set with the{' '}
                <code style={{ background: '#161617', padding: '1px 6px', borderRadius: 5, color: '#FF80B8' }}>PAYMENT_PROVIDER</code>{' '}
                env var on Railway (<code style={{ background: '#161617', padding: '1px 6px', borderRadius: 5, color: '#FF80B8' }}>stripe</code> or{' '}
                <code style={{ background: '#161617', padding: '1px 6px', borderRadius: 5, color: '#FF80B8' }}>square</code>). Keys live in env vars, never the database.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {payProviders.map(p => {
                  const isLive = p.active
                  const ready = p.configured
                  return (
                    <div
                      key={p.name}
                      style={{
                        background: '#0c0c0d',
                        border: `1px solid ${isLive ? 'rgba(236,30,121,0.4)' : '#202022'}`,
                        borderRadius: 14,
                        padding: '1.1rem 1.2rem',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
                          {p.label}
                        </span>
                        {isLive ? (
                          <span style={{
                            fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: '#fff', background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
                            padding: '0.2rem 0.55rem', borderRadius: 999,
                          }}>
                            Active
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: '#6b7280', background: '#161617', border: '1px solid #202022',
                            padding: '0.2rem 0.55rem', borderRadius: 999,
                          }}>
                            Standby
                          </span>
                        )}
                      </div>

                      {/* Readiness pill */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.85rem',
                        color: ready ? '#10b981' : '#f59e0b',
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: ready ? '#10b981' : '#f59e0b' }} />
                        {ready ? 'Configured' : 'Not configured'}
                      </div>

                      {/* Env checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {p.envVars.map(v => (
                          <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
                            <span style={{
                              width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              background: v.present ? 'rgba(16,185,129,0.15)' : v.required ? 'rgba(239,68,68,0.12)' : '#161617',
                              color: v.present ? '#10b981' : v.required ? '#ef4444' : '#6b7280',
                              fontWeight: 800, fontSize: 9,
                            }}>
                              {v.present ? '✓' : '·'}
                            </span>
                            <code style={{ color: v.present ? '#9ca3af' : '#6b7280', fontFamily: 'monospace' }}>
                              {v.key}
                            </code>
                            {!v.required && (
                              <span style={{ fontSize: '0.62rem', color: '#52525b' }}>optional</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {p.name === 'square' && !ready && (
                        <p style={{ fontSize: '0.68rem', color: '#6b7280', margin: '0.75rem 0 0', lineHeight: 1.5 }}>
                          Square driver is stubbed — run <code style={{ color: '#FF80B8' }}>npm i square</code> + implement
                          lib/payments/square.ts to go live.
                        </p>
                      )}
                    </div>
                  )
                })}
                {payProviders.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', padding: '0.5rem' }}>
                    Loading payment status…
                  </div>
                )}
              </div>
            </div>

            {/* API Connection */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={sectionTitleStyle}>CollectTCG API Connection</div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>API Base URL</label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value)}
                    placeholder="https://collecttcg.co.uk"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>API Key</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      style={{ ...inputStyle, paddingRight: '2.75rem' }}
                    />
                    <button
                      onClick={() => setShowApiKey(v => !v)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        padding: '2px',
                        lineHeight: 1,
                      }}
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Test + Save buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={handleTest}
                    disabled={testing || !apiUrl || !apiKey}
                    style={{
                      background: '#161617',
                      border: '1px solid #202022',
                      borderRadius: '11px',
                      color: testing || !apiUrl || !apiKey ? '#6b7280' : '#e4e4e7',
                      cursor: testing || !apiUrl || !apiKey ? 'not-allowed' : 'pointer',
                      padding: '0.6rem 1.1rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      opacity: testing || !apiUrl || !apiKey ? 0.6 : 1,
                    }}
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
                      border: 'none',
                      borderRadius: '11px',
                      color: '#fff',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  {saveMsg && (
                    <span style={{ fontSize: '0.8125rem', color: saveMsg.includes('Failed') ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                      {saveMsg}
                    </span>
                  )}
                </div>

                {/* Test result */}
                {testResult && (
                  <div style={{
                    background: testResult.connected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${testResult.connected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    borderRadius: '11px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.82rem',
                    color: testResult.connected ? '#10b981' : '#ef4444',
                    fontWeight: 500,
                    fontFamily: testResult.connected ? 'inherit' : 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}>
                    {testResult.connected
                      ? `Connected — ${testResult.productCount} product${testResult.productCount === 1 ? '' : 's'} found`
                      : `Connection failed:\n${testResult.error}`}
                  </div>
                )}
              </div>
            </div>

            {/* Webhook section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={sectionTitleStyle}>Webhook (optional, for real-time sync)</div>
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0 0 1rem', lineHeight: 1.6 }}>
                Add this URL as a webhook in your CollectTCG account. When stock changes, CollectTCG will POST to this URL and your inventory updates instantly.
              </p>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Webhook URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={webhookUrl}
                      readOnly
                      style={{ ...inputStyle, color: '#9ca3af', flex: 1 }}
                    />
                    <button
                      onClick={handleCopy}
                      style={{
                        background: '#161617',
                        border: '1px solid #202022',
                        borderRadius: '11px',
                        color: copied ? '#10b981' : '#e4e4e7',
                        cursor: 'pointer',
                        padding: '0.6rem 1rem',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Webhook Secret</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showWebhookSecret ? 'text' : 'password'}
                      value={webhookSecret}
                      onChange={e => setWebhookSecret(e.target.value)}
                      placeholder="Optional — used to verify requests"
                      style={{ ...inputStyle, paddingRight: '2.75rem' }}
                    />
                    <button
                      onClick={() => setShowWebhookSecret(v => !v)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        padding: '2px',
                        lineHeight: 1,
                      }}
                      aria-label={showWebhookSecret ? 'Hide secret' : 'Show secret'}
                    >
                      {showWebhookSecret ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual sync */}
            <div>
              <div style={sectionTitleStyle}>Manual Sync</div>
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0 0 1rem', lineHeight: 1.6 }}>
                Pull all products from CollectTCG now. New products will be created; existing ones will be updated.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSync}
                  disabled={syncing || !isConfigured}
                  style={{
                    background: isConfigured && !syncing ? 'linear-gradient(135deg,#EC1E79,#FF4DA6)' : '#161617',
                    border: isConfigured && !syncing ? 'none' : '1px solid #202022',
                    borderRadius: '11px',
                    color: isConfigured && !syncing ? '#fff' : '#6b7280',
                    cursor: syncing || !isConfigured ? 'not-allowed' : 'pointer',
                    padding: '0.7rem 1.6rem',
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    boxShadow: isConfigured && !syncing ? '0 8px 22px -10px rgba(236,30,121,0.6)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {syncing ? (
                    <>
                      <span style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Syncing...
                    </>
                  ) : 'Sync Now'}
                </button>
                {lastLog && !syncing && !syncResult && (
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    Last sync: {formatDate(lastLog.createdAt)}
                  </span>
                )}
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

              {/* Sync result */}
              {syncResult && (
                <div style={{
                  marginTop: '1rem',
                  background: syncResult.error ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  border: `1px solid ${syncResult.error ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                  borderRadius: '11px',
                  padding: '0.875rem 1rem',
                  fontSize: '0.875rem',
                  color: syncResult.error ? '#ef4444' : '#10b981',
                  fontWeight: 600,
                }}>
                  {syncResult.error
                    ? `Sync failed: ${syncResult.error}`
                    : `Synced — ${syncResult.created} created, ${syncResult.updated} updated, ${syncResult.skipped} skipped (${syncResult.duration}ms)`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs tab */}
        {activeTab === 'logs' && (
          <div style={{ padding: '1.35rem' }}>
            {logs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '999px',
                  background: '#161617',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Plug size={20} color="#6b7280" />
                </div>
                <div style={{ color: '#f4f4f5', fontWeight: 700, fontSize: '0.9375rem' }}>No syncs yet</div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Run your first sync above to see logs here.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      {['Date / Time', 'Status', 'Created', 'Updated', 'Skipped', 'Duration', 'Message'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left',
                          padding: '0.5rem 0.75rem',
                          color: '#6b7280',
                          fontWeight: 700,
                          fontSize: '0.6875rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          borderBottom: '1px solid #1a1a1c',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        style={{ borderBottom: '1px solid #1a1a1c', transition: 'background 0.15s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161617' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <td style={{ padding: '0.7rem 0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {formatDate(log.createdAt)}
                        </td>
                        <td style={{ padding: '0.7rem 0.75rem' }}>
                          {statusBadge(log.status)}
                        </td>
                        <td style={{ padding: '0.7rem 0.75rem', color: '#10b981', fontWeight: 700 }}>
                          {log.created}
                        </td>
                        <td style={{ padding: '0.7rem 0.75rem', color: '#f4f4f5' }}>
                          {log.updated}
                        </td>
                        <td style={{ padding: '0.7rem 0.75rem', color: '#9ca3af' }}>
                          {log.skipped}
                        </td>
                        <td style={{ padding: '0.7rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {log.duration}ms
                        </td>
                        <td style={{ padding: '0.7rem 0.75rem', color: '#6b7280', maxWidth: '240px' }}>
                          {log.message ? (
                            <span title={log.message} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.message}
                            </span>
                          ) : (
                            <span style={{ color: '#374151' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
