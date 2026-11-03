# Completion work and verified release blockers — 2026-11-03

Scope: migration/elio-data-preserve-ui only. No main update, production deployment,
production secret changes or live database writes. All new flags default to OFF.
The owner's follow-up request to handle all remaining work follows the specific
proposal for grammar fill/navigation/mindmap and Pomodoro. Those controls are
contained in the existing cards/pages. A microphone control completes the requested
speaking audio path; all other page markup remains fixed.

## Implemented in this change

- GrammarStudio reads the source catalog/lessons through the server. All source
  fill/quiz/build exercises can be selected; grading uses the source revision and
  server answer key. Answers are not returned before submission. No invented XP,
  minutes or local skill-session writes occur in this preview. Mindmap is derived
  from the lesson, not generated as an AI result. Admin legacy reset/edit/delete
  controls are not used to mutate core source material.
- Existing import controls now review single canonical grammar collections and
  exam JSON with verified source answers. Source IDs survive review/save. The core
  does not call legacy parsers that insert sample writing/speaking tasks. Each exam
  save accepts one reviewed collection to avoid partial multi-record saves. PDF/
  image OCR stays a draft: plain text is not silently converted into an answered
  exam. Missing/unclear source content requires review and structured input.
- Grammar imports now use a deterministic per-account record ID and atomic conflict
  rejection. Existing duplicate legacy collection IDs are detected before insert.
  No overwrite mode or automatic data reconciliation was added.
- Manual vocabulary create/bulk-create/update/delete is now server-backed for the current account. Existing controls await acknowledgement and retain input on failure; shared source words cannot be edited/deleted through private-card actions. Source IDs, extra fields and SRS history are preserved. Bulk saving does not refetch the full catalog for every individual word.
- Writing drafts are private per task, restored and debounced to the server with CAS. Changing tasks flushes the current draft; failures retain editor content. Old source draft keys are not overwritten.
- Canonical exam writing/speaking prompts are visible in the existing studios;
  importing a collection refreshes the applicable task catalog.
- Microphone capture is bounded to 60 seconds/5 MB. Tracks close on session/account
  changes, permission races and unmount. Server STT returns text into the existing
  answer input for review, without sending it or claiming pronunciation scoring.
- The existing SpeakButton uses server TTS in speaking-core preview. WAV/container
  audio is played directly; Gemini L16 PCM is wrapped in a 16-bit mono WAV header.
  Playback errors propagate and object URLs are released. No silent local speech
  fallback on a provider error. Format reference:
  https://ai.google.dev/gemini-api/docs/generate-content/speech-generation
- Pomodoro is in ProgressPage behind ELIO_CORE_UI_FOCUS_ENABLED. It restores active
  sessions, displays server-based remaining time, supports pause/resume/cancel and
  requires server acknowledgement before completion. Only completed focus sessions
  contribute minutes. Sound is optional and disabled by default.
- Listening's existing bookmark saves the actual stored cue into a private phrase
  deck, with source fingerprint/account checks and deterministic duplicate skipping.
  Missing Vietnamese translations stay empty. Numeric item ID zero is preserved in
  dictation history. This is phrase saving, not word-level dictionary lookup.

## UI verification contract

The fixed baseline remains 2f8fe179f470d33279b028c2c643a4c821612d0f; raster thresholds
are unchanged. The source guard freezes exact baseline AND candidate presentation
fingerprints for only GrammarStudio, ProgressPage and InterviewStudio, recorded in
ELIO_APPROVED_PRESENTATION.json. All other JSX remains under the original strict
comparison. This is not a wildcard exception or a new screenshot baseline.
The existing 80 off-flag route/viewport/theme comparisons still run. Core-enabled
browser fixtures save desktop/mobile images for the new grammar and focus controls.

## Live read-only verification

The saved configuration was used only to read the authorized Turso hostname.
Observed: ee_users 11; ee_records 762; ee_state 64; elio_shared_vocabulary 6,718;
ee_google_identities 0. Password format counts: modern PBKDF2 7, exact legacy
64-hex:64-hex 3, google$ marker 1, other formats 0. No passwords/hashes or personal
account details were printed or committed. Format compatibility is verified; this
is not an actual password login test for every user.

The database currently lacks all three additive core tables (sessions, limits,
Google flows). ee_config contains zero rows, so no core provider configuration is
present. The provided file has database/encryption/admin configuration, but no
Google client credentials or transcript backend configuration. Actual Cloudflare
Worker secrets were not accessed; absence in the file is not proof of their absence
in Cloudflare. Plugin discovery did not return a Cloudflare integration.

scripts/check_elio_readiness.mjs reproduces read-only schema/count/config checks
without printing secrets. db/elio-core-additive.sql is the concrete pending schema
change: three new tables and one index; it has not been run on production.

## Still NOT production-ready

External blockers: authorization/access for the actual Worker configuration,
additive schema preparation with a verified backup, configured free AI/STT/TTS/
transcript providers, and real Google callback/media acceptance. No secret is
requested through chat. These cannot be replaced by fixture success.

Remaining source/UI coverage: legacy study-history/SRS reconciliation, remaining vocabulary
deck-management/quiz controls, writing history navigation, playlist/podcast automation,
word-level lookup, full official exam section/media/writing/speaking coverage and ECL
content remain outside the completed paths above. Do not advertise timed objective
practice as an official certificate simulation. Large scanned-book OCR accuracy
and batching are not established. Keep main/production and activation flags unchanged.

## Verification for this change

157 JavaScript tests and 7 Python safety tests pass locally. Browser coverage now
contains 34 fixture interaction flows, including grammar success/stale-answer,
Pomodoro reload/pause/resume/cancel, canonical grammar/exam import, microphone/TTS,
private vocabulary success/conflict and writing draft restore/conflict. The fixed
80 UI comparisons remain required. Always check the final commit CI; local or
fixture success does not authorize production activation.

## Backup and local schema rehearsal

A consistent read transaction copied the nine existing tables into a local SQLite
snapshot (integrity_check: ok). The snapshot was AES-256-GCM encrypted and saved
privately before any proposed production schema work. Ciphertext SHA-256:
913a6e69ef57ff9f6d8f44d7ae7a3456d6ce0b03b2d642ded828502f4af3c92c.
The saved AI_ENCRYPTION_KEY is hashed with SHA-256 to derive the backup key; no key
is embedded in the backup or repository. scripts/decrypt_elio_backup.mjs performs
an offline decrypt to a NEW local file using that original environment key. It
never overwrites an existing file or restores directly to production.

The additive schema was applied to a separate LOCAL copy. integrity_check passed
and every existing table's row count stayed unchanged. This rehearsal and backup
do not constitute authorization or evidence that the production schema was applied.
