// Tab "Lộ trình" — 60 ngày tương tác của lộ trình telc B2.
// Port từ app gốc "Học telc B2" (Roadmap.tsx + tab "today" trong App.tsx).
import React, { useMemo, useState } from 'react';
import { DAYS, VOCAB_TOPICS } from '@/data/telc-b2/data-plan';
import { PHASES, PLAN_DAYS, PLAN_START, STUDY_BLOCKS } from '@/data/telc-b2/data-content';
import { grammarTopicForDay } from '@/data/telc-b2/data-grammar';
import { CheckCircle2, Lock, CalendarDays } from 'lucide-react';

export function currentPlanDay() {
  // Ngày hiện tại theo lịch học, neo vào PLAN_START, múi giờ Việt Nam.
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const today = fmt.format(new Date());
  const start = new Date(`${PLAN_START}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const diff = Math.floor((now - start) / 86400000) + 1;
  return Math.max(1, Math.min(PLAN_DAYS, diff));
}

export function RoadmapTab({ progress, onToggleBlock, onCompleteDay }) {
  const planDay = currentPlanDay();
  const nextDay = useMemo(() => {
    const done = new Set(progress.completedDays || []);
    for (let d = 1; d <= PLAN_DAYS; d += 1) if (!done.has(d)) return d;
    return PLAN_DAYS;
  }, [progress.completedDays]);
  const [selectedDay, setSelectedDay] = useState(nextDay);
  const day = DAYS.find((d) => d.day === selectedDay) || DAYS[0];
  const isFuture = selectedDay > planDay;
  const isDone = (progress.completedDays || []).includes(selectedDay);
  const checkedCount = (progress.checks || []).filter((c) => c.day === selectedDay).length;
  const grammar = grammarTopicForDay(selectedDay);
  const vocabTopic = VOCAB_TOPICS[(selectedDay - 1) % VOCAB_TOPICS.length];

  const dateLabel = (() => {
    const d = new Date(`${PLAN_START}T00:00:00`);
    d.setDate(d.getDate() + selectedDay - 1);
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
  })();

  return (
    <div className="space-y-6">
      {/* Ngày hiện tại */}
      <div className="surface p-5">
        <div className="eyebrow mb-1">Ngày {nextDay} / {PLAN_DAYS} · Hôm nay theo lịch là Ngày {planDay}</div>
        <h2 className="font-display text-2xl font-bold text-foreground">{day.focus}</h2>
        <p className="text-sm text-muted-foreground mt-1">{dateLabel} · {day.task}</p>
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="px-2 py-1 rounded-full bg-muted text-foreground">Ngữ pháp tuần: {grammar ? grammar.name : 'Ôn tổng hợp'}</span>
          <span className="px-2 py-1 rounded-full bg-muted text-foreground">Từ vựng: {vocabTopic.name} ({vocabTopic.nameVi})</span>
          <span className="px-2 py-1 rounded-full bg-muted text-foreground">Đã hoàn thành {(progress.completedDays || []).length}/{PLAN_DAYS} ngày</span>
        </div>
      </div>

      {/* 5 khối học của ngày đang chọn */}
      <div className="surface p-5">
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Ngày {selectedDay} — 5 khối học · 4 giờ</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {isFuture
            ? 'Ngày này chưa tới — chỉ xem trước, chưa tick được.'
            : isDone
              ? 'Ngày này đã hoàn thành — vẫn xem lại và tick lại được.'
              : 'Tick từng khối khi làm xong. Đủ 5 khối thì bấm "Hoàn thành Ngày".'}
        </p>
        <div className="space-y-3">
          {STUDY_BLOCKS.map((block) => {
            const checked = (progress.checks || []).some((c) => c.day === selectedDay && c.blockId === block.id);
            return (
              <button
                key={block.id}
                type="button"
                disabled={isFuture}
                onClick={() => onToggleBlock(selectedDay, block.id)}
                className={`w-full text-left rounded-xl border p-4 transition ${checked ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-border bg-card hover:border-accent/50'} ${isFuture ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border text-muted-foreground'}`}>
                    {checked ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{block.minutes}&prime;</span>}
                  </span>
                  <span>
                    <span className="block font-semibold text-foreground">{block.name} · {block.minutes} phút</span>
                    <span className="block text-sm text-muted-foreground mt-0.5">{block.what}</span>
                    <span className="block text-xs text-muted-foreground mt-1">Kết quả: {block.output}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">Đã tick {checkedCount}/5 khối</span>
          <button
            type="button"
            disabled={isFuture || isDone}
            onClick={() => onCompleteDay(selectedDay)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {isDone ? 'Đã hoàn thành ✓' : `Hoàn thành Ngày ${selectedDay}`}
          </button>
        </div>
      </div>

      {/* Các giai đoạn */}
      <div className="grid gap-3 md:grid-cols-2">
        {PHASES.map((phase) => (
          <div key={phase.name} className="surface p-4">
            <div className="font-semibold text-foreground">{phase.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Ngày {phase.from}–{phase.to}</div>
            <p className="text-sm text-muted-foreground mt-2">{phase.goal}</p>
          </div>
        ))}
      </div>

      {/* Lưới 60 ngày */}
      <div className="surface p-5">
        <h3 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> Toàn bộ 60 ngày
        </h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {DAYS.map((d) => {
            const done = (progress.completedDays || []).includes(d.day);
            const future = d.day > planDay;
            const active = d.day === selectedDay;
            const count = (progress.checks || []).filter((c) => c.day === d.day).length;
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => setSelectedDay(d.day)}
                className={`relative rounded-lg border px-2 py-2 text-center text-sm font-semibold transition ${active ? 'border-accent bg-accent text-accent-foreground' : done ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border bg-card text-foreground hover:border-accent/50'}`}
                title={`${d.focus}${future ? ' (chưa tới)' : ''}`}
              >
                {d.day}
                {future && <Lock className="absolute right-1 top-1 h-3 w-3 opacity-60" />}
                {count > 0 && !done && <span className="absolute left-1 top-1 text-[10px] leading-none">{count}/5</span>}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">{DAYS[selectedDay - 1].focus} — {DAYS[selectedDay - 1].task}</p>
      </div>
    </div>
  );
}
