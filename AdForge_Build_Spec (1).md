# AdForge — Complete Build Specification (V1 MVP)

> **Purpose of this document:** This is a complete, self-contained build spec for an AI-powered static ad creative generator for B2B SaaS. It is written to be handed directly to an AI coding agent (Claude Code, Cursor, etc.). Every decision needed to build the MVP end-to-end has already been made and locked below. **Do not ask the user clarifying questions — build exactly what is specified here.** Where a choice existed, the default has been chosen and stated explicitly. If a detail is genuinely missing, choose the simplest sensible option that matches the spirit of this document and note it in code comments.

---

## 1. Product in one sentence

A web app that turns competitor ads or a company's own business documents into on-brand, **fully editable** static ad creatives for B2B SaaS, by generating ad copy with AI and auto-filling editable design templates.

## 2. The single most important constraint

The final creative **must be 100% editable by the user inside the app** — they can change every piece of text, swap the logo, change colors, and move/resize elements. This is the product's whole reason to exist.

**Therefore this app does NOT use raw AI image generation (no DALL·E / Stable Diffusion / image models) to produce the creative.** Image models produce flat, uneditable images with unreliable text rendering — the opposite of the requirement. Instead, the creative is a **structured, layer-based template** that AI fills with copy and branding, and that the user edits directly. This decision is final for V1.

## 3. Locked tech stack

Use exactly this stack. Do not substitute.

- **Framework:** Next.js 14+ (App Router) with TypeScript.
- **Styling:** Tailwind CSS.
- **UI components:** shadcn/ui.
- **Database + Auth + File Storage:** Supabase (Postgres, Supabase Auth with email/password, Supabase Storage for uploaded logos/assets and exported images).
- **AI / LLM calls:** Anthropic Claude API (`@anthropic-ai/sdk`), model `claude-sonnet-4-20250514`. All LLM calls happen server-side in Next.js API route handlers (`app/api/.../route.ts`). Never expose the API key to the client.
- **Creative renderer + editor:** Custom React component that renders a template from a JSON layer definition using absolutely-positioned `div`s (no external editor SDK, no licensing cost). Editing is done via a properties side-panel plus drag-to-move and drag-to-resize on the canvas.
- **PNG/JPG export:** `html-to-image` library (`toPng` / `toJpeg`) on the rendered creative DOM node.
- **Deployment target:** Vercel (frontend + API routes) with Supabase as the backend. Code must run locally with `npm run dev`.

## 4. What is IN scope for V1 (build all of this)

1. Email/password auth (sign up, log in, log out).
2. Project workspace: a user creates "Ad Projects". Each project holds inputs, generated angles, and saved creatives.
3. **Input step** — the user provides source material in either or both of two ways:
   - (Optional) Paste/import competitor ad text (transcripts from their existing scraper — accept pasted text, no scraper integration needed in V1).
   - Upload or paste business documents / business description (text, plus optional file upload of `.txt`/`.md`/`.pdf`).
4. **AI angle & message extraction** — AI reads the input(s) and produces a structured list of marketing angles, each with: angle name, the core message, a suggested hook/headline, and a suggested CTA.
5. **Angle selection** — user picks one angle to turn into a creative.
6. **AI ad-copy generation** — for the chosen angle, AI generates the actual creative copy fields (headline, subheadline, body line, CTA button text).
7. **Template selection** — user picks from a library of at least 5 pre-built static ad templates (defined as JSON layer files, see §7). Common ad sizes: 1080×1080 (square) and 1080×1350 (portrait) at minimum.
8. **Branding inputs** — user uploads a logo and sets brand colors (primary, secondary, text color) via color pickers. Optionally upload a background image.
9. **Auto-fill** — selected template is populated with the AI copy + branding.
10. **In-app editor** — user edits everything: text content, font size, colors, element position, element size, logo swap. Changes render live.
11. **Export** — download the final creative as PNG. Save the creative (its JSON state) to the project so it can be reopened and re-edited later.

## 5. What is OUT of scope for V1 (do NOT build yet)

- The ad-library scraper (already exists separately; V1 just accepts pasted text).
- Canva / Figma export (planned Phase 2 — leave a clearly-marked stub function `exportToCanva()` that throws "not implemented in V1").
- Team/multi-user collaboration, billing/payments, animated/video ads, A/B testing analytics.
- Raw AI image generation of any kind.

## 6. Data model (Supabase / Postgres)

Create these tables with Row Level Security so a user can only access their own rows (filter by `auth.uid() = user_id`).

