-- Email verification + guest-order claim
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "verifyTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "verifyTokenExpiry" TIMESTAMP(3);
