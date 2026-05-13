CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "body" TEXT NOT NULL,
  "productRef" TEXT,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
