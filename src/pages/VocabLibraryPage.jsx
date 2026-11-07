import {WordDetailsTrigger} from '@/components/vocabulary/WordDetail';
import {vocabularyDetails} from '@/lib/vocabulary-details';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { VocabTabs } from '@/components/vocabulary/VocabTabs';
import { GenderText } from '@/components/ui/GenderText';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { LevelFilter } from '@/components/ui/LevelFilter';
import { WORDS, TOPICS } from '@/data/vocabulary';
import { Check, BookmarkPlus, Layers, Search } from 'lucide-react';
import { toast } from 'sonner';

export function VocabLibraryPage() {
  const [profile] = useState(() => db.learnerProfile.get());
  const [selectedLevel, setSelectedLevel] = useState(profile.target_level || 'B1');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [search, setSearch] = useState('');
  const [myCards, setMyCards] = useState(() => db.vocabulary.findMany());

  useEffect(() => {
    const handleDbChange = () => {
      setMyCards(db.vocabulary.findMany());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  // Quick lookup set for saved words: "article german"
  const savedKeys = new Set(
    myCards.map((c) => `${(c.article || '').trim()} ${(c.german || '').trim()}`.toLowerCase())
  );

  // Filter 950 library words
  const filteredWords = WORDS.filter((w) => {
    if (selectedLevel !== 'ALL' && w.level !== selectedLevel) return false;
    if (selectedTopic !== 'all' && w.topic !== selectedTopic) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        w.german.toLowerCase().includes(q) ||
        w.vietnamese.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSaveWord = async (word) => {
    try {
    const key = `${(word.article || '').trim()} ${(word.german || '').trim()}`.toLowerCase();
    if (savedKeys.has(key)) return;

    await db.vocabulary.create({
      ...vocabularyDetails(word),
      german: word.german,
      article: word.article,
      word_type: word.word_type,
      vietnamese: word.vietnamese,
      example_de: word.example_de,
      example_vi: word.example_vi,
      topic: word.topic,
      level: word.level,
    });
    if(!db.vocabulary.isCore?.()) db.studyLogs.recordActivity({ newWords: 1 });
    toast.success(`Đã lưu "${word.german}" vào bộ thẻ cá nhân.`);

    } catch(error) { toast.error(error.message); }
  };

  const handleSaveWholeTopic = async () => {
    try {
    const unsaved = filteredWords.filter(
      (w) => !savedKeys.has(`${(w.article || '').trim()} ${(w.german || '').trim()}`.toLowerCase())
    );
    if (unsaved.length === 0) {
      toast.info('Tất cả các từ trong mục lọc này đã có trong bộ thẻ của bạn!');
      return;
    }

    const added = await db.vocabulary.createMany(unsaved);
    if(!db.vocabulary.isCore?.()) db.studyLogs.recordActivity({ newWords: added.length });
    toast.success(`Đã lưu toàn bộ ${added.length} từ mới vào bộ thẻ!`);

    } catch(error) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="KHO NGUYÊN LIỆU CHUẨN HOÁ"
        title="Thư viện từ vựng"
        deTitle="Wortschatz-Bibliothek"
        subtitle="Kho từ vựng tinh chọn 20 chủ đề bám sát đề thi Goethe, telc, ÖSD và DTZ."
        actions={
          <button
            onClick={handleSaveWholeTopic}
            className="tap px-3.5 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 shadow-sm inline-flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>Lưu tất cả ({filteredWords.length} từ)</span>
          </button>
        }
      />

      <VocabTabs />

      {/* Filters: Level & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <LevelFilter
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          includeAll={true}
        />

        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm trong thư viện từ vựng..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-sm border border-border bg-card text-foreground"
          />
        </div>
      </div>

      {/* Topic Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border">
        <button
          onClick={() => setSelectedTopic('all')}
          className={`tap px-3 py-1 rounded-sm border text-xs font-mono whitespace-nowrap ${
            selectedTopic === 'all'
              ? 'bg-accent text-accent-foreground border-accent font-semibold'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Tất cả chủ đề
        </button>
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t.id)}
            className={`tap px-3 py-1 rounded-sm border text-xs font-mono whitespace-nowrap ${
              selectedTopic === t.id
                ? 'bg-accent text-accent-foreground border-accent font-semibold'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.vi}
          </button>
        ))}
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredWords.map((word, idx) => {
          const key = `${(word.article || '').trim()} ${(word.german || '').trim()}`.toLowerCase();
          const isSaved = savedKeys.has(key);

          return (
            <div
              key={`${word.german}_${idx}`}
              className="surface p-4 flex flex-col justify-between hover:border-accent/30 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-1">
                  <span className="uppercase tracking-wider">{word.topic}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-muted/60 border border-border">
                    {word.level}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <WordDetailsTrigger word={word}><GenderText
                    article={word.article}
                    german={word.german}
                    wordType={word.word_type}
                    className="text-lg font-bold"
                  /></WordDetailsTrigger>
                  <SpeakButton text={word.german} size="sm" />
                </div>

                <div className="font-display font-medium text-sm md:text-base text-accent mt-0.5">
                  {word.vietnamese}
                </div>

                {word.example_de && (
                  <p className="font-heading italic text-xs text-muted-foreground mt-2 border-l-2 border-border pl-2 line-clamp-2">
                    "{word.example_de}"
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                {isSaved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Đã lưu trong bộ thẻ
                  </span>
                ) : (
                  <button
                    onClick={() => handleSaveWord(word)}
                    className="tap px-2.5 py-1 rounded-sm border border-accent/40 bg-accent/10 hover:bg-accent text-accent hover:text-accent-foreground text-xs font-mono font-medium transition-colors inline-flex items-center gap-1"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Lưu vào bộ thẻ
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
