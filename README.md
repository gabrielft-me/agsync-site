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
and script inlined — no external JavaScript bundle. The keystroke plan for the
one command that types itself in is generated at build time (`src/lib/typing.ts`)
and embedded as a data attribute, which keeps the client script import-free and
therefore inlined.

## The output is captured, never written

Two scenes are the exception and say so. `src/data/project.ts` is an authored
illustration — an invented `my-service` repository and the six markdown files
inside it — and `src/data/outro.ts` is prose; both are drawn without a prompt or
an exit code so neither can be mistaken for the output of a command.

The captured output and the invented project share a file layout, which is what
actually links them. They do not share decision IDs or task numbers: the output
comes from a different repository, and making the specifics appear to match
would be inventing a coincidence.

`outro.ts` also holds `VENUE`, which is still the generic "a hackathon in San
Francisco" — replace it with the event's actual name.

Every other terminal block is what the CLI actually printed. To regenerate:

```sh
AGSYNC_REPO=~/path/to/agsync scripts/capture-scenes.sh
```

That runs each command and writes `src/data/scenes.ts`. CLI commands go under a
pty (`scripts/pty-run.py`) so they emit their real ANSI; the installer does not,
because it draws a spinner and erases it, which a terminal consumes and a
capture keeps — piped, it prints the settled lines a person is left with.

The install is captured against PyPI proper, cold: pip prints `Downloading` the
first time and `Using cached` every time after, and the first is the one a
visitor will actually get. The throwaway venv and the disabled cache that keep
the capture off the caller's machine print nothing of their own, so the
displayed command and the recorded output belong to each other.

pip keeps its version notice, which is genuine output and renders as the dimmed
extra it is. There is one installer, so the switcher hides itself; a second
entry in `installs` in `Screen.astro` brings it back, and switching re-runs the
scene with the one just picked.

`src/lib/ansi.ts` turns the escapes into spans at build time. Never edit
`scenes.ts` by hand.

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
  data/         scenes.ts (generated — see above), project.ts + outro.ts (authored)
  lib/          ansi.ts (SGR -> spans), trim.ts, typing.ts, markdown.ts, github.ts
  pages/        index.astro, 404.astro, og.astro
  styles/       global.css (tokens, texture, app-mode mechanics)
scripts/        capture-scenes.sh, build-scenes.py, pty-run.py
```

## Behaviour notes

Source order is a plain vertical list: the headline, then seven scenes, each
with its own label and output. That is what a reader gets with JavaScript off
or with `prefers-reduced-motion: reduce`. Only when both are available does
script add `data-app`, stack the scenes, and take over the wheel.

Above the breakpoint the window takes the whole height it is given, capped at
40rem so it stops being a bigger and bigger empty rectangle on a tall screen;
whatever room is left over splits above and below it. Nothing scrolls inside it
unless you expand an elision: a scene that does not fit has too much output and
belongs in `trim.ts`, not in a scrollbar.

Three fixed texture layers sit behind everything — a radial wash, a tiled
`feTurbulence` grain at ~4%, and scanlines behind the terminal only. None are
animated, none are hit-testable, and the grain is a data URI generated once.
