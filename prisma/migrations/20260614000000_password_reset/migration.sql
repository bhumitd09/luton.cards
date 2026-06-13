-- Password reset token fields (idempotent).
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "resetTokenHash" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);
