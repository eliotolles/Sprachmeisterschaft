import React, { useState } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { LEVEL_IDS, LEVELS } from '@/data/levels';
import { getStoredAiKey, setStoredAiKey } from '@/lib/elio-ai';
import {
  getTursoConfig,
  saveTursoConfig,
  testTursoConnection,
  migrateTursoSchema,
  syncLocalToTurso,
} from '@/lib/turso';
import {
  Save,
  RotateCcw,
  Key,
  Sparkles,
  AlertCircle,
  Database,
  CheckCircle2,
  Cloud,
  CloudUpload,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { showConfirmModal } from '@/components/ui/ConfirmModal';

export function SettingsPage() {
  const { navigate } = useRouter();
  const [profile, setProfile] = useState(() => db.learnerProfile.get());

  const [displayName, setDisplayName] = useState(profile.display_name || 'Nguyễn Văn Đạt');
  const [targetLevel, setTargetLevel] = useState(profile.target_level || 'B1');
  const [examDate, setExamDate] = useState(profile.exam_date || '');
  const [dailyGoal, setDailyGoal] = useState(profile.daily_goal || 20);
  const [aiKey, setAiKey] = useState(getStoredAiKey());

  // Turso state
  const [tursoConfig, setTursoConfigState] = useState(getTursoConfig);
  const [tursoStatus, setTursoStatus] = useState(null);
  const [isTestingTurso, setIsTestingTurso] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTestTurso = async () => {
    setIsTestingTurso(true);
    setTursoStatus(null);
    saveTursoConfig(tursoConfig);
    const res = await testTursoConnection();
    setIsTestingTurso(false);
    setTursoStatus(res);
    if (res.ok) {
      toast.success(`Kết nối Turso thành công (${res.latencyMs}ms)! Tìm thấy ${res.tablesCount} bảng.`);
    } else {
      toast.error(`Kết nối thất bại: ${res.error}`);
    }
  };

  const handleMigrateTurso = async () => {
    setIsMigrating(true);
    try {
      saveTursoConfig(tursoConfig);
      await migrateTursoSchema();
      toast.success('Đã khởi tạo thành công 7 bảng dữ liệu trên Turso!');
      handleTestTurso();
    } catch (e) {
      toast.error('Lỗi khởi tạo bảng: ' + e.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSyncToTurso = async () => {
    setIsSyncing(true);
    try {
      saveTursoConfig(tursoConfig);
      const state = {
        vocabularyCards: db.vocabulary.findMany(),
        studyLogs: db.studyLogs.findMany(),
        learnerProfile: profile,
      };
      const res = await syncLocalToTurso(state);
      toast.success(`Đồng bộ thành công! ${res.cards} thẻ từ vựng & ${res.logs} nhật ký đã đẩy lên Turso.`);
    } catch (e) {
      toast.error('Lỗi đồng bộ: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

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

  const handleResetData = async () => {
    const ok = await showConfirmModal({
      title: 'Đặt lại cơ sở dữ liệu',
      message: 'Bạn có chắc chắn muốn đặt lại cơ sở dữ liệu về mặc định ban đầu không? Toàn bộ dữ liệu luyện tập cục bộ sẽ được nạp lại từ đầu.',
      confirmText: 'Đặt lại toàn bộ',
      variant: 'danger',
    });
    if (ok) {
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

        {/* TURSO EDGE DATABASE CONNECTION */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" />
              <span className="font-display text-sm font-bold text-foreground">
                Cơ sở dữ liệu đám mây Turso (libSQL Edge)
              </span>
            </div>

            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border ${
                tursoStatus?.ok
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {tursoStatus?.ok ? `Đã kết nối (${tursoStatus.latencyMs}ms)` : 'Chưa kết nối Cloud'}
            </span>
          </div>

          <p className="text-xs font-body text-muted-foreground">
            Kết nối Turso để lưu trữ 7 bảng dữ liệu (thẻ từ vựng SRS, nhật ký học, kết quả 9 đề thi, ghi chú)
            đồng bộ tức thì trên toàn cầu khi xuất bản lên Cloudflare Pages.
          </p>

          <div className="space-y-3 p-4 rounded-sm bg-muted/30 border border-border">
            <div>
              <label className="block text-[11px] font-mono text-foreground mb-1">
                Turso Database URL (Ví dụ: <code>libsql://db-name-org.turso.io</code>)
              </label>
              <input
                type="text"
                value={tursoConfig.url}
                onChange={(e) =>
                  setTursoConfigState({ ...tursoConfig, url: e.target.value.trim() })
                }
                placeholder="libsql://sprachmeisterschaft-yourname.turso.io"
                className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-foreground mb-1">
                Turso Auth Token
              </label>
              <input
                type="password"
                value={tursoConfig.authToken}
                onChange={(e) =>
                  setTursoConfigState({ ...tursoConfig, authToken: e.target.value.trim() })
                }
                placeholder="eyJh..."
                className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
              />
            </div>

            {/* Turso Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestTurso}
                disabled={isTestingTurso || !tursoConfig.url}
                className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingTurso ? 'animate-spin' : ''}`} />
                <span>{isTestingTurso ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
              </button>

              <button
                type="button"
                onClick={handleMigrateTurso}
                disabled={isMigrating || !tursoConfig.url}
                className="tap px-3 py-1.5 rounded-sm border border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent text-xs font-mono font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isMigrating ? 'Đang tạo bảng...' : 'Khởi tạo 7 bảng (Migrate)'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToTurso}
                disabled={isSyncing || !tursoConfig.url}
                className="tap px-3 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ thẻ lên Turso'}</span>
              </button>
            </div>
          </div>
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
