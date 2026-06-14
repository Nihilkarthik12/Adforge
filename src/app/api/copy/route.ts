// POST /api/copy — Step B: generate the creative copy fields for one angle (spec §8).
// Server-side only; returns strict JSON: { headline, subheadline, body, cta }.

import {
  COPY_MODEL,
  extractJson,
  getAnthropic,
  messageText,
} from "@/lib/anthropic";
import { COPY_FIELDS } from "@/lib/creative/types";
import type { Angle, CopyFields } from "@/lib/creative/types";

interface CopyBody {
  angle?: Angle;
  businessText?: string;
  templateFields?: string[];
}

const SYSTEM = `You write tight, high-converting B2B SaaS ad copy. Given a chosen marketing angle and the business context, produce the copy for a single static ad.

Return ONLY a JSON object, no prose and no markdown fences, in exactly this shape:
{"headline":"...","subheadline":"...","body":"...","cta":"..."}

Hard limits so the copy fits the template:
- headline: ≤ 8 words.
- subheadline: ≤ 14 words.
- body: ≤ 20 words.
- cta: ≤ 3 words.
Write in the voice of the angle. No emojis, no hashtags, no surrounding quotes.`;

export const maxDuration = 30;

export async function POST(request: Request) {
  const anthropic = getAnthropic();
  if (!anthropic) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let body: CopyBody;
  try {
    body = (await request.json()) as CopyBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.angle?.name) {
    return Response.json({ error: "angle is required." }, { status: 400 });
  }

  const fields = body.templateFields?.length
    ? body.templateFields
    : [...COPY_FIELDS];

  const userContent = [
    `CHOSEN ANGLE:`,
    `- name: ${body.angle.name}`,
    `- core message: ${body.angle.core_message}`,
    `- hook: ${body.angle.hook}`,
    `- suggested CTA: ${body.angle.cta}`,
    ``,
    `BUSINESS CONTEXT:\n${body.businessText?.trim() || "(none provided)"}`,
    ``,
    `Produce copy for these fields: ${fields.join(", ")}.`,
  ].join("\n");

  try {
    const message = await anthropic.messages.create({
      model: COPY_MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

    const copy = extractJson<CopyFields>(messageText(message));
    if (!copy.headline || !copy.cta) {
      throw new Error("Model output missing required copy fields");
    }
    return Response.json({
      headline: copy.headline ?? "",
      subheadline: copy.subheadline ?? "",
      body: copy.body ?? "",
      cta: copy.cta ?? "",
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Copy generation failed." },
      { status: 502 },
    );
  }
}
