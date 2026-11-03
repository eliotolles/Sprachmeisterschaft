# Private profile, settings and note editor binding

The existing SettingsPage and NotesPage controls now use server `ee_state` through
`createPersonalBinding` when both core authentication and
`ELIO_CORE_UI_PERSONAL_ENABLED=true` are enabled. The new flag defaults to OFF.
No deployment configuration or production secrets were changed.

- Reads `sprach_profile` and `sprach_notes` for the authenticated account only.
  No browser-wide notes/profile are used as fallback in this preview.
- Existing source IDs, timestamps, extra fields and `{notes, ...metadata}` envelopes
  survive edits. Array-form notes remain arrays. No automatic legacy data migration.
- Writes use the existing client CAS revisions. CRUD operations are serialized and
  only update the cache after server acknowledgement. A conflict is reported;
  neither retry nor forced overwrite is attempted. The editor retains its draft.
- Account changes clear the cache and editor fields; late reads/writes and queued
  work cannot populate the next account. Duplicate submits are ignored while saving.
- Learning settings persist display name, target level, exam date and daily goal.
  The display name is a learning-profile value; this does not rewrite `ee_users.name`
  or Google identity. Existing profile consumers receive the database-change event.
- In core authentication mode, the legacy Settings Turso migrate/sync/reset actions
  are rejected before reading/writing database configuration. Optional AI keys are
  not read from or persisted to browser storage in core mode; use server Admin AI.
  Existing presentation and copy remain unchanged, including legacy key/cloud hints.
- Missing profile values use B1/20 and an empty exam date, without inventing an exam
  deadline. Malformed/duplicate note IDs fail closed.

Verification: six new isolated binding tests cover CRUD, envelope preservation,
concurrent mutations, CAS failure, account switches/late responses, invalid input
and disabled-mode delegation. Four browser fixture flows exercise note edit/reload/
delete, profile save/reload, and draft retention on conflict. Visual regression
adds Notes and Settings to the fixed baseline comparison (80 cases total).
These are fixture tests, not evidence of live Turso/provider acceptance.

Remaining: source `settings`/`studyPlan`/other legacy-key reconciliation requires
verified mapping and cannot silently overwrite imported data. Live acceptance and
production enablement remain blocked. No production writes, schema application,
password changes, UI redesign, merge or deployment occur in this change.
