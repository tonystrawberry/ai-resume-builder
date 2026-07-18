import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getOrCreateConversation(profileId: string) {
  return prisma.chatConversation.upsert({
    where: { profileId },
    create: { profileId, messages: [] },
    update: {},
  });
}

export async function saveConversationMessages(
  conversationId: string,
  messages: unknown[],
) {
  return prisma.chatConversation.update({
    where: { id: conversationId },
    data: {
      messages: messages as Prisma.InputJsonValue,
    },
  });
}
