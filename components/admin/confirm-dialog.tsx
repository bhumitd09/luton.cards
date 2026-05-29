'use client'

/**
 * Promise-based confirm dialog for the admin back office. One provider in
 * the layout; any page does:
 *
 *   const confirm = useConfirm()
 *   if (!(await confirm({ title: 'Delete product?', message: '…', danger: true }))) return
 *   // ...proceed with the destructive action
 *
 * Replaces the browser's native window.confirm() with a styled, on-brand
 * modal. Resolves true on confirm, false on cancel / backdrop / Esc.
 */
import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button for irreversible/destructive actions. */
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(async () => false)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>(resolve => {
      resolver.current = resolve
      setOpts(options)
    })
  }, [])

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result)
    resolver.current = null
    setOpts(null)
  }, [])

  // Esc cancels, Enter confirms while open.
  useEffect(() => {
    if (!opts) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false)
      if (e.key === 'Enter') settle(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [opts, settle])

  const danger = opts?.danger
  const accent = danger ? '#ef4444' : '#EC1E79'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && typeof window !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={e => { if (e.target === e.currentTarget) settle(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            animation: 'lcConfirmFade 130ms ease-out',
          }}
        >
          <div
            style={{
              width: '100%', maxWidth: 420, background: '#0f0f10',
              border: '1px solid #202022', borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 28px 70px -20px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ padding: '1.25rem 1.35rem 0.5rem', display: 'flex', gap: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(236,30,121,0.12)',
              }}>
                <AlertTriangle size={19} color={accent} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
                  {opts.title || 'Are you sure?'}
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: '0.875rem', lineHeight: 1.55, color: '#9ca3af' }}>
                  {opts.message}
                </p>
              </div>
              <button
                onClick={() => settle(false)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2, height: 'fit-content' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '1rem 1.35rem 1.25rem' }}>
              <button
                onClick={() => settle(false)}
                style={{
                  background: '#161617', border: '1px solid #202022', color: '#e4e4e7',
                  fontSize: '0.85rem', fontWeight: 700, padding: '0.55rem 1rem', borderRadius: 11, cursor: 'pointer',
                }}
              >
                {opts.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => settle(true)}
                autoFocus
                style={{
                  background: danger
                    ? 'linear-gradient(135deg,#ef4444,#f87171)'
                    : 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
                  border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 800,
                  padding: '0.55rem 1.1rem', borderRadius: 11, cursor: 'pointer',
                  boxShadow: `0 8px 22px -10px ${danger ? 'rgba(239,68,68,0.7)' : 'rgba(236,30,121,0.6)'}`,
                }}
              >
                {opts.confirmLabel || (danger ? 'Delete' : 'Confirm')}
              </button>
            </div>
          </div>
          <style>{`@keyframes lcConfirmFade { from { opacity: 0 } to { opacity: 1 } }`}</style>
        </div>,
        document.body,
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
