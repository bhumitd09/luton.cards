-- About page refresh: drop "shop" framing, remove em-dashes from bios,
-- introduce about_group_photo CMS key (empty default so admin uploads via /admin/team).

-- 1. Refresh team_members bios with no em-dashes, casual voice.
UPDATE "Content"
SET "value" = '[{"name":"Bhumit","role":"Vintage Pokémon Specialist","tag":"Base Set & Beyond","photo":"","bio":"The vintage hunter. Hand picks pre-2003 Pokémon, Base Set holos, gold stars and sealed wax that''s older than most of the people buying it."},{"name":"Bash","role":"One Piece Specialist","tag":"OP-01 to Now","photo":"","bio":"Lives and breathes One Piece TCG. Knows every set, every alt art, every leader meta. If it''s an OP card, Bash has an opinion on it."},{"name":"Ramz","role":"Pokémon & One Piece Specialist","tag":"Modern Sets Master","photo":"","bio":"The all rounder. Tracks modern Pokémon sets and One Piece releases side by side. First to know what''s about to spike."},{"name":"Allan","role":"Grading & Sealed Specialist","tag":"PSA · CGC · ACE","photo":"","bio":"Years of PSA, CGC and ACE submissions plus a sealed vault that''s the envy of UK collectors. Every slab on the site has been through his hands."}]',
    "label" = 'Team Members',
    "type" = 'json',
    "updatedAt" = NOW()
WHERE "key" = 'team_members';

-- 2. Seed an empty about_group_photo row so /admin/team has somewhere to save into.
-- Prisma uses cuid() at the application layer, so we use a fixed string ID for
-- the seeded row (overwritten as soon as admin uploads via the API upsert).
INSERT INTO "Content" ("id", "key", "value", "type", "label", "updatedAt")
VALUES ('seed_about_group_photo', 'about_group_photo', '', 'text', 'About: Group Photo', NOW())
ON CONFLICT ("key") DO NOTHING;
