# ADR 001: M0 data spike — go/no-go

- Status: accepted
- Date: 2026-11-11

## Context

The brief (§ Ingestion job spike go/no-go) pre-committed to an M0 data
spike that would answer one question before backend code lands: can
kaikki.org's German extract actually fill the content model
(brief § Content model, lines 195–215)?

S0.1 landed the data: a German-only JSONL extract exists at
`https://kaikki.org/dictionary/downloads/de/de-extract.jsonl.gz`
(295.8 MB gzipped, Wiktionary 2026-10-01, no checksum published, 1.34 M
entries). 15 hand-picked fixture files in `fixtures/kaikki/` cover
every POS plus a compound, a homograph, a separable verb, a reflexive
verb and a *singulare tantum* noun.

The spike's exit test from the brief:

> "The content model is achievable if, for the sampled nouns, most
> have gender, plural and all four cases, and for the sampled verbs,
> most have auxiliary and principal parts. If the English-edition
> German entries are too thin, the fallback is a smaller card model;
> the brief is changed before the backend is built."

This ADR runs the test, decides go or no-go, and records three
sub-decisions the brief asked S0.2 to make: the storage format for
reflexive verbs, the ingestion-gate thresholds, and the mapping report
(appendix).

## Decision

**GO. The content model as written is achievable** with two small
clarifications in the brief:

1. **Reflexive storage.** `VERB.reflexive` stays a lemma-level boolean
   on the record. **Derivation rule**: `reflexive = true` iff the
   kaikki infinitive form (`forms[]` with `tags: ["infinitive"]`)
   contains `"sich"`. In addition, add a new nullable field
   `VERB.reflexivePattern` (string) that stores the raw `sich (…)
   …` template, taken from the first reflexive sense's `raw_tags`.
   This keeps the card shape simple (one boolean for UI gating) but
   preserves the specific pattern a learner would need to see
   (`sich (über etwas) freuen`). Rationale: kaikki stores reflexivity
   **per sense**, not per lemma — so a majority-of-senses rule would
   misclassify verbs like `laufen` that carry one marginal reflexive
   sense among many non-reflexive ones. The infinitive-form rule is
   deterministic and matches the learner's intuition.

2. **Composite (compound) nouns.** `NOUN.composite` is best-effort:
   populated only when kaikki's `etymology_texts[]` contains the
   token `Determinativkompositum` AND `etymology_links[]` lists exactly
   two to six proper-noun or noun lemmas. Haustürschlüssel satisfies
   this (`etymology_links = [["Haustür", …], ["Schlüssel", …]]`); Haus
   and Band do not (their `etymology_links` are historical, 40+
   entries, not compositional). Linking element (`s` in
   `Haus-s-tür-schlüssel`) is derived by string-diffing the surface
   form against the concatenated components; stays `null` if the diff
   is ambiguous. This is noted in the brief; the field was already
   optional.

