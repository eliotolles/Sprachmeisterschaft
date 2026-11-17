// Tab "Chẩn đoán" — đề mẫu Ngày 1: Đọc 15 câu + Nghe 10 câu, bấm giờ như thi thật.
// Port từ app gốc "Học telc B2" (Diagnostic.tsx). Audio: file mp3 đã copy vào
// public/audio/telc-b2/ (chưa push lên GitHub vì là file nhị phân) — nếu file
// chưa có trên server thì trình nghe báo lỗi và vẫn làm bài được.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  HOEREN_MAX, HOEREN_TEILE, HOEREN_TIME_SEC, LESEN1_HEADINGS, LESEN1_TEXTS,
  LESEN2_ITEMS, LESEN2_TEXT, LESEN3_ADS, LESEN3_SITUATIONS, LESEN_MAX, LESEN_TIME_SEC,
} from '@/data/telc-b2/data-diagnostic';
import { CheckCircle2, Clock, Play, XCircle, VolumeX } from 'lucide-react';

const AUDIO_SRC = {
  h1a: '/audio/telc-b2/hoeren-1a.mp3',
  h1b: '/audio/telc-b2/hoeren-1b.mp3',
  h1c: '/audio/telc-b2/hoeren-1c.mp3',
  h2: '/audio/telc-b2/hoeren-2.mp3',
  h3: '/audio/telc-b2/hoeren-3.mp3',
};

