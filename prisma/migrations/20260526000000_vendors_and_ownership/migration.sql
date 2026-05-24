-- Vendor / consignment support.
-- Each AdminUser becomes a potential vendor with their own stock and
-- commission rate. Products carry vendorId so only the owning vendor can
-- edit/delete (superadmin sees everything but can only edit own).
-- OrderItem snapshots the vendor + payout math at sale time so historical
-- payouts are frozen even if commission rates or product ownership change.

-- ── AdminUser additions ─────────────────────────────────────────────────
ALTER TABLE "AdminUser"
  ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payoutNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

-- Change column default for role to 'vendor' for new rows (existing rows untouched).
ALTER TABLE "AdminUser" ALTER COLUMN "role" SET DEFAULT 'vendor';

-- ── Product additions ───────────────────────────────────────────────────
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "vendorId" TEXT;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Product_vendorId_idx" ON "Product"("vendorId");

-- Backfill: assign every existing product to the first superadmin found.
-- This makes Bhumit (or whoever is set up first) the owner of legacy stock
-- which is fine — he's the founder. Vendor members get their own stock
-- going forward via the admin/members invite flow.
UPDATE "Product"
SET "vendorId" = (
  SELECT "id" FROM "AdminUser"
  WHERE "role" = 'superadmin'
  ORDER BY "createdAt" ASC
  LIMIT 1
)
WHERE "vendorId" IS NULL;

-- ── OrderItem additions ─────────────────────────────────────────────────
ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "vendorId" TEXT,
  ADD COLUMN IF NOT EXISTS "vendorPayout" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payoutPaidAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "payoutNote" TEXT;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "OrderItem_vendorId_idx" ON "OrderItem"("vendorId");
CREATE INDEX IF NOT EXISTS "OrderItem_payoutPaidAt_idx" ON "OrderItem"("payoutPaidAt");

-- Backfill: copy the product's current vendorId onto historical OrderItems.
-- vendorPayout + platformFee stay 0 for historical orders because we can't
-- safely recompute them — commission rates may have changed since.
UPDATE "OrderItem" oi
SET "vendorId" = p."vendorId"
FROM "Product" p
WHERE oi."productId" = p."id"
  AND oi."vendorId" IS NULL;
