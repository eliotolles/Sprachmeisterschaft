import React, { useState } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { LEVEL_IDS, LEVELS } from '@/data/levels';
import { getStoredAiKey, setStoredAiKey } from '@/lib/elio-ai';
import { Save, RotateCcw, Key, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const { navigate } = useRouter();
  const [profile, setProfile] = useState(() => db.learnerProfile.get());

  const [displayName, setDisplayName] = useState(profile.display_name || 'Nguyễn Văn Đạt');
  const [targetLevel, setTargetLevel] = useState(profile.target_level || 'B1');
  const [examDate, setExamDate] = useState(profile.exam_date || '');
  const [dailyGoal, setDailyGoal] = useState(profile.daily_goal || 20);
  const [aiKey, setAiKey] = useState(getStoredAiKey());

  const handleSave = (e) => {
    e.preventDefault();
    const updated = db.learnerProfile.update({
      display_name: displayName.trim(),
      target_level: targetLevel,
      exam_date: examDate,
      daily_goal: Number(dailyGoal) || 20,
    });
    setStoredAiKey(aiKey);
    setProfile(updated);
    toast.success('Đã lưu cài đặt! Trình độ mục tiêu mới đã áp dụng toàn app.');
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại cơ sở dữ liệu về mặc định ban đầu không?')) {
      localStorage.removeItem('sprachmeisterschaft_db_v1');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-rise">
      <PageHeader
        eyebrow="TÙY CHỈNH HỆ THỐNG"
        title="Cài đặt học tập"
        deTitle="Einstellungen"
        subtitle="Cấu hình trình độ mục tiêu áp dụng toàn diện cho từ vựng, ngữ pháp, đề thi và AI."
        actions={
          <button
            onClick={() => navigate('/me')}
            className="tap px-3 py-1.5 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted"
          >
            ← Về trang cá nhân
          </button>
        }
      />

      <form onSubmit={handleSave} className="surface p-6 md:p-8 space-y-6">
        {/* Display name */}
        <div>
          <label className="block text-xs font-mono font-medium text-foreground mb-1">
            Họ và tên hiển thị
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-heading"
          />
        </div>

        {/* Target Level A1-C2 (Core requirement) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-mono font-medium text-foreground">
              Trình độ mục tiêu (CEFR) *
            </label>
            <span className="text-[11px] font-mono text-accent">
              Áp dụng cho Từ vựng, Ngữ pháp, Đề thi & AI
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {LEVELS.map((lvl) => {
              const isSelected = targetLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setTargetLevel(lvl.id)}
                  className={`tap p-3 rounded-sm border text-left transition-all ${
                    isSelected
                      ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                      : 'bg-card border-border hover:border-accent/40 text-foreground'
                  }`}
                >
                  <div className="font-mono font-bold text-base">
                    {lvl.id}
                  </div>
                  <div className="text-xs font-heading font-medium mt-0.5">
                    {lvl.de}
                  </div>
                  <div className={`text-[10px] font-mono mt-1 ${isSelected ? 'text-accent-foreground/80' : 'text-muted-foreground'}`}>
                    Mục tiêu: {lvl.vocabTarget} từ
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam date countdown */}
        <div>
          <label className="block text-xs font-mono font-medium text-foreground mb-1">
            Ngày dự kiến thi chứng chỉ (D-xx Countdown)
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
          />
        </div>

        {/* Daily card goal */}
        <div>
          <label className="block text-xs font-mono font-medium text-foreground mb-1">
            Mục tiêu thẻ từ ôn mỗi ngày (Mặc định: 20)
          </label>
          <input
            type="number"
            min="5"
            max="100"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
          />
        </div>

        {/* Optional AI Key */}
        <div className="pt-2 border-t border-border">
          <label className="block text-xs font-mono font-medium text-foreground mb-1 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-accent" />
            <span>Khóa API LLM tùy chọn (Gemini / OpenAI API Key)</span>
          </label>
          <input
            type="password"
            value={aiKey}
            onChange={(e) => setAiKey(e.target.value)}
            placeholder="Không bắt buộc — Mặc định dùng engine gia sư tiếng Đức tích hợp sẵn"
            className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground font-mono"
          />
          <p className="text-[11px] font-body text-muted-foreground mt-1">
            Nếu để trống, ELIO sẽ vận hành hoàn toàn độc lập bằng engine mô phỏng chuyên sâu chuẩn xác.
          </p>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetData}
            className="tap px-3 py-2 text-xs font-mono text-rose-600 hover:text-rose-700 hover:underline"
          >
            Đặt lại dữ liệu gốc
          </button>

          <button
            type="submit"
            className="tap px-6 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-xs font-mono rounded-sm border border-accent/40 shadow-sm inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Lưu tất cả thay đổi</span>
          </button>
        </div>
      </form>
    </div>
  );
}