```
users                (handled by Supabase Auth)

projects
  id            uuid pk default gen_random_uuid()
  user_id       uuid  -> auth.users.id
  name          text
  created_at    timestamptz default now()

inputs
  id              uuid pk
  project_id      uuid -> projects.id
  competitor_text text            -- optional pasted competitor ad transcripts
  business_text   text            -- business description / pasted docs
  uploaded_files  jsonb           -- array of {name, storage_path}
  created_at      timestamptz default now()

angles
  id            uuid pk
  project_id    uuid -> projects.id
  name          text
  core_message  text
  hook          text
  cta           text
  created_at    timestamptz default now()

creatives
  id            uuid pk
  project_id    uuid -> projects.id
  angle_id      uuid -> angles.id (nullable)
  template_key  text          -- which base template was used
  state_json    jsonb         -- the full editable layer state (see §7)
  thumbnail_url text          -- exported PNG in Supabase Storage
  created_at    timestamptz default now()
  updated_at    timestamptz default now()

brand_kits
  id            uuid pk
  project_id    uuid -> projects.id
  logo_path     text
  color_primary text
  color_secondary text
  color_text    text
  bg_image_path text (nullable)
```

Supabase Storage buckets: `assets` (logos, uploaded bg images, uploaded docs) and `exports` (rendered PNGs). Both private, served via signed URLs.

## 7. Template & creative state format (THE CORE OF EDITABILITY)

A creative is a JSON document describing a canvas and an ordered list of layers. The renderer draws it; the editor mutates it; export rasterizes it. This single format is what makes the output 100% editable.

```jsonc
{
  "canvas": { "width": 1080, "height": 1080, "background": "#FFFFFF" },
  "layers": [
    {
      "id": "headline",
      "type": "text",           // "text" | "image" | "shape"
      "x": 80, "y": 120,        // px from top-left
      "width": 920, "height": 200,
      "rotation": 0,
      "content": "Your headline here",
      "fontFamily": "Inter",
      "fontSize": 64,
      "fontWeight": 700,
      "color": "#111111",
      "textAlign": "left",
      "lineHeight": 1.1,
      "editable": true,
      "bindsTo": "headline"     // maps AI copy field -> this layer
    },
    {
      "id": "logo",
      "type": "image",
      "x": 80, "y": 60, "width": 160, "height": 60, "rotation": 0,
      "src": null,              // filled from brand_kit.logo_path
      "objectFit": "contain",
      "editable": true,
      "bindsTo": "logo"
    },
    {
      "id": "cta_bg",
      "type": "shape",
      "shape": "rectangle",
      "x": 80, "y": 880, "width": 320, "height": 90, "radius": 12,
      "fill": "#2563EB",        // filled from brand_kit.color_primary
      "editable": true,
      "bindsTo": "color_primary"
    },
    {
      "id": "cta_text",
      "type": "text",
      "x": 100, "y": 905, "width": 280, "height": 50,
      "content": "Get started",
      "fontSize": 28, "fontWeight": 600, "color": "#FFFFFF",
      "textAlign": "center",
      "editable": true,
      "bindsTo": "cta"
    }
  ]
}
```

**Renderer rule:** each layer is an absolutely-positioned `div` inside a container sized to `canvas.width/height`, scaled to fit the viewport with CSS `transform: scale()` while keeping internal coordinates at true pixel size (so export is full resolution). Text layers are contentEditable when selected. Image layers render `<img>`. Shape layers render styled divs.

**Editor rule:** clicking a layer selects it and shows a properties panel (content, font size, weight, color, alignment, x/y/w/h). Selected layers can be dragged to move and have corner handles to resize. A layers list allows reordering (z-index) and toggling visibility.

**Auto-fill rule:** `bindsTo` connects template layers to data. After AI copy + brand kit are ready, walk the layers and set `content`/`src`/`fill` from the matching field (`headline`, `subheadline`, `body`, `cta`, `logo`, `color_primary`, `color_secondary`, `color_text`). After auto-fill the user can override anything.

Ship at least **5 template JSON files** in `/templates/*.json` covering varied layouts (e.g. bold-headline-left, centered-statement, problem/solution split, testimonial-style, feature-callout). Two canvas sizes minimum (1080×1080 and 1080×1350).

## 8. The AI steps — exact prompt contracts

All AI calls are server-side, return **strict JSON only** (instruct the model to output JSON with no prose, no markdown fences), and are parsed with try/catch.

**Step A — Angle extraction.** Endpoint `POST /api/angles`. Input: `{ competitorText?, businessText, uploadedDocsText? }`. System prompt: an expert B2B SaaS performance marketer extracting distinct ad angles. Output JSON:
```json
{ "angles": [ { "name": "...", "core_message": "...", "hook": "...", "cta": "..." } ] }
```
Return 4–6 angles. Persist them to the `angles` table.

