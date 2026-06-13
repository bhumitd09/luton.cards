import { NextRequest } from 'next/server'
import { POST as checkoutPost } from '@/app/api/checkout/route'

/**
 * POST /api/stripe/checkout — legacy alias.
 *
 * The real checkout logic now lives in the provider-agnostic /api/checkout
 * (which delegates to the active payment driver — see lib/payments). This
 * alias is kept so any older caller / bookmark keeps working. New code
 * should call /api/checkout directly.
 */
export function POST(req: NextRequest) {
  return checkoutPost(req)
}
