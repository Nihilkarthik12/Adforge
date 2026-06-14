# AdForge — User Flow (V1 MVP)

The product's job: turn competitor ads / business docs into **100% editable** static ad creatives.
The flow below is the single happy path. A top stepper keeps the user oriented:

`Input → Angles → Copy → Brand → Template → Editor → Export`

```
┌────────────┐
│   LOGIN    │  email/password (Supabase Auth). Minimal — no email verify / reset in V1.
└─────┬──────┘
      │
┌─────▼──────┐
│ DASHBOARD  │  list projects + "New Project"
└─────┬──────┘
      │ create / open project
      │
┌─────▼────────────────────────────────────────────────┐
│ 1. INPUT                                              │
│   • Business description (required, text)             │
│   • Competitor inputs (optional, ANY of):             │
│       - paste ad text                                 │
│       - upload ad screenshots (PNG/JPG)  ← NEW        │
│       - upload PDF swipe files            ← NEW        │
│   • Optional business docs (.txt/.md/.pdf)            │
│   [Generate Angles] → POST /api/angles                │
└─────┬────────────────────────────────────────────────┘
      │  AI reads text + screenshot vision + pdf text
      │
┌─────▼────────────────────────────────────────────────┐
│ 2. ANGLES                                            │
│   4–6 angle cards: {name, core_message, hook, cta}    │
│   user selects ONE → POST /api/copy                   │
└─────┬────────────────────────────────────────────────┘
      │
┌─────▼────────────────────────────────────────────────┐
│ 3. COPY (auto)                                       │
│   AI returns {headline, subheadline, body, cta}       │
│   (limits: headline ≤8w, cta ≤3w, body ≤20w)          │
└─────┬────────────────────────────────────────────────┘
      │
┌─────▼────────────────────────────────────────────────┐
│ 4. BRAND KIT                                         │
│   • logo upload      → assets bucket                  │
│   • 3 color pickers (primary / secondary / text)      │
│   • optional background image                         │
└─────┬────────────────────────────────────────────────┘
      │
┌─────▼────────────────────────────────────────────────┐
│ 5. TEMPLATE PICKER                                   │
│   AI recommends 3 templates  ← NEW (AI suggest)       │
│     POST /api/recommend-templates                     │
│   ...shown first, rest of library below               │
│   user handpicks ONE          (user handpick)         │
└─────┬────────────────────────────────────────────────┘
      │  auto-fill via bindsTo (copy + brand → layers)
      │  creates a `creatives` row, opens editor
      │
┌─────▼────────────────────────────────────────────────┐
│ 6. EDITOR  ★ most important screen                   │
│   live canvas (scaled) + properties panel + layers    │
│   edit: text, font, color, position, size, logo swap  │
│   [Save] → state_json + thumbnail                     │
│   [Export PNG] → full-res 1080px                      │
└─────┬────────────────────────────────────────────────┘
      │
┌─────▼──────┐
│  EXPORT    │  download PNG · reopen creative later to keep editing
└────────────┘
```

## Notes on the two GPT-driven additions
- **Competitor image/PDF uploads (Input):** screenshots are sent to Claude Sonnet 4.6 as **vision** content blocks; PDFs are text-extracted server-side. Both feed the same `/api/angles` call alongside pasted/business text.
- **AI template recommendation (Template picker):** "AI suggest, user handpick." AI ranks templates using their metadata (`category/aspectRatio/industry/style`) against the chosen angle + copy, surfaces the top 3, but the user always makes the final pick.
