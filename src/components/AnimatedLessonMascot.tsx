import React from 'react';
import { motion } from 'motion/react';
import { Mascot } from '../types';

type MascotState = 'idle' | 'speaking' | 'listening' | 'correct' | 'wrong';

interface Props {
  mascot?: Mascot;
  moduleMascotUrl?: string | null;
  fallbackUrl?: string | null;
  fallbackEmoji: string;
  alt: string;
  state: MascotState;
}

export default function AnimatedLessonMascot({ mascot, moduleMascotUrl, fallbackUrl, fallbackEmoji, alt, state }: Props) {
  // A mídia do módulo tem prioridade e é reutilizada em todos os estados.
  // O movimento continua sendo aplicado pelo Motion, sem exigir arquivos separados.
  const source = moduleMascotUrl || mascot?.avatarUrl || fallbackUrl || undefined;

  const size = Math.min(220, Math.max(110, mascot?.lessonSize || 150));
  const animate = state === 'speaking'
    ? { y: [0, -3, 0], scale: [1, 1.035, 1], rotate: [0, -1, 1, 0] }
    : state === 'listening'
      ? { scale: [1, 1.025, 1] }
      : state === 'correct'
        ? { y: [0, -15, 0, -8, 0], rotate: [0, -4, 4, 0] }
        : state === 'wrong'
          ? { x: [0, -5, 5, -3, 3, 0] }
          : { y: [0, -4, 0], rotate: [0, -1.2, 1.2, 0] };

  return (
    <motion.div
      animate={animate}
      transition={{ duration: state === 'idle' ? 3.4 : 0.65, repeat: ['idle', 'speaking', 'listening'].includes(state) ? Infinity : 0, ease: 'easeInOut' }}
      className="relative shrink-0 flex items-end justify-center"
      style={{ width: size, height: size }}
      aria-label={`${alt} — ${state}`}
    >
      {source ? (
        <img
          key={`${state}-${source}`}
          src={source}
          alt={alt}
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain drop-shadow-lg select-none"
          draggable={false}
        />
      ) : (
        <div className="h-full w-full rounded-[2rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-6xl shadow-md">
          {fallbackEmoji}
        </div>
      )}
      {state === 'speaking' && (
        <span className="absolute right-1 bottom-2 flex items-end gap-1 rounded-full bg-white/90 px-2 py-1 shadow">
          <i className="block h-2 w-1 rounded-full bg-sky-400 animate-pulse" />
          <i className="block h-4 w-1 rounded-full bg-sky-500 animate-pulse" />
          <i className="block h-3 w-1 rounded-full bg-sky-400 animate-pulse" />
        </span>
      )}
    </motion.div>
  );
}
