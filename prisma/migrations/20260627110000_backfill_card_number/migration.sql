-- One-time backfill of Product.cardNumber for listings created before the
-- field existed. Card-database imports append the collector number to the
-- product name as "… #<number>" (e.g. "Charizard (Base Set) #4",
-- "… DOUBLE CRISIS #15 …", "#TG12/TG30"). Pull that token out into cardNumber.
--
-- Safe + idempotent: only touches rows where cardNumber is still empty, and
-- only when the name actually carries a "#<alphanumeric>" token. Products whose
-- name has no number (the source had none at import) are left untouched — they
-- can be set by hand on the edit form.
UPDATE "Product"
SET "cardNumber" = substring("name" FROM '#([A-Za-z0-9/]+)')
WHERE "cardNumber" IS NULL
  AND "name" ~ '#[A-Za-z0-9]';

-- Second pass: catch the bare "N/M" set-number format (e.g. "Espeon 6/12 Box
-- Topper") that some listings carry without a leading '#'. Conservative — only
-- 1-4 digits each side, only when still empty, so it won't grab unrelated text.
UPDATE "Product"
SET "cardNumber" = substring("name" FROM '([0-9]{1,4}/[0-9]{1,4})')
WHERE "cardNumber" IS NULL
  AND "name" ~ '[0-9]{1,4}/[0-9]{1,4}';
