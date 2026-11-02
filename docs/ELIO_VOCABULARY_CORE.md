# Elio vocabulary/SRS core checkpoint

Source: ElioEinfachlernen- `cloudflare-return`, `bd5179107363ebcc19764454b08d7c94acd1a289`, business logic in `public/js/srs.js`.

## Implemented and tested

- Pure SRS scheduler extracted from Elio without DOM/rendering or localStorage dependencies.
- Again = 10 minutes, Hard / Good / Easy use Elio's intervals and ease adjustment. A card-field adapter preserves the existing target vocabulary naming and millisecond due time.
- Authenticated catalog search across German, Vietnamese and English fields, with German umlaut case folding, literal LIKE escaping, pagination, deck and level filters. Stored source IDs and fields remain unchanged.
- `POST /api/core/vocabulary/review`: server computes schedule using server time; accepts source ID, rating, direction and expected revision only. Client-supplied owner or timestamps are rejected.
- Reviews are isolated by authenticated account and by DE→VI / VI→DE direction. Progress and append-only history are committed in one compare-and-swap `ee_state` write under `sprach_vocabulary_reviews`.
- Concurrent/stale requests return 409 instead of overwriting or double-counting. The reserved review document cannot be replaced through the generic state-write API.
- Existing `srs`, source vocabulary and imported data remain untouched. Unknown source IDs or malformed stored progress cause an error without overwriting prior progress.
- Client compatibility service serializes review writes and advances versions only after server confirmation.

## Limits and activation status

- This is a core checkpoint, not a finished vocabulary UI integration. No JSX, CSS, HTML, layout, images or animations changed.
- Existing private vocabulary deck conversion, legacy review mapping, quiz wiring and full UI flashcard interaction remain pending.
- No migration or review was executed on live Turso; all write tests used isolated SQLite.
- New APIs remain behind the previously introduced migration gate, disabled by default; no production configuration or deployment changed.
- History is never silently truncated. Above 1.5 MB per new review document, the server refuses the write with 413; an additional history-storage design is required before that limit is reached. This checkpoint does not claim unlimited history storage.
- Browser screenshot/E2E verification and real deployed backend tests remain pending. The project is not ready for production.

## Validation

- Scheduler tests cover the four initial ratings, later intervals, ease bounds, invalid stored data, immutability and target-field mapping.
- SQLite-backed tests cover trilingual fields, umlauts, literal search syntax, deck/level filtering, account isolation, preserved source data, reverse-direction isolation, stale retries, preserved history and corrupt-state protection.
- Gateway/client tests cover authentication, reserved-state protection and ordered revisioned review requests.

Rollback: revert this module commit while the core gate remains off. Never replace the entire live database or delete legacy progress to roll back code.
