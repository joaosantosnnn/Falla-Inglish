import React, { useMemo, useState } from 'react';
import { Check, Globe2, Search, X } from 'lucide-react';
import { APP_LOCALES, saveLocalLanguage } from '../services/localePreferences';

interface LocalLanguageModalProps {
  open: boolean;
  currentLocale: string;
  onClose: () => void;
  onChange: (locale: string) => void;
}

export default function LocalLanguageModal({ open, currentLocale, onClose, onChange }: LocalLanguageModalProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return APP_LOCALES;
    return APP_LOCALES.filter(item => `${item.label} ${item.nativeLabel} ${item.code}`.toLowerCase().includes(normalized));
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[88vh] bg-white rounded-3xl border-2 border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-800 flex items-center gap-2"><Globe2 size={20} /> Idioma local</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">Define o idioma da interface, explicações e traduções.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500" aria-label="Fechar"><X size={20} /></button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <label className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 px-3 py-2.5">
            <Search size={17} className="text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} className="w-full outline-none text-sm font-bold" placeholder="Buscar idioma" />
          </label>
        </div>

        <div className="overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map(item => {
            const selected = item.code === currentLocale;
            return (
              <button
                key={item.code}
                onClick={() => {
                  const saved = saveLocalLanguage(item.code);
                  onChange(saved);
                  onClose();
                }}
                className={`text-left rounded-2xl border-2 p-3 flex items-center gap-3 transition ${selected ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-300'}`}
              >
                <span className="text-2xl">{item.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-800 truncate">{item.nativeLabel}</span>
                  <span className="block text-[10px] font-bold text-slate-400 truncate">{item.label}</span>
                </span>
                {selected && <Check size={18} className="text-sky-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
