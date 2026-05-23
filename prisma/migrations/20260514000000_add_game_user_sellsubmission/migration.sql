-- AlterTable: add `game` column to Product (defaults all existing rows to 'pokemon')
ALTER TABLE "Product" ADD COLUMN "game" TEXT NOT NULL DEFAULT 'pokemon';

-- CreateIndex on the new game column
CREATE INDEX "Product_game_idx" ON "Product"("game");

-- AlterTable: add optional userId link to Order (guest checkout keeps NULL)
ALTER TABLE "Order" ADD COLUMN "userId" TEXT;

-- CreateIndex on Order.userId
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateTable: User (customer accounts)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT DEFAULT 'GB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex unique email
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey: Order.userId -> User.id (SET NULL on user delete so guest orders stay)
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- CreateTable: SellSubmission (buy-back form submissions)
CREATE TABLE "SellSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "game" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "estimate" TEXT,
    "images" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'new',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on SellSubmission status + email
CREATE INDEX "SellSubmission_status_idx" ON "SellSubmission"("status");
CREATE INDEX "SellSubmission_email_idx" ON "SellSubmission"("email");
