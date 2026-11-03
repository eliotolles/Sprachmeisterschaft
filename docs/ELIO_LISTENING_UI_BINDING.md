# Existing listening library and player — server binding

Opt-in: ELIO_CORE_ENABLED, ELIO_CORE_UI_AUTH_ENABLED and ELIO_CORE_UI_LISTENING_ENABLED. All production flags remain unchanged. No live database writes or schema changes were made.

The existing /skills/listening route opens Video-Studio, not the unused DictationStudio component. The binding therefore updates the actual library and ListeningPlayerPage without changing navigation or presentation structure. Only authenticated accessible listening records supply collections, videos and cues. A video requires a real 11-character YouTube ID and finite ordered cue times; unsupported legacy records remain untouched and are not represented by fabricated captions. Valid YouTube videos with no captions stay visible with an empty subtitle list; the adapter does not silently discard them. Missing core records no longer substitute the old Nicos Weg example.

Dictation submits only the record/item/cue identity, a source fingerprint and learner answer. The server resolves the authorized stored caption and rejects stale fingerprints before saving. Source token alignment supplies corrections; character-case differences are labelled as case differences, not automatically classified as noun errors. Text comparison does not claim to infer acoustic or pronunciation causes. Attempts use a private revision-checked journal and create no fixed-duration or synthetic XP browser records.

Account/library changes clear cached content and visible practice state. Late responses cannot replace another account or cue. Failed grading retains the typed answer. Unsupported edit/delete/import/save-card controls refuse local fallback writes in this preview. Existing YouTube playback and subtitle controls are retained; live YouTube availability and complete transcript-service/media acceptance remain unverified.

Validation: 124 JavaScript tests and 7 Python safety tests; 14 isolated browser flows include successful dictation and stale-caption failure on the real player route. All 56 JSX components retain tags, classes and inline styles. Visual coverage expands to 60 viewport/theme/route cases; final CI must establish its completed results. These fixtures do not establish live media/provider acceptance.

Remaining: source legacy subtitle-format reconciliation, playlist/podcast import, backend transcript-service configuration, saved-vocabulary controls, restored historical completion indicators and real playback/subtitle acceptance. This does not declare the entire Listening engine complete.