**Ingestion-gate thresholds** (brief § Ingestion job, "share of
entries missing required fields exceeds a threshold"):

Fail the ingestion run — keep the old dictionary live — if **any** of:

| Gate | Pass unless more than… |
| ---- | --- |
| G1 Nouns missing `gender` | 2% of noun entries |
| G2 Nouns missing `genitiveSingular` | 2% of noun entries |
| G3 Nouns missing `plural` AND not flagged *singulare tantum* | 5% of noun entries |
| G4 Nouns missing a form for any of nom/gen/dat/acc singular | 2% of noun entries |
| G5 Verbs missing `infinitive`, `präteritum3sg`, or `partizipII` | 2% of verb entries |
| G6 Verbs missing `auxiliary` | 5% of verb entries |
| G7 Adjectives missing `comparative` or `superlative` | 15% (some are morphologically defective; e.g. `rosa`) |
| G8 Golden-word tests fail (Haus, laufen, Haustürschlüssel, Band, schön) | 0 failures tolerated |
| G9 Row-count deviation vs previous build | ±5% |

The M0 fixtures all meet G1–G7 (every non-degenerate noun and verb
fixture is complete). The thresholds leave headroom for Wiktionary's
long tail: obscure dialectal entries, archaic forms, and the
`pos: "name"` and `tags: ["form-of"]` surface stubs that must be
filtered BEFORE applying gates.

**Filtering rules applied before gates (brief § Ingestion, but now
explicit)**:

- `pos: "name"` (surnames and place names) → dropped.
- `tags: ["form-of"]` or `pos_title in {"Deklinierte Form", "Konjugierte Form"}` → dropped from the main entries table; instead fed into the inflected-form table pointing at the base lemma.
- `pos: "phrase"` **without** `tags[intj]` → dropped (idioms stay manual per brief).
- Entries whose `senses` is empty or whose only sense's glosses are empty → dropped (incomplete stubs).

**Dump integrity** (brief § Ingestion, "If kaikki publishes a
checksum…"): S0.1 confirmed **no checksum is published**. The job
therefore relies on G8 (golden words) and G9 (row count) to catch
gross poisoning, and accepts the targeted single-entry attack as a
residual risk. Recorded here so the security review can cite it.

## Consequences

**Easier**

- S1.4 (Maven skeleton) can proceed against the content model as
  written — no shape changes required.
- S2.1 (noun mapper) and S2.2 (verb/adj mapper) have a concrete
  mapping table (see appendix) and a specific set of gates to assert
  in their golden tests.
- The reflexive-verb rule (`infinitive contains "sich"`) is
  deterministic and testable: freuen → true, laufen → false, aufstehen
  → false.

**Harder**

- `VERB.reflexivePattern` is a new field not in the pre-S0.2 brief.
  The brief and the eventual OpenAPI contract must add it. The app's
  card UI must render it (but that's one more line of text next to
  the lemma).
- `NOUN.composite` detection is heuristic. Haustürschlüssel is a happy
  path; real-world compounds with fusing vowels (e.g. `Donauwelle` for
  `Donau + Welle`?) may fall out. Accepted — the field is already
  optional.
- Full per-person conjugation tables for some verbs (notably
  reflexive-only lemmas) are **partial** in kaikki's `forms[]`:
  freuen's fixture has principal parts but 0 tagged
  `tense+person+number` forms, because kaikki groups reflexive
  conjugation under different tag patterns than non-reflexive
  conjugation. The brief's `VERB.conjugation` is implicitly tolerant
  of this (fields in the content model are nullable by rule), but S2.2
  will need to do a second pass over `raw_tags` to recover the
  per-person entries, or accept a partial table for reflexives.

**Must be re-checked**

- When the real ingest job (S1.4+) scans all 1.34 M German entries
  (vs the 15-fixture sample), re-measure the per-gate failure rates.
  If G1–G6 exceed their thresholds at scale, this ADR is superseded
  by a smaller card model.
- When writing the preposition / conjunction / numeral mappers, verify
  that `categories[]` on real entries contains the case / kind markers
  the appendix says to use. The 15 fixtures cover one entry per
  class; edge cases will surface at scale.

## Appendix A — Mapping report (kaikki → content-model record)

Each row names a content-model field and the kaikki source. **Rule
column** is the extraction heuristic the S2.1+ mapper will implement.
**Null column** names the fallback when the rule misses.

### Shared (every POS)

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `germanText` | `word` | Verbatim. Preserve case. | n/a (drop entry if absent) |
| `pos` | `pos` + `pos_title` + `tags` | Table in Appendix B below. | pos is unmappable (`name`, `unknown`, raw `phrase` with no `intj` tag) → drop entry |
| `englishTranslations` | `translations[]` where `lang_code == "en"` | Collect `.word` values, dedupe, cap at 10. | List empty → drop entry (per brief: `englishTranslations` is non-empty) |
| `examples` | `senses[].examples[]` | `{ text, translation: null, source: "DICTIONARY" }`. kaikki gives no English translation of German examples. Cap total per card at 5. | Collected list empty → `[]`, not null |
| `note` | — | Learner-only; always `null` from ingestion | always |
| `source` | — | Always `"DICTIONARY"` at ingest | always |

### NOUN

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `gender` | `tags[]` on the main entry | Pick the first of `masculine` \| `feminine` \| `neuter`. Map to `m \| f \| n`. | None of the three present (rare) → drop entry |
| `article` | Derived from `gender` | `m→der, f→die, n→das` (cross-check against any `forms[].article == "der|die|das"` on nom-sg) | gender null |
| `plural` | `forms[]` where `tags == ["nominative","plural"]` | `.form`. Multiple → prefer the one without `raw_tags`. | *Singulare tantum*: no plural forms exist AND entry carries category "Singularetantum" → `null` + set `singularOnly: true` flag on the record |
| `genitiveSingular` | `forms[]` where `tags == ["genitive","singular"]` | `.form`. First one wins. | Never missing in the 15 fixtures; drop entry if absent at scale |
| `declension` | `forms[]` grouped by `tags` | For each of nom/gen/dat/acc × sg/pl: first matching `.form`. | A cell is null when no form has the tag pair (legitimate for *singulare tantum* plural cells) |
| `composite.components` | `etymology_texts[]` + `etymology_links[]` | If any text contains `"Determinativkompositum"` AND `etymology_links.length` ∈ [2,6]: components are the `.first` of each link. Else null. | Not a clean compound |
| `composite.linkingElement` | Derived | After components are known, string-diff `germanText` against `"".join(components)`. The excess characters at the join are the linking element (`"s"` in `Haus-s-tür-schlüssel`). | Diff ambiguous |

### VERB

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `infinitive` | `forms[]` where `tags` includes `infinitive` and not `form-of` | `.form`. If it starts with `"sich "` strip that prefix for the lemma text but record it in `reflexivePattern`. | Entry has no infinitive form → drop |
| `präteritum3sg` | `forms[]` where `tags == ["past","third-person","singular"]` | `.form`. If it contains a space, prefix+root (e.g. `"stand auf"` → separable). | Missing → drop (G5) |
| `partizipII` | `forms[]` where `tags == ["participle-2","perfect"]` | `.form`. | Missing → drop (G5) |
| `auxiliary` | `forms[]` where `tags == ["auxiliary","perfect"]` | Collect `.form` values. Result is `{"haben"}`, `{"sein"}`, or `{"haben","sein"}`. Map to `haben \| sein \| both`. | Single `auxiliary`-tagged form that's not one of those two → null |
| `separable` | Derived from `präteritum3sg` | `präteritum3sg` contains a space → true. Cross-check: entry's `categories[]` contains `"Trennbares Verb"` (when present). | Both signals absent → false |
| `prefix` | Derived | When separable: `prefix = infinitive[: len(infinitive) - len(root)]` where `root` is the second token of `präteritum3sg`. `aufstehen` − `stand` → `auf`. | Not separable → null |
| `reflexive` | Derived from kaikki infinitive form | Kaikki's infinitive `form` field for a reflexive-only verb is already `"sich freuen"`. Rule: infinitive starts with `"sich "` → true. | Default false |
| `reflexivePattern` | `senses[].raw_tags[]` | First reflexive sense's raw_tag starting with `"sich"`. | Reflexive is false |
| `regularity` | Derived from `präteritum3sg` | Weak: `präteritum3sg` ends in `-te`/`-tete` and no vowel change vs infinitive stem. Strong: vowel change (laufen/lief). Mixed: both marks. Heuristic; store null if uncertain. | Uncertain |
| `conjugation` | `forms[]` grouped by `tags` | For each tense (present/past/subjunctive-ii) × person (1/2/3) × number (sg/pl): the first matching `.form`. Prefer forms whose `raw_tags` is empty (modern, non-dialectal). | Any cell can be null (e.g. partial tables for reflexive-only verbs) |

### ADJECTIVE

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `positive` | `forms[]` where `tags == ["positive"]` | First `.form`. Fall back to `word`. | Never — fall back wins |
| `comparative` | `forms[]` where `tags == ["comparative"]` (not also `genitive` etc.) | First `.form` without extra case tags (choose the undeclined form). | Morphologically absent (`rosa`) |
| `superlative` | `forms[]` where `tags == ["superlative"]` | First `.form` without extra case tags (prefer the `am …sten` variant). | Morphologically absent |
| `declinable` | Derived | `true` if any `forms[]` carry case tags; `false` if the entry has only `predicative` forms. | Never |

### ADVERB

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `comparative` | same as adjective | Optional per brief. | Usually null |
| `superlative` | same as adjective | Optional per brief. | Usually null |

### PRONOUN

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `type` | `pos_title` | Map `"Personalpronomen" → personal`, `"Possessivpronomen" → possessive`, `"Relativpronomen" → relative`, etc. Table in S2.1+ when edge cases arise. | Unknown pos_title → store as `other` |
| `paradigm` | `forms[]` grouped by `tags` | Keys depend on `type`: personal uses `case × number`, possessive adds `gender`. | Any cell null if no form matches |

### PREPOSITION

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `governedCases` | `categories[]` + `senses[].raw_tags[]` | Match `/Präposition mit (Akkusativ|Dativ|Genitiv)/` and `/\+ (Akkusativ|Dativ|Genitiv)/` across both fields. Collect the set. | Empty set → store as `[]` (unusual) |
| `twoWay` | Derived | `governedCases.size >= 2` OR category text contains `"Wechselpräposition"`. | `false` by default |

### CONJUNCTION

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `kind` | `categories[]` | Match case-insensitively: `"nebenordnend" → coordinating`, `"unterordnend" → subordinating`, `"korrelativ" → correlative`. | No match → `coordinating` (the common case; conservative default) |

### NUMERAL

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `kind` | `categories[]` | `"Grundzahlwort"/"Kardinalzahl" → cardinal`; `"Ordinalzahl" → ordinal`. | No match → `cardinal` |
| `value` | Hand-table | Spike-time lookup of common numerals (zwei → 2, drei → 3, …). Optional per brief. | Not in the table |

### INTERJECTION

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `usageNote` | `pos_title` or first sense `glosses[0]` | Prefer `pos_title` (`"Grußformel"`) if specific; else gloss. Cap at 200 chars. | Both empty → `null` |

### PARTICLE

| Record field | kaikki source | Rule | Null when |
| --- | --- | --- | --- |
| `usageNote` | `pos_title` + first sense `glosses[0]` | `pos_title` tells kind (`"Modalpartikel"`, `"Gradpartikel"`, `"Antwortpartikel"`); gloss gives one-line meaning. | Both empty → `null` |

### IDIOM
Not fed by ingestion. Learner adds them manually in the app (brief
§ Content model).

## Appendix B — POS mapping (kaikki → content model)

| kaikki `pos` | kaikki `pos_title` or extra tag | Content-model `pos` | Why |
| --- | --- | --- | --- |
| `noun` | (any), `tags[form-of]` absent | NOUN | — |
| `noun` | `pos_title == "Deklinierte Form"` or `tags[form-of]` | (inflected-form table, points at lemma) | Surface variant, not a card |
| `verb` | (any), `tags[form-of]` absent | VERB | — |
| `verb` | `pos_title == "Konjugierte Form"` or `tags[form-of]` | (inflected-form table) | Surface variant |
| `adj` | not `tags[form-of]` | ADJECTIVE | — |
| `adj` | `tags[form-of]` | (inflected-form table) | Surface variant |
| `adv` | — | ADVERB | — |
| `pron` | — | PRONOUN | — |
| `prep` | — | PREPOSITION | — |
| `conj` | — | CONJUNCTION | — |
| `num` | — | NUMERAL | — |
| `particle` | `pos_title` ∈ {Modalpartikel, Antwortpartikel, Abtönungspartikel, Fokuspartikel} | PARTICLE | — |
| `particle` | `pos_title == "Gradpartikel"` | ADVERB | Learner intuition: `sehr` is taught as an adverb. Decision recorded here, not a brief change |
| `phrase` | `tags` includes `"intj"` | INTERJECTION | kaikki routes interjections via phrase + intj tag |
| `phrase` | no `intj` tag | (drop) | Idioms stay manual |
| `name` | — | (drop) | Proper nouns out of scope (brief: "German language entries only, phrases/proverbs skipped") |
| `unknown` | — | (drop) | kaikki's "I don't know" catch-all |

## Appendix C — The inflected-form table

The ingest job builds an auxiliary `inflected_form` table keyed on
`(form_lowercase, pos)` with a pointer to the base lemma. Two inputs:

1. **Explicit kaikki stubs**: entries with `tags: ["form-of"]` or
   `pos_title ∈ {"Deklinierte Form", "Konjugierte Form"}`. Insert
   `(entry.word, entry.pos) → senses[0].form_of[0].word`.
2. **Expanded forms**: for every main entry, walk `forms[]` and
   insert `(f.form, lemma) → lemma` where `f.tags` is non-empty
   (skip bare citation forms).

Dedupe on `(form_lowercase, pos, lemma)`. This feeds the brief's
"inflected-form table resolves `Häuser` to `Haus`" lookup path
(brief § Lookup, line 342).

## Supersedes / superseded by
None.
