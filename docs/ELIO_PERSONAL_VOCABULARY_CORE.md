# Personal vocabulary compatibility

GET `/api/core/vocabulary/deck?id=` reads an accessible legacy words deck with its content fingerprint and edit capability. POST `/api/core/vocabulary/save` appends an exact shared source word to a selected deck; source ID, original fields and extra metadata remain available. Source vocabulary is read only. Personal owners may edit their own decks; stored Admin roles may edit shared decks but cannot access another user's private deck. Existing words and metadata are preserved, duplicate saves skip explicitly, and compare-and-swap rejects concurrent stale writes.

The existing review route now optionally accepts deckId, resolves the word through backend visibility rules, and scopes SRS by record/source ID/direction. Existing shared-only review keys remain unchanged. The client exposes matching adapter methods. A new private deck can be created through the structured import route.

Offline tests verify source IDs, old metadata preservation, duplicate skipping, stale-write rejection, account visibility, separate schedules for shared/private occurrences, and no shared vocabulary changes. Subtitle click controls, flashcard/quiz bindings, existing legacy progress conversion and visual/browser testing remain pending. No UI files or live database records changed.
