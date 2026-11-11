# kaikki.org German fixtures (S0.1 data spike)

Hand-picked kaikki.org entries for the sample words the brief names.
Used by the `ingest/` mapper golden tests (once it lands in S1.4+) and
by the S0.2 mapping report.

The real ingestion dump is **never** committed. These are small,
representative slices of it.

## Source

- **Dump file**: `de-extract.jsonl.gz` from kaikki.org's English-Wiktionary
  extractor, German-language slice.
- **Direct URL**: https://kaikki.org/dictionary/downloads/de/de-extract.jsonl.gz
- **Size**: 310,139,416 bytes compressed (~295.8 MB). ~2.9 GB
  uncompressed.
- **Wiktionary snapshot**: 2026-10-01 (enwiktionary dump date).
- **Extraction date**: 2026-10-30 (kaikki's `wiktextract` run).
- **Entries scanned**: 1,336,315 German entries in the extract.
- **Checksum**: kaikki.org publishes **no** SHA-256 / MD5 alongside this
  dump. (Security implication for the ingest job: see below.)
- **License**: the kaikki.org download pages do not state a license.
  The underlying Wiktionary content is dual-licensed CC BY-SA 4.0 /
  GFDL. Verify the extractor's own terms (https://github.com/tatuylonen/wiktextract)
  before redistributing the dump itself.

## What's here

One JSON file per sample word. Each file is a JSON array holding
**every** kaikki entry whose top-level `word` matches — so homographs
keep all their senses.

| File                        | Target word       | Entries | Purpose |
| --------------------------- | ----------------- | ------- | --- |
| `haus.json`                 | Haus              | 2       | Noun with full case paradigm |
| `laufen.json`               | laufen            | 1       | Strong verb (non-separable) |
| `schoen.json`               | schön             | 2       | Adjective with comparative / superlative |
| `sehr.json`                 | sehr              | 1       | Adverb |
| `ich.json`                  | ich               | 6       | Personal pronoun |
| `mit.json`                  | mit               | 4       | Preposition |
| `und.json`                  | und               | 2       | Conjunction |
| `zwei.json`                 | zwei              | 1       | Numeral |
| `hallo.json`                | hallo             | 1       | Interjection |
| `doch.json`                 | doch              | 4       | Particle |
| `band.json`                 | Band              | 5       | Homograph noun (see finding below) |
| `haustuerschluessel.json`   | Haustürschlüssel  | 1       | Compound noun |
| `aufstehen.json`            | aufstehen         | 1       | Separable verb |
| `freuen.json`               | freuen            | 1       | Reflexive verb (see finding below) |
| `milch.json`                | Milch             | 1       | *Singulare tantum* noun |
| `_summary.json`             | —                 | —       | Scanner output: counts, source size, first-entry schema peek |

Total: ~400 KB. Each file is small enough to read in a diff.

## Schema at a glance

The first entry's top-level keys (from `_summary.json`):

```
categories, etymology_links, etymology_texts, forms, hyphenations,
lang, lang_code, pos, pos_title, senses, sounds, synonyms, tags,
translations, word
```

Shape notes for the S0.2 mapping report:

- `word` — lemma string (case-preserving: `Haus`, `laufen`, `sich` is
  not in the lemma).
- `pos` — `noun`, `verb`, `adj`, `adv`, `pron`, `prep`, `conj`, `num`,
  `intj`, `particle`, `name`, …
- `pos_title` — localized POS name (`Substantiv`, `Verb`, …).
- `lang` / `lang_code` — always `Deutsch` / `de` in this slice.
- `tags` — lemma-level grammatical tags. On nouns: `["masculine"]`,
  `["feminine"]`, `["neuter"]`.
- `forms[]` — inflected forms, each with its own `tags`
  (e.g. `["nominative", "singular"]`, `["participle-2", "perfect"]`)
  and, on nouns, an `article` (`der`, `des`, `dem`, `den`, `die`).
- `senses[]` — one entry per sense. Each has `glosses` (German defs),
  `examples[]` (with `text` and literature `ref`), and sometimes
  sense-level `tags` and `raw_tags`.
- `translations[]` — cross-language; filter `lang_code == "en"` for
  the brief's English translations.
- `sounds[]` — IPA, audio files.
- `hypernyms[]`, `synonyms[]`, `coordinate_terms[]` — lexical relations.
- `etymology_texts[]`, `hyphenations[]` — bonus content.

## Findings that answer open questions

### Reflexive verbs

`sich freuen` is stored as a single entry with `word: "freuen"`,
`pos: "verb"`, and the reflexive marker **at the sense level**:

```json
"senses": [
  {
    "tags": ["reflexive"],
    "raw_tags": ["sich (über etwas) freuen"],
    ...
  }
]
```

There is **no** lemma-level `tags: ["reflexive"]` and **no**
reflexive-specific forms. This means a verb entry can carry both
transitive and reflexive senses in one record (common in German). The
S0.2 ADR will decide whether to:

- expose reflexivity as a per-sense flag on the record model, or
- promote it to a lemma-level hint when any sense is reflexive, or
- derive the `sich …` display form from `raw_tags`.

### Homographs (Band)

The brief anticipated 3 Band entries. kaikki returns **5**:

| # | pos       | tags                          | gloss summary |
| - | --------- | ----------------------------- | ------------- |
| 0 | `noun`    | `["neuter"]`                  | *das Band* — ribbon / tape (plural *Bänder*) |
| 1 | `noun`    | `["masculine"]`               | *der Band* — bound volume (book) |
| 2 | `noun`    | `["feminine"]`                | *die Band* — music group |
| 3 | `noun`    | `["neuter"]`                  | *das Band* — rubber band around a wheel tube |
| 4 | `name`    | `["feminine", "masculine", "noun"]` | *Band* — German surname |

Two entries share gender + POS (both `das Band`, different etymologies).
S0.2 and S2.1 need an identity key stronger than `(word, pos, gender)`
if they want to keep them apart. Entry `#4` is `pos: "name"`, not
`pos: "noun"` — proper-noun filtering is cheap.

### Singular-only noun (Milch)

`milch.json` carries `forms` with `singular` tags only (no `plural`).
Good sanity check for the S2.1 noun mapper's "plural may be null"
branch.

### Compound noun (Haustürschlüssel)

`forms` contains the full 4-case × 2-number paradigm with the right
article per case (der, des, dem, den, die). `etymology_texts` and
`etymology_links` give the compounds explicitly
(`Haustür` + `Schlüssel`). S4.3 (compound bulk-add) can lean on this.

### No checksum

kaikki.org publishes no checksum next to `de-extract.jsonl.gz`. The
brief's §Pipelines already flagged this; S0.2's go/no-go ADR should
confirm the fallback (row-count + golden-word gates in the ingest
job, accepted residual risk on a targeted single-entry attack).

## Reproducing the fixtures

The extractor script lives outside this repo in the session scratchpad,
intentionally — the dump is untrusted and large. To recreate:

1. Download the dump (295.8 MB) into a new, empty directory:
   ```
   curl -L -o de-extract.jsonl.gz \
     https://kaikki.org/dictionary/downloads/de/de-extract.jsonl.gz
   ```
2. Run the extractor (any Python 3.11+ works; `-I` isolates it from
   anything co-located with the dump):
   ```
   python -I extract_fixtures.py de-extract.jsonl.gz out/
   ```
3. The script writes one `<slug>.json` per target plus `_summary.json`.

The extractor is ~110 lines, dependency-free, reproducible. Not
committed because it's a one-shot spike tool — S1.4 / S2.1 will
replace it with a Maven-driven ingest job.
