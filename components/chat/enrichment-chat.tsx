"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatchConfirm, type AppliedProfile } from "@/components/chat/patch-confirm";
import { extractJsonPatch } from "@/lib/ai/enrich-chat";
import { cn } from "@/lib/utils";

type MessageLike = {
  id: string;
  role: string;
  content: string;
};

function messageText(m: {
  content?: string;
  parts?: Array<{ type?: string; text?: string }>;
}) {
  if (typeof m.content === "string" && m.content.length > 0) return m.content;
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("");
  }
  return "";
}

export function EnrichmentChat({
  profileId,
  chatId,
  initialMessages,
  profileVersion,
  onProfileUpdated,
}: {
  profileId: string;
  chatId: string;
  initialMessages: MessageLike[];
  profileVersion: number;
  onProfileUpdated: (profile: AppliedProfile) => void;
}) {
  const [version, setVersion] = useState(profileVersion);
  const { messages, input, setInput, handleSubmit, isLoading, error } =
    useChat({
      id: chatId,
      api: "/api/chat",
      body: { profileId },
      initialMessages: initialMessages.map((m, i) => ({
        id: m.id?.trim() ? m.id : `${chatId}-${m.role}-${i}`,
        role: m.role as "user" | "assistant" | "system" | "data",
        content: m.content,
      })),
    });

  useEffect(() => {
    setVersion(profileVersion);
  }, [profileVersion]);

  const latestPatch = useMemo(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant) return null;
    return extractJsonPatch(messageText(lastAssistant));
  }, [messages]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, latestPatch, isLoading]);

  return (
    <div className="flex h-[calc(100dvh-20rem)] max-h-[calc(100dvh-20rem)] min-h-[16rem] flex-col overflow-hidden rounded-xl border border-border bg-card xl:h-[calc(100dvh-10rem)] xl:max-h-[calc(100dvh-10rem)]">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
      >
        {messages.map((m, i) => {
          const text = messageText(m);
          if (!text.trim() && m.role !== "assistant") return null;
          return (
            <div
              key={m.id?.trim() ? m.id : `${chatId}-${m.role}-${i}`}
              className={
                m.role === "user"
                  ? "ml-8 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
                  : "mr-8 rounded-lg bg-surface px-3 py-2 text-sm"
              }
            >
              <div
                className={cn(
                  "chat-md max-w-none [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
                  "[&_strong]:font-semibold [&_em]:italic [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
                  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
                  "[&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
                  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-black/10 [&_pre]:p-2",
                  "[&_a]:underline",
                  m.role === "user" && "[&_code]:bg-white/20 [&_pre]:bg-white/15",
                )}
              >
                {text.trim() ? (
                  <ReactMarkdown>{text}</ReactMarkdown>
                ) : (
                  <p>{isLoading ? "Thinking…" : "(empty reply)"}</p>
                )}
              </div>
            </div>
          );
        })}
        {error ? (
          <div className="rounded-lg border border-danger/40 bg-card px-3 py-2 text-sm text-danger">
            {error.message || String(error)}
          </div>
        ) : null}
      </div>
      {latestPatch ? (
        <PatchConfirm
          profileId={profileId}
          patch={latestPatch}
          version={version}
          onApplied={(profile) => {
            setVersion(profile.version);
            onProfileUpdated(profile);
          }}
        />
      ) : null}
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 gap-2 border-t border-border p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share an achievement…"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
