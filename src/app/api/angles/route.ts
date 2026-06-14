// POST /api/angles — Step A: extract 4–6 marketing angles from the inputs (spec §8).
// Server-side only; returns strict JSON: { angles: [{ name, core_message, hook, cta }] }.

import {
  COPY_MODEL,
  extractJson,
  getAnthropic,
  messageText,
} from "@/lib/anthropic";
import type { Angle } from "@/lib/creative/types";

interface AnglesBody {
  competitorText?: string;
  businessText?: string;
  uploadedDocsText?: string;
}

const SYSTEM = `You are an expert B2B SaaS performance marketer. You read raw business material and competitor ads and extract DISTINCT advertising angles — each a different reason a buyer would care.

Return ONLY a JSON object, no prose and no markdown fences, in exactly this shape:
{"angles":[{"name":"...","core_message":"...","hook":"...","cta":"..."}]}

Rules:
- Return between 4 and 6 angles, each genuinely distinct (different value prop or buyer motivation — not reworded duplicates).
- "name": a short label for the angle (2–5 words).
- "core_message": one sentence stating the underlying value.
- "hook": a punchy suggested headline (≤ 12 words).
- "cta": a short call to action (≤ 3 words).`;

// Allow up to 30 s on Vercel so the Anthropic call has time to complete.
export const maxDuration = 30;

const MAX_TEXT_LENGTH = 12_000;

export async function POST(request: Request) {
  const anthropic = getAnthropic();
  if (!anthropic) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let body: AnglesBody;
  try {
    body = (await request.json()) as AnglesBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const businessText = (body.businessText?.trim() ?? "").slice(0, MAX_TEXT_LENGTH);
  if (!businessText) {
    return Response.json(
      { error: "businessText is required." },
      { status: 400 },
    );
  }

  const userParts = [
    `BUSINESS DESCRIPTION / DOCS:\n${businessText}`,
    body.uploadedDocsText?.trim()
      ? `UPLOADED DOCUMENT TEXT:\n${body.uploadedDocsText.trim().slice(0, MAX_TEXT_LENGTH)}`
      : "",
    body.competitorText?.trim()
      ? `COMPETITOR AD TRANSCRIPTS:\n${body.competitorText.trim().slice(0, MAX_TEXT_LENGTH)}`
      : "",
  ].filter(Boolean);

  try {
    const message = await anthropic.messages.create({
      model: COPY_MODEL,
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: "user", content: userParts.join("\n\n") }],
    });

    const { angles } = extractJson<{ angles: Angle[] }>(messageText(message));
    if (!Array.isArray(angles) || angles.length === 0) {
      throw new Error("No angles in model output");
    }
    return Response.json({ angles });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Angle extraction failed." },
      { status: 502 },
    );
  }
}
