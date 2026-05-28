-- Security hardening migration. Backs the C5 webhook fix + the H2 session
-- hardening (tokenVersion-based revocation) work.

-- ── Order.stripeSessionId ───────────────────────────────────────────────
-- Persist the Stripe Checkout session id when the order is created so the
-- webhook can verify the incoming session_id matches the order it's about
-- to flip to paid. Closes the "pay £1 for someone else's £900 order by
-- pointing metadata.orderId at it" attack.
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;
CREATE INDEX IF NOT EXISTS "Order_stripeSessionId_idx" ON "Order"("stripeSessionId");

-- ── AdminUser.tokenVersion + User.tokenVersion ──────────────────────────
-- Increment on password change or on a "sign out everywhere" action. JWT
-- payload includes the tokenVersion at sign time; on every request, the
-- session helper compares the token's version to the DB column and rejects
-- if stale. Enables real session revocation without a server-side store.
ALTER TABLE "AdminUser"
  ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
