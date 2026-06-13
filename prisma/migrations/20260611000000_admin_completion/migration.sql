-- Admin completion program: media scoping, refunds + manual orders,
-- customer profiles, buy-back offers, contact inbox, CMS pages.

-- Media vendor scoping
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
CREATE INDEX IF NOT EXISTS "Media_vendorId_idx" ON "Media"("vendorId");

-- Order: refunds + manual flag
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "refundedAmount" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isManual" BOOLEAN NOT NULL DEFAULT false;

-- SellSubmission: concrete offer
ALTER TABLE "SellSubmission"
  ADD COLUMN IF NOT EXISTS "offerAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "offerSentAt" TIMESTAMP(3);

-- CustomerProfile
CREATE TABLE IF NOT EXISTS "CustomerProfile" (
  "id"         TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "name"       TEXT,
  "adminNotes" TEXT,
  "tags"       TEXT[],
  "blocked"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerProfile_email_key" ON "CustomerProfile"("email");
CREATE INDEX IF NOT EXISTS "CustomerProfile_blocked_idx" ON "CustomerProfile"("blocked");

-- ContactMessage
CREATE TABLE IF NOT EXISTS "ContactMessage" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ContactMessage_status_idx" ON "ContactMessage"("status");
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- Page (CMS legal/help pages)
CREATE TABLE IF NOT EXISTS "Page" (
  "id"        TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Page_slug_key" ON "Page"("slug");
CREATE INDEX IF NOT EXISTS "Page_slug_idx" ON "Page"("slug");
