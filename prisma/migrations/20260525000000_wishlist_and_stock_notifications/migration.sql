-- Wishlist table
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Wishlist_userId_productId_key" ON "Wishlist"("userId", "productId");
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");

ALTER TABLE "Wishlist"
  ADD CONSTRAINT "Wishlist_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- StockNotification table (back-in-stock subscriptions)
CREATE TABLE "StockNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "StockNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockNotification_userId_productId_key" ON "StockNotification"("userId", "productId");
CREATE INDEX "StockNotification_productId_idx" ON "StockNotification"("productId");
CREATE INDEX "StockNotification_notifiedAt_idx" ON "StockNotification"("notifiedAt");

ALTER TABLE "StockNotification"
  ADD CONSTRAINT "StockNotification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
