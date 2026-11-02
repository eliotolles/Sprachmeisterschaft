# Migration checkpoint — 2026-11-02

Branch: migration/elio-data-preserve-ui. No main changes, production deployment, production secret changes or live database writes in this implementation checkpoint.

| Area | Implemented and fixture-tested | Remaining before operational acceptance |
| --- | --- | --- |
| Authentication | Existing PBKDF2 IDs, stored roles, server sessions, Origin/account guards | Three unknown legacy hashes and Google account flow; no resets allowed |
| Vocabulary | Shared lookup, source SRS, private deck read/save, per-deck review isolation | UI/flashcard/quiz wiring and legacy progress mapping |
| Grammar | Source 64 lessons/494 exercises, validation, mindmap data, grading/history | Presentation binding and visual/browser regression |
| Writing | Detailed source-evidence feedback, translation, own history | Actual configured provider and UI verification |
| Speaking | Partner sessions, transcript assessment, dynamic STT/TTS adapters | Real microphone/audio/voices, provider and UI verification |
| Listening | Validated German caption adapter, source dictation comparison, own history | Configured transcript service, playlist/podcast import, subtitle UI binding |
| Examination | Source 12-format snapshot, timed objective practice, server keys/results | Full official section rules, ECL content, media and UI binding |
| AI Tutor | Encrypted multi-provider dynamic model service, fallback, continuation, private tutor sessions | Live provider acceptance and existing AI settings/chat binding |
| Import | Create-only structured collections; image/PDF vision review drafts | Real scanned-book accuracy, page splitting/batching UX and import UI binding |
| Utilities | Server focus/pause/resume/completion, private persisted-practice statistics | Focus audio and existing widgets binding |

Validation: 85 JavaScript tests and 7 Python importer safety tests pass locally, including cross-route authentication/account isolation, protected history, pagination and missing-provider behavior. New module test outputs use fixtures, not live provider calls. CI must be checked against the final branch SHA.

UI protection: no JSX/TSX, React component, HTML, CSS, class or layout changes were pushed in this checkpoint. That establishes unchanged presentation source, not a before/after screenshot PASS. The local checkout is partial and this runtime has no installed app dependencies or Chromium browser binary; full app build, desktop/mobile/dark-mode screenshots and end-to-end UI acceptance have not run. Do not enable the new core or represent these backend modules as functioning through the existing UI until binding and visual acceptance are complete. ELIO_CORE_ENABLED remains off by default; no production flag was changed.

Data: the earlier import verified 6,718 shared source IDs and unchanged existing tables against the saved snapshots. No new live Turso verification was performed in this checkpoint. Source/private data were tested only against isolated SQLite fixtures. Do not infer current live counts from these tests.

Readiness: NOT READY for production. The remaining authentication compatibility, actual UI integration, live external services, screenshot comparison and end-to-end checks are release blockers. No merge/deploy is authorized by this report. Rollback of these unapplied source changes is by branch commit; no live data rollback is needed for this checkpoint.
