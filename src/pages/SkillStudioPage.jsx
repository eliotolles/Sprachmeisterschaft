import React from 'react';
import { useRouter } from '@/lib/router';
import { DictationStudio } from '@/components/skills/DictationStudio';
import { ShadowingStudio } from '@/components/skills/ShadowingStudio';
import { ReadingStudio } from '@/components/skills/ReadingStudio';
import { WritingStudio } from '@/components/skills/WritingStudio';
import { PronunciationStudio } from '@/components/skills/PronunciationStudio';
import { GrammarStudio } from '@/components/skills/GrammarStudio';
import { InterviewStudio } from '@/components/skills/InterviewStudio';

export function SkillStudioPage({ skillId }) {
  const { navigate } = useRouter();

  const handleBack = () => {
    navigate('/skills');
  };

  switch (skillId) {
    case 'listening':
      return <DictationStudio onBack={handleBack} />;
    case 'speaking':
      return <ShadowingStudio onBack={handleBack} />;
    case 'reading':
      return <ReadingStudio onBack={handleBack} />;
    case 'writing':
      return <WritingStudio onBack={handleBack} />;
    case 'pronunciation':
      return <PronunciationStudio onBack={handleBack} />;
    case 'grammar':
      return <GrammarStudio onBack={handleBack} />;
    case 'interview':
      return <InterviewStudio onBack={handleBack} />;
    default:
      return <GrammarStudio onBack={handleBack} />;
  }
}
