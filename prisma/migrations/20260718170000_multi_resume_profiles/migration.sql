-- AlterTable: allow multiple resumes per user
ALTER TABLE "MasterResumeProfile" DROP CONSTRAINT IF EXISTS "MasterResumeProfile_userId_key";
DROP INDEX IF EXISTS "MasterResumeProfile_userId_key";

ALTER TABLE "MasterResumeProfile" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Untitled resume';

CREATE INDEX IF NOT EXISTS "MasterResumeProfile_userId_updatedAt_idx" ON "MasterResumeProfile"("userId", "updatedAt");
