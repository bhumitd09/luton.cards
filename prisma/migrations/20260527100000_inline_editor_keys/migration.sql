-- Seed CMS keys exposed by the new inline editor on the storefront.
-- These are written to as soon as an admin clicks Save on any pencil icon;
-- pre-seeding so:
--   1. Admin sees the current default copy in the editor input (not blank).
--   2. The /admin keys list (if shown anywhere) includes all editable surfaces.
--   3. Future schema-level reporting can show "which CMS fields are missing".
--
-- Idempotent: ON CONFLICT DO NOTHING means re-running never overwrites
-- admin-edited copy. Each row gets a fixed seed id because Prisma uses
-- app-side cuid() (no DB default).

-- ── About page ──────────────────────────────────────────────────────────
INSERT INTO "Content" ("id", "key", "value", "type", "label", "updatedAt") VALUES
  ('seed_about_hero_subtitle',  'about_hero_subtitle',
   'We vend at events across the UK. Pokémon, One Piece, raw singles, graded slabs, sealed product. A proper shop is on the way. Until then, find us at the next event or shop online.',
   'text', 'About: hero subtitle', NOW()),
  ('seed_about_story_p1',  'about_story_p1',
   'Bash, Ramz and Bhumit linked up in lockdown. Warzone lobbies, late nights, friendship stuck. Pokémon dragged us back to the hobby, One Piece TCG dropped, and we were cooked.',
   'text', 'About story: paragraph 1 (origin)', NOW()),
  ('seed_about_story_p2',  'about_story_p2',
   'We met Allan vending at the same Milton Keynes event. That is where it all started. He joined the crew not long after, and it has been the same ever since. Family.',
   'text', 'About story: paragraph 2 (Allan)', NOW()),
  ('seed_about_story_p3',  'about_story_p3',
   'We are not a shop yet. We vend at events across the UK with raw singles, graded slabs and sealed product you can actually trust. A proper bricks and mortar spot is the long game.',
   'text', 'About story: paragraph 3 (vending / future)', NOW()),
  ('seed_about_story_p4',  'about_story_p4',
   'Dysfunctional family energy. We hype every PSA 10 and roast every PSA 7. Different specialisms, same obsession.',
   'text', 'About story: paragraph 4 (vibe)', NOW()),
  ('seed_about_mission_quote', 'about_mission_quote',
   'A vending crew run by people who actually collect. Properly sourced stock, fair pricing, and a community that puts the hobby first.',
   'text', 'About: mission quote', NOW()),
  ('seed_about_cta_body', 'about_cta_body',
   'Or skip the queue and shop the latest singles, graded slabs and sealed product online. We pack every order like it matters, because it does.',
   'text', 'About: CTA body', NOW())
ON CONFLICT ("key") DO NOTHING;

-- ── Ethos strip (homepage) ─────────────────────────────────────────────
-- The ethos strip already had fallbacks in the component but no seeded rows.
-- Seed the labels + headline + 3 pillars so the inline editor opens with
-- real copy not blank inputs.
INSERT INTO "Content" ("id", "key", "value", "type", "label", "updatedAt") VALUES
  ('seed_ethos_label',     'ethos_label',     'How we operate',                          'text', 'Ethos: eyebrow label', NOW()),
  ('seed_ethos_headline',  'ethos_headline',  'We buy them,' || chr(10) || 'grade them, sell them.', 'text', 'Ethos: headline',      NOW()),
  ('seed_ethos_01_title',  'ethos_01_title',  'We grade. We source.',                    'text', 'Ethos 01: title', NOW()),
  ('seed_ethos_01_body',   'ethos_01_body',
   'Some cards we buy raw and send off ourselves to PSA, CGC, ACE. Others we pick up already slabbed. Either way, we know the card before it goes on the site.',
   'text', 'Ethos 01: body', NOW()),
  ('seed_ethos_02_title',  'ethos_02_title',  'No funny pricing.',                       'text', 'Ethos 02: title', NOW()),
  ('seed_ethos_02_body',   'ethos_02_body',
   'We are collectors too. We know what things are worth and we price accordingly. You will not find us sticking a random number on something and hoping for the best.',
   'text', 'Ethos 02: body', NOW()),
  ('seed_ethos_03_title',  'ethos_03_title',  'Packed like it matters.',                 'text', 'Ethos 03: title', NOW()),
  ('seed_ethos_03_body',   'ethos_03_body',
   'Because it does. We have all had that sinking feeling when a parcel arrives dented. Every order goes out wrapped properly, not just chucked in a bag.',
   'text', 'Ethos 03: body', NOW())
ON CONFLICT ("key") DO NOTHING;