export function scaled(raw, max) {
  return Math.round((raw / max) * 75);
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function DiagnosticTab({ progress, onSaveDiagnostic }) {
  const [phase, setPhase] = useState('intro');
  const [answers, setAnswers] = useState({}); // id -> option index (Lesen 2 + Hoeren)
  const [t1, setT1] = useState({}); // text id -> heading index (Lesen 1)
  const [t3, setT3] = useState({}); // situation id -> ad id (Lesen 3)
  const [timeLeft, setTimeLeft] = useState(LESEN_TIME_SEC);
  const [played, setPlayed] = useState({}); // audioKey -> true (đã nghe xong, không nghe lại)
  const [audioError, setAudioError] = useState({}); // audioKey -> true (file chưa có)
  const [reviewId, setReviewId] = useState(null);
  const [justSaved, setJustSaved] = useState(null);
  const savedRef = useRef(false);
  const audioRefs = useRef({});

  const lesenRaw = useMemo(() => {
    let n = 0;
    for (const t of LESEN1_TEXTS) if (t1[t.id] === t.correct) n += 1;
    for (const it of LESEN2_ITEMS) if (answers[it.id] === it.correct) n += 1;
    for (const s of LESEN3_SITUATIONS) if (t3[s.id] === s.correct) n += 1;
    return n;
  }, [answers, t1, t3]);

  const hoerenRaw = useMemo(() => {
    let n = 0;
    for (const teil of HOEREN_TEILE) for (const it of teil.items) if (answers[it.id] === it.correct) n += 1;
    return n;
  }, [answers]);

  // Đồng hồ bấm giờ — hết giờ tự chuyển phần.
  useEffect(() => {
    if (phase !== 'lesen' && phase !== 'hoeren') return undefined;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          if (phase === 'lesen') { setPhase('hoeren'); setTimeLeft(HOEREN_TIME_SEC); }
          else finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function finish() {
    if (savedRef.current) return;
    savedRef.current = true;
    const result = {
      id: `diag-${Date.now()}`,
      lesenRaw, lesenMax: LESEN_MAX, hoerenRaw, hoerenMax: HOEREN_MAX,
      createdAt: new Date().toISOString(),
      answers: { answers, t1, t3 },
    };
    setJustSaved(result);
    onSaveDiagnostic(result);
    setPhase('done');
  }

  function startTest() {
    savedRef.current = false;
    setAnswers({}); setT1({}); setT3({});
    setPlayed({}); setAudioError({}); setJustSaved(null);
    setTimeLeft(LESEN_TIME_SEC);
    setPhase('lesen');
  }

  function playAudio(key) {
    const el = audioRefs.current[key];
    if (!el || played[key]) return;
    el.play().catch(() => setAudioError((p) => ({ ...p, [key]: true })));
  }

  const reviewDiag = reviewId
    ? (progress.diagnostics || []).find((d) => d.id === reviewId)
    : justSaved;

  if (reviewDiag) {
    const saved = reviewDiag.answers || { answers: {}, t1: {}, t3: {} };
    const a = saved.answers || {};
    const tt1 = saved.t1 || {};
    const tt3 = saved.t3 || {};
    return (
      <div className="space-y-6">
        <div className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="eyebrow">Kết quả chẩn đoán</div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Đọc {reviewDiag.lesenRaw}/{reviewDiag.lesenMax} → {scaled(reviewDiag.lesenRaw, reviewDiag.lesenMax)}/75
                {' · '}Nghe {reviewDiag.hoerenRaw}/{reviewDiag.hoerenMax} → {scaled(reviewDiag.hoerenRaw, reviewDiag.hoerenMax)}/75
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(reviewDiag.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <button type="button" onClick={() => { setReviewId(null); setJustSaved(null); }} className="px-3 py-2 rounded-lg border border-border text-sm font-semibold">
              ← Quay lại danh sách
            </button>
          </div>
        </div>

        <div className="surface p-5">
          <h3 className="font-display text-lg font-bold mb-3">Lesen Teil 1 — Nối tiêu đề (5 câu)</h3>
          <div className="space-y-4">
            {LESEN1_TEXTS.map((t) => {
              const ok = tt1[t.id] === t.correct;
              return (
                <div key={t.id} className={`rounded-xl border p-4 ${ok ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-red-400/50 bg-red-500/5'}`}>
                  <div className="flex items-start gap-2">
                    {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-semibold text-foreground">{t.label}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t.text}</p>
                      <p className="text-sm mt-2">Bạn chọn: <b>{tt1[t.id] == null ? '— chưa chọn —' : LESEN1_HEADINGS[tt1[t.id]]}</b> · Đáp án: <b>{LESEN1_HEADINGS[t.correct]}</b></p>
                      <p className="text-sm text-muted-foreground mt-1">{t.explain}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface p-5">
          <h3 className="font-display text-lg font-bold mb-3">Lesen Teil 2 — Sabbatjahr (5 câu)</h3>
          <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">{LESEN2_TEXT}</p>
          <div className="space-y-4">
            {LESEN2_ITEMS.map((it) => {
              const ok = a[it.id] === it.correct;
              return (
                <div key={it.id} className={`rounded-xl border p-4 ${ok ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-red-400/50 bg-red-500/5'}`}>
                  <p className="font-semibold text-foreground">{it.question}</p>
                  <p className="text-sm mt-1">Bạn chọn: <b>{a[it.id] == null ? '— chưa chọn —' : it.options[a[it.id]]}</b> · Đáp án: <b>{it.options[it.correct]}</b></p>
                  <p className="text-sm text-muted-foreground mt-1">{it.explain}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface p-5">
          <h3 className="font-display text-lg font-bold mb-3">Lesen Teil 3 — Nối quảng cáo (5 câu)</h3>
          <div className="grid gap-2 md:grid-cols-2 mb-4">
            {LESEN3_ADS.map((ad) => (
              <div key={ad.id} className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">{ad.text}</div>
            ))}
          </div>
          <div className="space-y-4">
            {LESEN3_SITUATIONS.map((s) => {
              const ok = tt3[s.id] === s.correct;
              return (
                <div key={s.id} className={`rounded-xl border p-4 ${ok ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-red-400/50 bg-red-500/5'}`}>
                  <p className="font-semibold text-foreground">{s.text}</p>
                  <p className="text-sm mt-1">Bạn chọn: <b>{tt3[s.id] == null ? '— chưa chọn —' : `Quảng cáo ${tt3[s.id]}`}</b> · Đáp án: <b>Quảng cáo {s.correct}</b></p>
                  <p className="text-sm text-muted-foreground mt-1">{s.explain}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface p-5">
          <h3 className="font-display text-lg font-bold mb-3">Hören — Nghe (10 câu)</h3>
          <div className="space-y-6">
            {HOEREN_TEILE.map((teil) => (
              <div key={teil.audioKey}>
                <p className="font-semibold text-foreground">{teil.teil}</p>
                <p className="text-xs text-muted-foreground italic mt-1">Lời thoại: {teil.script}</p>
                <div className="space-y-3 mt-3">
                  {teil.items.map((it) => {
                    const ok = a[it.id] === it.correct;
                    return (
                      <div key={it.id} className={`rounded-xl border p-4 ${ok ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-red-400/50 bg-red-500/5'}`}>
                        <p className="font-semibold text-foreground">{it.question}</p>
                        <p className="text-sm mt-1">Bạn chọn: <b>{a[it.id] == null ? '— chưa chọn —' : it.options[a[it.id]]}</b> · Đáp án: <b>{it.options[it.correct]}</b></p>
                        <p className="text-sm text-muted-foreground mt-1">{it.explain}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="space-y-6">
        <div className="surface p-5">
          <div className="eyebrow mb-1">Đề mẫu Ngày 1 · Chẩn đoán đầu vào</div>
          <h2 className="font-display text-2xl font-bold text-foreground">Làm đề mẫu telc B2 — Đọc + Nghe</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Đọc: 15 câu, 40 phút. Nghe: 10 câu, 20 phút, mỗi bài chỉ nghe <b>1 lần</b> (tạm dừng được, không nghe lại).
            Hết giờ mỗi phần sẽ tự chuyển phần. Kết quả được lưu lại để xem lại đáp án và lời giải.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Điểm quy đổi: Đọc {LESEN_MAX} câu → thang 75; Nghe {HOEREN_MAX} câu → thang 75 (như đề thi thật).
          </p>
          <button type="button" onClick={startTest} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Bắt đầu làm bài
          </button>
        </div>
        {(progress.diagnostics || []).length > 0 && (
          <div className="surface p-5">
            <h3 className="font-display text-lg font-bold mb-3">Các lần đã làm</h3>
            <div className="space-y-2">
              {(progress.diagnostics || []).map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3">
                  <span className="text-sm text-foreground">
                    {new Date(d.createdAt).toLocaleString('vi-VN')} — Đọc {d.lesenRaw}/{d.lesenMax} → {scaled(d.lesenRaw, d.lesenMax)}/75 · Nghe {d.hoerenRaw}/{d.hoerenMax} → {scaled(d.hoerenRaw, d.hoerenMax)}/75
                  </span>
                  <button type="button" onClick={() => setReviewId(d.id)} className="px-3 py-1.5 rounded-lg border border-border text-sm font-semibold">
                    Xem lại đáp án
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface p-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
        <div className="font-semibold text-foreground">
          {phase === 'lesen' ? 'Lesen — Đọc (15 câu)' : 'Hören — Nghe (10 câu)'}
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-sm font-mono"><Clock className="h-4 w-4" />{fmtTime(timeLeft)}</span>
          {phase === 'lesen' && (
            <button type="button" onClick={() => { setPhase('hoeren'); setTimeLeft(HOEREN_TIME_SEC); }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              Sang phần Nghe →
            </button>
          )}
          {phase === 'hoeren' && (
            <button type="button" onClick={finish} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              Nộp bài & xem kết quả
            </button>
          )}
        </div>
      </div>

      {phase === 'lesen' && (
        <>
          <div className="surface p-5">
            <h3 className="font-display text-lg font-bold mb-1">Teil 1 — Nối tiêu đề với đoạn văn</h3>
            <p className="text-sm text-muted-foreground mb-4">Chọn 1 trong 8 tiêu đề cho mỗi đoạn (có 3 tiêu đề thừa).</p>
            <div className="rounded-lg border border-border bg-card p-3 mb-4 text-sm">
              <b>Tiêu đề:</b>
              <ol className="list-decimal ml-5 mt-1 space-y-0.5 text-muted-foreground">
                {LESEN1_HEADINGS.map((h) => <li key={h}>{h}</li>)}
              </ol>
            </div>
            <div className="space-y-4">
              {LESEN1_TEXTS.map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold text-foreground">{t.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t.text}</p>
                  <select
                    value={t1[t.id] ?? ''}
                    onChange={(e) => setT1((p) => ({ ...p, [t.id]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Chọn tiêu đề —</option>
                    {LESEN1_HEADINGS.map((h, i) => <option key={h} value={i}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="surface p-5">
            <h3 className="font-display text-lg font-bold mb-1">Teil 2 — Sabbatjahr</h3>
            <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">{LESEN2_TEXT}</p>
            <div className="space-y-4">
              {LESEN2_ITEMS.map((it) => (
                <div key={it.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold text-foreground">{it.question}</p>
                  <div className="mt-2 space-y-1.5">
                    {it.options.map((opt, i) => (
                      <label key={opt} className="flex items-start gap-2 text-sm cursor-pointer">
                        <input type="radio" name={it.id} checked={answers[it.id] === i} onChange={() => setAnswers((p) => ({ ...p, [it.id]: i }))} className="mt-1" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface p-5">
            <h3 className="font-display text-lg font-bold mb-1">Teil 3 — Nối tình huống với quảng cáo</h3>
            <div className="grid gap-2 md:grid-cols-2 mb-4">
              {LESEN3_ADS.map((ad) => (
                <div key={ad.id} className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">{ad.text}</div>
              ))}
            </div>
            <div className="space-y-4">
              {LESEN3_SITUATIONS.map((s) => (
                <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold text-foreground">{s.text}</p>
                  <select
                    value={t3[s.id] ?? ''}
                    onChange={(e) => setT3((p) => ({ ...p, [s.id]: e.target.value || undefined }))}
                    className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Chọn quảng cáo —</option>
                    {LESEN3_ADS.map((ad) => <option key={ad.id} value={ad.id}>Quảng cáo {ad.id}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {phase === 'hoeren' && (
        <div className="surface p-5">
          <h3 className="font-display text-lg font-bold mb-1">Nghe — mỗi bài chỉ nghe 1 lần</h3>
          <p className="text-sm text-muted-foreground mb-4">Bấm ▶ để nghe. Tạm dừng được, nhưng nghe xong thì không nghe lại — giống thi thật.</p>
          <div className="space-y-6">
            {HOEREN_TEILE.map((teil) => (
              <div key={teil.audioKey} className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold text-foreground">{teil.teil}</p>
                <p className="text-sm text-muted-foreground mt-1">{teil.instruction}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={played[teil.audioKey]}
                    onClick={() => playAudio(teil.audioKey)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    {played[teil.audioKey] ? 'Đã nghe xong' : 'Nghe 1 lần'}
                  </button>
                  {audioError[teil.audioKey] && (
                    <span className="inline-flex items-center gap-1 text-sm text-amber-600"><VolumeX className="h-4 w-4" /> Không tải được file nghe (file mp3 chưa có trên máy chủ) — vẫn có thể trả lời các câu dưới đây.</span>
                  )}
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio
                    ref={(el) => { audioRefs.current[teil.audioKey] = el; }}
                    src={AUDIO_SRC[teil.audioKey]}
                    controls={played[teil.audioKey] ? false : true}
                    onEnded={() => setPlayed((p) => ({ ...p, [teil.audioKey]: true }))}
                    onError={() => setAudioError((p) => ({ ...p, [teil.audioKey]: true }))}
                    className="max-w-full"
                  />
                </div>
                <div className="space-y-4 mt-4">
                  {teil.items.map((it) => (
                    <div key={it.id}>
                      <p className="font-semibold text-foreground text-sm">{it.question}</p>
                      <div className="mt-2 space-y-1.5">
                        {it.options.map((opt, i) => (
                          <label key={opt} className="flex items-start gap-2 text-sm cursor-pointer">
                            <input type="radio" name={it.id} checked={answers[it.id] === i} onChange={() => setAnswers((p) => ({ ...p, [it.id]: i }))} className="mt-1" />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
