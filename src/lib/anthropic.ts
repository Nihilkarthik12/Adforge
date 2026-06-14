// Server-side Anthropic client and helpers for the two AI steps (spec §8).
// The API key is read from the environment and never reaches the client — these
// helpers are only ever imported by route handlers under app/api/.

import Anthropic from "@anthropic-ai/sdk";

// SPEC-NOTE: the build spec locked `claude-sonnet-4-20250514`, which is now
// deprecated. `claude-sonnet-4-6` is its current drop-in replacement and keeps
// the spec's deliberate Sonnet choice (fast, cheap copy generation).
export const COPY_MODEL = "claude-sonnet-4-6";

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
export const isAnthropicConfigured = Boolean(ANTHROPIC_API_KEY);

let client: Anthropic | null = null;

/** Lazily-built singleton; null when the key is absent so callers can 503. */
export function getAnthropic(): Anthropic | null {
  if (!isAnthropicConfigured) return null;
  if (!client) client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return client;
}

/**
 * Strip ```json fences / stray prose and parse the first JSON object or array
 * in a model response (spec §8: "handle the case where the model returns extra
 * text"). Throws on genuinely unparseable output so routes can 502.
 */
export function extractJson<T>(text: string): T {
  let s = text.trim();

  // Remove a leading ```json / ``` fence and its closing ```.
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(s);
  if (fence) s = fence[1].trim();

  // If there's still surrounding prose, grab the outermost {...} or [...].
  try {
    return JSON.parse(s) as T;
  } catch {
    const start = s.search(/[[{]/);
    const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      return JSON.parse(s.slice(start, end + 1)) as T;
    }
    throw new Error("Model did not return parseable JSON");
  }
}

/** Pull the concatenated text out of a Messages API response. */
export function messageText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
