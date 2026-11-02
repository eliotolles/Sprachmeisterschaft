import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { VocabTabs } from '@/components/vocabulary/VocabTabs';
import { GenderText } from '@/components/ui/GenderText';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { LevelFilter } from '@/components/ui/LevelFilter';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { SPECIALTIES } from '@/data/specialties';
import { toast } from 'sonner';
import {
  Layers,
  Search,
  Check,
  BookmarkPlus,
  Briefcase,
  HeartPulse,
  UtensilsCrossed,
  ShoppingBag,
  MessagesSquare,
  Smile,
  HardHat,
  Sparkles,
  Utensils,
  Building,
  Car,
  Navigation,
  Wrench,
  Cpu,
  Zap,
  FlaskConical,
  GraduationCap,
  Landmark,
  Calculator,
  Terminal,
  Boxes,
  Plus,
} from 'lucide-react';

const SPECIALTY_ICONS = {
  HeartPulse,
  UtensilsCrossed,
  ShoppingBag,
  MessagesSquare,
  Smile,
  HardHat,
  Sparkles,
  Utensils,
  Building,
  Car,
  Navigation,
  Wrench,
  Cpu,
  Zap,
  Briefcase,
  FlaskConical,
  GraduationCap,
  Landmark,
  Calculator,
  Terminal,
  Boxes,
};

