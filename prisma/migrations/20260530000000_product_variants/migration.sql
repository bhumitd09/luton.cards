-- Product variants: one row per (productId, condition, foil) combo.
-- Each variant has its own price + stock so a Near Mint Holofoil can cost
-- more than a Damaged Normal of the same card. Additive — products without
-- variants keep using their base price/stock and the storefront falls
-- back to the existing single-SKU flow.

CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id"        TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "condition" TEXT NOT NULL,
  "foil"      TEXT,
  "price"     DOUBLE PRECISION NOT NULL,
  "stock"     INTEGER NOT NULL DEFAULT 0,
  "sku"       TEXT,
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- A given product can only have one row per (condition, foil) combo.
-- Postgres treats NULL as distinct for unique constraints, so two rows
-- where foil IS NULL with the same condition would still slip past. The
-- API enforces a single "no-foil" variant per condition by treating NULL
-- and the absence of a foil value the same — the unique index here is
-- defence in depth for the common case.
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_productId_condition_foil_key"
  ON "ProductVariant"("productId", "condition", "foil");
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");

ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "ProductVariant_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- OrderItem: link + snapshot of the condition/foil sold so historical
-- orders still display the variant even after the variant row is deleted.
ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "variantId"        TEXT,
  ADD COLUMN IF NOT EXISTS "variantCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "variantFoil"      TEXT;

CREATE INDEX IF NOT EXISTS "OrderItem_variantId_idx" ON "OrderItem"("variantId");

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
