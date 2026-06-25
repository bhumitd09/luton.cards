-- Raw-single card condition (NM/LP/MP/HP/DMG). Idempotent.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "condition" TEXT;
