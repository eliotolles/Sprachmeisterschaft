# Existing interview studio — server binding

The opt-in `ELIO_CORE_UI_SPEAKING_ENABLED` requires core and UI authentication. It remains disabled by default. No production flag, secret or database was changed.

The existing interview page loads only accessible exam records from the authenticated backend. Unknown exam-provider metadata is treated as practice rather than being mislabeled as an official certificate. Opening a part requests an examiner turn without inventing a learner answer. Later requests send only the latest learner text, current task context and server session ID; client-authored assistant history is never accepted. The server prevents switching the task, level, provider or part inside a session.

Account changes clear displayed conversation, input and feedback. Epoch guards reject late responses after account/part changes or a restart. Restart retains older server sessions. Provider failures display an error, retain unsent learner input and create no fabricated response. Completed server feedback is saved in the account-scoped, revision-checked journal. The browser does not create the old fixed five-minute session, six-minute study log or synthetic XP.

Four evidence-backed practice criteria are mapped to the existing /100 display. The result explicitly says it is practice, not certificate pass/fail. Assessment is limited to the text transcript; pronunciation is not assessed. Feedback quotes, corrections, reasons, prevention tips, criterion comments, corrected answer and model response remain available through existing result fields. No tags, classes, styles, cards, navigation or page layout were redesigned.

Validation: 119 JavaScript tests and 7 Python safety tests pass locally. Browser fixtures cover starting, replying, grading, restart and provider-failure input retention. Source presentation guard checks all 56 JSX components. Visual coverage now includes the interview route (52 viewport/theme cases); check the final commit's CI for completed screenshot/browser results. Fixtures do not establish live provider quality.

Remaining: microphone/STT and server audio playback bindings, real provider/voice acceptance, history browsing and source import controls. The existing import control refuses local writes in the enabled preview until the server importer is connected. This is the interview text path, not completion of every Speaking feature.
