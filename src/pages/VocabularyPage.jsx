import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { VocabTabs } from '@/components/vocabulary/VocabTabs';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { GenderText } from '@/components/ui/GenderText';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/algorithms';
import { Search, Plus, Trash2, RotateCw, Filter, BookOpen, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { showConfirmModal } from '@/components/ui/ConfirmModal';

export function VocabularyPage() {
  const { navigate } = useRouter();
  const isAdmin = db.auth.isAdmin();
  const [cards, setCards] = useState(() => db.vocabulary.findMany());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // New word form state
  const [newGerman, setNewGerman] = useState('');
  const [newArticle, setNewArticle] = useState('');
  const [newType, setNewType] = useState('noun');
  const [newVietnamese, setNewVietnamese] = useState('');
  const [newExampleDe, setNewExampleDe] = useState('');
  const [newExampleVi, setNewExampleVi] = useState('');
  const [newTopic, setNewTopic] = useState('alltag');
  const [newLevel, setNewLevel] = useState('B1');

  useEffect(() => {
    const handleDbChange = () => {
      setCards(db.vocabulary.findMany());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  const today = formatDate();

  // Filter cards
  const filteredCards = cards.filter((c) => {
    if (statusFilter === 'due') {
      if (c.due_date && c.due_date > today) return false;
    } else if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const de = (c.german || '').toLowerCase();
      const vi = (c.vietnamese || '').toLowerCase();
      return de.includes(q) || vi.includes(q);
    }
    return true;
  });

  // Status stats
  const stats = {
    total: cards.length,
    due: cards.filter((c) => !c.due_date || c.due_date <= today).length,
    new: cards.filter((c) => c.status === 'new').length,
    learning: cards.filter((c) => c.status === 'learning').length,
    mastered: cards.filter((c) => c.status === 'mastered').length,
  };

  const handleCreateWord = async (e) => {
    try {
    e.preventDefault();
    if (!newGerman.trim() || !newVietnamese.trim()) {
      toast.error('Vui lòng nhập từ tiếng Đức và nghĩa tiếng Việt.');
      return;
    }

    await db.vocabulary.create({
      german: newGerman.trim(),
      article: newArticle,
      word_type: newType,
      vietnamese: newVietnamese.trim(),
      example_de: newExampleDe.trim(),
      example_vi: newExampleVi.trim(),
      topic: newTopic,
      level: newLevel,
    });

    if(!db.vocabulary.isCore?.()) db.studyLogs.recordActivity({ newWords: 1 });
    toast.success(`Đã thêm từ "${newGerman}" vào bộ thẻ!`);

    // Reset form
    setNewGerman('');
    setNewArticle('');
    setNewVietnamese('');
    setNewExampleDe('');
    setNewExampleVi('');
    setShowAddModal(false);

    } catch(error) { toast.error(error.message); }
  };

  const handleDeleteCard = async (id) => {
    try {
    await db.vocabulary.delete(id);
    setDeleteTargetId(null);
    toast.success('Đã xoá từ khỏi bộ thẻ.');

    } catch(error) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="QUẢN LÝ TỪ VỰNG"
        title="Bộ thẻ của tôi"
        deTitle="Wortschatz"
        subtitle="Quản lý và ôn luyện các từ vựng tiếng Đức đã lưu theo thuật toán SRS."
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && cards.length > 0 && (
              <button
                onClick={async () => {
                  const ok = await showConfirmModal({
                    title: 'Xóa toàn bộ thẻ từ vựng',
                    message: `Bạn có chắc chắn muốn xóa toàn bộ ${cards.length} thẻ từ vựng hiện có không? Thao tác này không thể hoàn tác.`,
                    confirmText: 'Xóa tất cả từ vựng',
                    variant: 'danger',
                  });
                  if (ok) {
                    db.vocabulary.clearAll();
                    toast.success('Đã xóa toàn bộ bộ thẻ từ vựng!');
                  }
                }}
                className="tap px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 border border-rose-300 dark:border-rose-900 text-xs font-mono font-medium rounded-sm shadow-sm inline-flex items-center gap-1.5"
                title="Xóa toàn bộ thẻ từ vựng (Quyền Admin)"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa tất cả ({cards.length})</span>
              </button>
            )}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="tap px-3.5 py-2 bg-card hover:bg-muted text-foreground text-xs font-mono font-medium rounded-sm border border-border shadow-sm inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4 text-accent" />
              <span>Import bộ từ</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="tap px-3.5 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm từ mới</span>
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <VocabTabs />

      {/* Status Filter Chips & Counters */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: `Tất cả (${stats.total})` },
          { id: 'due', label: `Đến hạn (${stats.due})` },
          { id: 'new', label: `Mới (${stats.new})` },
          { id: 'learning', label: `Đang học (${stats.learning})` },
          { id: 'mastered', label: `Vững (${stats.mastered})` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`tap px-3 py-1.5 rounded-sm border text-xs font-mono font-medium transition-colors ${
              statusFilter === f.id
                ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm từ tiếng Đức hoặc nghĩa tiếng Việt..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Vocabulary Card List */}
      {filteredCards.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Không tìm thấy thẻ từ nào"
          description={
            cards.length === 0
              ? 'Bộ thẻ của bạn chưa có từ nào. Hãy khám phá Thư viện từ vựng hoặc bấm "Thêm từ mới" ở góc trên.'
              : 'Không có từ nào phù hợp với bộ lọc tìm kiếm hiện tại.'
          }
          actionLabel="Khám phá Thư viện từ vựng"
          onAction={() => navigate('/vocabulary/library')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="surface p-4 flex flex-col justify-between hover:border-accent/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-1.5">
                  <span className="uppercase tracking-wider">{card.topic}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-muted/60 border border-border">
                    {card.level}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <GenderText
                    article={card.article}
                    german={card.german}
                    wordType={card.word_type}
                    className="text-lg md:text-xl font-bold"
                  />
                  <SpeakButton text={card.german} size="sm" />
                </div>

                <div className="font-display font-medium text-base text-accent mt-1">
                  {card.vietnamese}
                </div>

                {card.example_de && (
                  <p className="font-heading italic text-xs text-muted-foreground mt-2 border-l-2 border-border pl-2 line-clamp-2">
                    "{card.example_de}"
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="capitalize">
                  {card.status === 'mastered' ? '✓ Vững' : card.status === 'learning' ? 'Đang học' : 'Mới'}
                </span>
                <button
                  onClick={() => setDeleteTargetId(card.id)}
                  title="Xoá thẻ"
                  className="p-1 text-muted-foreground hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-sm w-full p-6 animate-rise text-center space-y-4">
            <h3 className="font-display text-xl font-bold text-foreground">
              Xác nhận xoá thẻ từ?
            </h3>
            <p className="font-body text-xs text-muted-foreground">
              Từ vựng này sẽ bị xoá khỏi bộ thẻ và tiến trình SRS liên quan sẽ bị huỷ.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="tap px-3 py-1.5 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleDeleteCard(deleteTargetId)}
                className="tap px-3 py-1.5 text-xs font-mono rounded-sm bg-rose-600 hover:bg-rose-700 text-white"
              >
                Xác nhận xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-lg w-full p-6 animate-rise">
            <h3 className="font-display text-2xl font-bold text-foreground mb-1">
              Thêm từ vựng thủ công
            </h3>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Từ mới sẽ được xếp lịch ôn ngay trong ngày hôm nay.
            </p>

            <form onSubmit={handleCreateWord} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                    Mạo từ
                  </label>
                  <select
                    value={newArticle}
                    onChange={(e) => setNewArticle(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm rounded-sm border border-border bg-card text-foreground font-mono"
                  >
                    <option value="">(Không có)</option>
                    <option value="der">der (đực)</option>
                    <option value="die">die (cái)</option>
                    <option value="das">das (trung)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                    Từ tiếng Đức *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGerman}
                    onChange={(e) => setNewGerman(e.target.value)}
                    placeholder="Ví dụ: Apfel, arbeiten..."
                    className="w-full px-2.5 py-1.5 text-sm rounded-sm border border-border bg-card text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                  Nghĩa tiếng Việt *
                </label>
                <input
                  type="text"
                  required
                  value={newVietnamese}
                  onChange={(e) => setNewVietnamese(e.target.value)}
                  placeholder="Ví dụ: quả táo, làm việc..."
                  className="w-full px-2.5 py-1.5 text-sm rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                    Chủ đề
                  </label>
                  <select
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                  >
                    <option value="alltag">Alltag (Đời sống)</option>
                    <option value="familie">Familie (Gia đình)</option>
                    <option value="arbeit">Arbeit (Công việc)</option>
                    <option value="essen">Essen (Ẩm thực)</option>
                    <option value="wohnen">Wohnen (Nhà ở)</option>
                    <option value="reisen">Reisen (Du lịch)</option>
                    <option value="gesundheit">Gesundheit (Sức khỏe)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                    Trình độ
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                  Câu ví dụ tiếng Đức
                </label>
                <input
                  type="text"
                  value={newExampleDe}
                  onChange={(e) => setNewExampleDe(e.target.value)}
                  placeholder="Ich esse jeden Tag einen Apfel."
                  className="w-full px-2.5 py-1.5 text-sm rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                  Dịch câu ví dụ tiếng Việt
                </label>
                <input
                  type="text"
                  value={newExampleVi}
                  onChange={(e) => setNewExampleVi(e.target.value)}
                  placeholder="Tôi ăn một quả táo mỗi ngày."
                  className="w-full px-2.5 py-1.5 text-sm rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="tap px-3 py-1.5 text-xs font-mono rounded-sm border border-border bg-card"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="tap px-4 py-1.5 text-xs font-mono rounded-sm bg-accent text-accent-foreground font-semibold"
                >
                  Lưu vào bộ thẻ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Import Modal */}
      <UniversalImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultType="vocabulary"
        onSuccess={() => {
          setCards(db.vocabulary.findMany());
        }}
      />
    </div>
  );
}
