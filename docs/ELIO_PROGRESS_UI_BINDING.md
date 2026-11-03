# Server-backed progress reports

Opt-in ELIO_CORE_UI_PROGRESS_ENABLED requires the core authentication preview. Vocabulary totals additionally require the existing server vocabulary binding; reports never fall back to browser-wide vocabulary when that binding is unavailable. All production flags remain unchanged.

Home, Progress, Me and Readiness now use only account-scoped server journals for study logs, graded skill sessions and exam counts. Notes counts on Progress are taken from the account's server notes state, without exposing note bodies. These read-only report projections do not migrate, delete or overwrite any old browser or Turso data.

XP is not fabricated. Only completed server focus sessions contribute measured focus minutes; writing/listening/grammar grades do not create the old fixed-duration study logs. Activity streaks can include persisted practice even when no XP was awarded. Ungraded speaking sessions do not become zero scores; graded legacy sessions without a timestamp can contribute to score summaries without inventing a calendar date. Certificate pass/fail is not inferred from exam practice percentages.

Account changes clear visible report data immediately. Late responses and superseded loads are rejected. Read-only snapshots do not reset the revisions used by in-flight journal writes. Database notifications and window focus refresh the reports; unchanged legacy behavior remains available only with this preview disabled.

Validation includes five in-memory unit checks for projection integrity, no fabricated minutes/XP, account changes and snapshot revision safety. CI must verify the complete unit/build/browser/visual suites on the final commit. Browser coverage adds successful/failed progress loading against isolated fixtures containing old unowned browser data.

Remaining: original legacy progress reconciliation, profile/settings and note editor synchronization, real-account/provider acceptance, and focus controls absent from the current UI. No live Turso acceptance or production deployment is claimed by this checkpoint.
