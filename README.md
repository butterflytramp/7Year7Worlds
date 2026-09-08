# 7 Years 7 Worlds — demo bundle

Static site, no build step.

- `/` — The Corridor (master page)      [in place]
- `/Y2K/` — World 02                    [index in place — add 2 files below]
- `/RetroGames/` — World 01             [add 2 files below]

## FINISH THE BUNDLE (2 Finder drags)

The destination files exist as 0-byte placeholders — when Finder asks,
choose **Replace**.

1. From `y2k-world/assets/` copy `ending.mp4` and `og.jpg`
   into `deploy-7years7worlds/Y2K/assets/`
2. From `pacman-world-site/` copy `index.html` into
   `deploy-7years7worlds/RetroGames/` and `assets/ending.mp4` into
   `deploy-7years7worlds/RetroGames/assets/`

(Do NOT copy `ending-original.mp4` — that's the 58MB source backup.)

## Deploy to Vercel

1. github.com → New repository (e.g. `hat-studio/7years7worlds`) →
   upload the CONTENTS of this folder (drag all files and folders onto
   the repo page, or `git init && git add . && git commit && git push`).
2. vercel.com → Add New Project → import that repo.
   Framework preset: **Other**. No build command, no output directory.
   Deploy.
3. Share the `*.vercel.app` URL with the team. Enable Project →
   Settings → Comments so feedback pins onto the page itself.
   Every future push auto-deploys with its own preview URL.

## Later: production on Linode

`scp -r` this folder's contents to the web root as `/7years7worlds/` —
the relative door links work unchanged at
`howaboutthat.in/7years7worlds/`. Before going live, set the real
og:image BASE_URL in `Y2K/index.html`.
