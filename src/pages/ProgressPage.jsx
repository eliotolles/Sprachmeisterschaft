import React, { useState, useEffect } from 'react';
import {useFocusTimer} from '@/lib/use-focus-timer';
import { db } from '@/lib/db';
import {progressCoreActive} from '@/lib/elio-progress-runtime';
import {progressStreak} from '@/core/elio/progress-binding';
import {useCoreProgress} from '@/lib/use-core-progress';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { calculateStreak, formatDate, addDays } from '@/lib/algorithms';
import { SKILLS } from '@/data/skills';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  BookMarked,
  RotateCw,
  Flame,
  FileCheck2,
  FileText,
  TrendingUp,
  Award,
} from 'lucide-react';

export function ProgressPage() {
  const coreActive=progressCoreActive(), focus=useFocusTimer();
  const [focusMinutes,setFocusMinutes]=useState(25),[focusPhase,setFocusPhase]=useState('focus'),[focusSound,setFocusSound]=useState(false);
  useEffect(()=>{if(focus.active){setFocusMinutes(focus.active.durationMs/60000);setFocusPhase(focus.active.phase);setFocusSound(focus.active.soundEnabled);}},[focus.active?.id]);
  const [cards, setCards] = useState(() => coreActive?(db.vocabulary.isCore?.()?db.vocabulary.findMany():[]):db.vocabulary.findMany());
  const [logs, setLogs] = useState(() => coreActive?[]:db.studyLogs.findMany());
  const [sessions, setSessions] = useState(() => coreActive?[]:db.skillSessions.findMany());
  const [exams, setExams] = useState(() => coreActive?[]:db.examResults.findMany());
  const [notes, setNotes] = useState(() => coreActive?[]:db.notes.findMany());

  useEffect(() => {
    const handleDbChange = () => {
      if(progressCoreActive()){setCards(db.vocabulary.isCore?.()?db.vocabulary.findMany():[]);return;}
      setCards(db.vocabulary.findMany());
      setLogs(db.studyLogs.findMany());
      setSessions(db.skillSessions.findMany());
      setExams(db.examResults.findMany());
      setNotes(db.notes.findMany());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  useCoreProgress(db,{cards:setCards,logs:setLogs,sessions:setSessions,exams:setExams,notes:setNotes});

  const today = formatDate();
  const dueCount = cards.filter((c) => !c.due_date || c.due_date <= today).length;
  const learnedCount = cards.filter((c) => (c.repetitions || 0) > 0).length;
  const streak = coreActive?progressStreak(logs,today):calculateStreak(logs);
  const totalXp = logs.reduce((sum, l) => sum + (l.xp || 0), 0);

  // 14-day activity bar chart data
  const activityData = [];
  for (let i = 13; i >= 0; i--) {
    const d = addDays(today, -i);
    const log = logs.find((l) => l.date === d);
    activityData.push({
      date: d.slice(5), // MM-DD
      cards: log?.cards_reviewed || 0,
      xp: log?.xp || 0,
      minutes: log?.minutes || 0,
    });
  }

  // 7 skills summary table
  const skillSummary = SKILLS.filter((s) => s.id !== 'game').map((s) => {
    const matching = sessions.filter((sess) => sess.skill === s.id);
    const count = matching.length;

    if (count === 0) {
      return {
        id: s.id,
        name: s.vi,
        count: 0,
        recent: 0,
        highest: 0,
        average: 0,
        diff: 0,
      };
    }

    const scores = matching.map((m) => Number(m.score) || 0);
    const recent = scores[0];
    const highest = Math.max(...scores);
    const average = Math.round(scores.reduce((a, b) => a + b, 0) / count);
    const firstScore = scores[scores.length - 1];
    const diff = recent - firstScore;

    return {
      id: s.id,
      name: s.vi,
      count,
      recent,
      highest,
      average,
      diff,
    };
  });

  return (
    <div className="space-y-8 animate-rise">
      <PageHeader
        eyebrow="BÁO CÁO NĂNG LỰC HỌC TẬP"
        title="Tiến độ học tập"
        deTitle="Fortschritt"
        subtitle="Theo dõi chuỗi học liên tục, tần suất hoạt động và phân tích xu hướng 7 kỹ năng."
      />

      {/* 5 StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Từ đã học"
          value={learnedCount}
          hint={`Trên tổng số ${cards.length} thẻ`}
          icon={BookMarked}
        />
        <StatCard
          label="Thẻ đến hạn"
          value={dueCount}
          hint="Cần ôn tập trong ngày"
          icon={RotateCw}
        />
        <StatCard
          label="Tổng XP / Streak"
          value={`${totalXp} XP`}
          hint={`Chuỗi ${streak} ngày liên tiếp`}
          icon={Flame}
        />
        <StatCard
          label="Đề thi đã làm"
          value={exams.length}
          hint="Lượt thi thử mô phỏng"
          icon={FileCheck2}
        />
        <StatCard
          label="Ghi chú cá nhân"
          value={notes.length}
          hint="Bản nháp & tài liệu"
          icon={FileText}
        />
      </div>

      {/* 14-day Activity Bar Chart */}
      <div className="surface p-6 space-y-4">
        <div>
          <div className="eyebrow">TẦN SUẤT HỌC TẬP</div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Hoạt động 14 ngày gần nhất (XP & Số thẻ ôn)
          </h3>
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            Mỗi phiên ôn thẻ, chơi game hoặc luyện kỹ năng đều được ghi nhận vào cột hoạt động ngày.
          </p>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="cards" fill="#7f1d1d" name="Thẻ ôn" radius={[2, 2, 0, 0]} />
              <Bar dataKey="xp" fill="#b45309" name="Điểm XP" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table: 7 Skills */}
      <div className="surface p-6 space-y-4">
        <div>
          <div className="eyebrow">CHI TIẾT 7 PHÒNG KỸ NĂNG</div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Bảng tổng hợp điểm số các kỹ năng
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="pb-2">Kỹ năng</th>
                <th className="pb-2 text-center">Số lần luyện</th>
                <th className="pb-2 text-center">Gần nhất</th>
                <th className="pb-2 text-center">Cao nhất</th>
                <th className="pb-2 text-center">Trung bình</th>
                <th className="pb-2 text-right">Chênh lệch với ban đầu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {skillSummary.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 font-heading font-semibold text-sm text-foreground">
                    {s.name}
                  </td>
                  <td className="py-3 text-center text-muted-foreground">
                    {s.count} lượt
                  </td>
                  <td className="py-3 text-center font-bold text-accent">
                    {s.recent}đ
                  </td>
                  <td className="py-3 text-center text-foreground">
                    {s.highest}đ
                  </td>
                  <td className="py-3 text-center text-foreground">
                    {s.average}đ
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`font-semibold ${
                        s.diff > 0
                          ? 'text-emerald-600'
                          : s.diff < 0
                          ? 'text-rose-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {s.diff > 0 ? `+${s.diff}đ` : `${s.diff}đ`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {focus.enabled && (
        <section aria-label="Pomodoro" className="surface p-6 space-y-4">
          <h2 className="font-display text-xl font-bold">Pomodoro · Tập trung học</h2>
          <p className="text-xs text-muted-foreground">Chỉ phiên tập trung hoàn tất được server xác nhận mới cộng phút học.</p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <label>Thời lượng (phút) <input aria-label="Thời lượng Pomodoro" type="number" min="1" max="90" value={focusMinutes} disabled={!!focus.active||focus.busy} onChange={e=>setFocusMinutes(Number(e.target.value))} className="w-20 px-2 py-1 border border-border bg-card rounded-sm" /></label>
            <select aria-label="Loại phiên Pomodoro" value={focusPhase} disabled={!!focus.active||focus.busy} onChange={e=>setFocusPhase(e.target.value)} className="px-2 py-1 border border-border bg-card rounded-sm"><option value="focus">Tập trung</option><option value="break">Nghỉ</option></select>
            <label><input type="checkbox" checked={focusSound} disabled={!!focus.active||focus.busy} onChange={e=>setFocusSound(e.target.checked)} /> Âm báo khi hoàn tất</label>
          </div>
          <output className="block text-3xl font-mono" aria-live="off">{String(Math.floor(Math.ceil(focus.remaining/1000)/60)).padStart(2,'0')}:{String(Math.ceil(focus.remaining/1000)%60).padStart(2,'0')}</output>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {!focus.active?<button type="button" disabled={!focus.ready||focus.busy||!Number.isInteger(focusMinutes)||focusMinutes<1||focusMinutes>90} onClick={()=>focus.action('start',{minutes:focusMinutes,phase:focusPhase,soundEnabled:focusSound})} className="tap px-3 py-2 rounded-sm border border-accent bg-accent text-accent-foreground disabled:opacity-50">Bắt đầu tập trung</button>:<>
              <button type="button" disabled={focus.busy} onClick={()=>focus.action(focus.active.paused?'resume':'pause')} className="tap px-3 py-2 rounded-sm border border-border bg-card">{focus.active.paused?'Tiếp tục phiên':'Tạm dừng phiên'}</button>
              <button type="button" disabled={focus.busy||focus.remaining>0} onClick={()=>focus.action('finish')} className="tap px-3 py-2 rounded-sm border border-accent bg-accent text-accent-foreground disabled:opacity-50">Hoàn tất phiên</button>
              <button type="button" disabled={focus.busy} onClick={()=>focus.action('cancel')} className="tap px-3 py-2 rounded-sm border border-border bg-card">Hủy phiên</button>
            </>}
          </div>
        </section>
      )}
    </div>
  );
}
