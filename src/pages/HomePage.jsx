import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import {progressCoreActive} from '@/lib/elio-progress-runtime';
import {progressStreak} from '@/core/elio/progress-binding';
import {useCoreProgress} from '@/lib/use-core-progress';
import { useRouter, Link } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { computeReadiness, calculateStreak, formatDate, addDays } from '@/lib/algorithms';
import { WORDS, STARTER_TOPICS } from '@/data/vocabulary';
import {
  RotateCw,
  Flame,
  Calendar,
  CheckCircle2,
  Sparkles,
  FileCheck2,
  Bot,
  ArrowRight,
  BookMarked,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export function HomePage() {
  const coreActive=progressCoreActive();
  const { navigate } = useRouter();
  const [profile, setProfile] = useState(() => db.learnerProfile.get());
  const [cards, setCards] = useState(() => coreActive?(db.vocabulary.isCore?.()?db.vocabulary.findMany():[]):db.vocabulary.findMany());
  const [logs, setLogs] = useState(() => coreActive?[]:db.studyLogs.findMany());
  const [sessions, setSessions] = useState(() => coreActive?[]:db.skillSessions.findMany());
  const [exams, setExams] = useState(() => coreActive?[]:db.examResults.findMany());
  const [studyPlan, setStudyPlan] = useState(() => db.studyPlan?.get());

  useCoreProgress(db,{cards:setCards,logs:setLogs,sessions:setSessions,exams:setExams});

  useEffect(() => {
    const handleDbChange = () => {
      setProfile(db.learnerProfile.get());
      if(progressCoreActive()){setCards(db.vocabulary.isCore?.()?db.vocabulary.findMany():[]);return;}
      setCards(db.vocabulary.findMany());
      setLogs(db.studyLogs.findMany());
      setSessions(db.skillSessions.findMany());
      setExams(db.examResults.findMany());
      setStudyPlan(db.studyPlan?.get());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    window.addEventListener('sprach_auth_change', handleDbChange);
    return () => {
      window.removeEventListener('sprach_db_change', handleDbChange);
      window.removeEventListener('sprach_auth_change', handleDbChange);
    };
  }, []);

  // Time-based German greeting
  const hour = new Date().getHours();
  let greeting = 'Guten Tag';
  let greetingVi = 'Chào buổi trưa';
  if (hour < 11) {
    greeting = 'Guten Morgen';
    greetingVi = 'Chào buổi sáng';
  } else if (hour >= 18) {
    greeting = 'Guten Abend';
    greetingVi = 'Chào buổi tối';
  }

  // Due cards today
  const today = formatDate();
  const dueCards = cards.filter((c) => !c.due_date || c.due_date <= today);

  // Streak
  const streak = coreActive?progressStreak(logs,today):calculateStreak(logs);

  // Exam Countdown (D-xx)
  const examDate = profile.exam_date ? new Date(profile.exam_date) : new Date(Date.now() + 45 * 86400000);
  const diffDays = Math.max(0, Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)));

  // Readiness
  const readiness = computeReadiness(cards, sessions, exams, profile.target_level || 'B1');

  // Starter Deck loader if empty
  const handleLoadStarterDeck = () => {
    const starterWords = WORDS.filter((w) => STARTER_TOPICS.includes(w.topic)).slice(0, 30);
    const added = db.vocabulary.createMany(starterWords);
    db.studyLogs.recordActivity({ newWords: added.length });
    toast.success(`Đã nạp thành công ${added.length} từ vựng mẫu vào bộ thẻ của bạn!`);
  };

  return (
    <div className="space-y-8 animate-rise">
      {/* Header */}
      <PageHeader
        eyebrow="TỔNG QUAN HỌC TẬP"
        title={`${greeting}, ${profile.display_name || 'Học viên'}!`}
        deTitle="Heute"
        subtitle={`Kế hoạch ôn tập và mục tiêu chứng chỉ ${profile.target_level || 'B1'} của bạn hôm nay.`}
        actions={
          <Link
            to="/review"
            className="tap px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm inline-flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            <span>Ôn {dueCards.length} thẻ đến hạn</span>
          </Link>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Thẻ đến hạn hôm nay"
          value={dueCards.length}
          hint={dueCards.length > 0 ? 'Cần ôn tập để giữ trí nhớ SM-2' : 'Đã hoàn thành hết thẻ hôm nay!'}
          icon={RotateCw}
          badge={dueCards.length > 0 ? 'Cần ôn' : 'Xong'}
        />
        <StatCard
          label="Chuỗi học liên tiếp"
          value={`${streak} ngày`}
          hint="Học đều đặn mỗi ngày để duy trì streak"
          icon={Flame}
          badge="Streak"
        />
        <StatCard
          label="Đếm ngược ngày thi"
          value={`D-${diffDays}`}
          hint={`Kỳ thi mục tiêu ${profile.target_level || 'B1'}`}
          icon={Calendar}
          badge={profile.target_level || 'B1'}
        />
        <StatCard
          label="Tổng từ trong bộ thẻ"
          value={cards.length}
          hint={`${readiness.vocab.mastered} từ đã thuộc vững`}
          icon={BookMarked}
          badge={`${readiness.vocab.learned} đã học`}
        />
      </div>

      {/* Main Banner: Readiness + 4 Daily Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Card */}
        <div className="surface p-6 flex flex-col justify-between">
          <div>
            <div className="eyebrow mb-1">Chỉ số sẵn sàng thi</div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Prüfungsreife
            </h2>
            <p className="font-body text-xs text-muted-foreground mt-1 mb-4">
              Đo lường tổng hợp từ 3 trụ cột: Vốn từ ({readiness.vocab.score}%), Kỹ năng ({readiness.skills.score}%), Đề thi ({readiness.exams.score}%).
            </p>
          </div>

          <div className="flex flex-col items-center justify-center my-3">
            <ProgressRing progress={readiness.total} size={130} strokeWidth={10} label="Sẵn sàng" />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="font-mono text-muted-foreground">Mục tiêu: {profile.target_level || 'B1'}</span>
            <Link to="/readiness" className="font-mono text-accent hover:underline inline-flex items-center gap-1">
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 4 Daily Tasks */}
        <div className="surface p-6 lg:col-span-2 flex flex-col justify-between">
          {studyPlan && Array.isArray(studyPlan.dailyTasks) && studyPlan.dailyTasks.length > 0 ? (
            (() => {
              const todayStr = formatDate();
              const planTasksForToday = studyPlan.dailyTasks.filter((t) => t.date === todayStr && !t.isRestDay);
              const activeRoadmapTasks = planTasksForToday.length > 0
                ? planTasksForToday
                : studyPlan.dailyTasks.filter((t) => !t.completed && !t.isRestDay).slice(0, 4);

              const missedCount = studyPlan.dailyTasks.filter(
                (t) => !t.completed && !t.isRestDay && t.date < todayStr
              ).length;

              const handleTogglePlanTask = (taskId, e) => {
                e.preventDefault();
                e.stopPropagation();
                db.studyPlan.toggleTask(taskId);
              };

              const handleReschedulePlan = () => {
                const updated = db.studyPlan.reschedule();
                if (updated) {
                  toast.success('Đã điều chỉnh dồn lịch học thông minh sang các ngày tiếp theo!');
                }
              };

              return (
                <>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <div className="eyebrow">
                        Lộ trình {studyPlan.meta?.examName || 'Chứng chỉ'} ({studyPlan.meta?.targetLevel || profile.target_level})
                      </div>
                      {missedCount > 0 && (
                        <button
                          type="button"
                          onClick={handleReschedulePlan}
                          className="tap text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded flex items-center gap-1.5"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Có {missedCount} bài lỡ hẹn • Điều chỉnh dồn lịch</span>
                        </button>
                      )}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      Nhiệm vụ trọng tâm hôm nay
                    </h2>
                    <p className="font-body text-xs text-muted-foreground mt-1 mb-4">
                      Theo lộ trình cá nhân hóa ({studyPlan.meta?.dailyMinutes || 45} phút/ngày). Đánh dấu hoàn thành để cập nhật tiến độ.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                    {activeRoadmapTasks.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className={`p-3.5 rounded-sm border transition-all flex items-start gap-3 justify-between ${
                          t.completed
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-border bg-card/60 hover:bg-muted/30'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleTogglePlanTask(t.id, e)}
                          className="mt-0.5 shrink-0 text-muted-foreground hover:text-emerald-600 transition-colors"
                          title={t.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
                        >
                          {t.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/60 hover:border-accent" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono mb-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-accent/10 text-accent font-bold uppercase">
                              {t.skill}
                            </span>
                            <span className="text-muted-foreground">{t.durationMinutes} phút</span>
                          </div>
                          <div
                            className={`text-xs font-heading font-semibold line-clamp-2 ${
                              t.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {t.title}
                          </div>
                        </div>

                        <Link
                          to={t.targetPath || '/skills'}
                          className="shrink-0 p-1.5 text-xs font-mono text-accent hover:underline rounded hover:bg-accent/10 transition-colors"
                          title="Vào phòng luyện tập tương ứng"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>
                      Đã hoàn thành {activeRoadmapTasks.filter((t) => t.completed).length}/
                      {activeRoadmapTasks.length} nhiệm vụ
                    </span>
                    <Link to="/readiness" className="text-accent hover:underline">
                      Đo lường độ sẵn sàng thi →
                    </Link>
                  </div>
                </>
              );
            })()
          ) : (
            <>
              <div>
                <div className="eyebrow mb-1">Kế hoạch hàng ngày</div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  4 Nhiệm vụ học tập hôm nay
                </h2>
                <p className="font-body text-xs text-muted-foreground mt-1 mb-4">
                  Hoàn thành các hoạt động để cộng điểm kinh nghiệm (XP) và duy trì chuỗi học.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                {/* Task 1 */}
                <Link
                  to="/review"
                  className="tap p-3.5 rounded-sm border border-border bg-card/60 hover:bg-muted/40 transition-colors flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-semibold text-foreground">
                      1. Ôn thẻ từ vựng SRS
                    </div>
                    <div className="text-[11px] text-muted-foreground font-body">
                      {dueCards.length > 0 ? `Còn ${dueCards.length} thẻ đến hạn` : 'Đã hoàn thành!'}
                    </div>
                  </div>
                </Link>

                {/* Task 2 */}
                <Link
                  to="/skills"
                  className="tap p-3.5 rounded-sm border border-border bg-card/60 hover:bg-muted/40 transition-colors flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-sm bg-blue-100 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-semibold text-foreground">
                      2. Luyện 1 kỹ năng ngôn ngữ
                    </div>
                    <div className="text-[11px] text-muted-foreground font-body">
                      Nghe chính tả, nói đuổi, ngữ pháp...
                    </div>
                  </div>
                </Link>

                {/* Task 3 */}
                <Link
                  to="/game"
                  className="tap p-3.5 rounded-sm border border-border bg-card/60 hover:bg-muted/40 transition-colors flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-sm bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-semibold text-foreground">
                      3. Phản xạ mạo từ Der/Die/Das
                    </div>
                    <div className="text-[11px] text-muted-foreground font-body">
                      Chơi 1 vòng 15 câu nhận ngay XP
                    </div>
                  </div>
                </Link>

                {/* Task 4 */}
                <Link
                  to="/elio"
                  className="tap p-3.5 rounded-sm border border-border bg-card/60 hover:bg-muted/40 transition-colors flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-sm bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-semibold text-foreground">
                      4. Hỏi gia sư AI ELIO
                    </div>
                    <div className="text-[11px] text-muted-foreground font-body">
                      Giải đáp thắc mắc ngữ pháp & bài thi
                    </div>
                  </div>
                </Link>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>Mỗi nhiệm vụ cộng dồn vào StudyLog trong ngày</span>
                <Link to="/progress" className="text-accent hover:underline">
                  Xem tiến độ tuần →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Starter Deck Card (If deck empty) */}
      {cards.length === 0 && (
        <div className="surface p-6 border-accent/40 bg-accent/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Bộ thẻ của bạn đang trống!
                </h3>
                <p className="font-body text-xs md:text-sm text-muted-foreground mt-0.5">
                  Nạp ngay 30 từ vựng cơ bản thông dụng nhất (Đời sống, Ẩm thực, Nhà ở) để bắt đầu phiên ôn thẻ SRS đầu tiên.
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadStarterDeck}
              className="tap px-5 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm rounded-sm border border-accent/40 shadow-sm shrink-0 inline-flex items-center gap-2"
            >
              <BookMarked className="w-4 h-4" />
              <span>Nạp bộ thẻ mẫu StarterDeck</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Tutor ELIO Introduction Banner */}
      <div className="surface p-6 bg-card/60">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-1 md:mt-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="eyebrow mb-0.5">GIA SƯ AI RIÊNG</div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Trợ lý ngôn ngữ ELIO
              </h3>
              <p className="font-body text-xs md:text-sm text-muted-foreground max-w-2xl mt-0.5">
                ELIO đồng hành cùng bạn 24/7: sửa lỗi ngữ pháp, chấm bài viết luận theo 4 tiêu chí chuẩn thi, đóng vai giám khảo phỏng vấn thi nói và đưa ra lộ trình ôn tập tuần.
              </p>
            </div>
          </div>
          <Link
            to="/elio"
            className="tap px-4 py-2 border border-border bg-card hover:bg-muted text-foreground text-xs font-mono font-medium rounded-sm inline-flex items-center gap-2 shrink-0"
          >
            <span>Trò chuyện với ELIO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
