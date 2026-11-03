# Production content repairs — 2026-11-03

Owner authorized fixes and a main update. Base main: 0e1613b5bd403eea186a5e7d93398dd115918670.

- Render grammar Markdown as semantic headings, tables, lists and emphasis inside the existing lesson frame. Raw HTML remains text.
- Derive level decks from the existing authenticated vocabulary binding. Preserve source IDs; shared words already available for SRS are not copied into new records.
- Carry Elio model recommendation hints from ElioEinfachlernen-/public/js/ai-models.js, source d1d8e3862b5021f5705d34ba4e07ca7cc729630d. Hints only rank IDs actually returned by the provider.
- Add server catalog and generation transports for OpenAI, Anthropic, DeepSeek, Mistral, Cerebras and Together, alongside Gemini, Groq and OpenRouter. Anthropic paginates; Together supports its array response.
- Commercial OpenAI/Anthropic/DeepSeek/Together catalogs are not labelled free. Gemini/Groq/Mistral/Cerebras quotas remain account dependent. Custom arbitrary URLs are intentionally not accepted by the server.
- No database migration, data replacement, key migration or production secret change.

Official protocol references:
- https://ai.google.dev/api/models
- https://developers.openai.com/api/reference/resources/models/methods/list
- https://platform.claude.com/docs/en/api/models/list
- https://api-docs.deepseek.com/api/list-models/
- https://docs.mistral.ai/api/endpoint/models
- https://inference-docs.cerebras.ai/api-reference/models/list-models
- https://docs.together.ai/docs/serverless/models

Before this change, live config confirmed auth, vocabulary, grammar and AI Admin enabled. Live grammar displayed 64 topics but raw Markdown. Level page used an empty static array. Live server AI configuration list was empty; no provider key was collected or moved. Real provider acceptance requires an owner-configured server key and is not established by fixture tests.

Source backup audit: 1,819 words have no CEFR level and 137 have range labels. These remain in the All view, explicitly unclassified or range-labelled; levels are not guessed or overwritten.

Set Wrangler keep_vars=true to retain owner-managed Dashboard flags across deploys (https://developers.cloudflare.com/workers/wrangler/configuration/). No secret values are read or changed.
