# World 03 — Ice Age

**What it is:** a page showing six things people are actually doing to redesign the planet, with the evidence for each.

Single self-contained `index.html`. No build step, no dependencies except Google Fonts.
Deploys at `/IceAge/` next to `/RetroGames/` and `/Y2K/` under the existing `vercel.json`.

---

## Structure

| Section | What's in it | Interaction |
|---|---|---|
| Threshold | Title, one line of setup | Start · sound opt-in · read-without-motion |
| What this is | Three short paragraphs. No metaphor. | — |
| It has worked before | Ozone / Montreal Protocol as the one finished proof | Drag the timeline 1987 → 2066, hole closes |
| 01 Making ice again | Nunavut. Real Ice, Arctic Reflections, ARIA, Cambridge | Press and hold to pump seawater; ice thickens |
| 02 Painting roofs white | Ahmedabad. Heat action plan, cool roofs | Drag to paint roofs; indoor temp drops |
| 03 Letting things come back | Mangroves, Great Green Wall, reefs, Miyawaki | Remove obstacles — you add nothing |
| 04 Signing agreements | Montreal, Kigali, High Seas, 30×30, cost collapse | Align eight parts; two resist |
| 05 Old cooling, reused | Stepwell, jaali, courtyard, wind tower | Move the sun; shade and airflow respond |
| 06 Eight projects in India | Real programmes, place and date each | Six lenses, eight sourced pins |
| Try it yourself | Four levers, six outcomes | Sliders → a written brief, not a score |
| What we're not sure about | Preliminary, contested, and one verified failure | — |
| The short version | Three sentences and three exits | — |
| Sources | All 24, filterable | Ice / Heat / Restoration / Agreements / Passive design |

Every section deep-links and the URL updates as you read.

---

## Art direction

Matched to `iceworldloop.mp4`. **High-key, not dark** — sunlit sculpted ice, glossy cerulean pool, matte snow, near-white sky.

Palette sampled from the loop: paper `#e9f1f7`, snow `#f4f8fb`, pool `#8fb8dc`, deep `#3d7cae`, shadow `#1d5480`, ink `#0f2c45`. Warm accents released gradually — gold `#c98b3c`, cream `#fbf0dc`, dawn `#e2b6c6`, green `#6f9d5a`.

A single `--thaw` variable runs 0→1 with scroll and drives the canvas palette, the warm floor glow and the ambient sound together. One ice wall turns gold as you descend.

The `H!` cutouts became the display type — white letterforms with stacked pale-blue shadows and an outer glow. Sections are separated by a **pool**: a reflective band with a surface line that draws itself. The chainsaw, kettle, crate and boots from your set appear as thin-line objects on the threshold and in the corner of each stage.

---

## Evidence

24 entries. Every figure has a button next to it; pressing it gives source, organisation, publication date, last-verified date, a status label and a plain-language caveat.

**Measured · estimated · preliminary · projected · contested · interpretive.** Anything labelled interpretive says in the drawer that it's our opinion rather than a finding.

---

## Modes

- **Reduced motion** — follows the OS setting, plus a manual toggle. Same content.
- **Lightweight** — drops the canvas backdrop for slower connections.
- **High contrast** — flattens display type, lifts secondary text.
- **No JavaScript** — the full text and all sources still read.

Preferences persist in `localStorage`, wrapped so a failure can't break the page.

---

## Before it goes live

1. **Re-verify every figure.** The date sits in one constant (`VERIFIED`). The Arctic results are one season old — recheck ARIA first.
2. **Make the OG image.** `og-iceage.jpg` is referenced but doesn't exist.
3. **Add real photography.** Diagrams only so far. Photographs of the Nunavut teams and Ahmedabad roofs would carry this. Licensed, credited, never synthetic.
4. **Consider using the loop.** `iceworldloop.mp4` as a muted threshold background — compress first, gate behind lightweight mode.
5. **Link it from the corridor** — `deploy-7years7worlds/index.html`.
6. **Analytics** — events push to `window.dataLayer`. Wire up or leave inert.

1,679 words. 126 KB uncompressed, ~28 KB gzipped.
