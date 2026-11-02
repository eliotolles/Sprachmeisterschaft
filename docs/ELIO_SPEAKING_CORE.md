# Speaking/speech core checkpoint

Elio's conversation, DetailedFeedback and server speech patterns are adapted into presentation-independent modules. No DOM, styles, voice selector or microphone UI is copied or changed.

- Authenticated `/api/core/speaking/reply` and `/speaking/grade` support A1–B2, provider/part context, server-owned partner turns, isolated sessions, optimistic revisions and signed AI continuation.
- Text-transcript grading explicitly declares that pronunciation/audio fluency has not been assessed. Partner turns cannot be submitted as learner evidence. No fabricated pronunciation score is produced from text alone.
- `/api/core/speech/transcribe` accepts bounded audio for a configured transcription model. Gemini inline audio and Groq multipart transcription adapters use the dynamically selected model, German language and server-only keys. Raw audio is not stored by these routes.
- `/api/core/speech/tts` uses an explicitly configured speech model. The current German TTS provider adapter is Gemini. No model ID is hardcoded; model availability is verified against the provider catalog. Only complete audio responses are accepted.
- AI configuration task assignments separate text, vision, speech and transcription models. Unsupported provider/task pairs fail rather than silently claiming support.
- A pure browser helper lists actual installed German speech-synthesis voices. It does not add a dropdown or alter existing UI.
- Session history uses `sprach_speaking_results`; the generic state API cannot replace server-derived speaking results. Existing conversation data remains untouched.

Tests cover account isolation, server-owned partner replies, stale versions, dynamic speech/transcription model selection, audio-only TTS requests, incomplete audio rejection, German STT multipart data and device voice filtering. Provider/audio tests use HTTP fixtures; no microphone, real recording, actual voice quality or real provider quota has been validated.

Routes remain gated off, and no live database migration/write, deployment, UI change or production secret change occurred. Existing legacy sessions still require explicit mapping to the new document. Browser speech-to-speech, exam-part UI wiring and device permissions remain pending end-to-end validation.
