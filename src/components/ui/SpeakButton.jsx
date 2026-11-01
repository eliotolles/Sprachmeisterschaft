import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakGerman } from '@/lib/algorithms';

export function SpeakButton({ text, className = '', size = 'md' }) {
  const [playing, setPlaying] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (!text) return;
    setPlaying(true);
    speakGerman(text);
    setTimeout(() => setPlaying(false), 1200);
  };

  const sizeClasses = {
    sm: 'w-7 h-7 p-1 text-xs',
    md: 'w-8 h-8 p-1.5 text-sm',
    lg: 'w-10 h-10 p-2 text-base',
  }[size] || 'w-8 h-8 p-1.5';

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title="Nghe phát âm chuẩn tiếng Đức"
      className={`tap inline-flex items-center justify-center rounded-sm border border-border bg-card/60 hover:bg-accent/10 hover:text-accent hover:border-accent/30 text-muted-foreground transition-colors ${sizeClasses} ${className}`}
    >
      <Volume2 className={`w-full h-full ${playing ? 'text-accent scale-110 animate-pulse' : ''}`} />
    </button>
  );
}
