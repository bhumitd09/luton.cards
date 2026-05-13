-- Add shipping fields to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingLine1" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingLine2" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCity" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingPostcode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCountry" TEXT DEFAULT 'GB';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCost" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingCarrier" TEXT;

-- ShippingZone table
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countries" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- ShippingRate table
CREATE TABLE "ShippingRate" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "minDays" INTEGER NOT NULL DEFAULT 1,
    "maxDays" INTEGER NOT NULL DEFAULT 5,
    "freeAbove" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
