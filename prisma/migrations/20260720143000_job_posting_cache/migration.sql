-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN "jobPostingText" TEXT,
ADD COLUMN "jobPostingParsedUrl" TEXT,
ADD COLUMN "jobPostingParsedAt" TIMESTAMP(3);
