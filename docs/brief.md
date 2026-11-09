# GermanFlow — Project Brief (fresh repo)

Oct 28, 2026 · @Jolene

## How to read this brief

This brief defines GermanFlow: what the app does, how it is built, how it is secured and how AI agents work on it. It has two readers. The owner reads it to decide and review. AI agents read it to implement. Every rule is written so that it can be checked, and every section states which repository it applies to.

**Labels.** Text without a label is Decided.

| Label | Meaning | What an agent does |
| --- | --- | --- |
| Decided | The owner confirmed it | Implements it exactly as written |
| Open | Not decided yet. Listed in the decision log | Asks the owner. Does not pick a default |
| Pending spike | Depends on the M0 data spike | Waits for the spike ADR before implementing |
| must, must not | Mandatory rule | CI or review checks it |
| should, may | Recommendation, option | Follows it unless there is a recorded reason |

**Terms.**

| Term | Meaning |
| --- | --- |
| Owner | The person who owns the project and makes every decision |
| Learner | The person using the app. Today the same person as the owner |
| Lemma | The dictionary base form of a word, for example Haus for Häuser |
| POS | Part of speech (word class). Eleven values, listed in the content model |
| Card | One saved entry in the learner's deck |
| Deck | All cards stored on the phone |
| Dump | kaikki.org's raw Wiktionary data file. Used only by the ingestion job |
| Ingestion | The job that turns the dump into dictionary.sqlite |
| Dictionary file | dictionary.sqlite, a read-only SQLite file inside the backend image |
| Identity key | The value that decides whether two cards are the same card |
| Contract | The OpenAPI file that defines the API between app and backend |
| ADR | Architecture decision record: a short file in docs/decisions/ |
| Spike (M0) | The first task: test real dictionary data before building the backend |
| Story | One deliverable slice written as "As a who, I want what, so that why", with checkable acceptance criteria. One GitHub issue |
| Story point | Relative effort. 2 to 8 per story. 8 points ≈ a week and a half of focused human work, adjusted for AI pair-programming |

All docs, commits, PR titles and code comments are in English. German strings are the product's data, never its interface language.

**Two repositories.** The project lives in two private repos: `germanflow-app` (the Expo mobile app) and `germanflow-backend` (API, ingestion job, dictionary model and the API contract). The table shows which repo each part of this brief belongs to.

| Part of this brief | Applies to |
| --- | --- |
| Part A: product, features and user flows, UX states, content model, architecture | Shared. Both repos reference it |
| Part B: design system and the offline add queue (v2). The mobile-app stack is under Architecture in Part A | Frontend: `germanflow-app` |
| Part C: API contract, backend behavior, ingestion job. The backend stack is under Architecture in Part A | Backend: `germanflow-backend` |
| Part D: security review, AI agent system, workflow and CI/CD, roadmap, decision log | Both. Each repo has its own agents, settings, `STATUS.md` and pipelines |

# Part A. Shared: product, behavior, data and architecture (both repos)

## Product

GermanFlow is a native mobile app for building and keeping a personal working German vocabulary (*Wortschatz*, "word treasure"). The learner types a word, gets the grammar that matters for its word class, saves it on the phone, and reviews it with spaced repetition until it sticks.

**Success.** GermanFlow is a personal project with two goals: the owner uses it to learn German and learns the production stack (React Native, Java, CI/CD) by building it. There are no external metrics. v0.1 counts as a success when it is installed on the owner's phone and the owner reviews their own cards with it. The stack-learning goal succeeds when the owner can diagnose a 500 in the API from logs alone and can add a new POS mapper without a plan agent.

**Scope decision.** The purpose is one handy tool for reading German: note a word and its meaning in one place instead of opening many apps. Because of that, the MVP covers all 11 word classes, compound bulk-add, idioms, inflected-form lookup, search, examples and personal edits. The build order in the roadmap still delivers nouns and verbs first.

### What it exists to do

