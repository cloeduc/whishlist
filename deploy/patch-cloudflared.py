#!/usr/bin/env python3
"""Insert or update a cloudflared ingress hostname before the catch-all."""
from __future__ import annotations

import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 4:
        print("usage: patch-cloudflared.py CONFIG HOSTNAME SERVICE", file=sys.stderr)
        raise SystemExit(2)
    path = Path(sys.argv[1])
    hostname = sys.argv[2]
    service = sys.argv[3]
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    block = (
        f"  - hostname: {hostname}\n"
        f"    service: {service}\n"
    )
    out: list[str] = []
    i = 0
    skipped = False
    while i < len(lines):
        line = lines[i]
        if line.strip() == f"- hostname: {hostname}":
            skipped = True
            i += 1
            while i < len(lines) and (
                lines[i].startswith("    ") or lines[i].strip() == ""
            ):
                i += 1
            continue
        out.append(line)
        i += 1

    # Insert before catch-all: "- service: http_status:404"
    inserted = False
    final: list[str] = []
    for line in out:
        if (not inserted) and line.lstrip().startswith("- service: http_status:"):
            final.append(block)
            inserted = True
        final.append(line)
    if not inserted:
        if final and not final[-1].endswith("\n"):
            final.append("\n")
        final.append("ingress:\n" if "ingress:" not in "".join(final) else "")
        final.append(block)

    path.write_text("".join(final), encoding="utf-8")
    action = "updated" if skipped else "added"
    print(f"{action} {hostname} -> {service}")


if __name__ == "__main__":
    main()
