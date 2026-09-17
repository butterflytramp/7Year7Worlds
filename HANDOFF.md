# 7 YEARS / 7 WORLDS — the museum corridor

Handoff package. Read this first, then `src/03-engine.js`.

---

## What this is

A single-page WebGL experience for **Studio How About That!** — the landing
portal for a seven-part series. The conceit: **the corridor is the eighth
world**. One continuous, Hadid-inspired white museum you walk through by
scrolling; seven apertures cut into it lead to the seven world sites.

Live behaviour, in order: an opening screen with a monumental numeral → a
line of light splits the dark and opens the museum → a four-beat studio note
read while drifting through the entrance chamber → the walk, passing the
studio's hung collection and the seven world entrances → a closing index.

---

## Why this package is split up

The shipped page is **one self-contained 1.74 MB `index.html`** — but 94% of
that is base64 assets. Pasted whole into a chat it will exhaust the context
window before anything can be read.

So: the code (98 KB, readable) lives in `src/`, the binaries live in
`assets/`, and `build.py` welds them back into the single file.

```
build.py            rebuild -> index.html          (verified byte-identical)
index.html          the built page, ready to open
src/01-head.html    <head>: all CSS + the inlined @font-face
src/02-body.html    DOM: opening screen, note, world placards, nav, footer
src/03-engine.js    ← the actual work. Three.js module.
src/04-tail.html    closing tags
assets/             18 files: 15 artworks, world-03 plate, RSVP QR, the font
```

**Workflow:** edit `src/…` → `python3 build.py` → open `index.html`.
Never hand-edit `index.html`; it is generated.

---

## Running it

Open `index.html` directly, or `python3 -m http.server` and browse to it.
Needs WebGL. Three.js r160 loads from jsDelivr via an import map — the only
external request in the whole page. If it fails, a 6-second guard clears the
dark opening and shows the index of worlds instead of leaving a black screen.

11 of the 26 artworks are referenced as `/art/<name>.jpg` rather than inlined
(see `ART_DATA` in the engine). They 404 locally and render as blank frames;
that is expected, they're served as files in production.

---

## Engine architecture (`src/03-engine.js`, top to bottom)

**The path** — a `CatmullRomCurve3` that sways so the route hides itself,
arc-length parameterised. `u` = 0..1 along it, `S(u)` = metres.

**The section** — `KEYS[]` is the spatial score: `[u, width, height, lean,
bulge]`. `prof(u)` interpolates it; `sec(u,v)` returns a point on the
cross-section, `v = -π/2` floor centre, `0` right wall, `π/2` apex, `π` left.
The rhythm is deliberate: wide chamber → narrow passage → tall atrium →
curving gallery → low compression → vast void → cathedral end.

> **Only `x` is ever modified after the base curve**, so `y` stays monotonic
> up each wall and `vForY(u,side,y)` can invert it by bisection. Several
> things depend on that invariant — don't break it.

**The surface** — one big `BufferGeometry` swept from the section, with
custom attributes (`aS` arc length, `aX/aY` metres, `aXn/aYn` normalised,
`aV` angle, `aAO` baked occlusion). Normals are welded across the floor seam.

**The material** — a `MeshStandardMaterial` with `onBeforeCompile`. This is
where most of the cleverness is:
- **apertures** are `discard`ed in the fragment shader (`uHoleA/uHoleB`), not
  modelled — so the openings cost nothing and the rims are separate geometry
- **mineral plaster** generated procedurally *in metres* at three scales
  (~18 m drift, ~0.6 m grain, ~9 cm pores), so it can't stretch or tile
- each scale fades on **screen-space footprint** (`fwidth`), not distance —
  a distance test reads a glancing wall as "near" while a pixel smears across
  half a metre of it, and the noise crawls. Don't revert this.
- **`uMod`** is a data texture over the shell's own UV, built once the
  collection is hung: R = local wall tone, G = how far the surface is quieted
  near an exhibit, B = contact shadow, A = warmth pulled out.
  Wall tone per exhibit is derived from each artwork's **measured mean
  luminance and saturation** — near-white works get a deeper wall, dark works
  a lighter one, saturated works a neutral one.
- **light cuts** (`uSeam`) and **skylight / world-colour pools** (`uPool`)

**The seven worlds** — `WORLD_DEF[]`. Each is a different architectural
intervention, not a door: a vertical slit, a peeling wall, an ellipse, a
sunken gallery, a ribbon, a suspended portal over a bridge, a cathedral void.
Open worlds leak colour, motes and light into the corridor as you approach.

**The collection** — `hangArt(src, ratio, height, u, side, y)`. Frames are
built the way frames are built: backing, print, window mat, moulding.

**The director** — the frame loop. Scroll maps to `u` through three bands:
overture holds, a slow drift while the note is read, then the walk
(`PD / P0 / P1 / UMAX / UB`). Inertia is frame-rate independent.

---

## Conventions

- **Type**: Nazarena throughout, subset and inlined as WOFF — no font CDN.
  One static weight, **no italic** (a synthesised slant wrecks the deco
  forms), and it is **unicase**: lowercase draws as capitals. It lacks `·`
  and arrows; those fall back deliberately.
- **Canvas-drawn signage** (world labels, sealed numerals) registers a redraw
  that re-fires on `document.fonts.ready` — otherwise it paints in a fallback
  face before the webfont lands.
- Comments in the source explain *why*, including several things that look
  wrong but aren't. Read them before "fixing" anything.

---

## Placeholders to replace

- Dates on worlds 04–07 (`21st Oct / 18th Nov / 16th Dec / 20th Jan`) appear
  in `02-body.html` **twice** — the placards and the footer index. Both.
- World links: `./RetroGames/`, `./Y2K/`, `/iceage`.
- The RSVP QR in the World 07 plaque.

## Known open items

- Worlds 04–07 are sealed membranes awaiting reveal.
- Mobile is the desktop experience at lower resolution; the brief called for
  a simplified guided cinematic journey instead.
- Ambient sound is generated (Web Audio), off by default, toggled in the nav.
