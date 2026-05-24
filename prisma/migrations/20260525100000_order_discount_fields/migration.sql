-- Track which discount code was applied at checkout + how much was deducted.
-- Snapshot fields (not foreign-keyed) so admin can later edit/delete the
-- Discount row without nuking historical order records.
ALTER TABLE "Order" ADD COLUMN "discountCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "discountAmount" DOUBLE PRECISION DEFAULT 0;
