# Server-backed AI administration

Opt-in: `ELIO_CORE_ENABLED`, `ELIO_CORE_UI_AUTH_ENABLED`, and `ELIO_CORE_UI_AI_ADMIN_ENABLED`. All remain disabled by default; no production flags or secrets were changed.

The existing Admin controls now use server-authorized configuration metadata. Keys are encrypted on the server, are never returned in configuration responses, and are not stored in browser caches. Removing a configuration archives it and retains its encrypted secret. Stored server roles enforce access independently of the page.

Provider catalogs are discovered from Gemini, Groq and OpenRouter APIs. Unknown pricing is labelled unknown rather than free. The existing Free Only, Free First, Allow Paid and Paid Fallback controls persist via revision-checked server settings. Task pools and explicit model assignments are validated server-side. Generation uses bounded fallback, verified backup models and signed continuation context; per-model provider failures persist a short cooldown. OpenRouter paid-price constraints are enforced in requests. Other provider pricing/quota depends on the configured account.

The connection test makes a real provider JSON request when configured; it does not establish grading quality or quota availability. CI uses synthetic fixtures and blocks external calls. Existing unsupported provider options are rejected by the server; no new provider is implied by preserving their presentation. Quota metrics and a populated audit-log UI are not implemented.

Validation: 115 JavaScript tests, 7 Python tests, 10 browser interaction flows, and 48 desktop/mobile/light/dark baseline comparisons. Exact DOM text, geometry and computed styles must match. Raster comparison permits only the documented bounded compositor variation (100 pixels, maximum channel delta 16); raw pixel differences remain reported. The source guard also checks all 56 JSX components retain their tag inventory, class names and inline styles. These are offline checks, not live Turso or provider acceptance.

No schema was applied and no live database was written in this checkpoint. Actual provider credentials, external-service acceptance and the remaining module bindings are still required before enabling the new core.
