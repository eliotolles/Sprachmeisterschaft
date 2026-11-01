import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { VocabTabs } from '@/components/vocabulary/VocabTabs';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { SITUATIONS } from '@/data/situations';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { toast } from 'sonner';
import {
  Utensils,
  Activity,
  Building,
  Train,
  CreditCard,
  Home,
  ShoppingBag,
  Phone,
  MessageCircle,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';

const ICONS = {
  Utensils,
  Activity,
  Building,
  Train,
  CreditCard,
  Home,
  ShoppingBag,
  Phone,
  MessageCircle,
};

export function VocabSituationsPage() {
  const isAdmin = db.auth.isAdmin();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dbSituations, setDbSituations] = useState(() => db.universal.findMany({ type: 'situation' }));
  const [deletedIds, setDeletedIds] = useState(() => db.situations?.getDeletedIds?.() || []);
  const [overrides, setOverrides] = useState(() => db.situations?.getOverrides?.() || {});
  const [editingSituation, setEditingSituation] = useState(null);
  const [editingPhrase, setEditingPhrase] = useState(null); // { index, de, vi, note, isNew }

  useEffect(() => {
    const handleDbChange = () => {
      setDbSituations(db.universal.findMany({ type: 'situation' }));
      setDeletedIds(db.situations?.getDeletedIds?.() || []);
      setOverrides(db.situations?.getOverrides?.() || {});
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  const importedSituationsList = dbSituations.map((item) => ({
    id: item.id,
    title_de: item.data?.title_de || item.title,
    title_vi: item.data?.title_vi || item.title,
    desc: item.data?.desc || 'Tình huống giao tiếp do học viên / quản trị viên nhập vào.',
    icon: item.data?.icon || 'MessageCircle',
    phrases: item.data?.phrases || [],
    isImported: true,
  }));

  const allSituations = [...importedSituationsList, ...SITUATIONS]
    .filter((s) => !deletedIds.includes(s.id))
    .map((s) => {
      if (overrides[s.id]) {
        return { ...s, ...overrides[s.id] };
      }
      return s;
    });

  const [selectedId, setSelectedId] = useState(allSituations[0]?.id || 'restaurant');

  // Keep selection valid if current is deleted
  const currentSituation = allSituations.find((s) => s.id === selectedId) || allSituations[0];
  const IconComponent = (currentSituation && ICONS[currentSituation.icon]) || MessageCircle;

  const handleDeleteSituation = (sitId, sitTitle) => {
    if (window.confirm(`Bạn có chắc muốn xóa tình huống "${sitTitle}" không?`)) {
      db.situations.delete(sitId);
      toast.success(`Đã xóa tình huống "${sitTitle}"!`);
      const remaining = allSituations.filter((s) => s.id !== sitId);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
    }
  };

  const handleResetSituations = () => {
    if (window.confirm('Khôi phục lại toàn bộ các tình huống giao tiếp gốc của hệ thống?')) {
      db.situations.resetDefaults();
      toast.success('Đã khôi phục các tình huống gốc!');
    }
  };

  const handleSaveSituation = (e) => {
    e.preventDefault();
    if (!editingSituation) return;
    db.situations.update(editingSituation.id, {
      title_vi: editingSituation.title_vi,
      title_de: editingSituation.title_de,
      desc: editingSituation.desc,
      icon: editingSituation.icon,
    });
    setEditingSituation(null);
    toast.success('Đã lưu thông tin tình huống!');
  };

  const handleDeletePhrase = (index) => {
    if (!currentSituation) return;
    if (window.confirm(`Xóa mẫu câu #${index + 1}?`)) {
      const updatedPhrases = [...(currentSituation.phrases || [])];
      updatedPhrases.splice(index, 1);
      db.situations.update(currentSituation.id, { phrases: updatedPhrases });
      toast.success('Đã xóa mẫu câu!');
    }
  };

  const handleSavePhrase = (e) => {
    e.preventDefault();
    if (!editingPhrase || !currentSituation) return;
    const phrases = [...(currentSituation.phrases || [])];
    if (editingPhrase.isNew) {
      phrases.push({
        de: editingPhrase.de,
        vi: editingPhrase.vi,
        note: editingPhrase.note || '',
      });
    } else {
      phrases[editingPhrase.index] = {
        de: editingPhrase.de,
        vi: editingPhrase.vi,
        note: editingPhrase.note || '',
      };
    }
    db.situations.update(currentSituation.id, { phrases });
    setEditingPhrase(null);
    toast.success(editingPhrase.isNew ? 'Đã thêm mẫu câu mới!' : 'Đã cập nhật mẫu câu!');
  };

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="GIAO TIẾP THỰC CHIẾN"
        title={`${allSituations.length} Tình huống giao tiếp`}
        deTitle="Alltagssituationen"
        subtitle="Mẫu câu tiếng Đức thông dụng kèm bản dịch và ghi chú văn hóa trong đời sống DACH."
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleResetSituations}
                className="tap px-3 py-1.5 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted text-muted-foreground flex items-center gap-1.5 shadow-sm"
                title="Khôi phục tình huống gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khôi phục gốc</span>
              </button>
            )}
            <button
              onClick={() => setIsImportOpen(true)}
              className="tap px-3 py-1.5 text-xs font-mono rounded-sm bg-accent text-accent-foreground font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import tình huống</span>
            </button>
          </div>
        }
      />

      <VocabTabs />

      {/* Situation Tabs */}
      {allSituations.length === 0 ? (
        <div className="surface p-8 text-center text-xs font-mono text-muted-foreground">
          Chưa có tình huống nào. Quản trị viên có thể bấm "Khôi phục gốc" hoặc "Import tình huống".
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allSituations.map((s) => {
              const SIcon = ICONS[s.icon] || MessageCircle;
              const isSelected = s.id === selectedId;

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`tap p-3 text-left rounded-sm border transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                      : 'bg-card border-border hover:border-accent/40 text-foreground'
                  }`}
                >
                  <SIcon
                    className={`w-4 h-4 shrink-0 ${isSelected ? 'text-accent-foreground' : 'text-accent'}`}
                  />
                  <div className="min-w-0">
                    <div className="font-heading font-semibold text-xs truncate flex items-center gap-1">
                      <span>{s.title_vi}</span>
                      {s.isImported && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                          Mới
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] font-display italic truncate ${
                        isSelected ? 'text-accent-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {s.title_de}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Situation Content */}
          {currentSituation && (
            <div className="surface p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {currentSituation.title_de} — {currentSituation.title_vi}
                    </h2>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                      {currentSituation.desc}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setEditingPhrase({
                          isNew: true,
                          index: (currentSituation.phrases || []).length,
                          de: '',
                          vi: '',
                          note: '',
                        })
                      }
                      className="tap px-2.5 py-1 text-xs font-mono rounded bg-accent text-accent-foreground font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm mẫu câu</span>
                    </button>
                    <button
                      onClick={() => setEditingSituation({ ...currentSituation })}
                      className="tap px-2.5 py-1 text-xs font-mono rounded border border-border bg-card hover:bg-muted text-foreground flex items-center gap-1 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Sửa bộ</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteSituation(currentSituation.id, currentSituation.title_vi)
                      }
                      className="tap px-2.5 py-1 text-xs font-mono rounded border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 flex items-center gap-1 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa bộ</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Phrases List */}
              <div className="space-y-3">
                {currentSituation.phrases && currentSituation.phrases.length > 0 ? (
                  currentSituation.phrases.map((phrase, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-sm border border-border bg-card/60 hover:border-accent/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs text-accent font-semibold">
                            {idx + 1}.
                          </span>
                          <span className="font-heading font-semibold text-base text-foreground">
                            {phrase.de}
                          </span>
                        </div>
                        <p className="font-body text-sm text-accent/90 pl-5">
                          → {phrase.vi}
                        </p>
                        {phrase.note && (
                          <p className="font-body text-xs text-muted-foreground pl-5 italic">
                            💡 {phrase.note}
                          </p>
                        )}
                      </div>

                      <div className="pl-5 md:pl-0 shrink-0 flex items-center gap-2">
                        <SpeakButton text={phrase.de} size="md" />
                        {isAdmin && (
                          <>
                            <button
                              onClick={() =>
                                setEditingPhrase({
                                  isNew: false,
                                  index: idx,
                                  de: phrase.de,
                                  vi: phrase.vi,
                                  note: phrase.note || '',
                                })
                              }
                              className="tap p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Sửa mẫu câu"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleDeletePhrase(idx)}
                              className="tap p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-600"
                              title="Xóa mẫu câu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs font-mono text-muted-foreground">
                    Chưa có mẫu câu đính kèm cho tình huống này.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Universal Import Modal */}
      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultType="situation"
        onSuccess={() => {
          setDbSituations(db.universal.findMany({ type: 'situation' }));
        }}
      />

      {/* Edit Situation Modal */}
      {editingSituation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface p-6 max-w-md w-full space-y-4 rounded-sm border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                Chỉnh sửa tình huống giao tiếp
              </h3>
              <button
                type="button"
                onClick={() => setEditingSituation(null)}
                className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSituation} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Tên tiếng Việt *
                </label>
                <input
                  type="text"
                  required
                  value={editingSituation.title_vi || ''}
                  onChange={(e) =>
                    setEditingSituation({ ...editingSituation, title_vi: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Tên tiếng Đức *
                </label>
                <input
                  type="text"
                  required
                  value={editingSituation.title_de || ''}
                  onChange={(e) =>
                    setEditingSituation({ ...editingSituation, title_de: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Mô tả tình huống
                </label>
                <textarea
                  rows={2}
                  value={editingSituation.desc || ''}
                  onChange={(e) =>
                    setEditingSituation({ ...editingSituation, desc: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Icon hiển thị
                </label>
                <select
                  value={editingSituation.icon || 'MessageCircle'}
                  onChange={(e) =>
                    setEditingSituation({ ...editingSituation, icon: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                >
                  {Object.keys(ICONS).map((iconKey) => (
                    <option key={iconKey} value={iconKey}>
                      {iconKey}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingSituation(null)}
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

      {/* Add / Edit Phrase Modal */}
      {editingPhrase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface p-6 max-w-md w-full space-y-4 rounded-sm border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                {editingPhrase.isNew ? 'Thêm mẫu câu mới' : `Sửa mẫu câu #${editingPhrase.index + 1}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPhrase(null)}
                className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhrase} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Câu tiếng Đức (Deutsch) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ich möchte einen Tisch reservieren."
                  value={editingPhrase.de || ''}
                  onChange={(e) => setEditingPhrase({ ...editingPhrase, de: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Nghĩa tiếng Việt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tôi muốn đặt một bàn."
                  value={editingPhrase.vi || ''}
                  onChange={(e) => setEditingPhrase({ ...editingPhrase, vi: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Ghi chú văn hóa / Ngữ cảnh (không bắt buộc)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Dùng khi gọi điện trước cho nhà hàng..."
                  value={editingPhrase.note || ''}
                  onChange={(e) => setEditingPhrase({ ...editingPhrase, note: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingPhrase(null)}
                  className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted font-mono"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="tap px-4 py-1.5 rounded-sm bg-accent text-accent-foreground font-mono font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingPhrase.isNew ? 'Thêm câu' : 'Lưu câu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default VocabSituationsPage;
