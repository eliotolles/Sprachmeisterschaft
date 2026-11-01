import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { LEVEL_IDS } from '@/data/levels';
import { toast } from 'sonner';
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
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';

export function ListeningOverviewPage() {
  const { navigate } = useRouter();
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [activeScopeTab, setActiveScopeTab] = useState('all'); // 'all' (Kho chung) | 'personal' (Kho cá nhân)
  const [collections, setCollections] = useState(() => db.listening.getCollections());
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

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

  const handleDeleteCollection = (colId, colTitle) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ video "${colTitle}" cùng toàn bộ tập trong bộ không?`)) {
      db.listening.deleteCollection(colId);
      toast.success(`Đã xóa bộ video: "${colTitle}"`);
    }
  };

  const handleResetListening = () => {
    if (window.confirm('Khôi phục lại toàn bộ các bộ video luyện nghe gốc chuẩn Nicos Weg của hệ thống?')) {
      db.listening.resetDefaults();
      toast.success('Đã khôi phục các bộ video gốc!');
    }
  };

  const handleSaveCollectionEdit = (e) => {
    e.preventDefault();
    if (!editingCollection) return;
    db.listening.updateCollection(editingCollection.id, {
      title: editingCollection.title,
      deTitle: editingCollection.deTitle,
      level: editingCollection.level,
      provider: editingCollection.provider,
      description: editingCollection.description,
      scope: editingCollection.scope || 'public',
    });
    setEditingCollection(null);
    toast.success('Đã lưu chỉnh sửa bộ video!');
  };

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="XƯỞNG KỸ NĂNG NGÔN NGỮ"
        title="Luyện nghe tiếng Đức"
        deTitle="Hörverstehen & Video-Studio"
        subtitle="Học qua video YouTube có phụ đề song ngữ Đức - Việt, đồng bộ thời gian thực theo lời nói, tự động dừng từng câu và chép chính tả chuẩn CEFR."
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleResetListening}
                className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-muted-foreground font-mono text-xs flex items-center gap-1.5 shadow-sm"
                title="Khôi phục danh sách video gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khôi phục gốc</span>
              </button>
            )}
            <button
              onClick={() => setIsImportOpen(true)}
              className="tap px-3.5 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Import Video / Playlist</span>
            </button>
          </div>
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
          const canManage = isAdmin || col.created_by === currentUser?.id;

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
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono text-accent uppercase font-bold tracking-wider">
                      {col.provider}
                    </span>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingCollection({ ...col })}
                          className="tap p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Sửa bộ video"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(col.id, col.title)}
                          className="tap p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-600"
                          title="Xóa bộ video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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

      {/* Edit Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface p-6 max-w-md w-full space-y-4 rounded-sm border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                Chỉnh sửa bộ video luyện nghe
              </h3>
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCollectionEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Tên bộ (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  required
                  value={editingCollection.title || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Tên bộ (Tiếng Đức)
                </label>
                <input
                  type="text"
                  value={editingCollection.deTitle || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, deTitle: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Cấp độ (CEFR) *
                  </label>
                  <select
                    value={editingCollection.level || 'B1'}
                    onChange={(e) => setEditingCollection({ ...editingCollection, level: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                  >
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Nguồn / Kênh cung cấp
                  </label>
                  <input
                    type="text"
                    value={editingCollection.provider || ''}
                    onChange={(e) => setEditingCollection({ ...editingCollection, provider: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Phạm vi (Scope)
                  </label>
                  <select
                    value={editingCollection.scope || 'public'}
                    onChange={(e) => setEditingCollection({ ...editingCollection, scope: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                  >
                    <option value="public">🌍 Toàn hệ thống (Public)</option>
                    <option value="private">👤 Cá nhân (Private)</option>
                    <option value="admin_only">🔒 Nội bộ Admin</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Mô tả bộ video
                </label>
                <textarea
                  rows={3}
                  value={editingCollection.description || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingCollection(null)}
                  className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted font-mono"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="tap px-4 py-1.5 rounded-sm bg-accent text-accent-foreground font-mono font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListeningOverviewPage;
