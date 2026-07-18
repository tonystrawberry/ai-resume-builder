import { createHash, randomBytes } from "crypto";

/**
 * Random public hash for share links (64 hex chars, unguessable).
 * Derived from fresh entropy so links are not sequential or guessable.
 */
export function createShareToken(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}

export function publicSharePath(token: string): string {
  return `/r/${token}`;
}

export function publicShareUrl(token: string, origin?: string): string {
  const path = publicSharePath(token);
  if (origin) return `${origin.replace(/\/$/, "")}${path}`;
  if (typeof process.env.AUTH_URL === "string" && process.env.AUTH_URL) {
    return `${process.env.AUTH_URL.replace(/\/$/, "")}${path}`;
  }
  if (typeof process.env.NEXTAUTH_URL === "string" && process.env.NEXTAUTH_URL) {
    return `${process.env.NEXTAUTH_URL.replace(/\/$/, "")}${path}`;
  }
  return path;
}
