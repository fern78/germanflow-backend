"""Stream a kaikki.org German JSONL.gz dump and pull fixtures for the S0.1 sample words.

Run with `python -I` (no implicit paths, since the dump directory is untrusted):
    python -I extract_fixtures.py <path-to-de-extract.jsonl.gz> <out-dir>

One output file per target word, named `<slug>.json`, holding a JSON array of every
entry whose top-level "word" (case-sensitive match) is the target. Also writes
`_summary.json` with counts, the first entry's top-level keys (schema peek), and the
total entries scanned.
"""
from __future__ import annotations

import gzip
import json
import sys
from pathlib import Path

# Target words. Slug is the output filename (ASCII, lowercase, umlauts transliterated).
# Each row: (slug, kaikki-word, note). The note is reproduced in the fixture's README.
TARGETS: list[tuple[str, str, str]] = [
    # --- one entry per word class ---
    ("haus",              "Haus",             "noun"),
    ("laufen",            "laufen",           "verb"),
    ("schoen",            "schön",            "adjective"),
    ("sehr",              "sehr",             "adverb"),
    ("ich",               "ich",              "pronoun"),
    ("mit",               "mit",              "preposition"),
    ("und",               "und",              "conjunction"),
    ("zwei",              "zwei",             "numeral"),
    ("hallo",             "hallo",            "interjection"),
    ("doch",              "doch",             "particle"),
    # --- special cases the brief names ---
    ("band",              "Band",             "homograph noun (three entries expected: das Band, die Band, der Band)"),
    ("haustuerschluessel","Haustürschlüssel", "compound noun"),
    ("aufstehen",         "aufstehen",        "separable verb"),
    ("freuen",            "freuen",           "reflexive verb (stored by kaikki as 'freuen'; reflexivity in forms/tags)"),
    ("milch",             "Milch",            "singular-only (singulare tantum) noun"),
]


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: python -I extract_fixtures.py <de-extract.jsonl.gz> <out-dir>", file=sys.stderr)
        return 2
    src = Path(argv[1]).resolve()
    out_dir = Path(argv[2]).resolve()
    if not src.is_file():
        print(f"not a file: {src}", file=sys.stderr)
        return 2
    out_dir.mkdir(parents=True, exist_ok=True)

    wanted: dict[str, tuple[str, str]] = {word: (slug, note) for slug, word, note in TARGETS}
    buckets: dict[str, list[dict]] = {slug: [] for slug, _, _ in TARGETS}
    first_entry_keys: list[str] | None = None
    scanned = 0
    size_bytes = src.stat().st_size

    with gzip.open(src, "rt", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            scanned += 1
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if first_entry_keys is None:
                first_entry_keys = sorted(entry.keys())
            word = entry.get("word")
            if not isinstance(word, str):
                continue
            hit = wanted.get(word)
            if hit is None:
                continue
            slug, _ = hit
            buckets[slug].append(entry)
            if scanned % 100_000 == 0:
                print(f"scanned {scanned:,}", file=sys.stderr)

    counts: dict[str, int] = {}
    for slug, _, _ in TARGETS:
        entries = buckets[slug]
        counts[slug] = len(entries)
        out_path = out_dir / f"{slug}.json"
        with out_path.open("w", encoding="utf-8", newline="\n") as fh:
            json.dump(entries, fh, ensure_ascii=False, indent=2)
            fh.write("\n")

    summary = {
        "source_file":           src.name,
        "source_size_bytes":     size_bytes,
        "entries_scanned":       scanned,
        "first_entry_top_keys":  first_entry_keys or [],
        "counts_per_fixture":    counts,
        "targets":               [
            {"slug": slug, "word": word, "note": note}
            for slug, word, note in TARGETS
        ],
    }
    with (out_dir / "_summary.json").open("w", encoding="utf-8", newline="\n") as fh:
        json.dump(summary, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print(f"done. scanned {scanned:,} entries. counts: {counts}")
    missing = [slug for slug, n in counts.items() if n == 0]
    if missing:
        print(f"WARNING: no entries matched for: {missing}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
