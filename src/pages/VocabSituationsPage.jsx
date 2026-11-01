import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { VocabTabs } from '@/components/vocabulary/VocabTabs';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { SITUATIONS } from '@/data/situations';
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
  const [selectedId, setSelectedId] = useState(SITUATIONS[0].id);

  const currentSituation = SITUATIONS.find((s) => s.id === selectedId) || SITUATIONS[0];
  const IconComponent = ICONS[currentSituation.icon] || MessageCircle;

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="GIAO TIẾP THỰC CHIẾN"
        title="8 Tình huống giao tiếp"
        deTitle="Alltagssituationen"
        subtitle="Mẫu câu tiếng Đức thông dụng kèm bản dịch và ghi chú văn hóa trong đời sống DACH."
      />

      <VocabTabs />

      {/* Situation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SITUATIONS.map((s) => {
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
                <div className="font-heading font-semibold text-xs truncate">
                  {s.title_vi}
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
          {currentSituation.phrases.map((phrase, idx) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
