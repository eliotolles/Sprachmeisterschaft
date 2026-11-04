import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {elioClient} from '@/lib/elio-auth-runtime';
import {speakingCoreActive} from '@/lib/elio-speaking-runtime';
import {createSpeechPlayer} from '@/core/elio/browser-audio';
import {toast} from 'sonner';
import { speakGerman } from '@/lib/algorithms';

export function SpeakButton({ text, className = '', size = 'md', slow = false }) {
  const [playing, setPlaying] = useState(false);
  const [player]=useState(()=>createSpeechPlayer({client:elioClient}));
  useEffect(()=>{const stop=()=>{player.stop();setPlaying(false);};window.addEventListener('sprach_auth_change',stop);return()=>{player.stop();window.removeEventListener('sprach_auth_change',stop);};},[player]);

  const handleSpeak = async (e) => {
    e.stopPropagation();
    if (!text) return;
    if(!slow && speakingCoreActive()){if(playing){player.stop();setPlaying(false);return;}setPlaying(true);try{await player.play(text);}catch(error){if(error.code!=='ACCOUNT_CHANGED')toast.error(error.message);}finally{setPlaying(false);}return;}
    setPlaying(true);
    speakGerman(text, slow ? 0.65 : undefined);
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
      title={slow ? "Nghe phát âm chậm" : "Nghe phát âm tiếng Đức"}
      aria-label={slow ? "Nghe phát âm chậm" : "Nghe phát âm tiếng Đức"}
      className={`tap inline-flex items-center justify-center rounded-sm border border-border bg-card/60 hover:bg-accent/10 hover:text-accent hover:border-accent/30 text-muted-foreground transition-colors ${sizeClasses} ${className}`}
    >
      <Volume2 className={`w-full h-full ${playing ? 'text-accent scale-110 animate-pulse' : ''}`} />
    </button>
  );
}
