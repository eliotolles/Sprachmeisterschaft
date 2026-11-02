# Elio Grammar core checkpoint

## Source and content inventory

Source: `ElioEinfachlernen-`, `cloudflare-return`, commit `bd5179107363ebcc19764454b08d7c94acd1a289`.

The bundled `public/data/grammar-book-a1-b2.json` is carried into `src/core/elio/data/grammar-book-a1-b2.json` with its original lesson IDs, content, answer keys, explanations and source metadata. Verified inventory: **64 lessons, 494 exercises** (247 fill, 247 quiz); A1=12, A2=13, B1=17, B2=22. This is not a claim that the historical 165-topic / 42-lesson inventories have been located or migrated.

## Implemented

- `grammar-content.js`: Elio answer normalization/grading, verified-exercise selection, import validation and pure mindmap sections/grouping. Elio's DOM/CSS/mindmap renderer is not copied.
- `grammar.js`: authorized catalog, source lesson reads, create-only collection import, server grading and revisioned account-specific attempt history.
- The catalog selects the correct level exactly; B1 never includes A2. Search and bounded pagination are supported.
- Existing accessible ee_records grammar collections are read with owner/public visibility. A stored copy of the bundled collection takes precedence without doubling the bundled lesson IDs. Private copies only override content for their owner. Invalid/empty legacy collections are preserved, not exposed as invented lessons.
- Source IDs are preserved. A new import receives a fresh storage record ID; importing an existing source collection ID never updates somebody else's record.
- Admin imports default to public; User imports default to private and cannot request public visibility.
- Lesson responses omit answer keys and exercise explanations until submission; each exercise carries a fingerprint including its source answer key. A stale exercise revision is rejected after content changes.
- Fill, quiz and build exercise types are supported by the content engine. The bundled pack currently contains fill and quiz types only. AI-origin answer keys are excluded, as in Elio; no invented AI grading fallback runs when a verified answer key is unavailable.
- Submission accepts the learner answer, source exercise identity and expected history revision. Correctness and explanation come from the server's source, not client flags.
- Attempts are appended together in one compare-and-swap write under `sprach_grammar_attempts`; stale retries return 409 without duplicate history. That document cannot be replaced through generic state PUT.
- Browser compatibility client methods serialize submissions and reject previous-account responses. No browser UI binding is included in this checkpoint.

## Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/core/grammar?level=B1&q=...&limit=100&offset=0` | Authorized lesson summaries |
| GET | `/api/core/grammar/lesson?collection=...&id=...` | Lesson, verified exercise prompts and source-derived mindmap data |
| POST | `/api/core/grammar/import` | Validated create-only import with backend visibility rules |
| POST | `/api/core/grammar/submit` | Server answer grading and optimistic attempt persistence |

All routes use the existing new-core authentication/Origin/account-change checks and remain disabled by the migration gate unless explicitly enabled. No schema change is required beyond the previously prepared core authentication tables; attempts use existing ee_state.

## Validation

- All 494 source exercises were checked against every accepted source answer.
- Tests cover normalization, incorrect answers, missing answer keys, content-derived mindmap groups, AI-origin exclusion, invalid imports, exact level filters and omission of answer keys before submission.
- Real isolated SQLite tests cover public/private imports, legacy source precedence, preservation of existing records, account-isolated attempts, stale retry conflicts, changed source fingerprints and rejection of client-supplied owner/correctness.
- Gateway/client tests cover API authentication, default Admin visibility, protected attempt documents and ordered revisioned client submissions.

## Remaining limits

- No JSX, CSS, HTML, icon, font, navigation or layout was changed. No Elio UI was imported.
- GrammarStudio UI binding, rendering every source exercise type, showing the mindmap in an existing authorized UI slot, session resume and real browser screenshot comparisons remain pending. The current target UI cannot be assumed equivalent to Elio's fill/build interfaces.
- Existing legacy grammarAttempts/grammarSession data are preserved; conversion to the new attempt document has not run.
- Attempt documents are not silently truncated. A document over 1.5 MB is refused pending an additional history-storage design.
- Real provider-backed error explanation/OCR and live deployed-backend tests were not performed. No live database writes, deployment, production secret changes or main-branch merge occurred.

This checkpoint advances the core migration; it does not complete the full project or activate the new core on the website.
