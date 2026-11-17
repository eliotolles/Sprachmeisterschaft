// Tab "Công cụ" — khung triển khai ý, khung email + 2 bài mẫu, 7 bài nói Teil 1.
// Port từ app gốc "Học telc B2" (Toolkit.tsx).
import React, { useState } from 'react';
import {
  EMAIL_FRAME, EMAIL_SAMPLES, FOLLOWUP_QUESTIONS, IDEA_FRAMEWORK,
  PHRASES_TEIL2, PHRASES_TEIL3, SPEAKING_PARTS, SPEAKING_SAMPLES,
  WRITING_CHECKLIST, WRITING_TIMING,
} from '@/data/telc-b2/data-content';

export function ToolkitTab() {
  const [openSample, setOpenSample] = useState(null);
  const [openSpeaking, setOpenSpeaking] = useState(null);

  return (
    <div className="space-y-6">
      <div className="surface p-5">
        <div className="eyebrow mb-1">Khung 5 bước triển khai ý — dùng cho cả Viết và Nói</div>
        <h2 className="font-display text-2xl font-bold text-foreground">Công cụ làm bài</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Mọi bài Viết và Nói B2 đều dùng chung một khung. Thuộc khung này thì không bao giờ bí ý giữa chừng.
        </p>
      </div>

      <div className="surface p-5">
        <h3 className="font-display text-lg font-bold mb-3">Khung triển khai ý — Meinung · Grund · Beispiel · Gegenargument · Fazit</h3>
        <div className="space-y-3">
          {IDEA_FRAMEWORK.map((s) => (
            <div key={s.step} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-foreground">{s.step}</p>
              <p className="text-sm text-muted-foreground italic mt-1">{s.sample}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.fn}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="surface p-5">
        <h3 className="font-display text-lg font-bold mb-3">Khung email (Schreiben) — 6 phần</h3>
        <div className="space-y-2">
          {EMAIL_FRAME.map((f) => (
            <div key={f.part} className="rounded-lg border border-border bg-card p-3 text-sm">
              <span className="font-semibold text-foreground">{f.part}: </span>
              <span className="text-muted-foreground italic">{f.sample}</span>
            </div>
          ))}
        </div>
        <h4 className="font-semibold text-foreground mt-5 mb-2">Chia giờ 30 phút viết</h4>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {WRITING_TIMING.map((w) => (
            <li key={w.minutes}><b className="text-foreground font-mono">{w.minutes} phút:</b> {w.task}</li>
          ))}
        </ul>
        <h4 className="font-semibold text-foreground mt-5 mb-2">Checklist trước khi nộp</h4>
        <ul className="list-disc ml-5 space-y-1 text-sm text-muted-foreground">
          {WRITING_CHECKLIST.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <h4 className="font-semibold text-foreground mt-5 mb-2">2 bài email mẫu</h4>
        <div className="space-y-3">
          {EMAIL_SAMPLES.map((s, i) => {
            const isOpen = openSample === i;
            return (
              <div key={s.title} className="rounded-xl border border-border bg-card overflow-hidden">
                <button type="button" onClick={() => setOpenSample(isOpen ? null : i)} className="w-full text-left p-4">
                  <span className="block font-semibold text-foreground">{s.title} · {s.words}</span>
                  <span className="block text-sm text-muted-foreground mt-0.5">{s.situation}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <p className="text-sm whitespace-pre-line text-foreground bg-muted rounded-lg p-4">{s.body}</p>
                    {s.note && <p className="text-sm text-muted-foreground mt-2">{s.note}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="surface p-5">
        <h3 className="font-display text-lg font-bold mb-3">Nói (Sprechen) — 3 phần thi</h3>
        <div className="space-y-3">
          {SPEAKING_PARTS.map((p) => (
            <div key={p.teil} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-foreground">{p.teil}</p>
              <p className="text-sm text-muted-foreground mt-1">{p.req}</p>
              <p className="text-sm text-muted-foreground mt-1"><b className="text-foreground">Mẹo:</b> {p.tip}</p>
            </div>
          ))}
        </div>

        <h4 className="font-semibold text-foreground mt-5 mb-2">7 bài mẫu Teil 1 — học thuộc, bốc thăm bài nào nói bài đó</h4>
        <div className="space-y-3">
          {SPEAKING_SAMPLES.map((s, i) => {
            const isOpen = openSpeaking === i;
            return (
              <div key={s.title} className="rounded-xl border border-border bg-card overflow-hidden">
                <button type="button" onClick={() => setOpenSpeaking(isOpen ? null : i)} className="w-full text-left p-4 font-semibold text-foreground">
                  {s.title}
                </button>
                {isOpen && <p className="px-4 pb-4 text-sm whitespace-pre-line text-muted-foreground">{s.body}</p>}
              </div>
            );
          })}
        </div>

        <h4 className="font-semibold text-foreground mt-5 mb-2">Mẫu câu Teil 2 — tranh luận</h4>
        <div className="space-y-2">
          {PHRASES_TEIL2.map((g) => (
            <div key={g.group} className="rounded-lg border border-border bg-card p-3 text-sm">
              <span className="font-semibold text-foreground">{g.group}: </span>
              <span className="text-muted-foreground italic">{g.phrases}</span>
            </div>
          ))}
        </div>

        <h4 className="font-semibold text-foreground mt-5 mb-2">Mẫu câu Teil 3 — cùng lên kế hoạch</h4>
        <div className="space-y-2">
          {PHRASES_TEIL3.map((g) => (
            <div key={g.group} className="rounded-lg border border-border bg-card p-3 text-sm">
              <span className="font-semibold text-foreground">{g.group}: </span>
              <span className="text-muted-foreground italic">{g.phrases}</span>
            </div>
          ))}
        </div>

        <h4 className="font-semibold text-foreground mt-5 mb-2">Câu hỏi phụ thường gặp sau Teil 1</h4>
        <div className="space-y-2">
          {FOLLOWUP_QUESTIONS.map((f) => (
            <div key={f.q} className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="font-semibold text-foreground">{f.q}</p>
              <p className="text-muted-foreground mt-0.5">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
