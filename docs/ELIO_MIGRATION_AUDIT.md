# Elio → Sprachmeisterschaft migration audit (2026-11-02)

## Immutable constraints
- Preserve Sprachmeisterschaft's React components, CSS, layout, typography, navigation, and responsive design exactly. No UI changes to accommodate imported data.
- Work only on `migration/elio-data-preserve-ui`; source and destination `main` branches remain untouched.
- Do not delete or overwrite accounts, passwords, sessions, roles, AI keys, secrets, or personal progress.
- Do not mutate the live database without a separately verified backup and a tested reversible migration.
- Report surplus, missing, or incompatible records rather than creating new UI or silently discarding them.

## Verified source snapshot
- Local uploaded SQLite snapshot: `elio-einfach (2).db`, approximately 104 MiB; `PRAGMA integrity_check` = `ok`.
- `app_shared` buckets: `wc` 73 items, `materials` 51 items, `vocab` 6731 items, `listeningLibraryV2` 635 items.
- `app_records`: 63 user-specific bucket rows; exclude from shared content migration pending per-user mapping.
- `app_users`: 8 users; exclude from content migration.
- Several `_...backup...` tables exist; exclude to prevent duplicate imports.
- Never commit the uploaded SQLite file, credentials, user records, or personal data to this public repository.

## Architecture incompatibility
- Sprachmeisterschaft: React/Vite, browser localStorage under `sprachmeisterschaft_db_v1`, Cloudflare Worker for assets and AI/admin endpoints.
- Elio: Cloudflare Worker + Turso JSON buckets (`app_shared`, `app_records`).
- The two schemas are not drop-in compatible. Do not copy the Elio Worker or database directly into the React app.

## Blocking work before any replacement
1. Inventory the destination's exact content schema and content readers, including vocabulary, grammar, listening, writing, and exams.
2. Build an offline, deterministic mapping with validation and deduplication; generate a surplus/missing report.
3. Back up destination browser data per account and any deployed server-side database; the GitHub backup branch only protects source code.
4. Test migration against a disposable destination; compare counts and sample content, verify no visual diffs.
5. Address separately the discovered unsafe default-password and client-side admin-role logic in `src/lib/db.js` without changing UI; do not conflate with the content migration.
6. Obtain verified runtime credentials through the deployment environment only, never through committed source.
