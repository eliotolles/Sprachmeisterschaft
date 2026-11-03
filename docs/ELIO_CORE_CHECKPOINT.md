# Migration checkpoint — 2026-11-03

Branch: migration/elio-data-preserve-ui. No main changes, production deployment, production secret changes or live database writes in this checkpoint. Feature flags remain disabled by default.

| Area | Implemented and fixture-tested | Remaining before operational acceptance |
| --- | --- | --- |
| Authentication | Server sessions, stored roles, PBKDF2 compatibility, existing login/register/Google controls, signed OAuth callback core | Three unknown legacy password formats; actual Google credentials/callback acceptance |
| Vocabulary | Shared lookup, source SRS, private decks, account/deck isolation, existing flashcard review binding | Deck editing/import/quiz controls and legacy progress mapping |
| Grammar | Source 64 lessons/494 exercises, validation, mindmap data and grading/history | UI binding; current screen lacks fill-in and mindmap surfaces, requiring an owner decision before new controls |
| Writing | Source-evidence feedback, translation/history and existing studio grading binding | Configured-provider acceptance; draft/history/import controls |
| Speaking | Partner sessions, transcript assessment, existing interview UI binding and dynamic STT/TTS adapters | Real microphone/audio/voices, provider acceptance, history/import controls and remaining audio UI bindings |
| Listening | Validated German caption adapter, existing library/player binding, source dictation and private attempts | Transcript service, playlist/podcast import, legacy subtitle mapping and live media acceptance |
| Examination | Source 12-format snapshot, existing exam list/detail binding, timed objective practice and private answers/results | Full official sections, ECL content, image/audio tasks and provider-backed explanations |
| AI Tutor | Private server conversations bound to the existing ELIO page; no canned fallback on provider failure | Live provider acceptance |
| AI Administration | Encrypted keys, dynamic catalogs, existing Admin controls, task routing, policies, bounded fallback and cooldown | Actual provider/quota acceptance; unsupported providers, audit-log UI and quota metrics |
| Import | Create-only collections, existing vocabulary/YouTube import preview/save binding and server OCR review drafts | Grammar/exam preview binding, scanned-book accuracy and page batching |
| Utilities | Private focus sessions, persisted-practice statistics and private server report bindings for Home/Progress/Me/Readiness | Legacy history reconciliation, profile/settings/note editor sync; no existing Pomodoro/focus-sound presentation was found |

Local validation: 136 JavaScript tests and 7 Python safety tests; browser coverage expanded to 20 interaction flows and visual coverage to 72 desktop/mobile/light/dark comparisons (see final CI for completion). DOM text, geometry and computed styles are compared exactly; bounded compositor raster variation is reported separately. The source guard checks unchanged tag inventory, classes and inline styles across 56 JSX components. Event handlers and data adapters were changed without redesigning the UI. See module binding documents for limitations. CI status must be checked against the final commit.

Data: the earlier import verified 6,718 shared source IDs and unchanged original tables against saved snapshots. No new live Turso verification occurred in this checkpoint; fixture tests do not establish current production counts. Additive schema and production flags remain unapplied.

Readiness: NOT READY for production. Remaining module bindings, legacy authentication compatibility, live services and data acceptance remain blockers. No merge/deploy is authorized. Rollback of these unapplied source changes is by branch commit; no live data rollback is needed.
