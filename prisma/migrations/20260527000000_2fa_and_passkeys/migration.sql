-- 2FA (TOTP) + WebAuthn passkey support for the admin back office.
-- Both features are opt-in per AdminUser and configured at /admin/settings/security.

-- ── AdminUser: TOTP fields ──────────────────────────────────────────────
ALTER TABLE "AdminUser"
  ADD COLUMN IF NOT EXISTS "totpSecret" TEXT,
  ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "totpRecoveryCodes" TEXT[] NOT NULL DEFAULT '{}';

-- ── Passkey credentials ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Passkey" (
  "id"             TEXT NOT NULL,
  "adminUserId"    TEXT NOT NULL,
  "credentialID"   TEXT NOT NULL,
  "publicKey"      BYTEA NOT NULL,
  "counter"        BIGINT NOT NULL DEFAULT 0,
  "transports"     TEXT,
  "name"           TEXT NOT NULL,
  "isDiscoverable" BOOLEAN NOT NULL DEFAULT true,
  "deviceType"     TEXT,
  "backedUp"       BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt"     TIMESTAMP(3),
  CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Passkey_credentialID_key"  ON "Passkey"("credentialID");
CREATE INDEX        IF NOT EXISTS "Passkey_adminUserId_idx"   ON "Passkey"("adminUserId");

ALTER TABLE "Passkey"
  ADD CONSTRAINT "Passkey_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
