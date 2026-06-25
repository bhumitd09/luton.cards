import { db } from '@/lib/db'

/**
 * Store-wide admin notification feed (the back-office bell).
 *
 * Best-effort: a notification is a nicety, never a reason to fail the
 * operation that triggered it — so creation errors are swallowed and logged.
 */
export type NotificationType = 'sale' | 'refund' | 'order' | 'low-stock' | 'contact'

export async function notifyAdmins(input: {
  type: NotificationType
  title: string
  body?: string
  href?: string
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      },
    })
  } catch (err) {
    console.error('notifyAdmins failed:', err)
  }
}