- Help one learner retain German words over months, not just recognise them in the moment.
- Make adding a word low-friction: type the lemma, preview the card, save. Nouns get article, plural and a 4-case Deklination. Verbs get auxiliary, principal parts and Konjugation. Adjectives and adverbs get degrees, pronouns a paradigm, prepositions their governed case, conjunctions subordinating or not, particles and interjections a usage note. Every card carries English translations.
- Turn compound nouns into a learning accelerator: one tap adds every component as its own card.
- Keep all vocabulary on the learner's own device. The backend stores no user data.
- Keep running cost at zero: free data source (Wiktionary via kaikki.org), free hosting tier, no AI calls.
- Support idioms and multi-word expressions as manual entries (German phrase, the learner's own translation, optional example and notes).

### What it is not

- Not a translation tool, not a grammar reference, not a general flashcard app. German-specific affordances (gender, cases, haben/sein, separable prefixes) are first-class.
- Not multi-user, not cloud-synced, not social. No accounts.

### Principles

1. **Local first.** Reviewing, browsing, deleting, backup, export and the daily reminder all work offline. Only "add from dictionary" needs the network.
2. **Grammar is stored once and treated as authoritative.** Dictionary-sourced cards are never changed automatically. A wrong card is fixed with Refresh grammar, which keeps review progress (flow 13). Manual idiom cards are fully editable. On dictionary cards only examples and the personal note are editable (flows 12 and 13).
3. **The server knows nothing about the user.** No accounts, no analytics, no user data stored or logged.
4. **Boring, production-standard technology.** The project doubles as a learning vehicle, so choices favor what teams actually run in production today over novelty.

## Features and user flows

The app has three bottom tabs: **Words** (saved cards, orange + button), **Practice** (review) and **Settings**. Flows are numbered 1 to 13 and referenced by number elsewhere. The app UI is English only; German strings are data.

### 1. Add a word from the dictionary

1. Tap + on Words. A bottom sheet opens with a segmented control `[ Word ] [ Idiom ]`, Word selected.
2. Type a single-token lemma and tap **Look up**. Input is trimmed and Unicode-normalized (NFC). Hyphenated words are allowed; a space triggers the idiom redirect (flow 3).
3. The backend returns zero, one or several entries (see the API contract). The app shows:
    - **One entry:** a preview of the per-POS card with **Save** and **Cancel**.
    - **Several entries** (homographs such as der/das/die Band, or the same spelling in different word classes): a picker. Each row shows article or POS, plural or principal parts, and the first gloss. Entries already saved are greyed with an "In deck" tag. Tapping an entry opens its preview. After saving, the picker returns so another meaning can be added.
    - **Zero entries:** the 404 offramp (flow 4).
4. **Save** writes the card to the local database in one transaction, keeps the sheet open with an empty field, so the next word is one step away, and shows a short confirmation.

Lookup is tolerant of case (typing `haus` finds `Haus`) but saved text keeps its dictionary spelling. If the typed word is an inflected form (`Häuser`, `ging`), the backend resolves it to the lemma and the preview says "Häuser is the plural of Haus. Adding Haus."

Reflexive verbs: the Word tab also accepts `sich` followed by a verb (`sich freuen`). The lookup resolves to the verb entry, the preview shows it as reflexive, and the saved card keeps the reflexive form when the dictionary stores it that way. The spike confirms how kaikki records reflexive verbs. Other two-word input still triggers the idiom redirect. There is no alternative-spelling lookup (ae/oe/ue, ss for ß): words are typed as spelled. Umlauts (ä, ö, ü, ß) are typed via the system keyboard; the app ships no keyboard of its own.

### 2. Add a compound noun

`Haustürschlüssel` returns the noun entry plus a `composite` block listing its components (for example Haus, Tür, Schlüssel; linking elements such as the Fugen-s are shown as plain text, not cards). The preview offers **Save compound + 3 components**. The backend resolves each component in the same response, so there is one round trip. Components that are already saved are skipped. Components that resolve to several entries are not added automatically and are listed as "needs choosing" so the learner can add them through flow 1. A partial result reads: "Saved 3 of 4 cards. 1 already in deck."

### 3. Add an idiom (manual, no network)

Typing `auf jeden Fall` in the Word tab shows a soft redirect banner ("That looks like a phrase") with a button that switches to the Idiom tab with the text pre-filled. Idiom fields:

| Field | Required | Limit |
| --- | --- | --- |
| German phrase | Yes | 1–200 characters, whitespace collapsed |
| English translation(s) | Yes, at least one | 1–200 characters each, up to 5 |
| Example sentence | No | up to 300 characters |
| Example translation | No | up to 300 characters |
| Notes | No | up to 1000 characters |

Save writes locally. No backend call is made.

### 4. The 404 offramp

An unknown lemma shows "No dictionary entry for this word" with an **Add as idiom** button that flips to the Idiom tab with the typed text pre-filled. Suggestion chips (FTS5 near matches, for typos) are post-MVP, but the backend index is built with FTS5 from day one so they are cheap to add.

### 5. Duplicates

Saving a card that already exists shows an "Already in your deck" dialog and writes nothing. The identity key is **lemma + pos + gender** for nouns, and **lemma + pos** for everything else. Matching is case-preserving: German is case-significant (*der Band*, *das Band* and *die Band* are three different cards). Idioms are matched on their whitespace-normalized text.

### 6. Review

- The Practice tab shows a snapshot of cards due today, shuffled once at session start so grading never reshuffles the deck. Oldest-due first, capped at 30 cards per session; the rest stay due.
- Direction toggle: German to English, or English to German.
- The article is shown on the front of a noun card in both directions. The back reveals article, translations, and the grammar summary.
- Two grades: **Again** and **Got it**. Simplified SM-2: ease starts at 2.5 (minimum 1.3, maximum 3.0). Got it: repetitions + 1, interval 1 day, then 3 days, then previous interval × ease, and ease + 0.1. Again: repetitions reset to 0, interval 1 day, ease − 0.3, and the card returns once to the end of the current session queue.
- Due dates are stored as local calendar dates (not timestamps), so time zone changes and travel cannot shift a card by a day.
- Progress ("Card 3 of 12"), a session-complete screen and an empty state ("Nothing due. Next review tomorrow.").

### 7. Delete

Delete lives on the expanded card, behind a confirm dialog, because there is no cloud copy. Grammar is not editable; fix a wrong dictionary card with Refresh grammar (flow 13). Examples and the personal note are editable (flow 12).

### 8. Backup: export and import (JSON)

- **Export** writes one versioned JSON file (see the content model) and opens the system share sheet, so the learner can save it to cloud storage or send it to themselves.
- **Import** opens the system file picker, validates the file (size limit, schema version, every record against the schema), then shows a preview: "42 new cards, 8 already in deck, 0 invalid." Import merges and never overwrites existing cards or their review progress. Anything invalid is reported, never silently dropped.

### 9. Daily review reminder

Settings has a toggle and a time picker (Off until enabled, 19:00 when first enabled). When enabled the app schedules a repeating local notification at that time. Because a scheduled local notification cannot check the due count when it fires, the text is generic ("Time for today's German cards"). Android 13+ requires a runtime notification permission: the app asks only when the learner turns the toggle on, and if it is denied, shows a short explanation and a link to system settings. No server, no push service.

### 10. About and credits

A required screen. Grammar data is derived from Wiktionary (CC BY-SA) via the Wiktextract project and kaikki.org; the screen names both, links the license and states that the data was transformed. It also links the privacy statement: no accounts, no analytics, all vocabulary stored on the device.

The privacy statement also says that the hosting provider may log visitor IP addresses when a word is looked up. GermanFlow's own logs do not record IP addresses or typed text.

### 11. Search and filter

The Words tab has a local search box that filters saved cards by German text or English translation, in the MVP. It works offline and never calls the backend.

### 12. Examples and personal edits

Dictionary cards show example sentences from Wiktionary where they exist. A card without examples shows none and never invents them. The learner can add, edit and delete example sentences and the personal note on any card. On dictionary cards the grammar and the translations are not editable. On manual idiom cards every field is editable.

### 13. Refresh grammar

A dictionary card has a Refresh grammar action — use it when a saved card's gender, plural, principal parts or other grammar looks wrong. It fetches the current dictionary entry for the same lemma and word class, replaces the grammar fields and keeps the review progress, the examples and the note. If the refreshed identity key would collide with another saved card, nothing changes and the app says so. This replaces delete and re-add, which would destroy review progress.

## UX states and error handling

Error copy follows four rules: plain language, no status codes or stack traces on screen, always say what is safe ("Your saved cards are not affected"), and always offer a next action. The tone is warm and short, matching the cozy look.

| Situation | What the learner sees | App behavior |
| --- | --- | --- |
| No connection during lookup | "You're offline. Looking up a word needs a connection. You can still add an idiom or review your cards." Buttons: Try again, Add as idiom | No request sent. Nothing is queued in the MVP (see the v2 offline queue section) |
| Server is waking up (free-tier cold start) | After 3 s: "Waking the dictionary, this can take up to a minute on the first lookup." | Request timeout 60 s. One automatic retry with backoff on timeout, network error or 5xx. Lookups are idempotent, so retries are safe |
| Lookup timed out after retry | "The dictionary didn't answer. Try again in a moment." Button: Try again | Typed text is kept in the field |
| Word not found (404) | "No dictionary entry for this word." Button: Add as idiom | Flips to the Idiom tab with text pre-filled |
| Invalid input | Inline: "Enter one German word. Letters and hyphens only." | Validated on the client first; the server validates again |
| Rate limited (429) | "Too many lookups. Try again in a few seconds." | Honors the Retry-After header; button disabled until it elapses |
| Server error (5xx) | "The dictionary had a problem. Your saved cards are not affected." Button: Try again | Raw error never shown or stored |
| Response fails schema validation | "We got an unexpected answer. Nothing was saved." | Client validates every response against the shared schema before use. Entry is discarded |
| App too old for the API | "Please update GermanFlow to keep adding words." | Triggered by an unsupported API schema version; review and local features keep working |
| Duplicate on save | "Already in your deck." | Nothing written (flow 5) |
| Local save fails (disk full, I/O) | "Couldn't save this card. Your other cards are safe." Button: Try again | Every save is one database transaction; failure rolls back completely |
| App killed mid-save or mid-review | Nothing visible on next launch | Saves are atomic. Each grade is persisted immediately, so a session resumes with the remaining due cards |
| Database migration fails at startup | "GermanFlow couldn't update your data. Your previous data was restored." | The database file is copied before any migration and restored on failure |
| Import file invalid, too large or from a newer version | Specific message per cause, and a count of invalid records | Nothing is changed unless the preview is confirmed; a partly invalid file imports only the valid records |
| Export fails (no share target, storage error) | "Couldn't create the backup file." Button: Try again | No partial file is shared |
| Notification permission denied | "Reminders need notification permission." Button: Open settings | Toggle stays off until permission is granted |
| No cards yet / none due | Friendly empty states with the next action (Add your first word / Next review tomorrow) | None |

### Loading and feedback rules

- Every network action shows progress within 300 ms and can be cancelled.
- Buttons that trigger a write are disabled while in flight, so a double tap cannot save twice.
- Haptic feedback on grade and on save is optional polish, not part of the MVP.

## Content model

One record per card. The discriminator is `pos`, with eleven values. The backend returns, and the app stores, a tagged union keyed on it. Dictionary data is never invented: a field Wiktionary does not provide is `null`, and the card UI renders only what exists.

**Shared fields (all records):** `germanText` (the lemma), `englishTranslations` (non-empty list), `pos`, `source` (`DICTIONARY` or `MANUAL`), plus local-only fields: `id` (UUID), `createdAt`, and review state (`ease`, `intervalDays`, `repetitions`, `dueDate`, `lastReviewedAt`).

**Fields for flow 12 (all records):** `examples` (a list of sentences, each with an optional English translation and a `source` of DICTIONARY or MANUAL) and `note` (optional free text). Both are editable by the learner.

| pos | Specific fields |
| --- | --- |
| NOUN | `gender` (m, f, n), `article`, `plural`, `genitiveSingular`, `declension` (Nominativ, Genitiv, Dativ, Akkusativ, each with singular and plural), optional `composite` (components, linking element) |
| VERB | `auxiliary` (haben, sein, or both), `separable` and `prefix`, `reflexive`, `regularity` (weak, strong, mixed), principal parts (infinitive, Präteritum 3sg, Partizip II), `conjugation` (Präsens, Präteritum, Perfekt, each with ich, du, er/sie/es, wir, ihr, sie/Sie) |
| ADJECTIVE | `positive`, `comparative`, `superlative`, `declinable` |
| ADVERB | optional `comparative`, `superlative` |
| PRONOUN | `type` (personal, possessive, relative and so on), `paradigm` (cases by gender and number) |
| PREPOSITION | `governedCases` (Akkusativ, Dativ, Genitiv), `twoWay` (Wechselpräposition) |
| CONJUNCTION | `kind` (coordinating, subordinating, correlative); subordinating means verb-final word order |
| NUMERAL | `kind` (cardinal, ordinal), optional `value` |
| INTERJECTION | `usageNote` |
| PARTICLE | `usageNote` |
| IDIOM | `example`, `exampleTranslation`, `notes` (all optional). `englishTranslations` is required and non-empty. No grammar block |

### Identity and uniqueness

The identity key is `lemma | pos | gender` for nouns and `lemma | pos` for everything else (idioms use whitespace-normalized text). It is stored as a unique column, so the database itself rejects duplicates even if the UI check is bypassed.

If Wiktionary corrects a noun's gender, Refresh grammar updates the gender and the identity key together.

### One contract, two languages

The API contract is an OpenAPI 3 document committed to the repo. The Java backend generates it from code (springdoc), CI regenerates it and fails the build if it differs from the committed copy, and TypeScript types are generated from it for the app. The app additionally validates every response at runtime (Zod), because types alone do not protect against a bad server response.

`germanflow-backend` owns the contract. Its CI regenerates `contracts/openapi.json` and fails if it differs from the committed copy, and each backend release publishes that file under a version tag. `germanflow-app` keeps a copy in `contracts/`, updated by a script that fetches a chosen backend release and regenerates the TypeScript types. App CI fails if the committed types do not match the committed contract. A contract change goes backend first, then a release tag, then an app change that bumps the contract version.

### On-device database (SQLite)

One `words` table: `id`, `pos`, `german_text`, `gender`, `identity_key` (unique), `english_translations` (JSON), `payload` (POS-specific JSON), `source`, `created_at`, and the review columns, with an index on `due_date`. The schema is versioned with explicit migrations, each covered by a test that upgrades a database created by the previous version.

### Backup file format

```json
{
  "app": "germanflow",
  "schemaVersion": 1,
  "exportedAt": "2026-10-28T12:00:00Z",
  "cards": [ { "pos": "NOUN", "germanText": "Hund", "...": "...", "srs": { "ease": 2.5, "intervalDays": 3, "repetitions": 2, "dueDate": "2026-11-01" } } ]
}
```

Rules: the importer accepts any `schemaVersion` up to its own, refuses newer ones with an "update the app" message, rejects files over 10 MB or 20,000 cards, validates each card against the schema, merges by identity key and never overwrites existing review progress.

The importer also rejects any file whose JSON is nested deeper than 10 levels. The real backup format never goes deeper than 6.

## Architecture

Three parts: the **mobile app** (React Native, stores the learner's cards), a **stateless read-only backend** (Spring Boot, looks words up), and a **dictionary file** (SQLite, built offline by an ingestion job from kaikki.org's Wiktionary data). The backend holds no user data and the app never talks to anything else.

### Where the dump lives and how it meets "add a word"

1. **The dump** is kaikki.org's download of Wiktionary entries: a huge text file with one JSON entry per line, covering many languages and many fields. It is only ever handled by the ingestion job, on a temporary CI machine. It never reaches the backend host or a phone, and it is deleted when the job ends.
2. **Ingestion** is a Java program that reads the dump line by line, keeps only German entries, keeps only the fields the cards need, maps each entry into the record shapes in the content model, and writes the result into one file, `dictionary.sqlite`. Think of it as a pre-cooked German dictionary shaped exactly like the app's cards.
3. **That file lives inside the backend's Docker image**, on the container's disk, and the backend opens it read-only. Deploying a new dictionary means deploying a new image.
4. **When the learner types Haus and taps Look up,** the app calls the backend, the backend runs a SQL query on `dictionary.sqlite`, and returns the matching entries as JSON. The learner picks one and taps Save, and the card is written into the phone's own SQLite database. From then on that card never needs the backend again.
5. **Refresh:** a scheduled GitHub Actions workflow (monthly, or run by hand) downloads the new dump, runs ingestion, validates the result (row counts, plus golden words such as Haus, laufen, Haustürschlüssel, Band, schön), builds the image and deploys. If validation fails the old dictionary keeps running. Refreshing never changes cards already saved on phones.

Why not fetch kaikki live: it has no official query API, so "live" means scraping its pages, which breaks when their layout changes and loads a small community-run site. Both free hosting limits and the project's learning goals favor owning the pipeline.

### Size: what lives where

| Where | What | Size |
| --- | --- | --- |
| CI machine (temporary) | Raw kaikki download | Large. The full English-edition dump is about 2.3 GB compressed. kaikki also publishes per-language extracts; the M0 spike confirms whether a German-only file exists, which would avoid the big download. Deleted after the job |
| Backend image | German-only `dictionary.sqlite` | To be measured in the spike. Expected size: hundreds of MB at most. If too big, trim fields (translations into other languages, audio, categories) |
| The phone: app | Standard React Native app binary | Independent of the dictionary |
| The phone: saved cards | Local SQLite | Roughly 1 to 3 KB per card (estimate): thousands of cards stay in single-digit MB |

The dictionary never ships inside the app. This is what keeps the phone footprint small.

### Mobile app

- Expo (current SDK) with dev builds (`expo-dev-client`) and EAS Build for installable Android builds. Expo Router for navigation. TypeScript in strict mode.
- On-device data: `expo-sqlite` with Drizzle ORM and explicit migrations.
- Server calls: one lookup endpoint, wrapped with TanStack Query for retry and loading state. Other state is plain React state; no Redux.
- Runtime validation with Zod. Notifications with `expo-notifications`. Backup with `expo-file-system`, `expo-sharing` and `expo-document-picker`.
- Tests: Jest with React Native Testing Library; Maestro for end-to-end flows on an emulator.
- The backend URL comes from the build profile (development, preview, production) through app config. **No secrets are compiled into the app**: anything in a mobile bundle can be extracted.
- Feature-based folders under src/: `features/words`, `features/practice`, `features/settings`, `shared/db`, `shared/api`, `theme`.

Pinned versions: the Expo SDK version and the Node version are recorded in an ADR at M1. TypeScript types are generated from the OpenAPI file with openapi-typescript.

**Builds.** Installable Android builds use EAS Build if the free plan is enough. The Expo pricing page on 2026-10-28 shows that the Free plan allows up to 15 Android builds, at low priority (waits can reach 90+ minutes at peak), with a 45-minute build timeout. That is enough for one person. Day-to-day development uses local builds. If the free plan stops being enough, build locally and install the APK on the owner's phone directly. Record the choice in an ADR.

### Backend

- Java 21, Spring Boot 3.x, Maven (three Maven modules, so ingestion and API share one model): `dictionary-core` (record model and SQLite schema), `ingest` (command-line batch job), `api` (the Spring Boot service).
- SQLite is opened read-only through JDBC and every query is a prepared statement. A `GrammarSource` interface hides the source, so a different data source can replace it without touching controllers.
- OpenAPI generated with springdoc, rate limiting per client IP, structured JSON logs that contain only `pos`, result (`FOUND`, `AMBIGUOUS`, `NOT_FOUND`) and latency, never the typed text.
- Tests: JUnit 5 and Spring Boot Test. The kaikki-to-record mapper is covered by golden-file tests built from small hand-picked dump fixtures. This mapper is the riskiest code in the project.

Operational counters (no typed text, no IPs): requests per day, and the share of lookups that ended FOUND, AMBIGUOUS and NOT\_FOUND. They show missing coverage without recording what anyone typed. The counters appear in the standard log stream as structured JSON lines; the owner reads them from the host's log viewer. No separate metrics endpoint in the MVP.

**Performance target.** `/lookup` p95 under 200 ms on a warm container, under 2 s on a cold start. Checked during release testing, not continuously.

### Repository layout (two private repos)

```text
germanflow-app/
  app/                    Expo Router routes (screens)
  src/                    features/, shared/, theme/
  contracts/openapi.json  copy of the backend's published contract
  docs/                   brief (app parts), decisions/ (ADRs)
  .github/workflows/      ci-mobile, security, build-mobile
  .claude/                agents, settings, hooks
  CLAUDE.md, STATUS.md

germanflow-backend/
  api/                    Spring Boot service
  ingest/                 ingestion batch job
  dictionary-core/        shared Java model + SQLite schema
  contracts/openapi.json  generated API contract (source of truth)
  docs/                   brief (backend parts), decisions/ (ADRs)
  .github/workflows/      ci-backend, security, ingest, deploy-backend
  .claude/                agents, settings, hooks
  CLAUDE.md, STATUS.md
```

# Part B. Frontend (germanflow-app)

Design system (tokens, typography, components, screens, accessibility) and the v2 offline add queue live in the app repo's copy of this brief: `germanflow-app/docs/brief.md`. This backend repo does not need Part B; CLAUDE.md asks agents here to read Parts A, C, D.

# Part C. Backend (germanflow-backend)

## API contract and backend behavior

The API is public, read-only and carries no user identity. Nothing in a request or response is personal data.

### Endpoints

| Endpoint | Purpose | Notes |
| --- | --- | --- |
| `POST /api/v1/lookup` | Find dictionary entries for a typed word | Body `{ "q": "Haus" }`. POST rather than GET so the typed word never appears in a URL, because hosting platforms and proxies log URLs. The call is idempotent, so retries are safe |
| `GET /api/v1/meta` | Dictionary build date, source dump date, schema version, attribution text | Feeds the About screen |
| `GET /api/v1/health` | Liveness check for the host | Returns no data |

### Lookup request rules

- `q` is trimmed and NFC-normalized, 1 to 64 characters, a single token of Unicode letters and hyphens (`^\p{L}[\p{L}-]{0,63}$`). Anything else is a 400. Request bodies over 1 KB are rejected.
- Matching order: exact lemma, then case-insensitive lemma (lowercased with `Locale.ROOT`, never SQLite's ASCII-only NOCASE), then an inflected-form table (`Häuser` resolves to `Haus`). At most 10 entries are returned, exact-case matches first.

### Lookup response

`200` returns `{ schemaVersion, query, resolvedFrom?, entries[] }`. Each entry is the tagged union from the content model, keyed on `pos`. For compound nouns the `composite` block lists components, each with a `status` of `RESOLVED` (full entry included), `AMBIGUOUS` or `NOT_FOUND`, resolved one level deep with at most 6 components.

| Status | When | Body |
| --- | --- | --- |
| 200 | One or more entries | As above |
| 400 | Invalid `q` or oversized body | Problem JSON, code `INVALID_QUERY` |
| 404 | No entry for the word | Problem JSON, code `NOT_FOUND` |
| 429 | Rate limit exceeded | Problem JSON, code `RATE_LIMITED`, with a `Retry-After` header |
| 500 / 503 | Server problem | Problem JSON, code `INTERNAL`, generic message |

Errors use RFC 9457 `application/problem+json` with a stable machine-readable `code`. They never echo the input and never contain stack traces, class names or file paths.

### Versioning

The URL carries the major version (`/api/v1`) and every response carries `schemaVersion`. A breaking change ships as `/api/v2` while v1 stays up long enough for installed apps to update; an app that meets an unsupported `schemaVersion` shows the "please update" state and keeps working offline.

The URL version is the real compatibility boundary. The `schemaVersion` body field only signals additive changes within a version. `GET /api/v1/meta` also returns a minimum supported app version. An app older than that shows the "please update" state, so a bad release can be retired without breaking the server.

### Ingestion job (CLI)

Input: the kaikki dump (path or URL). Output: `dictionary.sqlite` containing the entries, an inflected-form table, an FTS5 index, and a `meta` table (source URL, dump date, license text). Rules:

- Only entries whose language is German. Kaikki entries tagged as phrases or proverbs are skipped, because idioms are manual in the app.
- Each kaikki entry is mapped to a record in the content model. A field that cannot be derived is `null`; nothing is guessed.
- The job fails, and the old dictionary stays deployed, if golden-word tests fail or if the share of entries missing required fields exceeds a threshold. The threshold is set after the M0 spike.
- **Dump integrity.** If kaikki publishes a checksum (SHA-256 or similar) alongside the dump, the job verifies it before parsing; a mismatch fails the run. Otherwise the row-count comparison and golden-word gates catch gross poisoning, and a targeted single-entry attack is an accepted risk. The M0 spike records whether a checksum is published.
- **M0 spike (first task):** download real data, write fixtures for about a dozen words covering every POS plus a compound (`Haustürschlüssel`), a homograph (`Band`), a separable verb, a reflexive verb and a singular-only noun, and document which kaikki fields map to which record fields and which cannot be mapped. This spike decides how much of the content model is achievable, and the brief is updated from it before the rest of the backend is built.

**Spike go/no-go criteria.** Set during the spike and recorded in an ADR. The content model is achievable if, for the sampled nouns, most have gender, plural and all four cases, and for the sampled verbs, most have auxiliary and principal parts. If the English-edition German entries are too thin, the fallback is a smaller card model; the brief is changed before the backend is built.

# Part D. Rules for both repos: security, agents, workflow, roadmap, decisions

## Security review

The attack surface is small by design: no accounts, no user data on the server, no API keys, and a read-only public lookup. The realistic risks are abuse of the free backend, malformed input (typed text and imported files), supply-chain compromise, leaked deployment credentials, and, because AI agents write code here, the agent workflow itself. This is a design-time review; the first implementation review should repeat it against real code.

### Threats and mitigations

| # | Risk | Mitigation | How it is checked |
| --- | --- | --- | --- |
| 1 | SQL injection on the backend | Prepared statements only, no dynamic SQL. Read-only SQLite connection. FTS5 `MATCH` input is quoted token by token, because FTS5 has its own operator syntax (`"`, `*`, `NEAR`, `AND`) that can error or run expensive queries | Tests that send SQL metacharacters and FTS5 operators; a lint rule forbidding string-built SQL |
| 2 | SQL injection and bad data on the device | Parameterized queries through Drizzle only. Every value, including imported data, is validated with Zod before it reaches the database | Unit tests; lint rule against raw SQL strings with interpolation |
| 3 | Malicious or oversized backup file (huge strings, deep nesting, `__proto__` keys) | 10 MB and 20,000-card caps, strict Zod schema that rejects unknown keys, per-field length caps, plain `JSON.parse` with no eval, preview before commit | Import tests with hostile fixtures |
| 4 | Content injection in the UI | Cards and notes render as plain text. No WebView, no HTML or Markdown rendering of data, no auto-opened links | Review rule: any WebView or HTML renderer needs an ADR |
| 5 | Abuse or DoS of the free backend | Per-IP rate limit (30 requests per minute with a small burst) plus a global ceiling, 1 KB body limit, 64-character query cap, 10-entry response cap, request timeouts, bounded connection pool, JVM memory set for a 512 MB container. Client IP is read from the proxy header only when the request comes from the platform proxy | Load test in CI-adjacent script; tests for 429 and for header spoofing |
| 6 | Secrets embedded in the app | There are none to embed. **No shared "app key" is used**: anything in an APK can be extracted, so it would add false confidence. If abuse appears, add Google Play Integrity attestation later. Certificate pinning is deliberately not used in the MVP (certificate rotation on free hosting would brick installed apps) | CI scans the built bundle for high-entropy strings and known key patterns |
| 7 | Insecure transport | HTTPS only. Release builds block cleartext HTTP; only the development profile allows `http://10.0.2.2` | CI inspects the merged Android manifest and network config |
| 8 | Data at rest on the device | Cards are non-sensitive and live in the app sandbox. Android auto-backup is off (decision log, item 8); the JSON export is the supported backup | Manifest check |
| 9 | Privacy leaks | Server logs contain only `pos`, result and latency, never the typed text. No analytics or crash SDK in the MVP. Notification text is generic, so no vocabulary appears on the lock screen. If OTA updates (EAS Update) are enabled, the app contacts Expo's update servers, so they are off in the MVP unless the owner decides otherwise. Hosting platforms may log IP addresses; the privacy statement says so | Log-format test; dependency review rejects analytics SDKs |
| 10 | Supply chain (npm and Maven) | Lockfiles committed, `npm ci` in CI, Dependabot or Renovate on both ecosystems, GitHub dependency review on PRs, vulnerability scanning of npm, Maven and the Docker image, GitHub Actions pinned to commit SHAs, base images pinned by digest, container runs as non-root. Every new dependency needs a one-line justification in the PR. **Agents may not add dependencies without the owner's approval**: AI tools sometimes suggest package names that do not exist, and attackers register those names. Dependabot or Renovate PRs are reviewed at least monthly; a stale update queue is its own risk | CI jobs; CODEOWNERS on manifest and lockfiles |
| 11 | Leaked credentials | `.env*` gitignored. The Android upload keystore lives outside the repo (or in EAS-managed credentials) and is backed up, because losing it blocks app updates. Secret scanning on commit (gitleaks) and GitHub push protection. Deploy tokens live in GitHub Environments with a required reviewer for production, scoped to the minimum | Pre-commit hook and CI secret scan |
| 12 | CI/CD compromise | Branch protection on `main` (PR required, status checks, no force pushes). Workflows default to `permissions: contents: read`. No `pull_request_target` running untrusted code. Forks get no secrets. Changes to `.github/workflows/` need the owner's review (CODEOWNERS) | Workflow lint (actionlint) |
| 13 | Poisoned or broken dictionary data | The dump is untrusted input: streaming parser with size, depth and time limits, no polymorphic deserialization, values stored through prepared statements, field length caps. Row counts compared to the previous build and golden-word tests gate every deploy. Wiktionary is community-edited, so entries can be wrong or vandalized; the About screen says the data is community-sourced | Ingestion gate tests |
| 14 | AI agent workflow (prompt injection, over-broad access) | Agents get least-privilege tools: reviewers and the security agent are read-only. Content from the web, the dump, issues or dependencies is data, never instructions. No production credentials exist in any agent environment. Hooks block destructive commands (`rm -rf`, force push, edits to workflows or security files without review). No agent can merge to `main`; all agent code passes the same CI and the owner's review | Agent definitions in the repo; branch protection |
| 15 | Android release hardening | Release build is not debuggable, minified with Hermes bytecode, minimum permissions (`INTERNET`, `POST_NOTIFICATIONS`), no deep links, no exported components beyond the launcher | Manifest check in CI |
| 16 | Licensing and privacy compliance | Wiktionary data is CC BY-SA. The About screen and the `meta` table carry attribution, license link and a note that data was transformed. Because share-alike applies to adaptations, state the license of the derived data. The app collects no personal data, so the privacy statement and the Play Data safety form say so. This is not legal advice; check the license terms before publishing | Review checklist before store release |

### Security rules for every pull request

- No string-built SQL, no new dependency without justification, no new network destination, no new permission, no secret or key-like string in the diff.
- Any change to input validation, the importer, rate limiting, CI workflows or the agent definitions is reviewed by the security agent and by the owner before merge.
- A failing security check is fixed at its cause. It is never suppressed to get a green build.

**Additional security rules:**

- Agent hooks are a guard rail, not a security boundary. A shell command can still change files, so CI, CODEOWNERS and the owner's review are the real gate.
- Accepted risk: abuse of the free backend can use up its monthly hours and make lookups unavailable. Review, delete, export and import keep working offline. Rate limiting reduces this but does not remove it.
- Turn on two-factor authentication for GitHub, Expo and Google accounts. Keep a written recovery plan for the Android upload keystore.
- **Vulnerability reports.** While the repos are private, security findings go in a private issue in the repo with the problem. If a repo ever goes public, a `SECURITY.md` is added with a reporting address.

## AI agent system

Agents are separated by concern. The amount of process scales with the size and risk of each change. Project state lives in one STATUS.md per repo.

### Principles

1. **Separate by concern, not by folder.** Planning, building, testing, reviewing and security review are different mindsets. Agents that grade their own work miss things, so the builder never reviews its own diff.
2. **Least privilege.** Each agent gets only the tools and paths its job needs. Reviewers cannot edit. The tester cannot touch production code. Builders cannot touch CI, workflow or agent files without the owner's approval.
3. **Humans own merges and releases.** No agent merges to `main`, deploys, or holds production credentials.
4. **Files are the memory.** Subagents start with no context. Anything that must survive a handoff is written to a known file.
5. **One fact, one place.** Instruction files link to each other instead of copying text.

### Roster

| Agent | Repo | Job | Reads | Intended write scope (edit-hook guarded) | Notable limits |
| --- | --- | --- | --- | --- | --- |
| `planner` | Both | Turns a request into a plan: subtasks, acceptance criteria, files touched, risks, which agent does what | Whole repo | Only `docs/plans/*.md` | Read-only for product code. No shell commands that change anything |
| `app-dev` | App | Implements plan subtasks in the Expo app | Whole repo | `app/`, `src/` and `contracts/` in `germanflow-app` | Uses tokens from `theme/tokens.ts`, never raw hex |
| `backend-dev` | Backend | Implements plan subtasks in the API, the ingestion job and the shared model | Whole repo | `api/`, `ingest/`, `dictionary-core/` and `contracts/` in `germanflow-backend` | Prepared statements only. Owns contract generation |
| `tester` | Both | Writes failing tests first for a plan item or a bug, then confirms they pass after the fix | Whole repo | Only test directories and fixtures | Hook-blocked from editing production code, which makes weakening a test to pass hard. Review checks for it |
| `reviewer` | Both | Adversarial review of a diff in a fresh context against the plan, the brief and the CLAUDE.md files: correctness, scope creep, contract drift, token and enum consistency, missing tests | Whole repo and the diff | Nothing | Reports findings by severity. Never edits |
| `security-reviewer` | Both | Runs the security checklist on a diff: injection, input validation, secrets, new dependencies, permission changes, workflow and agent-file changes | Whole repo and the diff | Nothing | Reports findings. Never edits. Mandatory on the security triggers below |

**What the limits mean in practice.** The Writes column says where each agent is meant to write. Per-agent hooks block file edits outside those paths. They do not cover every shell command, so CI, CODEOWNERS and the owner's review are the backstop.

**Start small.** Each repo starts with `planner`, one dev agent (`app-dev` or `backend-dev`), `reviewer` and `security-reviewer`. `tester` is added to a repo only when tests start being weakened to make them pass. Until then the dev agent writes tests first.

**Hook scripts** are written in Node, which Expo already requires, so they run on Windows without extra tools. WSL or Git Bash is not needed.

**Agents per repo.** Each repo has its own `CLAUDE.md`, `.claude/` folder (agents, settings, hooks) and `STATUS.md`. A change that needs both repos is planned once, in the repo where the contract changes, and carried out as two PRs, backend first. The model for each agent is the owner's choice: the strongest model for `planner` and `security-reviewer`, a faster one for mechanical work.

### Match the ritual to the change

| Change | Examples | What happens |
| --- | --- | --- |
| Trivial | Typo, copy tweak, one-line config | Edit directly in the main session. CI is the only gate |
| Small | One file, no contract or security impact | Dev agent, then CI. Reviewer optional |
| Normal | A feature across several files | Plan, tests first, dev agent, reviewer, then the owner's PR review |
| Sensitive | Anything under the security triggers | Normal, plus `security-reviewer`, plus the owner's explicit review of the sensitive part |

**Security triggers:** the importer, lookup input validation, rate limiting, API controllers, anything that builds SQL, the Dockerfile, `.github/**`, the Android manifest and `app.json` permissions, dependency manifests and lockfiles, `.claude/**` (agents and settings), and the ingestion mapper.

### The work cycle for a normal change

1. The owner describes the goal in the main session. Plan mode (Shift+Tab in Claude Code) is used for anything touching more than one file.
2. `planner` writes `docs/plans/NNN-slug.md`: subtasks with acceptance criteria, an owner agent for each, and risks. The owner approves or edits it.
3. Tests come first for logic-heavy subtasks (ingestion mapper, review scheduling, importer, input validation). The dev agent writes them, or `tester` once it exists. UI-only subtasks get a Maestro flow or a manual checklist.
4. The dev agent implements on a feature branch until tests, typecheck and lint pass. Parallel work uses separate git worktrees.
5. If the API contract changes, `backend-dev` changes it in `germanflow-backend`. CI regenerates `contracts/openapi.json`, the change is merged and released with a version tag. Then `app-dev` updates the contract copy and regenerates the TypeScript types in a separate PR in `germanflow-app`. Each repo allows one open PR that touches the contract.
6. `reviewer` reviews the diff in a fresh context and the dev agent fixes the findings. On a security trigger, `security-reviewer` runs too.
7. The dev agent opens a PR from the template. CI runs. The owner reviews and merges. Agents never merge.
8. `STATUS.md` and `CHANGELOG.md` are updated inside the same PR.

### Instruction files

| Path (in each repo) | Purpose and rules |
| --- | --- |
| `CLAUDE.md` | The map for that repo: modules, non-negotiables, build, test and lint commands, the ritual table, where state lives. About 80 lines. In `germanflow-app` it also holds the Expo and TypeScript conventions, the folder structure, the token rule, test commands and the forbidden list (WebView, raw SQL, analytics SDKs, raw hex colors). In `germanflow-backend` it also holds the Java conventions, SQL rules, the logging rule (`pos`, result and latency only), contract generation and ingestion fixtures |
| `README.md` | Clone-to-run entry point for a human developer: prerequisites, setup, how to build, test and run. The three-file split is: this brief is the blueprint (why and what); `CLAUDE.md` is the agent map; `README.md` is the developer map |
| `.claude/agents/*.md` | The agent definitions for that repo, each a markdown file with frontmatter (`name`, `description`, `tools`, optional `model`) and a system prompt |
| `.claude/settings.json` | Committed permissions and hooks: allow the build, test and lint commands; deny reading `.env*`, force pushes and `rm -rf`; require approval to edit `.github/**` and `.claude/**`; run lint and typecheck before commits |
| `.claude/hooks/*.js` | Node scripts that the hooks call. They block edits outside an agent's write scope |
| `STATUS.md` | Single source of truth for project state (see Project state) |
| `docs/brief.md` | The parts of this brief that apply to the repo, per the map in "How to read this brief". If the copy and the full brief differ, the full brief wins |
| `docs/decisions/` | ADRs with a template: context, decision, consequences, status |
| `docs/plans/` | One file per planned change |
| `docs/design/` | App repo only: token reference and the approved simulation |
| `docs/security/` | The threat model from this brief, kept current |
| `.github/` | `CODEOWNERS`, PR template with the security checklist, workflows |
| `CHANGELOG.md` | One bullet per user-visible or structural change under `## [Unreleased]` |

Hygiene rules: a rule goes in `CLAUDE.md` only if an agent would otherwise get it wrong and it can be checked. When CI starts enforcing a rule, delete the sentence. Instruction files link to this brief instead of copying it.

### Project state

- **`STATUS.md`** has five sections: *Now* (task, owner agent, branch, phase), *Next* (ordered), *Blocked*, *Recently merged* (last 10), *Pending decisions*. Every session starts by reading it and ends by updating it.
- **The plan file header** carries `status: planned | in-progress | review | done`, `handoff_to: <agent>`, and checkbox subtasks.
- **ADRs** are written for decisions that are expensive to reverse, cross components, or were debated twice. The first ones to write: the two-repo split; SQLite artifact instead of live fetch; no app-embedded secret; contract-first with OpenAPI; Expo dev builds.
- Personal scratch notes may live in a gitignored `docs/know-how/`. Anything that belongs in the public record is promoted to an ADR or the plan.

### Prompt template for a fresh agent

Subagents inherit no context, so every prompt is a self-contained brief. Use a fork (which inherits the conversation) only for research you want kept out of the main context.

```markdown
Project: GermanFlow. Read CLAUDE.md and docs/brief.md sections <X, Y>.
Task: <one sentence>. Plan: docs/plans/NNN-slug.md, subtask 2.1.
You may edit: <paths>. You must not touch: <paths>.
Must respect: <3 to 5 specific constraints, e.g. identity key, token rule, no new dependencies>.
Done when: <checkable criteria and the commands that must pass>.
Report back: files changed, commands run with results, anything unsure. Under 200 words.
```

## Workflow, CI/CD and hosting

### Git workflow

- Never commit directly to `main`. Short-lived branches (`feat/`, `fix/`, `chore/`, `docs/`), a pull request for every change, squash merge, linear history.
- Commit messages are in English, imperative mood, one logical change each, and reference the plan subtask or ADR number where relevant.
- Branch protection requires a PR and passing status checks and forbids force pushes. On a solo repo GitHub does not let the author approve their own PR, so the human review gate is the owner's deliberate merge click after reading the diff and the reviewer agent's findings. Sensitive paths are listed in `CODEOWNERS` so they are visibly the owner's to review.
- Pre-commit hook: lint, typecheck and secret scan. Fix root causes; never suppress a signal to get green.

### Pipelines (GitHub Actions)

**Status: pending.** None of these workflow files exist in the repo yet; they are created in milestone M1 (`ci-backend` and `security` in story S1.4) and later milestones. Until then, branch protection has no status checks to require.

| Workflow | Runs when | Main jobs |
| --- | --- | --- |
| `ci-mobile` | Every PR in the app repo | `npm ci`, typecheck, ESLint and Prettier, Jest, generated types match the contract, Android manifest and permission check, bundle scan for key-like strings, `expo-doctor` |
| `ci-backend` | Every PR in the backend repo | `mvn verify` (unit and golden mapper tests), formatter and style checks, OpenAPI regenerated and diffed against `contracts/openapi.json`, dependency scan, Docker build without push, image scan |
| `security` | Every PR | gitleaks, dependency review, `actionlint`, CodeQL if the repo is public |
| `ingest` | Monthly schedule and manual | Download the dump, run ingestion, run gates (golden words, row-count comparison), publish `dictionary.sqlite` as a build artifact, trigger the image build |
| `deploy-backend` | Merge to `main`, or after `ingest` | Build and push the image, deploy to the host. The production environment requires the owner's approval |
| `build-mobile` | Manual or on a version tag | EAS Build: preview APK for the owner's phone, production AAB for the store |

All workflows default to `permissions: contents: read`, pin third-party actions to commit SHAs, and keep secrets in GitHub Environments.

**Start with three workflows**: `ci-mobile`, `ci-backend` and `security`. Add `ingest` at M0/M2, `build-mobile` when the first installable build is needed, and `deploy-backend` at M6 or when the first hosted lookup is needed.

**Where the workflows live.** `germanflow-app` runs `ci-mobile`, `security` and `build-mobile`. `germanflow-backend` runs `ci-backend`, `security`, `ingest` and `deploy-backend`. Each repo has its own branch protection, CODEOWNERS and secrets.

**Rollback.** A bad API release rolls back by redeploying the previous image digest from the registry. The dictionary rolls back the same way: the previous image carries the previous `dictionary.sqlite`.

### Environments

- **Local:** the backend runs on the developer's machine against a small fixture dictionary built from committed test fixtures, so the real dump is never needed for development. The Android emulator reaches it at `http://10.0.2.2:8080`.
- **Production:** one hosted backend plus the installed app. A separate preview environment is not worth its cost for a solo free-tier project.
- **Noticing outages.** The host's free-tier notifications (email on deploy failure and on health-check failure) are turned on. The owner uses these as the alert channel; there is no separate monitoring stack.

### Free hosting (as found in 2026 sources; free tiers change quietly, so re-verify before relying on them and record the choice in an ADR)

- **Render free web service:** runs Docker images, no card required per 2026 sources, 512 MB RAM, sleeps after about 15 idle minutes and takes 30 to 50 seconds to wake. The cold-start state in the UX section exists for this.
- **Google Cloud Run always-free tier:** the fallback. Scales to zero, needs a payment card.
- **Not chosen:** AWS (new accounts get credits, and the free plan closes after 6 months), and Fly.io (no free tier for new users).
- A 512 MB container is tight for a JVM. Run with `-XX:MaxRAMPercentage=70` and a small garbage collector, and keep Spring Boot lean (lazy initialization, no unused starters). A GraalVM native image is a later optimization and a good learning topic, not an MVP task.
- Keep-alive pinging is not used: it burns the monthly free hours, and the app already handles a cold start gracefully.
- **Cost tracking.** The owner checks the host's usage page monthly. If usage exceeds 50% of any free-tier quota, the owner either tightens the rate limit or swaps to the Cloud Run fallback.

### Release checklist (MVP)

1. CI green and the security checklist done; `CHANGELOG.md` and version updated.
2. A release build, run on a real phone in airplane mode: review, delete, export and import all work offline.
3. Contrast and TalkBack pass on every screen; the app is checked at 130% and 200% font scale.
4. About and credits screen shows the Wiktionary attribution; privacy statement is final.
5. Upload keystore backed up outside the repo.
6. Distribution decision applied (private APK sideload, or Google Play; decision log item 10).

Also on the release phone, test the cold-start message: let the hosted backend sleep, then run a lookup and confirm the waiting message is clear.

## Roadmap and definition of done

### Scope

| MVP (v0.1) | Later |
| --- | --- |
| Add from dictionary for all 11 word classes with homograph picker, inflected-form lookup, compound bulk-add, manual idioms, 404 offramp, duplicate rule, search, examples and personal edits, Refresh grammar | Offline add queue (v2, designed in the app repo's Part B) |
| Review with simplified SM-2, direction toggle, delete | Suggestion chips from FTS5 for typos |
| JSON export and import | iOS build (Expo makes this a configuration and testing task, not a rewrite) |
| Daily review reminder | Play Integrity attestation if abuse appears |
| About and credits, privacy statement | Anything new the owner decides to add later |
| Security baseline, CI/CD, free hosting, monthly ingestion | Explicitly never: accounts, cloud sync, AI features, web client, light theme, text-to-speech, statistics |

### Build order

| Milestone | Repo | Goal | Stories | Points | Exit gate |
| --- | --- | --- | --- | --- | --- |
| M0 Data spike | Backend | Know whether the real data can fill the content model before building the backend. | 2 | 8 | Findings and an ADR are recorded. The content model section of this brief matches the findings |
| M1 Foundations | Both | Both repos are protected, build in CI and run locally, with the contract hand-off in place. | 5 | 19 | All workflows are green. The app runs on an emulator. The backend runs locally. The contract copy in the app matches the backend |
| M2 Add from dictionary | Both | A learner can look up Haus, laufen and Band, pick a meaning and save it. | 6 | 38 | Haus, laufen and Band work end to end on an emulator, including the offline and timeout cases |
| M3 Review loop | App | A learner can review due cards with spaced repetition. | 3 | 10 | Scheduling unit tests pass. A full session runs on an emulator |
| M4 Remaining content | Both | Every word class, compounds and idioms can be added and removed. | 5 | 18 | Golden words pass for all eleven POS values |
| M5 Personal tools, backup, reminder | App | The deck becomes personal, safe to back up and easy to come back to. | 7 | 20 | Hostile import fixtures pass. The reminder fires on a real device |
| M6 Release hardening | Both | The app is safe, accessible, hosted and installed on the owner's phone. | 4 | 16 | The release checklist is complete. The first install on the owner's phone works |
| Total |  |  | 32 | 129 |  |

### Stories

The backlog is a list of user stories grouped by milestone. Each story becomes one issue in a GitHub Project that spans both repos.

- **Format.** "As a \<who>, I want \<what>, so that \<why>", followed by acceptance criteria that can be checked.
- **Points.** Every story is 2 to 8 points, with 8 as the ceiling (≈1.5 weeks of focused human work, adjusted for AI pair-programming). Larger stories are split; smaller ones merged.
- **Order.** The table order is the priority. A story starts only when the stories in its Needs column are done.
- **Done.** A story is done when every acceptance criterion passes and the definition of done below holds.
- **Calibration.** After the first three stories, compare the real days with the points and rescale the remaining stories if the ratio is off.
- **Tracking.** The GitHub Project has the fields Points, Milestone, Status and Needs. A PR says "Closes #\<issue>". Story S1.1 sets up the project and seeds these stories as issues.

#### M0 Data spike (8 points)

| ID | Story | Acceptance criteria | Repo | Pts | Needs |
| --- | --- | --- | --- | --- | --- |
| S0.1 | As the owner, I want real German dictionary data and fixtures for the sample words, so that I can judge the content model against real data. | The existence and size of a German-only extract is recorded. Fixture files exist for the sample words listed in the ingestion section (one per word class, a compound, a homograph, a separable verb, a reflexive verb, a singular-only noun). Fixtures are small files kept in the repo. | Backend | 3 | None |
| S0.2 | As the owner, I want a mapping report and a go/no-go decision, so that the brief matches what the data can deliver. | A table lists each kaikki field, the record field it fills, and the fields that cannot be mapped. The storage format of reflexive verbs is found. A threshold for the ingestion gates is proposed. An ADR records go or no-go. The content model section of the brief is updated. | Backend | 5 | S0.1 |

#### M1 Foundations (19 points)

| ID | Story | Acceptance criteria | Repo | Pts | Needs |
| --- | --- | --- | --- | --- | --- |
| S1.1 | As the owner, I want both repos protected and the agent kit installed, so that no change reaches main without review. | The kit is committed through a PR in each repo. Main requires a PR and blocks force pushes. Secret scanning and push protection are on. CODEOWNERS holds the real username. A dev agent edit outside its scope is blocked by the hook. The GitHub Project exists with its fields and the seeded stories. | Both | 3 | None |
| S1.2 | As a learner, I want an app shell that opens on my phone emulator, so that every later feature has a place to live. | Expo project with TypeScript strict and Expo Router, tabs Words, Practice and Settings. Theme tokens and the Poppins and Nunito Sans fonts are bundled. A lint rule blocks raw hex outside the tokens file. Workflows ci-mobile and security are green. The app runs on an Android emulator with the application id app.germanflow.wortschatz. The Expo SDK and Node versions are recorded in an ADR. | App | 5 | S1.1 |
| S1.3 | As a learner, I want the app to open a local database, so that saved words stay on my phone. | expo-sqlite with Drizzle. Migration 1 creates the cards table with a unique identity key. A migration test passes. The database opens at launch. The Words tab shows its empty state. | App | 3 | S1.2 |
| S1.4 | As the owner, I want a running backend skeleton, so that the app has something to call. | Maven project with the modules dictionary-core, ingest and api. Endpoints health and meta (with the minimum app version) work. A tiny fixture dictionary is read-only. The OpenAPI file is generated into contracts/openapi.json. Workflow files `.github/workflows/ci-backend.yml` and `.github/workflows/security.yml` exist and run on every PR, and both are green: `ci-backend` runs `mvn verify` and the OpenAPI diff against `contracts/openapi.json`; `security` runs gitleaks, GitHub dependency review and actionlint. A non-root Dockerfile runs locally. Java and Spring versions are recorded in an ADR. | Backend | 5 | S1.1, S0.2 |
| S1.5 | As the owner, I want the app to take the backend contract from a version tag, so that app and backend cannot drift apart unnoticed. | A backend release tag publishes the contract. The script contract:update copies it and regenerates the types. CI fails if the types are stale. | Both | 3 | S1.2, S1.4 |

#### M2 Add from dictionary (38 points)

| ID | Story | Acceptance criteria | Repo | Pts | Needs |
| --- | --- | --- | --- | --- | --- |
| S2.1 | As a learner, I want nouns in the dictionary with article, gender and plural, so that I learn a noun with its article. | The noun mapper fills article, gender, plural, genitive, translations and examples. Golden-file tests cover Haus, the three Band entries and a singular-only noun. The ingest job builds dictionary.sqlite with an FTS5 index. The golden-word and row-count gates fail the run on regression. | Backend | 8 | S0.2, S1.4 |
| S2.2 | As a learner, I want verbs and adjectives in the dictionary, so that I can save them with their forms. | The verb mapper fills the separable flag, the auxiliary, Präteritum and Partizip II, and the reflexive form as decided in the spike. The adjective mapper fills comparative and superlative. Golden tests cover laufen, aufstehen, sich freuen and schön. | Backend | 8 | S2.1 |
| S2.3 | As a learner, I want a lookup that understands case and inflected forms, so that typing Häuser or ging finds the right word. | POST /api/v1/lookup trims, normalizes to NFC and validates input (400 as problem+json). It is case tolerant. An inflected form resolves to its lemma with a note. Homographs return several entries. An unknown word returns the not-found result from the contract. Rate limiting returns 429. Logs record only pos, result and latency. Each case has a test. | Backend | 8 | S2.2 |
| S2.4 | As a learner, I want the app to handle every lookup outcome safely, so that bad network or bad data never crashes it. | The lookup client returns FOUND, AMBIGUOUS, NOT\_FOUND, OFFLINE, TIMEOUT, RATE\_LIMITED, INVALID or SERVER. Every response is validated with Zod. A timeout is enforced. The client never throws raw errors into the UI. Unit tests use a mocked server. | App | 3 | S1.5 |
| S2.5 | As a learner, I want to type a word, choose a meaning and save it, so that my word and its meaning are in one place. | The plus button opens the sheet on the Word tab. Look up shows a preview for nouns, verbs and adjectives, with the article on nouns. Homographs show a picker and saved entries are greyed with an In deck tag. Save writes one transaction, keeps the sheet open with an empty field and shows a confirmation. Offline and timeout states match the UX section. | App | 8 | S2.4, S1.3 |
| S2.6 | As a learner, I want duplicates blocked and my saved words listed, so that my deck stays clean and I can see it. | Saving an existing card shows Already in your deck and writes nothing. The Words tab lists saved cards with the article. Tapping a card expands it. Haus, laufen and Band pass end to end on an emulator, including offline and timeout. | App | 3 | S2.5, S2.3 |

#### M3 Review loop (10 points)

| ID | Story | Acceptance criteria | Repo | Pts | Needs |
| --- | --- | --- | --- | --- | --- |
| S3.1 | As a learner, I want cards scheduled by a simple spaced-repetition rule, so that I see each word when I am about to forget it. | Pure functions implement the rules of flow 6: ease 2.5 with minimum 1.3 and maximum 3.0, intervals 1 day, 3 days, then previous interval times ease, and Again resets. Due dates are local calendar dates. Due cards are selected oldest first and capped at 30. Unit tests include a time zone change. | App | 3 | S1.3 |
| S3.2 | As a learner, I want to run a practice session, so that I can actually learn my saved words. | The session snapshot is shuffled once. Card front and back show the article on noun fronts. Again and Got it save progress. Again returns the card once to the end of the queue. Progress reads Card 3 of 12. A complete screen and an empty state exist. Reduce-motion is respected. A full session runs on an emulator. | App | 5 | S3.1, S2.6 |
| S3.3 | As a learner, I want to choose German to English or English to German, so that I practise both directions. | A toggle switches direction. The article stays on the front of noun cards in both directions. The choice is remembered. Leaving mid-session keeps the progress already graded. | App | 2 | S3.2 |

#### M4 Remaining content (18 points)

| ID | Story | Acceptance criteria | Repo | Pts | Needs |
| --- | --- | --- | --- | --- | --- |
| S4.1 | As a learner, I want the other word classes in the dictionary, so that I can save any word I meet. | Mappers exist for adverbs, pronouns, prepositions, conjunctions, numerals, interjections and particles. Each class has a golden word. The gates cover the new classes. | Backend | 5 | S2.3 |
| S4.2 | As a learner, I want every word class to preview and save correctly, so that no word type is second class. | Preview and card render for every POS through the sealed type. An unknown pos is shown as unsupported without a crash. Identity keys follow the rules. Golden words pass end to end. | App | 3 | S4.1, S2.5 |
| S4.3 | As a learner, I want to add a compound noun and its parts in one step, so that Haustürschlüssel gives me Haus, Tür and Schlüssel. | The lookup returns the noun and a composite block in one response. The preview offers Save compound plus the number of components. Saved components are skipped. Components with several entries are listed as needs choosing. A partial result reads like Saved 3 of 4 cards. 1 already in deck. | Both | 5 | S2.3, S2.5 |
| S4.4 | As a learner, I want to add idioms by hand, so that phrases the dictionary lacks are still in my deck. | A space in the Word tab shows the That looks like a phrase banner and switches to the Idiom tab with the text filled in. The form enforces the field limits. Save writes locally and makes no network call. Duplicates are matched on whitespace-normalized text. | App | 3 | S2.5 |
| S4.5 | As a learner, I want an unknown word to offer an idiom card, and I want to delete cards I do not need, so that my deck stays mine. | An unknown word shows No dictionary entry for this word and an Add as idiom button with the text filled in. Delete sits on the expanded card behind a confirm dialog. A deleted card disappears from Words and Practice. | App | 2 | S4.4, S3.2 |

#### M5 Personal tools, backup, reminder (20 points)

| ID | Story | Acceptance criteria | Repo | Pts | Needs |
| --- | --- | --- | --- | --- | --- |
| S5.1 | As a learner, I want to search my saved words, so that I can find one quickly. | A local search box filters by German text or English translation, ignores case, works offline and never calls the backend. An empty result has its own state. | App | 2 | S2.6 |
| S5.2 | As a learner, I want to add my own examples and notes, so that a word carries my own context. | Dictionary examples show where they exist and are never invented. Examples and the personal note can be added, edited and deleted on any card. Grammar and translations stay locked on dictionary cards. Idiom cards are fully editable. Field limits are enforced. | App | 3 | S2.6, S4.4 |
| S5.3 | As a learner, I want to refresh a card's grammar, so that I fix a wrong entry without losing my progress. | Refresh grammar fetches the current entry for the same lemma and word class. It replaces the grammar fields and the identity key together and keeps review progress, examples and note. If the new key collides with another card, nothing changes and the app says so. Offline and error cases are handled. | App | 3 | S2.3, S2.6 |
| S5.4 | As a learner, I want to export my deck to a file, so that I have a backup. | Export writes the versioned JSON from the content model, including review progress, and opens the share sheet. A test re-imports the exported file. | App | 2 | S2.6, S3.1 |
| S5.5 | As a learner, I want to import a backup safely, so that a bad file can never damage my deck. | The file picker opens. The limits are 10 MB, 20,000 cards and JSON depth 10. The schema version is checked and every record is validated with Zod. A preview reads like 42 new cards, 8 already in deck, 0 invalid. Import merges and never overwrites. Hostile fixtures pass: oversized, deeply nested, wrong types, duplicate keys and script-like text shown as plain text. | App | 5 | S5.4 |
| S5.6 | As a learner, I want a daily reminder, so that I remember to review. | Settings has a toggle and a time picker, off until enabled and 19:00 when first enabled. A repeating local notification uses the generic text. The Android 13 permission is requested only when the toggle is turned on. If denied, an explanation and a link to system settings appear. The reminder fires on a real device. | App | 3 | S1.2 |
| S5.7 | As a learner, I want to see where the data comes from and how my data is handled, so that I can trust the app. | The About screen names Wiktionary (CC BY-SA), Wiktextract and kaikki.org, links the license and says the data was transformed. The privacy statement says there are no accounts and no analytics, and that the host may log IP addresses at lookup. It is reachable from Settings. | App | 2 | S1.2 |

#### M6 Release hardening (16 points)

| ID | Story | Acceptance criteria | Repo | Pts | Needs |
| --- | --- | --- | --- | --- | --- |
| S6.1 | As the owner, I want a full security pass, so that I release with known risks only. | The security checklist is run on both repos. The dependency audit has no unresolved high severity finding. The rate limit is tested. No secret is found in the history. Logs hold no typed text and no IP. Findings are fixed or recorded as accepted. | Both | 5 | All feature stories |
| S6.2 | As a learner, I want the app to work with assistive settings, so that it is usable for me and others. | Every interactive element has an accessibility label. Touch targets are at least 48 dp. Token contrast is checked and recorded. Text works at 200 percent font scale. Reduce-motion is respected. | App | 3 | All app feature stories |
| S6.3 | As the owner, I want the backend hosted with a monthly dictionary refresh, so that lookups work from anywhere and stay current. | The deploy-backend workflow runs. The hosting choice is re-verified and recorded in an ADR. A monthly ingest workflow builds the dictionary, passes the gates and deploys. A failed gate keeps the old dictionary live. Cold-start behaviour is documented. The release app uses the hosted HTTPS URL. | Backend | 5 | S6.1 |
| S6.4 | As a learner, I want the app installed on my phone, so that I can use it while reading German. | The build path is chosen (EAS Free if the quota fits, otherwise a local APK) and recorded. Signing material stays outside the repo. The release checklist is complete. The app is installed and one word is added and reviewed on the owner's phone. | App | 3 | S6.2, S6.3 |

### Definition of done (every PR)

- Tests written first for logic-heavy changes, and all pass. Typecheck, lint and formatting are clean.
- CI is green, including the security workflow.
- `reviewer` findings are resolved, and `security-reviewer` findings too when a trigger applied.
- `STATUS.md` and `CHANGELOG.md` are updated, and an ADR is added when the change meets the ADR criteria.
- No new dependency, permission, network destination or secret-like string without a recorded reason.
- No `TODO` left without a tracked issue.

## Decision log

This log lists every decision made while writing the brief, with its status. Open items appear only here. All 24 items are settled.

| # | Question | Decision | Status |
| --- | --- | --- | --- |
| 1 | TypeScript for the app? | Yes, strict mode | Decided |
| 2 | One repo or two? | Two private repos: `germanflow-app`, `germanflow-backend` | Decided |
| 3 | Search on the Words list in the MVP? | Yes, local search | Decided |
| 4 | Editing user-authored idioms? | Manual idiom cards are fully editable | Decided |
| 5 | `accentStrong` (#B5561F) for button fills? | Yes. Cream on #C4692C is about 3.6:1, below AA for small text | Decided |
| 6 | Reflexive verbs such as `sich freuen` | Accept `sich` followed by a verb. Keep the reflexive form if the dictionary stores it that way | Decided. Storage format Pending spike |
| 7 | Review defaults | 30-card session cap, Again requeues once, article shown on card fronts | Decided |
| 8 | Android auto-backup to Google | Off. The JSON export is the backup | Decided |
| 9 | OTA updates (EAS Update) | Off in the MVP | Decided |
| 10 | Distribution | Private APK on the owner's phone first | Decided |
| 11 | Alternative spellings (ae/oe/ue, ss for ß) | Never | Decided |
| 12 | Reminder default time | 19:00 | Decided |
| 13 | Maven modules | Three: `dictionary-core`, `ingest`, `api` | Decided |
| 14 | Repo visibility and license | Private, no license file until the owner publishes | Decided |
| 15 | Android application id | `app.germanflow.wortschatz` | Decided |
| 16 | Word classes in the MVP | All 11, plus compound bulk-add | Decided |
| 17 | Planning unit | User stories of 2 to 8 points, with 8 points ≈ a week and a half of focused human work (adjusted for AI pair-programming), tracked as issues in a GitHub Project | Decided |
| 18 | Installable builds | EAS Build while the free plan suffices (15 Android builds, low priority, 45-minute timeout). Fallback: local build and sideload the APK | Decided |
| 19 | Host IP logging in the privacy statement | State that the host may log IP addresses | Decided |
| 20 | JSON import depth cap | Reject files nested deeper than 10 levels | Decided |
| 21 | Undo after grading a card | Not built | Decided |
| 22 | Editable fields on dictionary cards | Examples and the personal note only. Grammar and translations are locked | Decided |
| 23 | Dark version of the brief | A generated reading copy with a black background and off-white text. The doc stays the editable source | Decided |
| 24 | Instruction kit (agent files, settings, hooks, templates) | Built as a zip with one folder per repo (agents, settings, hooks, templates, kickoff prompts) | Decided |

## Project risks

Strategic risks to the project itself, separate from the security threat table in § Security review. Each one's mitigation is already stated elsewhere in the brief; this table pulls them into one scannable place.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| M0 spike reveals dump coverage below threshold | Content model shrinks; roadmap re-cut | § Ingestion job spike go/no-go; the brief is updated before the backend is built |
| Render free tier changes or ends | Backend goes offline | Google Cloud Run fallback (§ Free hosting); rate-limit tightening before swap |
| kaikki.org goes offline or changes format | Monthly ingestion silently drifts | Ingest job fails loudly on download or parse change; old dictionary stays deployed; manual re-run or ADR for a new source |
| Owner-time gap (weeks without commits) | Branches rot, deps age | No persistent state in `main` beyond the brief, plans and CHANGELOG; Dependabot queue reviewed on return (§ security threat row 10) |
| Upstream breaking change (Expo SDK, Spring Boot, JVM) | Build breaks | Pinned versions in ADRs (§ Mobile app, § Backend); review window before bumping |
| Backup file format drifts between app versions | Old backups can't be imported | `schemaVersion` on every export; importer accepts any version up to its own (§ Backup file format) |
