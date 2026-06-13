-- Provider-agnostic payment tracking on Order, so adding Square (or any
-- future gateway) needs no further schema changes. stripeSessionId stays
-- for back-compat + the existing Stripe webhook provenance check.

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentRef"      TEXT;

CREATE INDEX IF NOT EXISTS "Order_paymentRef_idx" ON "Order"("paymentRef");
