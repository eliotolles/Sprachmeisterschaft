import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { VocabTabs } from '@/components/vocabulary/VocabTabs';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { SITUATIONS } from '@/data/situations';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
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
};

export function VocabSituationsPage() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dbSituations, setDbSituations] = useState(() => db.universal.findMany({ type: 'situation' }));

  useEffect(() => {
    const handleDbChange = () => {
      setDbSituations(db.universal.findMany({ type: 'situation' }));
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

  const allSituations = [...importedSituationsList, ...SITUATIONS];

  const [selectedId, setSelectedId] = useState(allSituations[0]?.id || 'restaurant');

  const currentSituation = allSituations.find((s) => s.id === selectedId) || allSituations[0];
  const IconComponent = ICONS[currentSituation.icon] || MessageCircle;

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="GIAO TIẾP THỰC CHIẾN"
        title={`${allSituations.length} Tình huống giao tiếp`}
        deTitle="Alltagssituationen"
        subtitle="Mẫu câu tiếng Đức thông dụng kèm bản dịch và ghi chú văn hóa trong đời sống DACH."
        actions={
          <button
            onClick={() => setIsImportOpen(true)}
            className="tap px-3 py-1.5 text-xs font-mono rounded-sm bg-accent text-accent-foreground font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import tình huống</span>
          </button>
        }
      />

      <VocabTabs />

      {/* Situation Tabs */}
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
              <SIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-accent-foreground' : 'text-accent'}`} />
              <div className="min-w-0">
                <div className="font-heading font-semibold text-xs truncate flex items-center gap-1">
                  <span>{s.title_vi}</span>
                  {s.isImported && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                      Mới
                    </span>
                  )}
                </div>
                <div className={`text-[10px] font-display italic truncate ${isSelected ? 'text-accent-foreground/80' : 'text-muted-foreground'}`}>
                  {s.title_de}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Situation Content */}
      <div className="surface p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
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

                <div className="pl-5 md:pl-0 shrink-0">
                  <SpeakButton text={phrase.de} size="md" />
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

      {/* Import Modal */}
      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultType="situation"
        onSuccess={() => {
          setDbSituations(db.universal.findMany({ type: 'situation' }));
        }}
      />
    </div>
  );
}
export default VocabSituationsPage;
