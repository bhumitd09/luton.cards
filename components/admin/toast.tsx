'use client'

/**
 * App-wide toast system. One provider (mounted at the app root) gives any
 * component `useToast()` → `.success() / .error() / .warning() / .info()`.
 *
 *   const toast = useToast()
 *   toast.success('Product saved')
 *   toast.error('Could not delete')   // errors persist until dismissed
 *
 * Features: 4 types with distinct colour + icon, per-type auto-dismiss
 * (errors stay until dismissed), manual dismiss, clean bottom-right stacking,
 * pause-on-hover, and ARIA live regions so screen readers announce them.
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface ToastItem { id: number; type: ToastType; message: string }

interface ToastApi {
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const noop = () => {}
const ToastContext = createContext<ToastApi>({ show: noop, success: noop, error: noop, warning: noop, info: noop })

const STYLES: Record<ToastType, { color: string; bg: string; border: string; Icon: typeof Check }> = {
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: Check },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  Icon: AlertCircle },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', Icon: AlertTriangle },
  info:    { color: '#EC1E79', bg: 'rgba(236,30,121,0.12)', border: 'rgba(236,30,121,0.3)', Icon: Info },
}

// Auto-dismiss duration per type (ms). 0 = persist until dismissed.
const DURATIONS: Record<ToastType, number> = { success: 3800, info: 3800, warning: 5500, error: 0 }

function ToastRow({ toast, onClose }: { toast: ToastItem; onClose: (id: number) => void }) {
  const s = STYLES[toast.type]
  const Icon = s.Icon
  const duration = DURATIONS[toast.type]
  const remaining = useRef(duration)
  const startedAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }, [])
  const start = useCallback((ms: number) => {
    clear()
    if (ms <= 0) return // persist (errors)
    startedAt.current = Date.now()
    timer.current = setTimeout(() => onClose(toast.id), ms)
  }, [clear, onClose, toast.id])

  useEffect(() => { start(remaining.current); return clear }, [start, clear])

  const pause = () => {
    clear()
    if (remaining.current > 0 && startedAt.current) {
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current))
    }
  }
  const resume = () => start(remaining.current)

  return (
    <div
      onClick={() => onClose(toast.id)}
      onMouseEnter={pause}
      onMouseLeave={resume}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
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
      <span style={{ flex: 1, minWidth: 0 }}>{toast.message}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(toast.id) }}
        aria-label="Dismiss notification"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 2, lineHeight: 0 }}
      >
        <X size={14} color="#6b7280" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, type, message }])
  }, [])

  const api: ToastApi = {
    show,
    success: m => show(m, 'success'),
    error: m => show(m, 'error'),
    warning: m => show(m, 'warning'),
    info: m => show(m, 'info'),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof window !== 'undefined' && createPortal(
        <div
          aria-label="Notifications"
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 10000,
            display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360, pointerEvents: 'none',
          }}
        >
          {toasts.map(t => <ToastRow key={t.id} toast={t} onClose={remove} />)}
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
