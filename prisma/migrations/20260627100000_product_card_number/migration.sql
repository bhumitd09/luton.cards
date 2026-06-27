-- Collector card number (e.g. "6/12", "001", "100"). Captured from the card
-- database on import and editable on any listing; matched by storefront search
-- so buyers can find a card by its number.
ALTER TABLE "Product" ADD COLUMN "cardNumber" TEXT;
