-- First-login onboarding gate for team members. New accounts created by a
-- superadmin are forced through /admin/onboarding (password + 2FA + payout
-- details) before they can use the back office. Existing accounts default to
-- false so they are never gated retroactively.
ALTER TABLE "AdminUser" ADD COLUMN "mustOnboard" BOOLEAN NOT NULL DEFAULT false;
