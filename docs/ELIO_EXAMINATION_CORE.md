# Examination core

The source snapshot contains 12 Goethe/telc/ÖSD A1–B2 formats from ElioEinfachlernen- cloudflare-return bd517910, checkedAt 2026-10-18. They are source metadata, not a claim of current official exam rules. No ECL format is invented.

Authenticated routes: GET `/api/core/exam/formats`, GET `/api/core/exam/attempts`, POST `/api/core/exam/start`, `/api/core/exam/answers`, `/api/core/exam/submit`.

A timed practice selects accessible imported exam item IDs and an explicit 1–180 minute practice duration. Only reading/listening questions with unique IDs, valid options and a document-sourced answer key can start. The server snapshots tasks and keys, fixes a deadline, owns scores and isolates attempts per account. Optimistic revisions reject concurrent overwrites. Late requests finalize only previously saved answers. Completed attempts cannot be rewritten. Source answer keys and arbitrary answer fields are omitted from catalog/active-attempt responses and released as result evidence only after submission. Results report equal-weight practice percentages, not official certification pass/fail.

GET `/api/core/records` now supports bounded limit/offset to read all accessible listening and other records without the old 200-record ceiling. Exam catalog responses hide keys. Source records remain unchanged.

Tests cover catalog key filtering, account isolation, stale revisions, finalization, deadline enforcement, source-key grading and all 12 source formats. UI exam event binding, full official section/shared-timer rules, ECL tasks, real audio playback and visual comparison remain pending. Writing/speaking are separate AI assessment cores, not objective exam grades. No live schema or production settings changed.
