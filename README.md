# agsync.dev

The landing page for [agsync](https://github.com/gabrielft-me/agsync). One
non-scrolling screen: the terminal is already running, and the wheel, the arrow
keys and the ticks move it through seven commands.

## Running it

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
```

Astro with no UI framework. The page ships as a single HTML file with the CSS
and ~3 KB of script inlined — no external JavaScript bundle.

## The output is captured, never written

Two scenes are the exception and say so. `src/data/tree.ts` is an authored
illustration of a repository layout and `src/data/outro.ts` is prose; both are
drawn without a prompt or an exit code so neither can be mistaken for the output
of a command. The project in the tree is invented.

`outro.ts` also holds `VENUE`, which is still the generic "a hackathon in San
Francisco" — replace it with the event's actual name.

Every other terminal block is what the CLI actually printed. To regenerate:

```sh
AGSYNC_REPO=~/path/to/agsync scripts/capture-scenes.sh
```

That runs the seven commands under a pty (`scripts/pty-run.py`, so the CLI sees
a terminal and emits its real ANSI), records each one's output and exit status,
and writes `src/data/scenes.ts`. `src/lib/ansi.ts` turns the escapes into spans
at build time. Never edit `scenes.ts` by hand.

Scenes 4 and 5 (`agsync replay`) need a repository with history. By default the
script builds agsync's own replay fixture — a real git repository made by real
commits, but a fixture. Point it at a real memory repo instead:

```sh
AGSYNC_REPLAY_REPO=~/path/to/memory-repo scripts/capture-scenes.sh
```

### Trimming

`src/lib/trim.ts` cuts each scene to the shortest form that still makes its
point. It only ever *selects* captured lines and counts what it dropped — it
never writes one — and every cut renders as a visible elision (`… 9 more`),
because a silent truncation is indistinguishable from a tool that found less
than it did. The rules assert the shape they expect, so a re-capture that
changes the output fails the build instead of quietly showing the wrong three
findings.

## The social card

`public/og.png` is a screenshot of the `/og` route at 1200×630. After changing
the hero or the captured output, open `/og`, screenshot the card, and crop:

```sh
sips -s format png -c 630 1200 --cropOffset 0 0 shot.jpg --out public/og.png
```

## Before launch

- `src/config.ts` — `REPO` is the GitHub slug everything else derives from.
- The star count is fetched at build time from the GitHub API and embedded in
  the HTML; it is never a client fetch, because a button that renders `0` and
  corrects itself a moment later is worse than one with no number. Set
  `GITHUB_TOKEN` in CI to avoid the unauthenticated rate limit.

## Layout

```
src/
  components/   Screen (the whole page), StarButton
  data/         scenes.ts (generated — see above), tree.ts + outro.ts (authored)
  lib/          ansi.ts (SGR -> spans), trim.ts, github.ts
  pages/        index.astro, 404.astro, og.astro
  styles/       global.css (tokens, texture, app-mode mechanics)
scripts/        capture-scenes.sh, build-scenes.py, pty-run.py
```

## Behaviour notes

Source order is a plain vertical list: the headline, then seven scenes, each
with its own label and output. That is what a reader gets with JavaScript off
or with `prefers-reduced-motion: reduce`. Only when both are available does
script add `data-app`, stack the scenes, and take over the wheel.

The window's height is measured from the active scene and animated, capped at
70vh. Nothing scrolls inside it: a scene that does not fit has too much output
and belongs in `trim.ts`, not in a scrollbar.

Three fixed texture layers sit behind everything — a radial wash, a tiled
`feTurbulence` grain at ~4%, and scanlines behind the terminal only. None are
animated, none are hit-testable, and the grain is a data URI generated once.
