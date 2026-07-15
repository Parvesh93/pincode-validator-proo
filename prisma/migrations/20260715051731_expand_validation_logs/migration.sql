-- AlterTable
ALTER TABLE "ValidationLog" ADD COLUMN     "city" TEXT,
ADD COLUMN     "codAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "estDeliveryDays" INTEGER,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prepaidAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productHandle" TEXT,
ADD COLUMN     "productTitle" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'storefront',
ADD COLUMN     "state" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "ValidationLog_shopId_createdAt_idx" ON "ValidationLog"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "ValidationLog_shopId_isAvailable_idx" ON "ValidationLog"("shopId", "isAvailable");

-- CreateIndex
CREATE INDEX "ValidationLog_shopId_result_idx" ON "ValidationLog"("shopId", "result");

UPDATE "ValidationLog"
SET "isAvailable" = true
WHERE LOWER("result") IN ('available', 'success', 'valid');
