# Existing ELIO chat connected to the server tutor

The existing chat presentation, input, suggestion chips, messages, history reset control and styles are unchanged. When authenticated preview config explicitly enables uiTutorEnabled (ELIO_CORE_UI_TUTOR_ENABLED), the page bypasses the canned local elioChat responses and calls the real server tutor journal through the compatibility client. Missing/failing providers show the existing error surface and retain unsent text; there is no fabricated response fallback.

Server-owned user/assistant turns are restored per authenticated account, with no browser-wide chat-history reads/writes in enabled mode. The UI sends only the latest learner text/session ID/level/language, not client-authored assistant history. It does not truncate to the old last-20-message local window. Late responses cannot cross accounts. Initial history hydration cannot replace a message composed while loading. Double sends are guarded.

The existing reset control starts a fresh server thread and updates activeSessionId; old server history is retained, not deleted. Level/language changes similarly start a new thread. Server journal revisions and size limits apply. Legacy account chat storage is left untouched while core mode is enabled, and the existing disabled-preview behavior remains available.

Validation: 98 JavaScript tests plus 7 Python importer tests pass locally. Seven isolated Chromium control flows pass: login, registration, Google destination, successful/failed review, and successful/failed tutor reply. Tutor fixtures verify no previous-account browser history appears, server response rendering, retained unsent input on failure, and append-only thread reset. No real API key/provider/Turso call was made by these browser fixtures. The previous source commit passed GitHub build, 40 disabled-preview visual cases and five control flows; final branch CI must also be checked after this change.

The production feature flag remains off. Actual configured provider acceptance, remaining module wiring, original legacy password compatibility and full live account acceptance remain release blockers. This does not declare the whole migration ready.
