-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('interested', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "companyName" TEXT,
    "jobUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'interested',
    "appliedAt" TIMESTAMP(3),
    "linkedResumeId" TEXT,
    "coverLetterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobApplication_userId_updatedAt_idx" ON "JobApplication"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "JobApplication_userId_status_idx" ON "JobApplication"("userId", "status");

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_linkedResumeId_fkey" FOREIGN KEY ("linkedResumeId") REFERENCES "MasterResumeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
