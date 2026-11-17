// Tab "Ngữ pháp" — 8 chủ điểm telc B2 + 7 nền tảng B1.
// Port từ app gốc "Học telc B2" (Toolkit.tsx — phần grammar + data-grammar.ts,
// data-grammar-b1.ts). Tick "đã học" lưu trong tiến độ.
import React, { useState } from 'react';
import { GRAMMAR_TOPICS_FULL } from '@/data/telc-b2/data-grammar';
import { B1_TOPICS } from '@/data/telc-b2/data-grammar-b1';
import { CheckCircle2 } from 'lucide-react';

export function GrammarTab({ progress, onToggleGrammar }) {
  const [openB2, setOpenB2] = useState(null);
  const [openB1, setOpenB1] = useState(null);
  const learned = new Set(progress.grammarLearned || []);

  return (
    <div className="space-y-6">
      <div className="surface p-5">
        <div className="eyebrow mb-1">8 chủ điểm cốt lõi telc B2 · học theo tuần</div>
        <h2 className="font-display text-2xl font-bold text-foreground">Ngữ pháp B2</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Đã học {learned.size}/8 chủ điểm. Tick “Đã học” khi nắm được chủ điểm — lộ trình dùng
          chủ điểm của tuần để gợi ý bài học mỗi ngày.
        </p>
      </div>

      <div className="space-y-3">
        {GRAMMAR_TOPICS_FULL.map((t) => {
          const isOpen = openB2 === t.id;
          const done = learned.has(t.id);
          return (
            <div key={t.id} className="surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenB2(isOpen ? null : t.id)}
                className="w-full text-left p-4 flex items-start justify-between gap-3"
              >
                <span>
                  <span className="block font-semibold text-foreground">Tuần {t.week} · {t.name}</span>
                  <span className="block text-sm text-muted-foreground mt-0.5">{t.nameVi}</span>
                </span>
                <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${done ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                  {done ? '✓ Đã học' : 'Chưa học'}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 text-sm">
                  <p className="text-muted-foreground">{t.intro}</p>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Quy tắc</p>
                    <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                      {t.rules.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Ví dụ</p>
                    <div className="space-y-2">
                      {t.examples.map((ex) => (
                        <div key={ex.de} className="rounded-lg border border-border bg-card p-3">
                          <p className="text-foreground">{ex.de}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ex.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {t.pitfall && (
                    <p className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-amber-800 dark:text-amber-200">
                      ⚠️ Bẫy thường gặp: {t.pitfall}
                    </p>
                  )}
                  {t.applyWriting && <p><b className="text-foreground">Dùng khi viết: </b><span className="text-muted-foreground">{t.applyWriting}</span></p>}
                  {t.applySpeaking && <p><b className="text-foreground">Dùng khi nói: </b><span className="text-muted-foreground">{t.applySpeaking}</span></p>}
                  <button
                    type="button"
                    onClick={() => onToggleGrammar(t.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {done ? 'Bỏ đánh dấu đã học' : 'Đánh dấu đã học'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="surface p-5">
        <div className="eyebrow mb-1">Ôn nền B1 — học trước khi vào B2 nếu còn yếu</div>
        <h2 className="font-display text-2xl font-bold text-foreground">Nền tảng B1</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ngữ pháp B2 xây trên nền B1. Nếu còn lúng túng ở những điểm dưới đây, ôn lại trước —
          mỗi chủ điểm có bài tập ngắn kèm đáp án.
        </p>
      </div>

      <div className="space-y-3">
        {B1_TOPICS.map((t) => {
          const isOpen = openB1 === t.id;
          return (
            <div key={t.id} className="surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenB1(isOpen ? null : t.id)}
                className="w-full text-left p-4"
              >
                <span className="block font-semibold text-foreground">{t.name}</span>
                <span className="block text-sm text-muted-foreground mt-0.5">{t.nameVi}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 text-sm">
                  <p className="text-muted-foreground">{t.explain}</p>
                  <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                    {t.points.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Ví dụ</p>
                    <div className="space-y-2">
                      {t.examples.map((ex) => (
                        <div key={ex.de} className="rounded-lg border border-border bg-card p-3">
                          <p className="text-foreground">{ex.de}</p>
                          {ex.note && <p className="text-xs text-muted-foreground mt-0.5">{ex.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {t.exercise && (
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="font-semibold text-foreground">Bài tập: {t.exercise}</p>
                      {t.exerciseAnswer && <p className="text-muted-foreground mt-1">Đáp án: {t.exerciseAnswer}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