export function VocabSpecialtiesPage() {
  const [profile] = useState(() => db.learnerProfile.get());
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('pflege');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [search, setSearch] = useState('');
  const [myCards, setMyCards] = useState(() => db.vocabulary.findMany());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const isAdmin = db.auth.isAdmin();

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

  const currentSpecialty =
    SPECIALTIES.find((s) => s.id === selectedSpecialtyId) || SPECIALTIES[0];

  // Filter words by Level and Search query
  const filteredWords = (currentSpecialty.words || []).filter((w) => {
    if (selectedLevel !== 'ALL' && w.level !== selectedLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        w.german.toLowerCase().includes(q) ||
        (w.vietnamese && w.vietnamese.toLowerCase().includes(q)) ||
        (w.example_de && w.example_de.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSaveWord = (word) => {
    const key = `${(word.article || '').trim()} ${(word.german || '').trim()}`.toLowerCase();
    if (savedKeys.has(key)) return;

    db.vocabulary.create({
      german: word.german,
      article: word.article || '',
      word_type: word.word_type || 'noun',
      vietnamese: word.vietnamese,
      example_de: word.example_de || '',
      example_vi: word.example_vi || '',
      topic: currentSpecialty.id,
      level: word.level || 'B1',
    });
    db.studyLogs.recordActivity({ newWords: 1 });
    toast.success(`Đã lưu "${word.german}" vào bộ thẻ cá nhân.`);
  };

  const handleSaveWholeSpecialty = () => {
    const unsaved = filteredWords.filter(
      (w) => !savedKeys.has(`${(w.article || '').trim()} ${(w.german || '').trim()}`.toLowerCase())
    );
    if (unsaved.length === 0) {
      toast.info('Tất cả các từ trong mục chuyên ngành này đã có trong bộ thẻ của bạn!');
      return;
    }

    const added = db.vocabulary.createMany(
      unsaved.map((w) => ({
        german: w.german,
        article: w.article || '',
        word_type: w.word_type || 'noun',
        vietnamese: w.vietnamese,
        example_de: w.example_de || '',
        example_vi: w.example_vi || '',
        topic: currentSpecialty.id,
        level: w.level || 'B1',
      }))
    );
    db.studyLogs.recordActivity({ newWords: added.length });
    toast.success(`Đã lưu toàn bộ ${added.length} từ chuyên ngành vào bộ thẻ!`);
  };

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="TỪ VỰNG & MẪU CÂU THEO NGHỀ NGHIỆP"
        title="Từ vựng chuyên ngành"
        deTitle="Fachwortschatz (Berufssprache)"
        subtitle="Hệ thống 21 chuyên ngành trọng điểm bám sát môi trường làm việc thực tế tại Đức (B1–B2 Beruf)."
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="tap px-3 py-2 bg-card border border-border text-xs font-mono font-medium rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                <span>Import tài liệu</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveWholeSpecialty}
              className="tap px-3.5 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 shadow-sm inline-flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Lưu cả ngành ({filteredWords.length} từ)</span>
            </button>
          </div>
        }
      />

      <VocabTabs />

      {/* 21 Specialties Horizontal Chips Carousel / Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
          <span>Chọn 1 trong 21 chuyên ngành (Fachbereich):</span>
          <span className="font-bold text-accent">
            {currentSpecialty.stt}. {currentSpecialty.vi} ({currentSpecialty.de})
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin">
          {SPECIALTIES.map((spec) => {
            const Icon = SPECIALTY_ICONS[spec.icon] || Briefcase;
            const isSelected = spec.id === selectedSpecialtyId;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => {
                  setSelectedSpecialtyId(spec.id);
                  setSearch('');
                }}
                className={`tap px-3 py-2 rounded-sm text-xs font-mono transition-all flex items-center gap-2 shrink-0 border ${
                  isSelected
                    ? 'border-accent bg-accent text-accent-foreground font-bold shadow-sm ring-1 ring-accent'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-black/20 text-accent-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  #{spec.stt}
                </span>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{spec.vi}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20' : 'bg-muted/70 text-muted-foreground'
                }`}>
                  {spec.words?.length || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Specialty Description Banner */}
      <div className="surface p-4 border border-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
              Chuyên ngành #{currentSpecialty.stt}
            </span>
            <h3 className="font-display font-bold text-base text-foreground">
              {currentSpecialty.vi} – <span className="italic font-normal text-muted-foreground">{currentSpecialty.de}</span>
            </h3>
          </div>
          <p className="font-body text-xs text-muted-foreground leading-relaxed">
            {currentSpecialty.description}
          </p>
        </div>

        <div className="text-xs font-mono text-muted-foreground shrink-0 flex items-center gap-2">
          <span>Tiến độ lưu:</span>
          <strong className="text-foreground font-bold">
            {filteredWords.filter((w) => savedKeys.has(`${(w.article || '').trim()} ${(w.german || '').trim()}`.toLowerCase())).length} / {filteredWords.length} thẻ
          </strong>
        </div>
      </div>

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
            placeholder={`Tìm từ trong ngành ${currentSpecialty.vi}...`}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Word Cards Grid */}
      {filteredWords.length === 0 ? (
        <div className="surface p-8 text-center border border-border rounded-sm space-y-2">
          <p className="text-sm font-heading text-muted-foreground">
            Không tìm thấy từ vựng nào phù hợp với bộ lọc trong chuyên ngành này.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedLevel('ALL');
              setSearch('');
            }}
            className="tap text-xs font-mono text-accent underline"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map((word, idx) => {
            const isSaved = savedKeys.has(
              `${(word.article || '').trim()} ${(word.german || '').trim()}`.toLowerCase()
            );

            return (
              <div
                key={`${word.german}-${idx}`}
                className="surface p-4 rounded-sm border border-border space-y-3 flex flex-col justify-between hover:border-accent/40 transition-colors shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span className="uppercase text-[10px] tracking-wider text-accent font-bold">
                      {currentSpecialty.stt} • {currentSpecialty.vi}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold">
                      {word.level || 'B1'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <GenderText
                        article={word.article}
                        text={word.german}
                        className="font-display text-lg font-bold text-foreground leading-snug"
                      />
                      <SpeakButton text={word.german} />
                    </div>
                    <div className="font-heading text-xs text-muted-foreground mt-0.5">
                      {word.vietnamese}
                    </div>
                  </div>

                  {word.example_de && (
                    <div className="pt-2 border-t border-border/60 text-xs font-body space-y-1">
                      <div className="text-foreground italic">
                        "{word.example_de}"
                      </div>
                      {word.example_vi && (
                        <div className="text-muted-foreground text-[11px]">
                          {word.example_vi}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveWord(word)}
                    disabled={isSaved}
                    className={`tap w-full py-1.5 px-3 rounded-sm text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${
                      isSaved
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : 'border border-border bg-card hover:bg-muted text-foreground hover:border-foreground/30'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã có trong bộ thẻ</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5 text-accent" />
                        <span>Lưu vào bộ thẻ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Universal Import Modal for Admin or Student */}
      <UniversalImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultType="vocabulary"
        onSuccess={() => {
          setMyCards(db.vocabulary.findMany());
        }}
      />
    </div>
  );
}

export default VocabSpecialtiesPage;
