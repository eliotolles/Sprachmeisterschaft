# Elio core migration: architecture audit and first implementation checkpoint

Date: 2026-11-02. This checkpoint is **not** a completed core replacement.

## Provenance and source selection

- Destination: `eliotolles/Sprachmeisterschaft`, branch `migration/elio-data-preserve-ui`, baseline `1eefd098b43da72ebbd967bfa75132bc0041cd8a`.
- Elio default main: `d1d8e3862b5021f5705d34ba4e07ca7cc729630d` (2026-10-23).
- Selected source for extraction: `ElioEinfachlernen-`, `cloudflare-return`, `bd5179107363ebcc19764454b08d7c94acd1a289` (2026-10-30), 52 commits ahead of main, no commits behind. Includes transcript backend, grammar/manual import and learning utilities absent from main.
- Also inspected heads: `cloud-backend` (`3ee3188e…`), `fix/restore-cc-controls-20261030` (`31be8e5c…`), `vercel-migration` (`ce3eb7a5…`). Recency alone was not treated as functional equivalence.
- `eliotolles/ElioEinfach`: repository metadata and commit access both returned 404 through the current GitHub connection. This does not prove the repository was deleted. Its contents cannot be assumed current or equivalent.

## Architecture findings

Destination is React with a synchronous browser-local `db` facade, per-user records in a shared localStorage document, an SM-2 variant, browser-side AI configuration, and a Worker with a gated read-only Elio vocabulary endpoint. Existing CI tests primarily cover pure adapters and negative API cases, not full browser workflows.

Elio is a static browser application with DOM-coupled modules plus a substantial server Worker. Server features include PBKDF2 authentication, hashed-cookie sessions, stored roles, optimistic record versions, encrypted provider keys, AI routing/fallback, model discovery, transcript extraction and account/shared state APIs. Browser modules combine rendering, prompts and business logic; copying those scripts would copy or depend on Elio's UI, so they must be split before reuse.

Elio Worker uses `app_*` tables; the authorized destination database uses `ee_*` tables. Blindly running Elio initialization would create a separate account universe and includes initialization side effects and deletion/archive triggers. That initialization is **not** imported or executed.

## Module compatibility map

| Module | Destination surface / current behavior | Source Elio logic / API | Data mapping and risk | Current status |
|---|---|---|---|---|
| Authentication | LoginPage, RegisterPage, AuthGate; synchronous local auth | `worker/index.js`: PBKDF2, session, role and Google verification | `app_users` differs from `ee_users`; preserve original IDs and hashes. Async UI binding is required. | New server adapter and tests implemented behind gate; not activated or UI-bound. |
| Data and ownership | `src/lib/db.js`, `src/lib/turso.js`; local writes and separate manual sync | `/api/state`, `/api/shared`, version-conflict handling in session.js | Map owner/key/revision to existing `ee_state`; never merge another user's cache. | Server per-owner compare-and-swap API and account-aware client implemented/tested. |
| Vocabulary | VocabularyPage, VocabDictionaryPage, ReviewPage; old shared reader | vocabulary.js, vocab-catalog.js, srs.js, word-dictionary.js | Shared rows in `elio_shared_vocabulary`, private decks in `ee_records`, review in `ee_state`. Elio has timestamp-based Again=10min; target uses a day-based variant. | 6,718 rows verified; new authenticated reader implemented. Full UI/SRS replacement pending. |
| Grammar | GrammarStudio, imported universal records, empty static packs | grammar.js, grammar-import.js, grammar-mindmap.js, grammar book data | ee_records(kind=grammar), grammarAttempts/grammarSession; source pack inspected has 64 A1–B2 items. Do not infer 165 topics or 42 lessons from historical reports. | Source audited; adapter, grading and mindmap presentation binding pending. |
| Writing | WritingStudio, ai-evaluator.js | schreiben.js, feedback.js, `/api/ai` | Source practice feedback uses four 0–5 criteria; do not silently relabel scores as official certificates. drafts/writingFeedback/history already exist in ee_state. | Prompt/schema mapping and provider-backed UI integration pending. |
| Speaking | skill studios and ElioChatPage | conversation.js, voice flow, `/api/speech/tts` | conversations/history; browser microphone permissions and actual German voice validation require browser tests. | Extraction and real audio tests pending. |
| Listening | ListeningOverviewPage, ListeningPlayerPage | listening-v2.js, listening-transcripts.js, worker/transcript-backend.mjs | 636 legacy listening records in backup; source cues are seconds and validate video/language. Existing CC and AI-generated captions must remain separate. | Source audited; backend deployment/config and subtitle/click-word binding pending. |
| Exams | ExamsListPage, ExamDetailPage | simulator.js, exams.js, exam-formats.js, telc-exam.js | exam records, examAttempts and activeExam; map rubric, timing, level and part without inventing equivalence across Goethe/telc/ÖSD/ECL. | Full format/score adapter and timer tests pending. |
| AI Tutor | AdminPage, ElioChatPage; some keys/config in browser | Worker server key encryption, `/api/admin/ai/models`, `/api/ai`, routing/retries | Source still contains model-specific restrictions/defaults. Provider catalogs must be fetched dynamically; no unreviewed static-list transplant. | Server secret handling/model routing migration pending; no provider key used in this checkpoint. |
| Import | UniversalImportModal and document-parsers.js | import-hub.js, pdf-tools.js, grammar-import.js | Document schema, collection IDs, source provenance and routing differ. Scanned PDF needs actual OCR/provider support, not a text-only parser assertion. | Schema/routing migration and real files pending. |
| Utilities/statistics | HomePage, ProgressPage, ReadinessPage, settings | study-planner.js, learning-lab-core.js, core.js events | Target UI has no verified matching location for every source utility. No new controls or layout may be invented. | Data mapping and UI-slot decisions pending. |

