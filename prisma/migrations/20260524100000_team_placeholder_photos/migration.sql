-- Temporary: populate team_members with placeholder portrait photos so the
-- About page layout can be visually verified before the real photos are
-- uploaded via /admin/team. Photos are sourced from pravatar.cc (free public
-- portrait service). Admin can overwrite at any time from /admin/team.
UPDATE "Content"
SET "value" = '[{"name":"Bhumit","role":"Vintage Pokémon Specialist","tag":"Base Set & Beyond","photo":"https://i.pravatar.cc/400?img=33","bio":"The vintage hunter. Hand-picks pre-2003 Pokémon — Base Set holos, gold stars, sealed wax that''s older than most of the customers."},{"name":"Bash","role":"One Piece Specialist","tag":"OP-01 to Now","photo":"https://i.pravatar.cc/400?img=12","bio":"Lives and breathes One Piece TCG. Knows every set, every alt art, every leader meta — if it''s an OP card, Bash has an opinion on it."},{"name":"Ramz","role":"Pokémon & One Piece Specialist","tag":"Modern Sets Master","photo":"https://i.pravatar.cc/400?img=8","bio":"The all-rounder. Tracks modern Pokémon sets and One Piece releases side by side — the first to know what''s about to spike."},{"name":"Allan","role":"Grading & Sealed Specialist","tag":"PSA · CGC · ACE","photo":"https://i.pravatar.cc/400?img=15","bio":"The grading specialist. Years of PSA, CGC and ACE submissions plus a sealed vault that''s the envy of UK collectors."}]',
    "updatedAt" = NOW()
WHERE "key" = 'team_members';
