# Reviewed imports through existing controls

Opt-in ELIO_CORE_UI_IMPORT_ENABLED requires core/UI authentication. No production switch or live database was changed.

The existing import modal can send reviewed vocabulary and YouTube subtitle collections to the create-only server importer. JSON IDs and recognized CSV/Excel ID columns are retained; conflicting or repeated IDs are rejected. New rows without source IDs receive deterministic IDs. Repeated identical collections retain their collection identity, allowing the server to reject repeat imports without overwriting old content. Public imports require stored Admin roles. The browser neither fills old blanks nor overwrites existing rows in core mode; only Skip/Create New is supported.

PDF/image OCR uses the server vision endpoint and returns a review draft, never automatically saves. The modal retains its existing preview/edit/confirm process. Missing provider or transcript service never becomes demo content. When no subtitles are supplied, the backend must return actual captions for the selected video before preview. Source parsers still handle CSV/Excel/DOCX/TXT locally; raw AI keys are not read from browser storage on the enabled OCR path.

Changing accounts clears the entire import draft, file reference, source title/URL, preview and report. Late OCR/extraction results are rejected. Server-confirmed counts appear only after successful persistence. Import events refresh the vocabulary/listening server caches without populating browser-wide content storage.

Validation: 127 JavaScript tests and 7 Python safety tests. Sixteen browser fixtures include reviewed JSON vocabulary import and CSV source-ID preservation with a server duplicate rejection. All 56 JSX components retain tags, class names and inline styles. Final CI must establish visual/browser completion on the final SHA.

Limitations: grammar/exam/situation and other module-specific preview formats are not yet wired to server saving and explicitly refuse local fallback. OCR must still be accepted against a configured real provider and scanned books; arbitrary 100-page scans are not claimed complete. PDF/image input is limited to 10 MB; the backend collection item limit is retained. Recognized ID headers are id/source_id/word_id/vocabulary_id. Internal Admin-only visibility has no server equivalent and is rejected rather than silently published.
