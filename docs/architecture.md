# AdForge — Architecture (V1 MVP)

## Stack (locked)
- **Next.js 14+ App Router + TypeScript**, Tailwind, shadcn/ui
- **Supabase** — Postgres + Auth (email/password) + Storage (private buckets)
- **Anthropic Claude `claude-sonnet-4-6`** (multimodal) — server-side only
- **Custom React renderer/editor** (no external editor SDK)
- **`html-to-image`** for PNG export
- Deploy: Vercel + Supabase

## The central abstraction: the Creative State JSON
Everything orbits one data structure (spec §7). The **renderer draws it, the editor mutates it,
export rasterizes it, auto-fill populates it**. This is what makes output 100% editable.

```
                ┌──────────────────────────┐
                │   CreativeState (JSON)    │
                │  canvas + ordered layers  │
                └──────────────────────────┘
                  ▲        ▲        ▲      ▲
         renders  │ mutates│  fills │      │ rasterizes
                  │        │        │      │
        CreativeCanvas  Editor   autofill  export(html-to-image)
```

## Layered design
```
┌─────────────────────────────────────────────────────────────┐
│ Client (React)                                              │
│   pages: login, dashboard, project/[id]/{input,angles,      │
│          brand,templates}, editor/[creativeId]              │
│   editor: CreativeCanvas · PropertiesPanel · LayersPanel    │
│   supabase browser client (auth session, asset uploads)     │
└───────────────┬─────────────────────────────────────────────┘
                │ fetch
┌───────────────▼─────────────────────────────────────────────┐
│ Server (Next.js Route Handlers) — secrets live here only    │
│   /api/angles               (text + vision + pdf → angles)  │
│   /api/copy                 (angle → copy fields)           │
│   /api/recommend-templates  (angle+copy → top 3 templates)  │
│   lib/ai/anthropic.ts (client + parseStrictJson)            │
│   supabase admin (service role) for storage/admin ops       │
└───────────────┬───────────────────────────┬─────────────────┘
                │                           │
        ┌───────▼────────┐         ┌────────▼─────────┐
        │ Anthropic API  │         │   Supabase       │
        │ Sonnet 4.6     │         │ Postgres (RLS)   │
        └────────────────┘         │ Auth · Storage   │
                                   └──────────────────┘
```

## Data model (Postgres, all RLS-scoped to the owning user)
`projects` → `inputs`, `angles`, `creatives`, `brand_kits` (each child FK → `projects.id`).
RLS: a row is visible only when its project's `user_id = auth.uid()`.
Storage buckets (private, signed URLs): `assets` (logos, bg, screenshots, docs), `exports` (PNGs/thumbnails).

`creatives.state_json` holds the full editable layer state — the heart of reopen-and-edit.

## Secrets boundary (non-negotiable)
- `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — **server only**, never shipped to client.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, client-safe.
- All LLM calls go through route handlers. The client never talks to Anthropic directly.

## Rendering & export precision
The canvas renders at **true pixel size** (e.g. 1080×1080) internally and is only visually
shrunk with CSS `transform: scale()`. Export runs `html-to-image` against the true-size node so
PNGs are full resolution regardless of viewport. Drag/resize math converts pointer deltas from
screen space back into canvas space using the active scale factor.

## Build order (de-risk the hard part first)
`Phase 0 setup → Phase 1 editor core (dummy data) → Phase 2 templates →
 Phase 3 AI + input/angles → Phase 4 brand + autofill → Phase 5 persistence/polish →
 Phase 6 exportToCanva() stub`

The editor is built **before** AI on purpose: it is the riskiest piece, and everything else
(copy, angles, branding) is trivial to wire in once editing works.

## Out of scope (V1)
Scraper, Canva/Figma export (stub only), teams/billing, animation, A/B analytics,
**and any raw AI image generation** — creatives are always editable layer JSON.
