'use client'

/**
 * Admin toast system. One provider mounted in the admin layout; any admin
 * page calls `useToast()` and gets `.success() / .error() / .info()`.
 *
 *   const toast = useToast()
 *   toast.success('Product saved')
 *   toast.error('Could not delete')
 *
 * Replaces the ad-hoc per-page status state with one consistent,
 * bottom-right stack. Auto-dismisses; click to dismiss early.
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; type: ToastType; message: string }

interface ToastApi {
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const noop = () => {}
const ToastContext = createContext<ToastApi>({ show: noop, success: noop, error: noop, info: noop })

const STYLES: Record<ToastType, { color: string; bg: string; border: string; Icon: typeof Check }> = {
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: Check },
  error: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', Icon: AlertCircle },
  info: { color: '#EC1E79', bg: 'rgba(236,30,121,0.12)', border: 'rgba(236,30,121,0.3)', Icon: Info },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => remove(id), 3800)
  }, [remove])

  const api: ToastApi = {
    show,
    success: m => show(m, 'success'),
    error: m => show(m, 'error'),
    info: m => show(m, 'info'),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof window !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 10000,
            display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360, pointerEvents: 'none',
          }}
        >
          {toasts.map(t => {
            const s = STYLES[t.type]
            const Icon = s.Icon
            return (
              <div
                key={t.id}
                onClick={() => remove(t.id)}
                style={{
                  pointerEvents: 'auto', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: '#0f0f10', border: `1px solid ${s.border}`,
                  borderLeft: `3px solid ${s.color}`,
                  borderRadius: 12, padding: '0.7rem 0.85rem',
                  boxShadow: '0 16px 40px -12px rgba(0,0,0,0.7)',
                  color: '#f4f4f5', fontSize: 13.5, fontWeight: 600, lineHeight: 1.45,
                  animation: 'lcToastIn 180ms cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: 6, background: s.bg, flexShrink: 0, marginTop: 1,
                }}>
                  <Icon size={13} color={s.color} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{t.message}</span>
                <X size={14} color="#6b7280" style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
            )
          })}
        </div>,
        document.body,
      )}
      <style>{`@keyframes lcToastIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