## Live data and backup evidence

- Authorized host: `elio-einfach-new-eliotollesmann.aws-ap-southeast-1.turso.io`.
- Read-only Dashboard verification: total=6718, unique IDs=6718, duplicate IDs=0, missing required ID/German=0, invalid extra_json=0.
- Existing backup: `elio-einfach-new_before_vocabulary.db`; SHA-256 `f9e8cedaa9a68d417e47cd24dfd53e2f7d00e4709ceb8654bd80170894c2cbbc`. This is the earlier pre-vocabulary backup, not a fresh post-import backup.
- A downloaded post-import snapshot was previously compared against the backup: every existing ee_* table matched, and all 6718 imported rows matched the source fields.
- Backup inventory: 11 users (4 super_admin, 7 user), 7 Elio-compatible PBKDF2 hashes, 3 legacy salted hashes with unverified algorithm, 1 Google identity. Counts reflect the inspected snapshot, not a claim that no live changes occurred since download.
- Existing ee_state includes exam, conversation, vocabulary and study-plan data. Existing ee_records includes writing, grammar, speaking, listening, vocabulary and exams. These are not overwritten by this checkpoint.
- No SQL migration or live writes were executed in this implementation checkpoint.

## Implemented foundation

`src/core/elio/passwords.js` extracts Elio's tested PBKDF2 encoding and verification. `database.js` provides server-only parameterized Turso requests pinned to the authorized host. `gateway.js` provides gated `/api/core/*` auth, per-account versioned state, existing shared vocabulary and legacy-record reads. It uses existing ee_users IDs and stored roles, has no seeded account, no implicit password change, no app_* initialization and no bulk data conversion. Unknown password encodings fail closed.

New-session hashes and rate limits use two separate tables defined in `db/elio-core-additive.sql`. This SQL has not been applied remotely. Existing ee_sessions and passwords are not invalidated. The browser compatibility client uses HttpOnly cookies, checks account epochs, serializes optimistic writes and exposes conflicts without overwriting newer progress. It is not yet bound to the application components.

The default `ELIO_CORE_ENABLED` is absent/false. Every core API except public configuration returns 503 without contacting the database until explicitly enabled in a permitted preview environment. Enabling it alone does not migrate the UI or create required tables.

## Activation and rollback boundaries

1. Obtain a fresh snapshot before any live schema preparation. Validate exact host and compare account/state inventories.
2. Apply only additive session/rate schema in an approved preview workflow; no auto initialization.
3. Resolve the 3 unverified legacy hash encodings and Google OAuth configuration. Do not reset passwords or silently lock users out to complete migration.
4. Bind async auth/state adapters to the existing UI and run screenshot comparisons on desktop/mobile/light/dark before accepting component changes.
5. Activation/deployment requires owner authorization. No production activation, secret changes, merge or deployment is included here.
6. Code rollback: revert the module commit or set the preview gate false. New session tables may remain inert. Never roll back by replacing the entire live database with an older snapshot, which could discard newer user data.

## Verification and known blockers

- New backend tests use real isolated SQLite tables to check legacy IDs/hash preservation, CSRF, hashed sessions, stored admin roles, blocked accounts, duplicate registration, shared/private records, logout scope, rate limiting, owner separation and stale-version conflicts.
- New client tests cover ordered progress writes, conflict propagation and late responses after account changes.
- Production credentials, AI providers, real OCR, microphone/TTS, YouTube service and browser UI were not exercised by these isolated tests.
- Legacy password format/Google identity support and an authorized preview surface are blockers to full activation and UI verification. Several modules require mapping to existing UI slots; no new UI is authorized implicitly.
- Previous local experiments in db.js and React pages are not part of this backend-only checkpoint. They are deferred until they can be reconciled with the new server core and screenshot-tested.

The complete project remains **NOT READY FOR DEPLOYMENT**. Importing vocabulary, adding gated APIs or passing unit tests does not satisfy the full-core completion criteria.
