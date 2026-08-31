#!/usr/bin/env bash
# Regenerates src/data/scenes.ts by actually running agsync and recording what
# it prints. Nothing in the demo is hand-written; if the CLI's output changes,
# re-run this and the site changes with it.
#
#   scripts/capture-scenes.sh            capture, and write src/data/scenes.ts
#   scripts/capture-scenes.sh --check    capture, and fail if the committed
#                                        scenes no longer match
#
# The version captured from is pinned in .agsync-ref, which is the one thing
# both repositories can see. With no AGSYNC_REPO the script clones that ref;
# with one, it uses that checkout as it stands, which is what you want while
# working on the tool and not what CI should ever do.
#
# Optional: AGSYNC_REPLAY_REPO=~/path/to/a/memory/repo replays that repository's
# real history instead of the project's own replay fixture.
#
# Every command runs under a pty (see pty-run.py) so the CLI sees a terminal and
# emits its real ANSI colours; the site parses those escapes rather than
# inventing its own.
#
# No ( ... ) subshells below: bash runs an EXIT trap when a subshell exits, so a
# cleanup trap plus a subshell deletes the work directory halfway through.
set -euo pipefail

MODE="${1:-write}"
OUT="$(cd "$(dirname "$0")/.." && pwd)"
REF="$(tr -d '[:space:]' < "$OUT/.agsync-ref")"
WORK="$(mktemp -d)"
RAW="$WORK/raw"
AGENT="$WORK/my-agent"
mkdir -p "$RAW" "$AGENT"

if [ -n "${AGSYNC_REPO:-}" ]; then
  REPO="$AGSYNC_REPO"
else
  REPO="$WORK/agsync"
  git clone --quiet --depth 1 --branch "$REF" \
    https://github.com/gabrielft-me/agsync.git "$REPO"
fi

# The capture needs the repository, not just the package: the fixtures and the
# replay history builder live in tests/.
AG="$REPO/.venv/bin/agsync"
if [ ! -x "$AG" ]; then
  python3 -m venv "$REPO/.venv"
  "$REPO/.venv/bin/pip" install --quiet -e "$REPO"
fi

VERSION="$("$AG" --version | awk '{print $NF}')"
REQUIRES="$(grep -m1 '^requires-python' "$REPO/pyproject.toml" | sed 's/.*"\(.*\)"/\1/')"

# run <id> <cwd> <command...> — pty-captures stdout+stderr and the exit status.
run() {
  local id="$1" cwd="$2"; shift 2
  local status=0
  PATH="$REPO/.venv/bin:$PATH" \
    python3 "$OUT/scripts/pty-run.py" "$RAW/$id.out" "cd '$cwd' && $*" \
    < /dev/null || status=$?
  printf '%s' "$status" > "$RAW/$id.status"
}

# Same, without the pty. Installers draw a spinner and erase it, which a
# terminal consumes and a capture keeps; piped, they print the settled lines a
# person is left looking at. The trade is their colour, which is little.
run_plain() {
  local id="$1" cwd="$2"; shift 2
  local status=0
  PATH="$REPO/.venv/bin:$PATH" /bin/sh -c "cd '$cwd' && $*" \
    > "$RAW/$id.out" 2>&1 < /dev/null || status=$?
  printf '%s' "$status" > "$RAW/$id.status"
}

# Installing it.
#
# agsync is on PyPI, so this is captured against the real index. It runs cold,
# into a throwaway environment, and that is not tidiness: pip prints
# "Downloading" the first time and "Using cached" every time after, and the
# first is what someone arriving at this page actually gets. pip installs into
# whichever environment it is run from, so it gets a venv of its own rather
# than the caller's — and neither that path nor the disabled cache appears
# anywhere in its output, so what is recorded is character-for-character what
# the bare command prints on a machine that has never seen the package.
python3 -m venv "$WORK/pip-env" >/dev/null
run_plain install-pip "$WORK" "'$WORK/pip-env/bin/pip' install --no-cache-dir agsync"

# 1 + 2 — the same command against a repo that decayed and one that has not.
run 1 "$REPO" "agsync check tests/fixtures/decayed"

git init -q "$AGENT"
git -C "$AGENT" config user.email you@example.com
git -C "$AGENT" config user.name You
run 7 "$AGENT" "agsync init"
run 2 "$AGENT" "agsync check"
run 3 "$REPO"  "agsync rules"

# 6 — the gate. Install the hook, commit the scaffold, then reuse a decision ID.
PATH="$REPO/.venv/bin:$PATH" "$AG" install-hooks "$AGENT" >/dev/null
git -C "$AGENT" add -A
git -C "$AGENT" -c core.hooksPath=.git/hooks commit -qm "scaffold memory"
cat >> "$AGENT/memory/decisions.md" <<'EOF'

## D-001 — Cache embeddings on disk between runs
- **Date:** 2026-08-30
- **Decision:** Embeddings are written to `.cache/` and reused across runs.
- **Consequences:** First run is slower; every later run skips re-embedding.
EOF
# ...and finish a task in the file without touching the index, the other half
# of the same class of drift.
sed -i '' 's/^\*\*Status:\*\* todo$/**Status:** done/' "$AGENT/tasks/00-example.md"
git -C "$AGENT" add -A
run 6 "$AGENT" 'git commit -m "wip"'

# 4 + 5 — replay needs real git history.
if [ -n "${AGSYNC_REPLAY_REPO:-}" ]; then
  TARGET="$AGSYNC_REPLAY_REPO"
else
  TARGET="$WORK/replay-fixture"
  mkdir -p "$TARGET"
  cd "$REPO"
  "$REPO/.venv/bin/python" - "$TARGET" <<'PY'
import sys
sys.path.insert(0, "tests"); sys.path.insert(0, "src")
from replay_repo import build_replay_repo
build_replay_repo(sys.argv[1])
PY
fi
run 4 "$(dirname "$TARGET")" "agsync replay $(basename "$TARGET")"
run 5 "$(dirname "$TARGET")" "agsync replay $(basename "$TARGET") --first-seen"

TARGET="$OUT/src/data/scenes.ts"
[ "$MODE" = "--check" ] && TARGET="$WORK/scenes.ts"

AGSYNC_REF="$REF" AGSYNC_VERSION="$VERSION" AGSYNC_REQUIRES="$REQUIRES" \
  python3 "$OUT/scripts/build-scenes.py" "$RAW" "$TARGET"

if [ "$MODE" = "--check" ]; then
  python3 "$OUT/scripts/diff-scenes.py" "$OUT/src/data/scenes.ts" "$TARGET" || {
    rm -rf "$WORK"
    exit 1
  }
  rm -rf "$WORK"
  echo "scenes match agsync $REF"
else
  rm -rf "$WORK"
  echo "wrote src/data/scenes.ts from agsync $VERSION ($REF)"
fi
