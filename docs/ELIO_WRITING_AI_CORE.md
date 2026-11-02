# Writing + server AI core checkpoint

## Source and scope

Elio `cloudflare-return` at `bd5179107363ebcc19764454b08d7c94acd1a289`: server-side encrypted provider keys/model routing in worker/index.js; DetailedFeedback schema/prompt in feedback.js; strict writing practice in schreiben.js. Rendering code is not copied.

## Implemented

- Server AES-GCM envelopes for multiple Gemini/Groq/OpenRouter keys under a dedicated ee_config namespace. Only backend-authenticated Admins can create/list/change AI configurations. Metadata and failures never return raw keys or provider error bodies. No credential is embedded in browser code or browser storage.
- Model catalogs are fetched from provider APIs at discovery and execution time, including Gemini pagination. There is no static model-ID list or hardcoded old-model fallback. Model switching verifies membership in the current catalog.
- OpenRouter free filtering checks returned prices; Gemini/Groq are labelled account-dependent rather than falsely declaring their entire catalog free. Availability and quota remain provider/account-dependent.
- Ordered fallback through enabled configurations, with bounded network timeouts, a request-wide deadline, input limits and authenticated rate limits. Invalid JSON/feedback is not converted into deterministic fake results.
- Signed continuation binds partial text to the account, configuration fingerprint and original prompt. Changed prefixes, context or accounts are rejected. The client automatically counts down 30 seconds and continues, up to a bounded number of rounds, retaining the complete received prefix. Partial feedback is never stored as a completed grade.
- Four practice criteria, each /5 and total /20, with evidence, concrete improvements, task checks, per-sentence feedback, exact quoted errors, grammar reasons, prevention, alternatives, corrected text and model answer. Scores are not official certificate conversions.
- Feedback validation checks learner quotations and coverage rather than accepting invented sentences or unchecked scores. Word count and total are calculated server-side.
- Provider-backed grading and Vietnamese/English/German explanation translation. Translation must preserve original scores, German corrections/model/examples and task judgments. Original feedback remains alongside its translations.
- Revisioned history under sprach_writing_results, account isolation, stale-write rejection, protected server-derived documents and no silent history truncation.

## Routes

- `/api/core/admin/ai/configs`: GET/POST/PATCH, Admin only.
- `/api/core/admin/ai/discover`, `/api/core/admin/ai/models`: POST, Admin only; transient discovery or an encrypted saved configuration.
- `/api/core/ai`: authenticated POST; 202 for explicitly partial output.
- `/api/core/writing/grade`, `/api/core/writing/translate`: authenticated, account-bound POST; 409 for stale history, 202 for partial AI output.

## Tests and limits

Tests use isolated SQLite and provider HTTP fixtures, not real provider keys. They cover encryption, live-catalog contract/pagination, actual free-price checks, Admin permissions, five-key fallback, malformed output, signed continuation, four-criterion validation, quote coverage, isolated history, stale writes and translation preservation. The client countdown is tested with a virtual wait.

No real model quality, provider quota, microphone, OCR or deployed UI claim is made. Encryption requires an independently configured server AI_ENCRYPTION_KEY; no production secret was read or changed. The new core remains gated off by default. The existing browser-facing AI implementation is not yet replaced; UI bindings and full browser verification remain pending.

Partial text is retained during the continuation chain and exposed to the caller on failure; browser-refresh recovery of a partial job is not yet implemented. History documents over 1.5 MB are refused without deleting prior data. Raw PDF is accepted only by a compatible provider path; unsupported chat providers require page images rather than pretending text extraction succeeded.

No JSX/CSS/HTML change, deployment, live database write, main push or merge is included. This is a core checkpoint, not completion of the full migration.
