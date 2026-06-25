import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { MAINT_BYPASS_COOKIE, maintenanceBypassToken } from '@/lib/maintenance-token'

const ADMIN_COOKIE = 'luton_admin_token'
const DEFAULT_TITLE = 'We’ll be right back'
const DEFAULT_MESSAGE = "We're updating the shop and restocking some cards. We'll be open again very soon — thanks for your patience."

export interface MaintenanceState {
  enabled: boolean
  title: string
  message: string
}

/** Read the site-lock state from the Content table (server-side, no fetch). */
export async function getMaintenanceState(): Promise<MaintenanceState> {
  try {
    const rows = await db.content.findMany({
      where: { key: { in: ['maintenance_enabled', 'maintenance_title', 'maintenance_message'] } },
      select: { key: true, value: true },
    })
    const map = new Map(rows.map(r => [r.key, r.value]))
    return {
      enabled: map.get('maintenance_enabled') === 'true',
      title: (map.get('maintenance_title') || '').trim() || DEFAULT_TITLE,
      message: (map.get('maintenance_message') || '').trim() || DEFAULT_MESSAGE,
    }
  } catch {
    // Fail open — never lock the site on a read error.
    return { enabled: false, title: DEFAULT_TITLE, message: DEFAULT_MESSAGE }
  }
}

/**
 * Decide whether THIS request should see the holding page.
 * Exempts the back office + the request's own bypass: a signed-in admin (admin
 * cookie) or a visitor who unlocked with the password (valid bypass cookie).
 */
export async function shouldGate(pathname: string, state: MaintenanceState): Promise<boolean> {
  if (!state.enabled) return false
  if (pathname.startsWith('/admin') || pathname.startsWith('/maintenance')) return false

  const jar = cookies()
  if (jar.get(ADMIN_COOKIE)?.value) return false // signed-in staff pass through

  const bypass = jar.get(MAINT_BYPASS_COOKIE)?.value
  if (bypass && bypass === (await maintenanceBypassToken())) return false

  return true
}
