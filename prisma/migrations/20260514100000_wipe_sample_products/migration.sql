-- Wipe the 12 placeholder products that were seeded on first launch.
-- These were never real stock — just storefront populators. Removing them
-- so admin starts with a clean Product table for adding real inventory.
DELETE FROM "Product" WHERE "slug" IN (
  'charizard-g-lvx-holo',
  'lugia-ex-full-art',
  'mew-ex-full-art',
  'kyogre-groudon-legend',
  'darkness-ablaze-booster-box',
  'vivid-voltage-booster-box',
  'lost-origin-booster-box',
  'luffy-leader-alt-art',
  'zoro-super-rare',
  'kid-secret-rare-cgc-9',
  'op01-romance-dawn-booster-box',
  'op02-paramount-war-booster-box'
);
