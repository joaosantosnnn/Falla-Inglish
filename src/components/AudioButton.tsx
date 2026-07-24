import React, { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speechService } from '../services/speechService';

interface AudioButtonProps {
  text: string;
  label?: string;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export default function AudioButton({
  text,
  label = 'Ouvir',
  compact = false,
  className = '',
  disabled = false,
  onError,
}: AudioButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => () => speechService.stop(), []);

  const activate = async (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      window.dispatchEvent(new CustomEvent('falla:speech-end', { detail: { text } }));
      return;
    }

    try {
      setIsSpeaking(true);
      window.dispatchEvent(new CustomEvent('falla:speech-start', { detail: { text } }));
      await speechService.speak(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível reproduzir o áudio.';
      onError?.(message);
    } finally {
      setIsSpeaking(false);
      window.dispatchEvent(new CustomEvent('falla:speech-end', { detail: { text } }));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      void activate(event);
    }
  };

  const isDisabled = disabled || !text.trim();

  return (
    <span
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      onClick={isDisabled ? undefined : activate}
      onKeyDown={isDisabled ? undefined : handleKeyDown}
      aria-label={`${isSpeaking ? 'Parar áudio' : 'Ouvir em inglês'}: ${text}`}
      title={isSpeaking ? 'Parar áudio' : 'Ouvir em inglês'}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white font-black text-falla-blue shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
        compact ? 'h-8 w-8 p-0' : 'px-3 py-2 text-xs'
      } ${className}`}
    >
      {isSpeaking ? <Square size={compact ? 14 : 15} fill="currentColor" /> : <Volume2 size={compact ? 16 : 17} />}
      {!compact && <span>{isSpeaking ? 'Parar' : label}</span>}
    </span>
  );
}
