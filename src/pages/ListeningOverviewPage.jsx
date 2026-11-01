import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { LEVEL_IDS } from '@/data/levels';
import {
  Headphones,
  Plus,
  PlayCircle,
  Youtube,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Globe,
  Lock,
  User,
  Video,
} from 'lucide-react';

export function ListeningOverviewPage() {
  const { navigate } = useRouter();
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [activeScopeTab, setActiveScopeTab] = useState('all'); // 'all' (Kho chung) | 'personal' (Kho cá nhân)
  const [collections, setCollections] = useState(() => db.listening.getCollections());
  const [isImportOpen, setIsImportOpen] = useState(false);

  const currentUser = db.auth.getUser();
  const isAdmin = db.auth.isAdmin();

  useEffect(() => {
    const handleDbChange = () => {
      setCollections(db.listening.getCollections({ level: selectedLevel }));
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, [selectedLevel]);

  const filteredCollections = collections.filter((c) => {
    // 1. Level filter
    if (selectedLevel !== 'ALL' && c.level !== selectedLevel) return false;

    // 2. Scope tab filter
    if (activeScopeTab === 'personal') {
      return c.scope === 'private' || c.id === 'my-personal-videos' || c.created_by === currentUser?.id;
    } else {
      // Kho chung
      return c.scope === 'public' || (!c.scope && c.id !== 'my-personal-videos');
    }
  });

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="XƯỞNG KỸ NĂNG NGÔN NGỮ"
        title="Luyện nghe tiếng Đức"
        deTitle="Hörverstehen & Video-Studio"
        subtitle="Học qua video YouTube có phụ đề song ngữ Đức - Việt, đồng bộ thời gian thực theo lời nói, tự động dừng từng câu và chép chính tả chuẩn CEFR."
        actions={
          <button
            onClick={() => setIsImportOpen(true)}
            className="tap px-3.5 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Import Video / Playlist</span>
          </button>
        }
      />

      {/* Scope Navigation Tabs: Kho Chung vs Video Cá Nhân */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveScopeTab('all')}
          className={`tap px-4 py-2 rounded-sm text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeScopeTab === 'all'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Kho video chung toàn hệ thống</span>
        </button>

        <button
          onClick={() => setActiveScopeTab('personal')}
          className={`tap px-4 py-2 rounded-sm text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeScopeTab === 'personal'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Video cá nhân của tôi (My Videos)</span>
        </button>
      </div>

      {/* Level Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedLevel('ALL')}
          className={`tap px-3 py-1.5 rounded-sm font-mono text-xs transition-all ${
            selectedLevel === 'ALL'
              ? 'bg-accent text-accent-foreground font-bold shadow-sm'
              : 'border border-border bg-card hover:bg-muted text-muted-foreground'
          }`}
        >
          Tất cả cấp độ
        </button>
        {LEVEL_IDS.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            className={`tap px-3 py-1.5 rounded-sm font-mono text-xs transition-all ${
              selectedLevel === lvl
                ? 'bg-accent text-accent-foreground font-bold shadow-sm ring-1 ring-accent'
                : 'border border-border bg-card hover:bg-muted text-muted-foreground'
            }`}
          >
            Trình độ {lvl}
          </button>
        ))}
      </div>

      {/* Empty State for Personal Videos */}
      {activeScopeTab === 'personal' && filteredCollections.length === 0 && (
        <div className="surface p-8 text-center border-2 border-dashed border-border rounded-sm space-y-4 max-w-xl mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Chưa có video cá nhân nào
            </h3>
            <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
              Bạn có thể dán bất kỳ link video YouTube tiếng Đức nào (bài hát, phim ngắn, tin tức DW, Easy German) để luyện nghe và chép chính tả trong không gian riêng của bạn.
            </p>
          </div>
          <button
            onClick={() => setIsImportOpen(true)}
            className="tap px-4 py-2 rounded-sm bg-accent text-accent-foreground text-xs font-mono font-bold shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nhập video cá nhân ngay</span>
          </button>
        </div>
      )}

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollections.map((col) => {
          const episodes = db.listening.getEpisodes(col.id);
          const firstEpisodeId = episodes[0]?.id || 'nw-a1-ep1';

          return (
            <div
              key={col.id}
              className="surface overflow-hidden border border-border hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col group"
            >
              {/* Thumbnail with Level badge */}
              <div className="relative aspect-video bg-muted overflow-hidden">
                <img
                  src={col.thumbnail}
                  alt={col.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-sm bg-accent text-accent-foreground font-mono text-xs font-bold shadow">
                    {col.level}
                  </span>
                  {col.scope === 'private' && (
                    <span className="px-1.5 py-0.5 rounded-sm bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Cá nhân</span>
                    </span>
                  )}
                  {col.scope === 'admin_only' && (
                    <span className="px-1.5 py-0.5 rounded-sm bg-amber-600 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Admin Only</span>
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-sm bg-black/75 text-white font-mono text-[11px]">
                  {col.episodesCount || episodes.length} tập
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-accent uppercase font-bold tracking-wider mb-1">
                    {col.provider}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-1 group-hover:text-accent transition-colors leading-snug">
                    {col.title}
                  </h3>
                  <p className="font-heading italic text-xs text-muted-foreground mb-3">
                    {col.deTitle}
                  </p>
                  <p className="font-body text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {col.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">
                    {episodes.length} video sẵn sàng
                  </span>

                  <button
                    onClick={() => navigate(`/skills/listening/${col.id}/${firstEpisodeId}`)}
                    className="tap px-3 py-1.5 rounded-sm bg-accent/10 hover:bg-accent text-accent hover:text-accent-foreground font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Vào luyện nghe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Universal Import Modal */}
      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultType="listening"
        onSuccess={() => {
          setCollections(db.listening.getCollections({ level: selectedLevel }));
        }}
      />
    </div>
  );
}

export default ListeningOverviewPage;
