// ====================================================================
// SPRACHMEISTERSCHAFT — PERSONALIZED ONBOARDING & ROADMAP MODAL
// Khảo sát mục tiêu ngắn gọn & kiến tạo lộ trình ôn thi cá nhân hóa
// Đáp ứng tiêu chuẩn: Tra cứu chuẩn Goethe/telc/ÖSD/TestDaF, responsive PC/Mobile,
// lưu theo tài khoản, không làm phiền khi đóng, liên kết đúng phòng luyện tập.
// ====================================================================

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  Sparkles,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  BookMarked,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import {
  OFFICIAL_EXAMS_META,
  generateStudyRoadmap,
} from '@/lib/study-plan-generator';
import { toast } from 'sonner';

export function OnboardingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1 to 5
  const user = db.auth.getUser();

  // Answers State
  const [examKey, setExamKey] = useState('telc');
  const [currentLevel, setCurrentLevel] = useState('A2');
  const [targetLevel, setTargetLevel] = useState('B1');
  const [timeFrame, setTimeFrame] = useState('1_3_months');
  const [customExamDate, setCustomExamDate] = useState('');
  const [weakSkills, setWeakSkills] = useState(['writing', 'speaking']);
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  // Generated Roadmap State
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Adjust target level if exam changes (e.g. TestDaF is B2-C1 only)
  useEffect(() => {
    const validLevels = OFFICIAL_EXAMS_META[examKey]?.validLevels || ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(targetLevel)) {
      setTargetLevel(validLevels[0]);
    }
  }, [examKey, targetLevel]);

  if (!isOpen) return null;

  const validTargetLevels = OFFICIAL_EXAMS_META[examKey]?.validLevels || ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const toggleWeakSkill = (skillId) => {
    setWeakSkills((prev) => {
      if (prev.includes(skillId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((s) => s !== skillId);
      }
      return [...prev, skillId];
    });
  };

  // Step 4 -> 5: Generate Roadmap
  const handleProceedToRoadmap = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const roadmap = generateStudyRoadmap({
        examKey,
        currentLevel,
        targetLevel,
        examDate: customExamDate,
        timeFrame,
        weakSkills,
        dailyMinutes,
        daysPerWeek,
      });
      setGeneratedRoadmap(roadmap);
      setIsGenerating(false);
      setStep(5);
    }, 400);
  };

  // Final Confirmation: Save to DB & start
  const handleConfirmPlan = () => {
    if (!generatedRoadmap) return;

    db.studyPlan.save(
      user?.id,
      {
        examKey,
        currentLevel,
        targetLevel,
        timeFrame,
        customExamDate,
        weakSkills,
        dailyMinutes,
        daysPerWeek,
      },
      generatedRoadmap
    );

    toast.success('Đã lưu thành công lộ trình học tập cá nhân hóa của bạn!');
    onClose();
  };

  // Dismiss for session ("Để sau")
  const handleDismissForNow = () => {
    db.studyPlan.dismissSession();
    toast.info('Bạn có thể hoàn tất khảo sát lộ trình ở lần đăng nhập tiếp theo.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="surface max-w-2xl w-full p-5 sm:p-8 relative border-2 border-border shadow-2xl animate-rise my-4 max-h-[92vh] flex flex-col">
        {/* Top Header & Close/Later */}
        <div className="flex items-start justify-between pb-3 border-b border-border shrink-0">
          <div>
            <div className="eyebrow flex items-center gap-1.5 text-accent mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CHÀO MỪNG ĐẾN VỚI ELIO EINFACH</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {step === 1 && '1. Bạn đang chuẩn bị cho kỳ thi nào?'}
              {step === 2 && '2. Trình độ hiện tại & Cấp độ mục tiêu?'}
              {step === 3 && '3. Bạn dự định thi vào thời gian nào?'}
              {step === 4 && '4. Kỹ năng trọng tâm & Thời gian biểu'}
              {step === 5 && '5. Lộ trình ôn tập cá nhân hóa của bạn'}
            </h2>
          </div>
          <button
            onClick={handleDismissForNow}
            className="text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
            title="Đóng khảo sát (Để sau)"
          >
            Để sau ✕
          </button>
        </div>

        {/* Progress Bar (1 to 4 or 5) */}
        <div className="py-3 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
            <span>Bước {step} / 5</span>
            <span className="font-semibold text-accent">
              {step === 1 && 'Chọn chứng chỉ'}
              {step === 2 && 'Xác định cấp độ'}
              {step === 3 && 'Kỳ hạn mục tiêu'}
              {step === 4 && 'Phân bổ thời gian'}
              {step === 5 && 'Kế hoạch hoàn chỉnh'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 py-4 pr-1">
          {/* ================= STEP 1: EXAM SELECTION ================= */}
          {step === 1 && (
            <div className="space-y-3 animate-rise">
              <p className="font-body text-xs sm:text-sm text-muted-foreground">
                Hãy chọn kỳ thi bạn hướng tới để hệ thống tự động tải cấu trúc đề thi chính thức và các dạng bài đặc trưng:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {Object.values(OFFICIAL_EXAMS_META).map((exam) => {
                  const isSelected = examKey === exam.id;
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => setExamKey(exam.id)}
                      className={`tap p-3.5 rounded-sm border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent'
                          : 'border-border bg-card hover:border-accent/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-heading font-bold text-sm text-foreground">
                            {exam.name}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
                        </div>
                        <div className="text-[10px] font-mono text-accent font-semibold mb-1">
                          {exam.org}
                        </div>
                        <p className="font-body text-xs text-muted-foreground line-clamp-2">
                          {exam.description}
                        </p>
                      </div>

                      <div className="text-[9px] font-mono text-muted-foreground mt-2 pt-2 border-t border-border/50">
                        Cấp độ: {exam.validLevels.join(', ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 2: LEVELS ================= */}
          {step === 2 && (
            <div className="space-y-5 animate-rise">
              <p className="font-body text-xs sm:text-sm text-muted-foreground">
                Đánh giá trung thực trình độ xuất phát và chứng chỉ mục tiêu bạn muốn đạt được:
              </p>

              {/* Current Level */}
              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-2">
                  Trình độ hiện tại của bạn:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['A0', 'A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => {
                    const isSelected = currentLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCurrentLevel(lvl)}
                        className={`tap py-2 px-1 text-center rounded-sm border text-xs font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                            : 'bg-card border-border hover:bg-muted text-foreground'
                        }`}
                      >
                        {lvl === 'A0' ? 'Mới học' : lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Level (Filtered by selected exam!) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-medium text-foreground">
                    Cấp độ mục tiêu ({OFFICIAL_EXAMS_META[examKey]?.name}):
                  </label>
                  <span className="text-[10px] font-mono text-accent">
                    Chỉ hiển thị các bậc hợp lệ của kỳ thi
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {validTargetLevels.map((lvl) => {
                    const isSelected = targetLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setTargetLevel(lvl)}
                        className={`tap p-3 text-center rounded-sm border transition-all ${
                          isSelected
                            ? 'bg-accent text-accent-foreground border-accent shadow-sm ring-1 ring-accent'
                            : 'bg-card border-border hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="font-display text-lg font-bold">
                          {lvl}
                        </div>
                        <div className="text-[10px] font-mono opacity-80 mt-0.5">
                          {lvl === 'A1' && 'Nhập môn cơ bản'}
                          {lvl === 'A2' && 'Giao tiếp hàng ngày'}
                          {lvl === 'B1' && 'Độc lập & B1 Visa'}
                          {lvl === 'B2' && 'Lao động & Đại học'}
                          {lvl === 'C1' && 'Học thuật chuyên sâu'}
                          {lvl === 'C2' && 'Gần như bản xứ'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gap Summary Indicator */}
              <div className="p-3 bg-muted/40 rounded-sm border border-border text-xs font-mono flex items-center justify-between">
                <span>Chặng đường bứt phá:</span>
                <span className="font-bold text-accent">
                  {currentLevel === 'A0' ? 'Mới bắt đầu' : currentLevel} ➔ {targetLevel} ({OFFICIAL_EXAMS_META[examKey]?.name})
                </span>
              </div>
            </div>
          )}

          {/* ================= STEP 3: EXAM DATE & TIMEFRAME ================= */}
          {step === 3 && (
            <div className="space-y-4 animate-rise">
              <p className="font-body text-xs sm:text-sm text-muted-foreground">
                Xác định khung thời gian để chia nhỏ các giai đoạn ôn tập và lên lịch tự động:
              </p>

              <div className="space-y-2">
                {[
                  { id: '1_month', label: 'Trong 1 tháng (~30 ngày)', desc: 'Lộ trình tăng tốc (Sprint), tập trung cao độ vào mẹo làm bài và thực chiến đề thi.' },
                  { id: '1_3_months', label: '1 đến 3 tháng (~75 ngày) — Khuyên dùng', desc: 'Khung thời gian chuẩn mực, đảm bảo đủ thời gian nạp từ vựng và luyện cả 4 kỹ năng.' },
                  { id: '3_6_months', label: '3 đến 6 tháng (~120 ngày)', desc: 'Lộ trình bền vững, xây gốc ngữ pháp bài bản và mở rộng vốn từ vựng phong phú.' },
                  { id: 'specific_date', label: 'Chọn ngày thi cụ thể qua lịch', desc: 'Bạn đã có lịch thi chính xác do viện Goethe, telc hoặc trường đại học công bố.' },
                  { id: 'undetermined', label: 'Chưa xác định ngày thi', desc: 'Lộ trình linh hoạt 60 ngày tự điều chỉnh theo nhịp độ cá nhân.' },
                ].map((opt) => {
                  const isSelected = timeFrame === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTimeFrame(opt.id)}
                      className={`tap w-full p-3 rounded-sm border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent'
                          : 'border-border bg-card hover:bg-muted'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                        isSelected ? 'border-accent bg-accent' : 'border-muted-foreground'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-heading font-semibold text-xs sm:text-sm text-foreground">
                          {opt.label}
                        </div>
                        <p className="font-body text-xs text-muted-foreground mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Specific Date Picker Input */}
              {timeFrame === 'specific_date' && (
                <div className="p-3 bg-muted/40 rounded-sm border border-border space-y-1.5 animate-rise">
                  <label className="block text-xs font-mono font-medium text-foreground">
                    Chọn ngày bạn sẽ thi:
                  </label>
                  <input
                    type="date"
                    required
                    value={customExamDate}
                    onChange={(e) => setCustomExamDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-border bg-card text-foreground"
                  />
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: WEAK SKILLS & COMMITMENT ================= */}
          {step === 4 && (
            <div className="space-y-4 animate-rise">
              <p className="font-body text-xs sm:text-sm text-muted-foreground">
                Hãy cho hệ thống biết kỹ năng nào đang làm khó bạn nhất để ưu tiên thêm thời lượng thực hành:
              </p>

              {/* Multi-select Weak Skills */}
              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-2">
                  Phần bạn cảm thấy khó nhất (Chọn một hoặc nhiều mục):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'grammar', label: 'Ngữ pháp', icon: Layers },
                    { id: 'vocabulary', label: 'Từ vựng', icon: BookMarked },
                    { id: 'reading', label: 'Đọc hiểu (Lesen)', icon: BookOpen },
                    { id: 'listening', label: 'Nghe hiểu (Hören)', icon: Headphones },
                    { id: 'writing', label: 'Viết luận (Schreiben)', icon: PenTool },
                    { id: 'speaking', label: 'Nói (Sprechen)', icon: Mic },
                  ].map((s) => {
                    const isSelected = weakSkills.includes(s.id);
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleWeakSkill(s.id)}
                        className={`tap p-2.5 rounded-sm border text-left text-xs font-mono transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-200 font-semibold ring-1 ring-rose-500'
                            : 'bg-card border-border hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Study Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-mono font-medium text-foreground mb-1.5">
                    Thời gian học mỗi ngày:
                  </label>
                  <select
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-border bg-card text-foreground"
                  >
                    <option value={15}>15 phút/ngày (Bận rộn)</option>
                    <option value={30}>30 phút/ngày (Vừa phải)</option>
                    <option value={45}>45 phút/ngày (Khuyên dùng chuẩn)</option>
                    <option value={60}>60 phút/ngày (Tập trung)</option>
                    <option value={90}>90 phút/ngày (Tăng tốc tối đa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-foreground mb-1.5">
                    Số ngày học mỗi tuần:
                  </label>
                  <select
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-border bg-card text-foreground"
                  >
                    <option value={3}>3 ngày/tuần (Thong thả)</option>
                    <option value={4}>4 ngày/tuần</option>
                    <option value={5}>5 ngày/tuần (Thứ 2 đến Thứ 6)</option>
                    <option value={6}>6 ngày/tuần</option>
                    <option value={7}>7 ngày/tuần (Học đều mỗi ngày)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: ROADMAP PREVIEW & CONFIRMATION ================= */}
          {step === 5 && generatedRoadmap && (
            <div className="space-y-4 animate-rise text-xs font-mono">
              {/* Meta Card */}
              <div className="p-3.5 bg-accent/10 border border-accent/30 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-accent text-sm">
                    {generatedRoadmap.meta.examName} — Trình độ {generatedRoadmap.meta.targetLevel}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-accent text-accent-foreground font-bold">
                    {generatedRoadmap.meta.totalDays} Ngày
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-accent/20">
                  <div>Ngày thi dự kiến: <strong className="text-foreground">{generatedRoadmap.meta.targetDate}</strong></div>
                  <div>Cường độ: <strong className="text-foreground">{generatedRoadmap.meta.dailyMinutes} phút/ngày</strong></div>
                  <div>Tổng giờ học: <strong className="text-foreground">~{generatedRoadmap.meta.totalEstimatedHours} giờ</strong></div>
                </div>
              </div>

              {/* 4 Phases Timeline */}
              <div className="space-y-2">
                <div className="font-bold text-foreground text-xs uppercase tracking-wider">
                  4 Giai đoạn chiến lược:
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {generatedRoadmap.phases.map((p) => (
                    <div key={p.index} className="p-2.5 bg-muted/40 border border-border rounded-sm space-y-1">
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>{p.name}</span>
                        <span className="text-accent">{p.durationDays} ngày</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-body">
                        {p.focus}
                      </p>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                        🎯 Cột mốc: {p.milestone}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Source & Disclaimer */}
              <div className="p-3 bg-card border border-border rounded-sm space-y-1.5 text-[11px] text-muted-foreground font-body">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Nguồn tham khảo khảo thí chính thức:</span>
                </div>
                <p className="italic">
                  {generatedRoadmap.meta.referenceSource}
                </p>
                <p className="pt-1 border-t border-border/50 text-[10px]">
                  ⚠️ <strong>Lưu ý học thuật:</strong> {generatedRoadmap.meta.disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-3 shrink-0">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="tap px-3.5 py-1.5 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted text-foreground flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          )}

          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep((prev) => prev + 1)}
              className="tap ml-auto px-5 py-1.5 text-xs font-mono font-semibold rounded-sm bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-1.5 shadow-sm"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleProceedToRoadmap}
              className="tap ml-auto px-5 py-1.5 text-xs font-mono font-semibold rounded-sm bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-1.5 shadow-sm"
            >
              <span>{isGenerating ? 'Đang phân tích dữ liệu...' : 'Kiến tạo lộ trình'}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={handleConfirmPlan}
              className="tap ml-auto px-6 py-2 text-xs font-mono font-bold rounded-sm bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Bắt đầu hành trình học ngay</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
