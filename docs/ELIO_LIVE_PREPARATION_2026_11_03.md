# Live core preparation and legacy compatibility — 2026-11-03

## Applied additive schema

The owner instructed continued completion after the schema/backup checkpoint.
The exact db/elio-core-additive.sql was rehearsed on the decrypted backup and then
applied to the authorized Turso hostname with a libsql atomic write batch.
Created: sprach_core_sessions, sprach_core_limits, sprach_core_google_flows and
the session-user index. No old-table DML, account reset, password rewrite or source
seed was performed. Existing table counts before/after matched the saved snapshot:
11 users, 762 records, 64 state rows and 6,718 shared vocabulary rows. All nine old
tables retained their counts. New table columns were read back and verified.

scripts/prepare_elio_core_schema.mjs defaults to a read-only dry run. Applying
requires --apply, the exact --expected-host, a verified encrypted backup digest,
the original encryption key, a successful local SQLite integrity/schema rehearsal,
and unchanged old-table counts. It rejects destructive statements and incompatible
existing core schemas. Re-running the additive SQL is idempotent. This script does
not activate the Worker, change secrets, merge main or deploy.

## Actual database authentication check

scripts/check_elio_auth_live.mjs verified the saved administrator credential against
the stored hash. The LOCAL gateway code then performed login, HttpOnly session
restore and logout using the LIVE authorized Turso database. Login returned 200;
identity/role/session checks passed, and the temporary core session was removed.
A fingerprint of every original user's id/email/hash/role/blocked fields matched
before and after. No user fields were changed or disclosed. Only new core session/
rate-limit tables were used by the acceptance call.

This proves local-core/live-database credential/session compatibility, not that the
production website has been deployed or that Google OAuth works.

## Legacy data read paths

- Legacy ee_state.vocab arrays are projected into a private virtual legacy-vocab
  deck with unchanged word IDs. SRS uses the separate modern per-owner review
  journal. The old vocab row is never overwritten. Editing/deleting the virtual
  source is rejected; explicit copies can be made in the modern private deck.
- Existing settings.userProfile.name and settings.dailyGoal are read only when
  no modern learning profile exists. Modern profile values take precedence.
- Legacy drafts with string values retain their original task keys and text.
  Existing task controls expose unmatched old drafts as explicitly labelled legacy
  drafts. They cannot be graded against an invented source prompt. Explicit edits
  save to the new per-task namespace, preserving the original drafts object.
- Valid legacy quiz dates and stored grammar correct/incorrect outcomes contribute
  historical activity without invented XP, minutes or SRS-review counts. Missing/
  invalid timestamps are ignored; modern duplicate grammar records take precedence.
  Historical results are not reclassified as new AI assessments or certificates.

Legacy exam attempts/writing feedback with incompatible schemas are still preserved
in their original keys, rather than silently assigned new official scores.

## Cloudflare access

CLI authentication was checked and is unavailable in this execution environment.
The Cloud Browser reached the sign-in page; the owner's selected GitHub sign-in
returned “Unable to sign in”. No repeated or alternative browser login was attempted,
and the owner explicitly said cloud login is blocked. That route was closed.

scripts/cloudflare-preflight.mjs and the separate read-only Actions workflow inspect
only the named sprachmeisterschaft Worker if repository Cloudflare credentials
already exist. They never deploy, mutate settings, print credential values or dump
plaintext bindings. A completed diagnostic job is NOT a production-ready verdict.
The diagnostic explicitly reports ready:false when access or service acceptance is
missing. No token/password is requested through chat.

## Remaining activation gate

Core flags remain OFF, main unchanged, no production Worker deployment or secret
changes. ee_config was empty at the live check, so actual provider acceptance remains
unavailable. Google/transcript bindings must be checked through a permitted Worker
connection, without browser retries. Full official exam/media coverage, unsupported
legacy result schemas and remaining library/quiz/history controls still require work.
CI fixtures and the local live-DB auth check do not remove those gates.
