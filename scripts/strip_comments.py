#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator


KEEP_COMMENT_SUBSTRINGS = [
    "NOSONAR",
    "eslint",
    "prettier",
    "stylelint",
    "ts-ignore",
    "ts-expect-error",
    "@license",
    "copyright",
    "generated",
    "@generated",
    "noinspection",
    "@formatter",
]


def should_keep_comment(comment_body: str, remove_directives: bool) -> bool:
    if remove_directives:
        return False
    body_lower = comment_body.lower()
    for needle in KEEP_COMMENT_SUBSTRINGS:
        if needle.lower() in body_lower:
            return True
    return False


@dataclass
class StripResult:
    text: str
    removed_comments: int


def strip_c_like_comments(
    source: str,
    *,
    remove_directives: bool,
    allow_regex_literals: bool,
) -> StripResult:
    out: list[str] = []
    i = 0
    n = len(source)
    removed = 0

    NORMAL = "NORMAL"
    SL_COMMENT = "SL_COMMENT"
    ML_COMMENT = "ML_COMMENT"
    SQ = "SQ"
    DQ = "DQ"
    BT = "BT"  # backtick (TS)
    REGEX = "REGEX"
    JAVA_TEXT_BLOCK = "JAVA_TEXT_BLOCK"  # """ ... """

    state = NORMAL
    comment_buf: list[str] = []

    def peek(offset: int = 0) -> str:
        j = i + offset
        return source[j] if 0 <= j < n else ""

    def prev_non_ws_char() -> str:
        k = len(out) - 1
        while k >= 0 and out[k].isspace():
            k -= 1
        return out[k] if k >= 0 else ""

    while i < n:
        ch = source[i]
        nxt = peek(1)

        if state == NORMAL:
            # Java text blocks """
            if ch == '"' and nxt == '"' and peek(2) == '"':
                out.append('"""')
                i += 3
                state = JAVA_TEXT_BLOCK
                continue

            if ch == '"':
                out.append(ch)
                i += 1
                state = DQ
                continue
            if ch == "'":
                out.append(ch)
                i += 1
                state = SQ
                continue
            if ch == "`" and allow_regex_literals:
                out.append(ch)
                i += 1
                state = BT
                continue

            # Start of comment?
            if ch == "/" and nxt == "/":
                comment_buf = ["//"]
                i += 2
                state = SL_COMMENT
                continue
            if ch == "/" and nxt == "*":
                comment_buf = ["/*"]
                i += 2
                state = ML_COMMENT
                continue

            # Regex literal (TS/JS) heuristic: only when enabled
            if allow_regex_literals and ch == "/":
                prev = prev_non_ws_char()
                # Heuristic: likely regex if it follows an operator/brace or start of file
                if prev == "" or prev in "([{:;,=!?&|+-*%^~<>\n":
                    out.append(ch)
                    i += 1
                    state = REGEX
                    continue

            out.append(ch)
            i += 1
            continue

        if state == SL_COMMENT:
            if ch == "\n":
                comment_text = "".join(comment_buf)
                body = comment_text[2:]
                if should_keep_comment(body, remove_directives):
                    out.append(comment_text)
                else:
                    removed += 1
                out.append("\n")
                i += 1
                state = NORMAL
                continue
            comment_buf.append(ch)
            i += 1
            continue

        if state == ML_COMMENT:
            if ch == "*" and nxt == "/":
                comment_buf.append("*/")
                i += 2
                comment_text = "".join(comment_buf)
                body = comment_text[2:-2]
                if should_keep_comment(body, remove_directives):
                    out.append(comment_text)
                else:
                    removed += 1
                    # Preserve line breaks to avoid collapsing lines too much
                    out.append("\n" * comment_text.count("\n"))
                state = NORMAL
                continue
            comment_buf.append(ch)
            i += 1
            continue

        if state == DQ:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(source[i + 1])
                i += 2
                continue
            if ch == '"':
                state = NORMAL
            i += 1
            continue

        if state == SQ:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(source[i + 1])
                i += 2
                continue
            if ch == "'":
                state = NORMAL
            i += 1
            continue

        if state == BT:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(source[i + 1])
                i += 2
                continue
            if ch == "`":
                state = NORMAL
            i += 1
            continue

        if state == REGEX:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(source[i + 1])
                i += 2
                continue
            if ch == "/":
                state = NORMAL
            i += 1
            continue

        if state == JAVA_TEXT_BLOCK:
            # End at next """
            if ch == '"' and nxt == '"' and peek(2) == '"':
                out.append('"""')
                i += 3
                state = NORMAL
                continue
            out.append(ch)
            i += 1
            continue

    # If file ends in a single-line comment without newline
    if state == SL_COMMENT:
        comment_text = "".join(comment_buf)
        body = comment_text[2:]
        if should_keep_comment(body, remove_directives):
            out.append(comment_text)
        else:
            removed += 1

    return StripResult("".join(out), removed)


_HTML_COMMENT_RE = re.compile(r"<!--([\\s\\S]*?)-->", re.MULTILINE)


def strip_html_comments(source: str) -> StripResult:
    matches = list(_HTML_COMMENT_RE.finditer(source))
    if not matches:
        return StripResult(source, 0)
    stripped = _HTML_COMMENT_RE.sub("", source)
    return StripResult(stripped, len(matches))


def iter_files(roots: Iterable[Path], exts: set[str]) -> Iterator[Path]:
    for root in roots:
        if not root.exists():
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            # Skip common heavy folders
            parts = set(Path(dirpath).parts)
            if "node_modules" in parts or "target" in parts or "dist" in parts or ".angular" in parts:
                dirnames[:] = []
                continue
            for name in filenames:
                path = Path(dirpath) / name
                if path.suffix.lower() in exts:
                    yield path


def main() -> int:
    parser = argparse.ArgumentParser(description="Strip comments from project source files.")
    parser.add_argument(
        "--roots",
        nargs="*",
        default=[
            "Backend-DietiEstates25/src",
            "Frontend-DietiEstates25/src",
        ],
        help="Root folders to process (relative to repo root).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write changes, only report.",
    )
    parser.add_argument(
        "--remove-directives",
        action="store_true",
        help="Also remove directive comments (eslint/prettier/NOSONAR/etc).",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    roots = [repo_root / r for r in args.roots]

    exts = {".java", ".ts", ".scss", ".html"}

    total_files = 0
    changed_files = 0
    removed_comments_total = 0

    for path in iter_files(roots, exts):
        total_files += 1
        original = path.read_text(encoding="utf-8", errors="replace")

        if path.suffix.lower() == ".html":
            result = strip_html_comments(original)
        elif path.suffix.lower() == ".java":
            result = strip_c_like_comments(
                original,
                remove_directives=args.remove_directives,
                allow_regex_literals=False,
            )
        elif path.suffix.lower() == ".scss":
            result = strip_c_like_comments(
                original,
                remove_directives=args.remove_directives,
                allow_regex_literals=False,
            )
        else:  # .ts
            result = strip_c_like_comments(
                original,
                remove_directives=args.remove_directives,
                allow_regex_literals=True,
            )

        if result.text != original:
            changed_files += 1
            removed_comments_total += result.removed_comments
            if not args.dry_run:
                path.write_text(result.text, encoding="utf-8")

    print(
        f"Processed {total_files} files. Changed {changed_files}. Removed {removed_comments_total} comments"
        + (" (dry-run)" if args.dry_run else "")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
