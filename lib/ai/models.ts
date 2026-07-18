import { google } from "@ai-sdk/google";

/** Default Gemini model for AI SDK 4 + @ai-sdk/google@1.x. Override with GEMINI_MODEL. */
export function getChatModel() {
  // gemini-2.0-flash often hits free-tier quota=0 for new keys; flash-latest is more reliable
  return google(process.env.GEMINI_MODEL || "gemini-flash-latest");
}

export function hasLlmKey() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}