**Step B — Copy generation.** Endpoint `POST /api/copy`. Input: `{ angle, businessText, templateFields: ["headline","subheadline","body","cta"] }`. Output JSON exactly:
```json
{ "headline": "...", "subheadline": "...", "body": "...", "cta": "..." }
```
Keep headline ≤ 8 words, CTA ≤ 3 words, body ≤ 20 words (so it fits templates). State these limits in the prompt.

Handle the case where the model returns extra text: strip ```` ```json ```` fences and trim before `JSON.parse`.

## 9. Screens / user flow (build in this order)

1. **Auth** (`/login`, `/signup`) — Supabase email/password.
2. **Dashboard** (`/`) — list projects, "New Project" button.
3. **Project → Input** (`/project/[id]/input`) — two text areas (competitor ads optional; business info required) + optional file upload. "Generate Angles" button → calls `/api/angles`.
4. **Project → Angles** (`/project/[id]/angles`) — shows the AI angle cards; user selects one → calls `/api/copy`.
5. **Project → Brand Kit** (`/project/[id]/brand`) — logo upload, 3 color pickers, optional bg image. (Can be combined into the editor sidebar instead of a separate screen — acceptable.)
6. **Project → Template picker** (`/project/[id]/templates`) — grid of template previews; user picks one.
7. **Editor** (`/project/[id]/editor/[creativeId]`) — the auto-filled creative + full editing UI + "Export PNG" + "Save". This is the most important screen; budget the most effort here.

A simple top stepper showing Input → Angle → Brand → Template → Edit keeps orientation.

## 10. Build phases (deliver in this sequence so it's usable early)

- **Phase 0 — Setup:** Next.js + Tailwind + shadcn/ui + Supabase project; env vars; auth; DB schema + RLS; storage buckets.
- **Phase 1 — Renderer + editor first (de-risk the hard part):** Build the JSON template renderer and the in-app editor against a hardcoded template + dummy data, including drag/resize/properties panel and PNG export. **Do this before the AI parts** — it's the riskiest piece and everything else is worthless if editing doesn't work.
- **Phase 2 — Templates:** Author the 5+ template JSON files and the template picker.
- **Phase 3 — AI:** `/api/angles` and `/api/copy`, plus the Input and Angles screens.
- **Phase 4 — Branding + auto-fill:** brand kit upload/storage, the `bindsTo` auto-fill that merges AI copy + brand into a template to create a `creatives` row, then opens the editor.
- **Phase 5 — Persistence + polish:** save/reopen creatives, project dashboard, thumbnails, loading/error states, basic responsive layout.
- **Phase 6 (stub only):** `exportToCanva()` placeholder for the future.

## 11. Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only, for storage/admin ops
ANTHROPIC_API_KEY=                # server-side only
```

Provide a `.env.example` with these keys (no values) and a README explaining setup: create Supabase project, run the SQL schema, create the two storage buckets, add env vars, `npm install`, `npm run dev`.

## 12. Acceptance criteria (the build is "done" for V1 when all are true)

1. A user can sign up, log in, and create a project.
2. A user can paste business info (and optionally competitor ad text), click generate, and get 4–6 distinct angles.
3. Selecting an angle generates headline/subheadline/body/CTA copy.
4. A user can upload a logo and set 3 brand colors.
5. Picking a template opens an editor with the template auto-filled with the AI copy and the brand kit.
6. In the editor the user can edit every text layer, change any color, swap the logo, and move/resize any element, with live preview.
7. The user can export a full-resolution PNG and reopen the saved creative later to keep editing.
8. No raw AI image generation is used anywhere. Editing never requires leaving the app.

---

## Appendix — Decisions that were made for you (so you don't ask)

- **Editability path:** in-app JSON-layer editor, not Canva, not raw image gen. Chosen because it is fully self-contained (no third-party API approval, no licensing cost) and directly satisfies the 100%-editable requirement. Canva export is deferred to Phase 2 as a stub.
- **LLM:** Anthropic Claude Sonnet, server-side only.
- **Backend:** Supabase (fastest path to auth + db + storage in one).
- **Export:** PNG via `html-to-image` against the live DOM at true pixel size.
- **Scraper:** out of scope; V1 ingests pasted competitor text only.
- If any unspecified micro-decision arises, pick the simplest option consistent with the above and leave a `// SPEC-NOTE:` comment. Do not pause to ask.
