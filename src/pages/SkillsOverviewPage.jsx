import {ExamCategoryNav,useExamCategory} from '@/components/common/ExamCategoryNav';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { SKILLS } from '@/data/skills';
import {
  Compass,
  Headphones,
  Mic,
  BookOpen,
  PenTool,
  Volume2,
  FileText,
  Users,
  Gamepad2,
  ArrowRight,
  Sparkles,
  Clock,
  Award,
  Plus,
} from 'lucide-react';

const ICON_MAP = {
  Compass,
  Headphones,
  Mic,
  BookOpen,
  PenTool,
  Volume2,
  FileText,
  Users,
  Gamepad2,
};

export function SkillsOverviewPage() {
  const { navigate } = useRouter();
  const [category,setCategory]=useExamCategory();
  const [sessions, setSessions] = useState(() => db.skillSessions.findMany());
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    const handleDbChange = () => {
      setSessions(db.skillSessions.findMany());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  // Compute latest score for each skill
  const latestBySkill = {};
  for (const s of sessions) {
    if (s.skill && !latestBySkill[s.skill]) {
      latestBySkill[s.skill] = s;
    }
  }

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="PHÒNG LUYỆN TOÀN DIỆN"
        title="Các phòng kỹ năng ngôn ngữ"
        deTitle="Fertigkeiten"
        subtitle="Rèn giũa phản xạ từ nghe, nói, đọc, viết đến phát âm và phỏng vấn mô phỏng."
        actions={
          <button
            onClick={() => setIsImportOpen(true)}
            className="tap px-3.5 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Import bài luyện mới</span>
          </button>
        }
      />

      <ExamCategoryNav value={category} onChange={setCategory}/>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...SKILLS,{id:'explore',icon:'Compass',de:'Lernen & Entdecken',vi:'Học & khám phá',tagline:'Hiểu cách dùng tiếng Đức trong đời sống.',desc:'Cấu trúc câu, phát âm, giao tiếp, văn hóa và tiếng Đức nâng cao.'}].map((skill) => {
          const Icon = ICON_MAP[skill.icon] || Sparkles;
          const lastSession = latestBySkill[skill.id];
          const isGame = skill.id === 'game';
          const linkPath = skill.id==='explore'?'/explore':isGame
            ? '/game'
            : skill.id === 'listening'
            ? '/skills/listening'
            : `/skills/${skill.id}`;

          return (
            <div
              key={skill.id}
              className="surface p-5 flex flex-col justify-between hover:border-accent/40 transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  {lastSession ? (
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-accent inline-flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Gần nhất: {lastSession.score}đ
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Chưa luyện
                    </span>
                  )}
                </div>

                <div className="eyebrow text-[9px] mb-0.5">
                  {skill.de}
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {skill.vi}
                </h3>
                <p className="font-heading italic text-xs text-accent mt-0.5 mb-2 font-medium">
                  "{skill.tagline}"
                </p>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                  {skill.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {lastSession ? `Lần cuối: ${lastSession.date}` : 'Mới'}
                </span>
                <Link
                  to={linkPath+(isGame?'':'?exam='+encodeURIComponent(category))}
                  className="tap px-3 py-1.5 bg-accent/10 hover:bg-accent text-accent hover:text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/30 transition-colors inline-flex items-center gap-1"
                >
                  <span>{isGame ? 'Vào chơi' : skill.id==='explore'?'Mở chủ điểm':'Vào phòng'}</span>
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
        defaultType="listening"
      />
    </div>
  );
}
