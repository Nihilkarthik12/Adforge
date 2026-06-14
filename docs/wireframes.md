# AdForge — Wireframes (V1 MVP)

Low-fidelity ASCII layouts. Intent over pixels. Stepper appears on all project screens.

`[ Input ]→[ Angles ]→[ Brand ]→[ Template ]→[ Editor ]`

---

## Login / Signup
```
┌───────────────────────────────────────┐
│                AdForge                 │
│   ┌───────────────────────────────┐   │
│   │ Email    [____________________]│   │
│   │ Password [____________________]│   │
│   │           [   Log in   ]       │   │
│   │   No account?  Sign up         │   │
│   └───────────────────────────────┘   │
└───────────────────────────────────────┘
```

## Dashboard
```
┌───────────────────────────────────────────────┐
│ AdForge          your projects     [+ New]  ◔ │
├───────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Acme Q3 │ │ Beta    │ │ Launch  │          │
│  │ 3 ads   │ │ 1 ad    │ │ 0 ads   │          │
│  └─────────┘ └─────────┘ └─────────┘          │
└───────────────────────────────────────────────┘
```

## 1. Input
```
┌──────────────────────────────────────────────────────────┐
│ [Input]→ Angles → Brand → Template → Editor              │
├──────────────────────────────────────────────────────────┤
│ Business description *                                    │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│ Competitor inputs (optional)                              │
│ ┌─ Paste ad text ─────────┐  ┌─ Upload ────────────────┐ │
│ │                         │  │ [+ screenshots PNG/JPG] │ │
│ │                         │  │ [+ PDF swipe files]     │ │
│ └─────────────────────────┘  │  ad1.png  swipe.pdf  ✕  │ │
│                              └─────────────────────────┘ │
│ Business docs (optional)  [+ .txt/.md/.pdf]               │
│                                       [ Generate Angles ] │
└──────────────────────────────────────────────────────────┘
```

## 2. Angles
```
┌──────────────────────────────────────────────────────────┐
│ Input →[Angles]→ Brand → Template → Editor               │
├──────────────────────────────────────────────────────────┤
│ Pick an angle to build into a creative:                   │
│ ┌────────────────────┐ ┌────────────────────┐            │
│ │ ● Speed wins        │ │ ● Cut busywork     │            │
│ │ msg: ship 2x faster │ │ msg: automate ops  │            │
│ │ hook: "Still..."    │ │ hook: "Stop..."    │            │
│ │ cta: Try free       │ │ cta: Get demo      │            │
│ │        [ Select ]   │ │        [ Select ]  │            │
│ └────────────────────┘ └────────────────────┘   (4–6)    │
└──────────────────────────────────────────────────────────┘
   selecting → generates copy → continues to Brand
```

## 4. Brand Kit
```
┌──────────────────────────────────────────────────────────┐
│ Input → Angles →[Brand]→ Template → Editor               │
├──────────────────────────────────────────────────────────┤
│ Logo        [ ⬆ upload ]   ( preview )                    │
│ Primary    [■ #2563EB]   Secondary [■ #1E293B]            │
│ Text color [■ #111111]                                    │
│ Background image (optional) [ ⬆ upload ]                  │
│                                          [ Continue ]     │
└──────────────────────────────────────────────────────────┘
```

## 5. Template Picker  (AI suggest → user handpick)
```
┌──────────────────────────────────────────────────────────┐
│ Input → Angles → Brand →[Template]→ Editor               │
├──────────────────────────────────────────────────────────┤
│ ✦ Recommended for "Speed wins"                            │
│ ┌────────┐ ┌────────┐ ┌────────┐                          │
│ │ ▌llll  │ │  ▔▔▔▔  │ │ ll  ▭  │   ← AI top 3            │
│ │ bold-L │ │ center │ │ split  │                          │
│ └────────┘ └────────┘ └────────┘                          │
│ All templates                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│ │ test.  │ │ feat.  │ │ ...    │ │ ...    │   (5+ total)  │
│ └────────┘ └────────┘ └────────┘ └────────┘               │
└──────────────────────────────────────────────────────────┘
   pick → auto-fill → open editor
```

## 6. Editor  ★ the core screen
```
┌──────────────────────────────────────────────────────────────┐
│ AdForge   project ▸ creative        [ Save ]  [ Export PNG ] │
├───────────┬──────────────────────────────────┬───────────────┤
│ LAYERS    │            CANVAS                 │ PROPERTIES    │
│ ▸ headline│   ┌───────────────────────┐       │ content       │
│ ▸ sub     │   │  LOGO                  │       │ [__________]  │
│ ▸ body    │   │  Big Headline Here     │       │ font size [64]│
│ ▸ cta_bg  │   │  subheadline...        │       │ weight   [700]│
│ ▸ cta_txt │   │  body line of copy     │       │ color   [■]   │
│ ▸ logo    │   │        [ CTA ]         │       │ align  L C R  │
│ (reorder, │   └───────────────────────┘       │ x[ ] y[ ]     │
│  hide 👁)  │   scaled to fit · true 1080px     │ w[ ] h[ ]     │
│           │   click=select · drag=move        │ [swap logo]   │
│           │   corner handles = resize         │               │
└───────────┴──────────────────────────────────┴───────────────┘
```

Interaction rules:
- Click a layer (canvas or list) → selects, opens its properties.
- Selected text layer is `contentEditable` inline; also editable via panel.
- Drag body to move; 4 corner handles to resize (math is scale-aware).
- Layers list reorders z-index and toggles visibility.
- Save persists `state_json` + a thumbnail; Export downloads full-res PNG.
