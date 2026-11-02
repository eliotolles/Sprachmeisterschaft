# Listening core migration

Source: ElioEinfachlernen- cloudflare-return bd5179107363ebcc19764454b08d7c94acd1a289 (`listening-v2-core.js`, `worker/transcript-backend.mjs`). UI files are unchanged.

Authenticated POST `/api/core/listening/transcript` accepts a YouTube URL or videoId. It requests German captions only through the configured server backend, checks identity, language, second-based ordered cues and size, rejects redirects, and suppresses upstream error text. Missing backend configuration returns 503; it never fabricates captions or silently substitutes AI.

POST `/api/core/listening/submit` accepts recordId, cueIndex, answer, strict and optimistic version. The server resolves captions from an accessible `ee_records` listening record, computes source token edit distance, and appends the result to the caller's `sprach_listening_results` journal. No client answer key or score is trusted. Generic state writes cannot replace this history. Existing listening records without cues remain intact and cannot be graded until caption import is completed.

The presentation-independent client exposes listeningTranscript and submitDictation. Source pure functions retain YouTube/playlist parsing, German tokenization, strict-case mode, subtitle synchronization and source labels.

Validation: offline fixtures exercise wrong-video/language/time-unit/order rejection, failure sanitization, account isolation, exact source grading and revision conflicts. Real transcript retrieval, playlist ingestion, podcast ingestion, subtitle-to-personal-deck saving, and UI event binding remain unverified/unimplemented. No provider configuration, live database or production deployment was changed.
