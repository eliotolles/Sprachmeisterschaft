import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { LevelFilter } from '@/components/ui/LevelFilter';
import { getAllExams } from '@/data/all-exams';
import {
  FileCheck2,
  Clock,
  Award,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { showConfirmModal } from '@/components/ui/ConfirmModal';

export function ExamsListPage() {
  const { navigate } = useRouter();
  const isAdmin = db.auth.isAdmin();
  const [profile] = useState(() => db.learnerProfile.get());
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [examResults, setExamResults] = useState(() => db.examResults.findMany());
  const [allExamsList, setAllExamsList] = useState(() => getAllExams());
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  useEffect(() => {
    const handleDbChange = () => {
      setExamResults(db.examResults.findMany());
      setAllExamsList(getAllExams());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  const handleDeleteExam = async (examId, examTitle) => {
    const ok = await showConfirmModal({
      title: 'Xóa đề thi',
      message: `Bạn có chắc chắn muốn xóa đề thi "${examTitle}" không?`,
      confirmText: 'Xóa đề thi',
      variant: 'danger',
    });
    if (ok) {
      db.exams.delete(examId);
      setAllExamsList(getAllExams());
      toast.success(`Đã xóa đề thi: "${examTitle}"!`);
    }
  };

  const handleResetExams = async () => {
    const ok = await showConfirmModal({
      title: 'Khôi phục đề thi gốc',
      message: 'Khôi phục lại toàn bộ danh mục đề thi mặc định gốc của hệ thống?',
      confirmText: 'Khôi phục đề gốc',
      variant: 'warning',
    });
    if (ok) {
      db.exams.resetDefaults();
      setAllExamsList(getAllExams());
      toast.success('Đã khôi phục danh mục đề thi gốc!');
    }
  };

  const handleSaveExamEdit = (e) => {
    e.preventDefault();
    if (!editingExam) return;
    db.exams.update(editingExam.id, {
      title: editingExam.title,
      provider: editingExam.provider,
      level: editingExam.level,
      minutes: Number(editingExam.minutes) || 90,
    });
    setAllExamsList(getAllExams());
    setEditingExam(null);
    toast.success('Đã cập nhật thông tin đề thi thành công!');
  };

  // Map of last result per exam ID
  const latestByExam = {};
  for (const r of examResults) {
    if (r.exam_id && !latestByExam[r.exam_id]) {
      latestByExam[r.exam_id] = r;
    }
  }

  const filteredExams = allExamsList.filter((e) => {
    if (selectedLevel !== 'ALL' && e.level !== selectedLevel) return false;
    return true;
  });

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'Goethe':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800';
      case 'telc':
        return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800';
      case 'ÖSD':
        return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800';
      case 'DTZ':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="CHUẨN KHẢO THÍ CHÂU ÂU (GER / CEFR)"
        title={allExamsList.length > 0 ? `Luyện ${allExamsList.length} đề thi mô phỏng` : 'Luyện đề thi mô phỏng'}
        deTitle="Prüfungssimulation"
        subtitle="Bộ đề chuẩn hóa quốc tế Goethe A1–C2, telc B1, ÖSD B1 và kỳ thi hội nhập DTZ B1."
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && allExamsList.length > 0 && (
              <button
                onClick={handleResetExams}
                className="tap px-2.5 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-foreground font-mono text-xs flex items-center gap-1.5"
                title="Khôi phục các đề mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục gốc</span>
              </button>
            )}
            <button
              onClick={() => setIsImportOpen(true)}
              className="tap px-3.5 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Import đề thi mới</span>
            </button>
          </div>
        }
      />

      {/* Filter by Level */}
      <LevelFilter
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        includeAll={true}
      />

      {/* Exams Grid or Empty State */}
      {filteredExams.length === 0 ? (
        <div className="surface p-8 sm:p-10 border border-border rounded-sm text-center space-y-4 max-w-xl mx-auto animate-rise">
          <div className="w-14 h-14 rounded-full bg-accent/10 border-2 border-accent/30 text-accent flex items-center justify-center mx-auto">
            <FileCheck2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display text-xl font-bold text-foreground">
              {allExamsList.length === 0
                ? 'Kho đề thi hiện đang trống'
                : `Không có đề thi nào ở cấp độ ${selectedLevel}`}
            </h3>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">
              {allExamsList.length === 0
                ? 'Toàn bộ dữ liệu đề thi mẫu đã được xóa sạch theo yêu cầu quản trị. Số lượng đề sẽ tự động nhảy số tăng lên ngay khi bạn Import bộ đề mới (PDF, DOCX, TXT hoặc JSON).'
                : 'Hãy thử chọn "Tất cả cấp độ" hoặc Import thêm đề thi cho cấp độ này.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="tap px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold rounded-sm inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Import đề thi mới ngay</span>
            </button>
            {selectedLevel !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedLevel('ALL')}
                className="tap px-3.5 py-2 border border-border bg-card hover:bg-muted text-xs font-mono rounded-sm"
              >
                Xem tất cả cấp độ
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => {
            const lastResult = latestByExam[exam.id];

            return (
              <div
                key={exam.id}
                className="surface p-5 flex flex-col justify-between hover:border-accent/40 transition-colors relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-sm border uppercase ${getProviderBadge(
                        exam.provider
                      )}`}
                    >
                      {exam.provider}
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{exam.minutes}p</span>
                      </div>

                      {/* Admin Action Buttons on Exam Card */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 pl-2 border-l border-border">
                          <button
                            type="button"
                            onClick={() => setEditingExam({ ...exam })}
                            className="tap p-1 rounded hover:bg-muted text-muted-foreground hover:text-accent transition-colors"
                            title="Sửa thông số đề thi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            className="tap p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                            title="Xóa đề thi này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="eyebrow text-[9px] mb-0.5 flex items-center gap-1.5">
                    <span>Trình độ {exam.level}</span>
                    {exam.isImported && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-bold lowercase">
                        import
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {exam.title}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                    {exam.intro || exam.description}
                  </p>

                  {lastResult && (
                    <div className="mt-3 p-2 rounded-sm bg-accent/5 border border-accent/20 flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Lần làm gần nhất:</span>
                      <span className="font-bold text-accent">
                        {lastResult.total}đ ({lastResult.passed ? 'Bestanden' : 'Chưa đạt'})
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    4 Kỹ năng (Đọc, Nghe, Viết, Nói)
                  </span>
                  <Link
                    to={`/exams/${exam.id}`}
                    className="tap px-3.5 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 inline-flex items-center gap-1"
                  >
                    <span>Làm đề</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Edit Exam Modal */}
      {isAdmin && editingExam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-md w-full p-6 border-2 border-border shadow-2xl space-y-4 animate-rise">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display text-lg font-bold text-foreground">
                Chỉnh sửa đề thi (Admin)
              </h3>
              <button
                onClick={() => setEditingExam(null)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExamEdit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Tên đề thi *</label>
                <input
                  type="text"
                  required
                  value={editingExam.title}
                  onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Kỳ thi / Đơn vị *</label>
                  <select
                    value={editingExam.provider}
                    onChange={(e) => setEditingExam({ ...editingExam, provider: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-border bg-card text-foreground"
                  >
                    <option value="Goethe">Goethe</option>
                    <option value="telc">telc</option>
                    <option value="ÖSD">ÖSD</option>
                    <option value="TestDaF">TestDaF</option>
                    <option value="DTZ">DTZ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Cấp độ (CEFR) *</label>
                  <select
                    value={editingExam.level}
                    onChange={(e) => setEditingExam({ ...editingExam, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-border bg-card text-foreground font-bold text-accent"
                  >
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Thời gian làm bài (Phút) *</label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  required
                  value={editingExam.minutes}
                  onChange={(e) => setEditingExam({ ...editingExam, minutes: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-sm bg-accent text-accent-foreground font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultType="exam"
      />
    </div>
  );
}

