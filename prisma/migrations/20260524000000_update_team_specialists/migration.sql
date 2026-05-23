-- Update team_members CMS content with new specialist roles (no "Co-Founder").
-- Only updates if the row exists; admin can override anytime via /admin/team.
UPDATE "Content"
SET "value" = '[{"name":"Bhumit","role":"Vintage Pokémon Specialist","tag":"Base Set & Beyond","photo":"","bio":"The vintage hunter. Hand-picks pre-2003 Pokémon — Base Set holos, gold stars, sealed wax that''s older than most of the customers."},{"name":"Bash","role":"One Piece Specialist","tag":"OP-01 to Now","photo":"","bio":"Lives and breathes One Piece TCG. Knows every set, every alt art, every leader meta — if it''s an OP card, Bash has an opinion on it."},{"name":"Ramz","role":"Pokémon & One Piece Specialist","tag":"Modern Sets Master","photo":"","bio":"The all-rounder. Tracks modern Pokémon sets and One Piece releases side by side — the first to know what''s about to spike."},{"name":"Allan","role":"Grading & Sealed Specialist","tag":"PSA · CGC · ACE","photo":"","bio":"The grading specialist. Years of PSA, CGC and ACE submissions plus a sealed vault that''s the envy of UK collectors."}]',
    "label" = 'Team Members',
    "type" = 'json',
    "updatedAt" = NOW()
WHERE "key" = 'team_members';
