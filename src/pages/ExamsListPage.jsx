import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { LevelFilter } from '@/components/ui/LevelFilter';
import { ALL_EXAMS } from '@/data/all-exams';
import { FileCheck2, Clock, Award, ArrowRight, ShieldCheck, Plus } from 'lucide-react';

export function ExamsListPage() {
  const { navigate } = useRouter();
  const [profile] = useState(() => db.learnerProfile.get());
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [examResults, setExamResults] = useState(() => db.examResults.findMany());
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    const handleDbChange = () => {
      setExamResults(db.examResults.findMany());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  // Map of last result per exam ID
  const latestByExam = {};
  for (const r of examResults) {
    if (r.exam_id && !latestByExam[r.exam_id]) {
      latestByExam[r.exam_id] = r;
    }
  }

  const filteredExams = ALL_EXAMS.filter((e) => {
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
        title="Luyện 9 đề thi mô phỏng"
        deTitle="Prüfungssimulation"
        subtitle="Bộ đề chuẩn hóa quốc tế Goethe A1–C2, telc B1, ÖSD B1 và kỳ thi hội nhập DTZ B1."
        actions={
          <button
            onClick={() => setIsImportOpen(true)}
            className="tap px-3.5 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Import đề thi mới</span>
          </button>
        }
      />

      {/* Filter by Level */}
      <LevelFilter
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        includeAll={true}
      />

      {/* 9 Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExams.map((exam) => {
          const lastResult = latestByExam[exam.id];

          return (
            <div
              key={exam.id}
              className="surface p-5 flex flex-col justify-between hover:border-accent/40 transition-colors"
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
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{exam.minutes} phút</span>
                  </div>
                </div>

                <div className="eyebrow text-[9px] mb-0.5">Trình độ {exam.level}</div>
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

      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultType="exam"
      />
    </div>
  );
}
