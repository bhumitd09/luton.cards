-- Track whether an order's stock has been taken off the shelf (idempotent decrement)
ALTER TABLE "Order" ADD COLUMN "stockDecremented" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing paid/shipped/delivered orders have already sold, so mark
-- them as decremented to avoid a future status change double-counting them.
UPDATE "Order" SET "stockDecremented" = true WHERE "status" IN ('paid', 'shipped', 'delivered');
