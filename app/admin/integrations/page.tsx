'use client'

import { useEffect, useState } from 'react'

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

  const webhookUrl = 'https://lutoncards.com/api/webhooks/collecttcg'

  useEffect(() => {
    // Load saved settings
    fetch('/api/content?keys=collecttcg_api_url,collecttcg_api_key,collecttcg_webhook_secret')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data.collecttcg_api_url) setApiUrl(data.collecttcg_api_url)
        if (data.collecttcg_api_key) setApiKey(data.collecttcg_api_key)
        if (data.collecttcg_webhook_secret) setWebhookSecret(data.collecttcg_webhook_secret)
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
      await Promise.all([
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
      setSaveMsg('Settings saved.')
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
    const colors: Record<string, { bg: string; color: string }> = {
      success: { bg: 'rgba(236,30,121,0.15)', color: '#EC1E79' },
      partial: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
      error: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    }
    const c = colors[status] || { bg: '#1f1f1f', color: '#6b7280' }
    return (
      <span style={{
        background: c.bg,
        color: c.color,
        fontSize: '0.75rem',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '999px',
        textTransform: 'capitalize',
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
    marginBottom: '0.375rem',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#fff',
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '1rem',
    paddingBottom: '0.625rem',
    borderBottom: '1px solid #1f1f1f',
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
          Integrations
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.375rem 0 0' }}>
          Connect external platforms to sync inventory and data.
        </p>
      </div>

      {/* Integration card */}
      <div style={{
        background: '#111',
        border: '1px solid #1f1f1f',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1f1f1f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <img
              src="https://collecttcg.co.uk/logo/CollectTCG.png"
              alt="CollectTCG"
              style={{ height: '32px', width: 'auto', display: 'block' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9375rem' }}>
                CollectTCG Inventory Sync
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '1px' }}>
                collecttcg.co.uk
              </div>
            </div>
          </div>
          <span style={{
            background: isConfigured ? 'rgba(236,30,121,0.15)' : '#1a1a1a',
            color: isConfigured ? '#EC1E79' : '#6b7280',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '999px',
            border: isConfigured ? '1px solid rgba(236,30,121,0.3)' : '1px solid #2a2a2a',
          }}>
            {isConfigured ? 'Connected' : 'Not configured'}
          </span>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #1f1f1f',
          padding: '0 1.5rem',
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
                fontWeight: 600,
                color: activeTab === tab ? '#EC1E79' : '#6b7280',
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
          <div style={{ padding: '1.5rem' }}>

            {/* API Connection */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={sectionTitleStyle}>API Connection</div>
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
                      background: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: testing || !apiUrl || !apiKey ? '#4b5563' : '#9ca3af',
                      cursor: testing || !apiUrl || !apiKey ? 'not-allowed' : 'pointer',
                      padding: '0.5rem 1.125rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      background: '#EC1E79',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#000',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  {saveMsg && (
                    <span style={{ fontSize: '0.8125rem', color: saveMsg.includes('Failed') ? '#ef4444' : '#EC1E79', fontWeight: 600 }}>
                      {saveMsg}
                    </span>
                  )}
                </div>

                {/* Test result */}
                {testResult && (
                  <div style={{
                    background: testResult.connected ? 'rgba(236,30,121,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${testResult.connected ? 'rgba(236,30,121,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.82rem',
                    color: testResult.connected ? '#EC1E79' : '#ef4444',
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
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem', lineHeight: 1.6 }}>
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
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: copied ? '#EC1E79' : '#9ca3af',
                        cursor: 'pointer',
                        padding: '0.625rem 1rem',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
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
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem', lineHeight: 1.6 }}>
                Pull all products from CollectTCG now. New products will be created; existing ones will be updated.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSync}
                  disabled={syncing || !isConfigured}
                  style={{
                    background: isConfigured && !syncing ? '#EC1E79' : '#1a1a1a',
                    border: isConfigured && !syncing ? 'none' : '1px solid #2a2a2a',
                    borderRadius: '10px',
                    color: isConfigured && !syncing ? '#000' : '#4b5563',
                    cursor: syncing || !isConfigured ? 'not-allowed' : 'pointer',
                    padding: '0.75rem 1.75rem',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
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
                        border: '2px solid rgba(0,0,0,0.3)',
                        borderTop: '2px solid #000',
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
                  background: syncResult.error ? 'rgba(239,68,68,0.08)' : 'rgba(236,30,121,0.08)',
                  border: `1px solid ${syncResult.error ? 'rgba(239,68,68,0.25)' : 'rgba(236,30,121,0.25)'}`,
                  borderRadius: '8px',
                  padding: '0.875rem 1rem',
                  fontSize: '0.875rem',
                  color: syncResult.error ? '#ef4444' : '#EC1E79',
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
          <div style={{ padding: '1.5rem' }}>
            {logs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#4b5563',
                fontSize: '0.9375rem',
              }}>
                No syncs yet. Run your first sync above.
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
                          color: '#4b5563',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderBottom: '1px solid #1f1f1f',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {formatDate(log.createdAt)}
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          {statusBadge(log.status)}
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#EC1E79', fontWeight: 600 }}>
                          {log.created}
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#9ca3af' }}>
                          {log.updated}
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>
                          {log.skipped}
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {log.duration}ms
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280', maxWidth: '240px' }}>
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
