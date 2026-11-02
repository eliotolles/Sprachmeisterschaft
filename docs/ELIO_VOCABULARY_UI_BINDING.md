# Vocabulary / review presentation binding

The adapter supplies the existing vocabulary card fields from the approved shared catalog plus the authenticated account's private ee_records words decks. Public legacy deck collections are not duplicated into the all-words catalog. Source IDs remain unchanged; namespaced UI IDs are transient and distinguish separate private deck copies. Shared/private SRS is read from the server journal and mapped to the existing card fields. English lookup and exact millisecond due times are supported.

Existing review buttons call server scheduling and await confirmed writes; failed saves stay on the current card and use the existing toast surface. Double clicks are guarded. Async hydration refreshes an initially empty review view without resetting an active session. Core reviews do not fabricate local study logs/XP. Existing legacy preview behavior remains available when the core flag is off.

The adapter needs both opted-in core auth and ELIO_CORE_UI_VOCABULARY_ENABLED=true; neither production flag was changed. Unsupported vocabulary create/edit/delete/import actions fail explicitly in this preview binding instead of silently writing a separate local database. Those operations remain release blockers, not completed features. Underlying server structured import and append-only shared-word save routes exist but their controls are not all connected yet.

Account changes clear memory immediately and discard late hydration/review responses. No vocabulary/progress is persisted to LocalStorage in this binding. Old local data is not erased or converted. Snapshot inspection found one legacy word without a source ID: it remains visible/read-only with a warning and cannot acquire an invented persistent ID or SRS history.

Unit tests verify hydration, exact source IDs, English search, account changes, late responses, source scheduling, per-deck scope and missing-ID preservation. Actual Turso access is not claimed by these fixtures.

Visual QA additionally records exact visible DOM geometry, text and computed presentation styles. Image comparison permits at most 100 raster pixels with channel delta at most 16/255 only when DOM presentation is identical; raw deltas and pixelmatch threshold=0 diagnostics remain in the report. This handles observed Chromium glyph rasterization without masking regions or accepting layout/color/style changes. Raw deltas and both DOM snapshots are retained with screenshots. Disabled-mode before/after visuals and enabled-mode control fixtures are separate evidence.
