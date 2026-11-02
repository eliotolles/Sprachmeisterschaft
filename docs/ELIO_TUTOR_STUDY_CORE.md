# Tutor, focus timer and persisted-practice statistics

POST `/api/core/tutor/reply` reuses the secure dynamic-provider adapter, bounded fallback, signed continuation and server encryption. Conversation messages live in the caller's optimistic journal; the client cannot submit fabricated assistant history or another account's conversation. A1–C2 and vi/de/en explanations are supported. This is an AI practice tutor, not an official certification authority.

POST `/api/core/study/timer` implements start/pause/resume/finish/cancel with server timestamps and account revisions. Only one timer may be active; focus and break phases accept explicit 1–90 minute durations. Paused time does not count. Early completion is rejected. Completed and cancelled sessions are appended without truncation. soundEnabled records the preference; playing audio still belongs to the existing UI and requires browser verification.

GET `/api/core/study/statistics` derives counts from the caller's persisted core vocabulary/grammar/writing/speaking/listening/exam/focus histories. It counts only completed focus phases as focus minutes. It does not infer learning quality, fabricate study time, combine different users, or convert old incompatible histories silently.

Offline tests verify pause accounting, deadline enforcement, private statistics, revision conflicts, server-owned tutor turns and cross-account rejection. Provider responses are fixtures; real provider credentials, frontend event binding, focus audio and responsive/dark-mode screenshots remain unverified. Production and UI files were not changed.
