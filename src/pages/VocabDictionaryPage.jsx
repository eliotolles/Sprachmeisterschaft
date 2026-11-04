import { WordDetail } from '@/components/vocabulary/WordDetail';
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { VocabTabs } from '@/components/vocabulary/VocabTabs';
import { LevelFilter } from '@/components/ui/LevelFilter';
import { GenderText } from '@/components/ui/GenderText';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { WORDS } from '@/data/vocabulary';
import { Search, BookOpen, BookmarkPlus, Check } from 'lucide-react';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export function VocabDictionaryPage() {
  const [wordTarget, setWordTarget] = useState(null);
  const closeWord = React.useCallback(() => setWordTarget(null), []);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [myCards, setMyCards] = useState(() => db.vocabulary.findMany());

  const savedKeys = new Set(
    myCards.map((c) => `${(c.article || '').trim()} ${(c.german || '').trim()}`.toLowerCase())
  );

  const results = WORDS.filter((w) => {
    if (selectedLevel !== 'ALL' && w.level !== selectedLevel) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      w.german.toLowerCase().includes(q) ||
      w.vietnamese.toLowerCase().includes(q)
    );
  });

  const handleSave = async (w) => {
    try {
    await db.vocabulary.create({
      german: w.german,
      article: w.article,
      word_type: w.word_type,
      vietnamese: w.vietnamese,
      example_de: w.example_de,
      example_vi: w.example_vi,
      topic: w.topic,
      level: w.level,
    });
    setMyCards(db.vocabulary.findMany());
    toast.success(`Đã thêm "${w.german}" vào bộ thẻ!`);

    } catch(error) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6 animate-rise">
      {wordTarget && <WordDetail target={wordTarget} onClose={closeWord} />}
      <PageHeader
        eyebrow="TRA CỨU SONG NGỮ"
        title="Từ điển Đức — Việt"
        deTitle="Wörterbuch"
        subtitle="Tra cứu nhanh nghĩa, ví dụ câu thực tế và nghe phát âm chuẩn bản xứ."
      />

      <VocabTabs />

      {/* Search Bar & Level Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 surface p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Gõ từ tiếng Đức (ví dụ: fahren, Haus...) hoặc tiếng Việt (nhà, ăn...)"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <LevelFilter
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          includeAll={true}
        />
      </div>

      <div className="text-xs font-mono text-muted-foreground">
        Tìm thấy {results.length} mục từ phù hợp
      </div>

      {/* Dictionary entries list */}
      <div className="surface divide-y divide-border">
        {results.slice(0, 50).map((w, idx) => {
          const key = `${(w.article || '').trim()} ${(w.german || '').trim()}`.toLowerCase();
          const isSaved = savedKeys.has(key);

          return (
            <div key={`${w.german}_${idx}`} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button type="button" className="tap text-left hover:underline" onClick={event => setWordTarget({ word: w, anchor: event.currentTarget })} aria-label={'Xem chi tiết ' + w.german}><GenderText
                    article={w.article}
                    german={w.german}
                    wordType={w.word_type}
                    className="text-lg font-bold"
                  /></button>
                  <SpeakButton text={w.german} size="sm" />
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-muted/60 border border-border text-muted-foreground">
                    {w.level}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    • {w.topic}
                  </span>
                </div>
                <div className="text-sm font-display font-medium text-accent">
                  {w.vietnamese}
                </div>
                {w.example_de && (
                  <p className="font-heading italic text-xs text-muted-foreground">
                    "{w.example_de}" → {w.example_vi}
                  </p>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {isSaved ? (
                  <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Đã lưu
                  </span>
                ) : (
                  <button
                    onClick={() => handleSave(w)}
                    className="tap px-2.5 py-1 text-xs font-mono rounded-sm border border-border bg-card hover:bg-accent/10 hover:text-accent hover:border-accent/40 inline-flex items-center gap-1 transition-colors"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Thêm vào bộ thẻ
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
