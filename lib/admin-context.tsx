'use client'

/**
 * Client-side admin awareness for the storefront.
 *
 * Mounted at the root of every page via the provider. Calls /api/admin/profile
 * once on first mount (cached for the session) and exposes:
 *
 *   - isAdmin: true/false once the check resolves
 *   - loading: while the initial fetch is in flight
 *   - role:    'superadmin' | 'vendor' (or null)
 *
 * The JWT cookie is httpOnly so we can't decode it client-side. We have to
 * ask the server. Doing it via context means every <EditableText> on a page
 * shares one request instead of each spawning its own.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type AdminInfo = {
  id: string
  email: string
  name?: string | null
  role: 'superadmin' | 'vendor'
}

type AdminContextValue = {
  admin: AdminInfo | null
  isAdmin: boolean
  isSuperadmin: boolean
  loading: boolean
  refresh: () => void
}

const AdminContext = createContext<AdminContextValue>({
  admin: null,
  isAdmin: false,
  isSuperadmin: false,
  loading: true,
  refresh: () => {},
})

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [bump, setBump] = useState(0)

  useEffect(() => {
    let aborted = false
    setLoading(true)
    fetch('/api/admin/profile', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (aborted) return
        if (data && data.id) {
          setAdmin({
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
          })
        } else {
          setAdmin(null)
        }
        setLoading(false)
      })
      .catch(() => {
        if (!aborted) {
          setAdmin(null)
          setLoading(false)
        }
      })
    return () => { aborted = true }
  }, [bump])

  return (
    <AdminContext.Provider
      value={{
        admin,
        isAdmin: !!admin,
        isSuperadmin: admin?.role === 'superadmin',
        loading,
        refresh: () => setBump(b => b + 1),
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}
