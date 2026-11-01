import React, { useState } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { VocabTabs } from '@/components/vocabulary/VocabTabs';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { GenderText } from '@/components/ui/GenderText';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { LEVEL_DECKS } from '@/data/level-decks';
import { LEVEL_IDS } from '@/data/levels';
import {
  Layers,
  Plus,
  BookmarkPlus,
  Gamepad2,
  CheckCircle2,
  Volume2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function VocabLevelsPage() {
  const { navigate } = useRouter();
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [expandedDeckId, setExpandedDeckId] = useState('deck-a1-family');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const currentUser = db.auth.getUser();
  const isAdmin = db.auth.isAdmin();

  // Filter decks
  const filteredDecks = LEVEL_DECKS.filter((d) => {
    if (selectedLevel !== 'ALL' && d.level !== selectedLevel) return false;
    return true;
  });

  const handleAddDeckToCards = (deck) => {
    let addedCount = 0;
    for (const w of deck.words) {
      db.vocabulary.create({
        german: w.german,
        article: w.article || '',
        word_type: w.word_type || 'noun',
        vietnamese: w.vietnamese,
        example_de: w.example_de || '',
        example_vi: w.example_vi || '',
        topic: deck.title,
        level: deck.level,
      });
      addedCount++;
    }
    db.studyLogs.recordActivity({ newWords: addedCount });
    toast.success(`Đã nạp toàn bộ ${addedCount} thẻ từ của bộ "${deck.title}" vào Thẻ ôn SRS cá nhân!`);
  };

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="TỪ VỰNG CHUẨN KHUNG CHÂU ÂU"
        title="Bộ từ theo cấp độ"
        deTitle="Wortschatz nach GER-Niveaus"
        subtitle="Hệ thống các bộ thẻ từ vựng phân chia bài bản theo từng trình độ từ A1 đến C2 kèm phát âm và ví dụ ngữ cảnh."
        actions={
          <button
            onClick={() => setIsImportOpen(true)}
            className="tap px-3.5 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Import bộ từ mới</span>
          </button>
        }
      />

      {/* Tabs */}
      <VocabTabs />

      {/* Level Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
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
            className={`tap px-3.5 py-1.5 rounded-sm font-mono text-xs transition-all ${
              selectedLevel === lvl
                ? 'bg-accent text-accent-foreground font-bold shadow-sm ring-1 ring-accent'
                : 'border border-border bg-card hover:bg-muted text-muted-foreground'
            }`}
          >
            Trình độ {lvl}
          </button>
        ))}
      </div>

      {/* Decks Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredDecks.map((deck) => {
          const isExpanded = expandedDeckId === deck.id;

          return (
            <div
              key={deck.id}
              className="surface p-5 sm:p-6 border border-border shadow-sm hover:border-accent/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 font-mono text-xs font-bold text-accent">
                      {deck.level}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {deck.cardsCount} thẻ từ vựng
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-bold text-foreground">
                    {deck.title}
                  </h3>
                  <p className="font-heading italic text-xs text-accent font-medium mb-2">
                    {deck.deTitle}
                  </p>
                  <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    {deck.description}
                  </p>
                </div>

                {/* Deck Action buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAddDeckToCards(deck)}
                    className="tap px-3 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm"
                    title="Nạp vào bộ thẻ cá nhân để ôn bằng thuật toán SRS"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Nạp vào thẻ SRS</span>
                  </button>

                  <button
                    onClick={() => navigate('/game')}
                    className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-foreground text-xs font-mono font-medium flex items-center gap-1.5"
                    title="Luyện phản xạ mạo từ Der/Die/Das"
                  >
                    <Gamepad2 className="w-3.5 h-3.5 text-accent" />
                    <span>Luyện phản xạ</span>
                  </button>

                  <button
                    onClick={() => setExpandedDeckId(isExpanded ? null : deck.id)}
                    className="tap p-2 rounded-sm border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                    title={isExpanded ? 'Thu gọn' : 'Xem danh sách từ'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Words Preview */}
              {isExpanded && (
                <div className="mt-5 pt-4 border-t border-border animate-fade-in">
                  <div className="eyebrow mb-3">DANH SÁCH TỪ VỰNG TRONG BỘ ({deck.words.length} TỪ)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deck.words.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-sm bg-card/60 border border-border flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <GenderText article={w.article} word={w.german} className="text-base" />
                            {w.word_type && (
                              <span className="text-[10px] font-mono text-muted-foreground italic">
                                ({w.word_type})
                              </span>
                            )}
                          </div>
                          <div className="font-heading text-xs text-muted-foreground mt-0.5">
                            {w.vietnamese}
                          </div>
                          {w.example_de && (
                            <div className="text-[11px] font-body text-foreground/80 mt-1.5 italic">
                              "{w.example_de}"
                            </div>
                          )}
                        </div>

                        <SpeakButton
                          text={`${w.article} ${w.german}`}
                          className="shrink-0 text-accent hover:bg-muted"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Universal Import Modal */}
      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultType="vocabulary"
        onSuccess={() => {
          toast.success('Đã làm mới danh sách bộ từ vựng!');
        }}
      />
    </div>
  );
}
export default VocabLevelsPage;
