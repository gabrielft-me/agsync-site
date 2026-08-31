#!/usr/bin/env python3
"""Run a command under a pty and record what it printed, plus its exit status.

The CLI only emits ANSI when it believes it is talking to a terminal, and the
site parses those escapes rather than re-inventing the colours. script(1) is the
obvious tool for this but fails outright when the caller's own stdin is not a
tty, which is most of the ways this ends up being run.

    pty-run.py <outfile> <shell command>
"""
import errno
import os
import pty
import subprocess
import sys


def main() -> int:
    out_path, command = sys.argv[1], sys.argv[2]

    master, slave = pty.openpty()
    proc = subprocess.Popen(
        ["/bin/sh", "-c", command],
        stdin=slave,
        stdout=slave,
        stderr=slave,
        close_fds=True,
    )
    # The parent's copy of the slave has to go, or the master never sees EOF.
    os.close(slave)

    chunks = []
    try:
        while True:
            try:
                data = os.read(master, 4096)
            except OSError as err:
                # A pty master reports EIO rather than EOF once the child is gone.
                if err.errno == errno.EIO:
                    break
                raise
            if not data:
                break
            chunks.append(data)
    finally:
        os.close(master)

    with open(out_path, "wb") as out:
        out.write(b"".join(chunks))

    return proc.wait()


if __name__ == "__main__":
    sys.exit(main())
