#!/usr/bin/env python3
"""Compares a committed scenes.ts against a fresh capture.

Everything the tool prints is compared as it stands. One thing is not: pip
appends a notice about its own new version, which changes when pip releases and
says nothing about agsync. Left in, CI would fail on somebody else's release.

    diff-scenes.py <committed> <fresh>
"""
import pathlib
import re
import sys

# pip talking about pip, not about the package it just installed.
PIP_NOTICE = re.compile(r"(?:\\n)*\[notice\][^\\]*(?:\\n)?")

# Where the capture ran. git names the remote by absolute path, and the work
# directory is a fresh mktemp every time; nothing about agsync is in there.
TEMP_PATH = re.compile(r"(?:/private)?/(?:var/folders|tmp)/[^\s'\\]+")


def normalise(text: str) -> str:
    return TEMP_PATH.sub("<work>", PIP_NOTICE.sub("", text))


def main() -> int:
    committed, fresh = (pathlib.Path(a) for a in sys.argv[1:3])
    if normalise(committed.read_text()) == normalise(fresh.read_text()):
        return 0

    print("scenes.ts is out of date: agsync no longer prints what the page shows.\n")

    old = normalise(committed.read_text()).splitlines()
    new = normalise(fresh.read_text()).splitlines()
    ids = re.compile(r'id: "([^"]+)"')

    scene = "?"
    for a, b in zip(old, new):
        found = ids.search(a)
        if found:
            scene = found.group(1)
        if a != b:
            print(f"  {scene}:")
            print(f"    committed: {a.strip()[:150]}")
            print(f"    now:       {b.strip()[:150]}\n")

    if len(old) != len(new):
        print(f"  and the scene list itself changed: {len(old)} lines -> {len(new)}\n")

    print("Run scripts/capture-scenes.sh and commit the result.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
