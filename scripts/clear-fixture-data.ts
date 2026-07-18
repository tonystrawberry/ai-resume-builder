import { PrismaClient, type Prisma } from "@prisma/client";
import { computeCompleteness } from "../lib/resume/completeness";
import { masterResumeSchema } from "../lib/resume/schema";

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.masterResumeProfile.findMany();
  for (const p of profiles) {
    const parsed = masterResumeSchema.parse(p.data);
    const before = parsed.experience.length;
    parsed.experience = parsed.experience.filter(
      (e) => !e.company.toLowerCase().includes("acme"),
    );
    const completeness = computeCompleteness(parsed);
    parsed.meta.gaps = completeness.gaps;

    await prisma.masterResumeProfile.update({
      where: { id: p.id },
      data: {
        data: parsed as unknown as Prisma.InputJsonValue,
        completeness: completeness as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
    await prisma.chatConversation.updateMany({
      where: { profileId: p.id },
      data: { messages: [] },
    });
    console.log(
      `Cleaned profile ${p.id}: experience ${before} -> ${parsed.experience.length}; chat cleared`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
