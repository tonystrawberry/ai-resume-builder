-- CreateEnum
CREATE TYPE "SharedLinkStatus" AS ENUM ('active', 'revoked');

-- CreateTable
CREATE TABLE "SharedResumeLink" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#0f6e56',
    "data" JSONB NOT NULL,
    "sourceVersion" INTEGER NOT NULL,
    "status" "SharedLinkStatus" NOT NULL DEFAULT 'active',
    "label" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "SharedResumeLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedResumeLink_token_key" ON "SharedResumeLink"("token");

-- CreateIndex
CREATE INDEX "SharedResumeLink_profileId_createdAt_idx" ON "SharedResumeLink"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "SharedResumeLink_status_idx" ON "SharedResumeLink"("status");

-- AddForeignKey
ALTER TABLE "SharedResumeLink" ADD CONSTRAINT "SharedResumeLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "MasterResumeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
