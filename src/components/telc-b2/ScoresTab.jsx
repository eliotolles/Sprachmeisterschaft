// Tab "Điểm số" — bảng điểm thi thử + sổ lỗi.
// Port từ app gốc "Học telc B2" (Scores.tsx).
import React, { useState } from 'react';
import { EXAM_CHECKLIST, EXAM_DAY_TIPS, EXAM_PARTS, SCORE_MILESTONES } from '@/data/telc-b2/data-content';
import { scaled } from './DiagnosticTab';

export function ScoresTab({ progress, onAddScore, onDeleteScore, onAddError, onDeleteError }) {
  const [label, setLabel] = useState('');
  const [lesen, setLesen] = useState('');
  const [sprach, setSprach] = useState('');
  const [hoeren, setHoeren] = useState('');
  const [schreiben, setSchreiben] = useState('');
  const [sprechen, setSprechen] = useState('');
  const [errorText, setErrorText] = useState('');

  const scores = progress.scores || [];
  const errors = progress.errors || [];

  const total = (s) => (Number(s.lesen) || 0) + (Number(s.sprachbausteine) || 0) + (Number(s.hoeren) || 0) + (Number(s.schreiben) || 0) + (Number(s.sprechen) || 0);
  const passed = (s) => {
    const written = (Number(s.lesen) || 0) + (Number(s.sprachbausteine) || 0) + (Number(s.hoeren) || 0) + (Number(s.schreiben) || 0);
    const oral = Number(s.sprechen) || 0;
    return written >= 135 && oral >= 45;
  };

  function submitScore(e) {
    e.preventDefault();
    if (!label.trim()) return;
    onAddScore({
      id: `score-${Date.now()}`,
      label: label.trim(),
      lesen: Number(lesen) || 0,
      sprachbausteine: Number(sprach) || 0,
      hoeren: Number(hoeren) || 0,
      schreiben: Number(schreiben) || 0,
      sprechen: Number(sprechen) || 0,
      createdAt: new Date().toISOString(),
    });
    setLabel(''); setLesen(''); setSprach(''); setHoeren(''); setSchreiben(''); setSprechen('');
  }

  return (
    <div className="space-y-6">
      <div className="surface p-5">
        <div className="eyebrow mb-1">Thi viết 225 điểm (đỗ ≥ 135) · Thi nói 75 điểm (đỗ ≥ 45)</div>
        <h2 className="font-display text-2xl font-bold text-foreground">Điểm số &amp; sổ lỗi</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Điểm viết được cộng gộp: Đọc yếu vẫn đỗ nếu Nghe + Viết + Sprachbausteine gánh được.
          Ghi điểm sau mỗi lần thi thử để thấy đường tiến bộ.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 mt-4">
          {EXAM_PARTS.map((p) => (
            <div key={p.part} className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground text-sm">{p.part}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.time} · {p.points} điểm</p>
              <p className="text-xs text-muted-foreground mt-1">{p.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="surface p-5">
        <h3 className="font-display text-lg font-bold mb-1">Ghi điểm thi thử mới</h3>
        <p className="text-xs text-muted-foreground mb-3">Mốc gợi ý: {SCORE_MILESTONES.map((m) => m.label).join(' · ')}</p>
        <form onSubmit={submitScore} className="grid gap-2 sm:grid-cols-3">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Tên lần thi (vd: Thi thử 1 — Ngày 36)" className="sm:col-span-3 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          {[
            ['lesen', lesen, setLesen, 'Lesen /75'],
            ['sprach', sprach, setSprach, 'Sprachbausteine /30'],
            ['hoeren', hoeren, setHoeren, 'Hören /75'],
            ['schreiben', schreiben, setSchreiben, 'Schreiben /45'],
            ['sprechen', sprechen, setSprechen, 'Sprechen /75'],
          ].map(([key, val, setter, ph]) => (
            <input key={key} value={val} onChange={(e) => setter(e.target.value)} placeholder={ph} inputMode="numeric" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          ))}
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Lưu điểm</button>
        </form>

        {scores.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">Chưa có điểm thi thử nào. Làm đề chẩn đoán ở tab “Chẩn đoán” rồi ghi điểm vào đây, hoặc nhập điểm các lần thi thử sau.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {[...scores].reverse().map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{s.label}</span>
                  <span className="text-muted-foreground"> — Đọc {s.lesen} · Sprachbausteine {s.sprachbausteine} · Nghe {s.hoeren} · Viết {s.schreiben} · Nói {s.sprechen}</span>
                  <span className={`ml-2 font-bold ${passed(s) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                    Tổng {total(s)}/300 {passed(s) ? '· ĐỖ ✓' : '· chưa đỗ'}
                  </span>
                </div>
                <button type="button" onClick={() => onDeleteScore(s.id)} className="text-sm text-red-500 font-semibold">Xóa</button>
              </div>
            ))}
          </div>
        )}

        {(progress.diagnostics || []).length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-foreground text-sm mb-2">Điểm chẩn đoán đã làm (quy đổi thang 75)</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {(progress.diagnostics || []).map((d) => (
                <li key={d.id}>
                  {new Date(d.createdAt).toLocaleString('vi-VN')} — Đọc {d.lesenRaw}/{d.lesenMax} → {scaled(d.lesenRaw, d.lesenMax)}/75 · Nghe {d.hoerenRaw}/{d.hoerenMax} → {scaled(d.hoerenRaw, d.hoerenMax)}/75
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="surface p-5">
        <h3 className="font-display text-lg font-bold mb-1">Sổ lỗi — ghi lại lỗi lặp lại</h3>
        <p className="text-sm text-muted-foreground mb-3">Mỗi lần chữa bài, ghi tối đa 3 lỗi lặp lại nhất. Tuần cuối chỉ ôn sổ này.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!errorText.trim()) return; onAddError({ id: `err-${Date.now()}`, text: errorText.trim(), createdAt: new Date().toISOString() }); setErrorText(''); }}
          className="flex gap-2"
        >
          <input value={errorText} onChange={(e) => setErrorText(e.target.value)} placeholder="vd: Quên đẩy động từ về cuối trong câu phụ weil..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Ghi lỗi</button>
        </form>
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-3">Chưa có lỗi nào được ghi.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...errors].reverse().map((err) => (
              <li key={err.id} className="rounded-lg border border-border bg-card p-3 flex items-start justify-between gap-2 text-sm">
                <span>{err.text} <span className="text-xs text-muted-foreground">({new Date(err.createdAt).toLocaleString('vi-VN')})</span></span>
                <button type="button" onClick={() => onDeleteError(err.id)} className="text-sm text-red-500 font-semibold shrink-0">Xóa</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="surface p-5">
        <h3 className="font-display text-lg font-bold mb-3">Checklist trước ngày thi</h3>
        <ul className="list-disc ml-5 space-y-1 text-sm text-muted-foreground">
          {EXAM_CHECKLIST.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <h3 className="font-display text-lg font-bold mt-5 mb-3">Mẹo ngày thi</h3>
        <ul className="list-disc ml-5 space-y-1 text-sm text-muted-foreground">
          {EXAM_DAY_TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </div>
  );
}
