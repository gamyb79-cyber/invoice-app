CREATE TABLE IF NOT EXISTS "Referral" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "referredEmail" TEXT,
  "referredUserId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reward" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt" TIMESTAMP(3),

  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Referral_code_key" ON "Referral"("code");
CREATE INDEX IF NOT EXISTS "Referral_userId_idx" ON "Referral"("userId");
CREATE INDEX IF NOT EXISTS "Referral_code_idx" ON "Referral"("code");
