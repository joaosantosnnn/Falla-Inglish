import React, { useState, useEffect } from 'react';
import { Mascot } from '../types';
import { Volume2, BellRing, Sparkles, Bell, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import licoMascot from '../assets/images/lico_mascot_1784292046285.jpg';
import teddyMascot from '../assets/images/teddy_mascot_1784292056581.jpg';
import lunaMascot from '../assets/images/luna_mascot_1784292067117.jpg';

const MASCOTS: Mascot[] = [
  {
    id: "lico",
    name: "Lico (O Livro Tagarela)",
    trait: "Sábio, curioso e super brincalhão.",
    role: "Guia Principal & Tutor de Gramática.",
    quote: "Cada página lida é um novo mundo descoberto! Sabia que falar mais de um idioma exercita o cérebro igual ginástica?",
    avatarUrl: licoMascot,
    styleColor: "from-blue-400 to-indigo-500",
    emoji: "📖"
  },
  {
    id: "teddy",
    name: "Teddy (O Ursinho Acolhedor)",
    trait: "Calmo, carinhoso e extremamente paciente.",
    role: "Guardião de Erros e Motivação.",
    quote: "Errar faz parte de aprender, amiguinho! Eu te dou um abraço quentinho de pelúcia e tentamos de novo juntas, ok?",
    avatarUrl: teddyMascot,
    styleColor: "from-amber-400 to-orange-500",
    emoji: "🧸"
  },
  {
    id: "luna",
    name: "Luna (A Coruja do Streak)",
    trait: "Determinada, focada e amante de café.",
    role: "Protetora de Ofensivas (Streaks) & Conforto.",
    quote: "Não deixe a chama apagar! Apenas 5 minutinhos de foco hoje garantem o seu futuro brilhando amanhã!",
    avatarUrl: lunaMascot,
    styleColor: "from-purple-400 to-pink-500",
    emoji: "🦉"
  },
  {
    id: "pip",
    name: "Pip (O Lápis Saltitante)",
    trait: "Enérgico, ansioso e criativo.",
    role: "Mestre das Dicas e Escrita.",
    quote: "Risque os seus medos! Vamos escrever palavras novas no ar e ver o vocabulário se materializar!",
    styleColor: "from-yellow-400 to-amber-500",
    emoji: "✏️"
  },
  {
    id: "estrela",
    name: "Estrela (A Estrela Guia)",
    trait: "Otimista nata, radiante e enérgica.",
    role: "Celebradora de Conquistas & Fim de Lição.",
    quote: "Você brilhou como uma super estrela hoje! Continue assim e logo vamos alcançar o topo das galáxias linguísticas!",
    styleColor: "from-yellow-300 to-yellow-500",
    emoji: "⭐"
  },
  {
    id: "tictac",
    name: "Tictac (O Relógio Apressado)",
    trait: "Pontual, focado e super dinâmico.",
    role: "Guardião de Desafios Diários.",
    quote: "Tique-taque! O tempo voa quando estamos nos divertindo. Conclua seu desafio rápido para ganhar bônus de XP!",
    styleColor: "from-rose-400 to-red-500",
    emoji: "⏰"
  },
  {
    id: "guga",
    name: "Guga (O Explorador)",
    trait: "Aventureiro, amigável e descolado.",
    role: "Líder de Conversação & Diálogos.",
    quote: "E aí, cara! Coloque a mochila nas costas e vamos desbravar o mundo conversando com novas pessoas!",
    styleColor: "from-teal-400 to-emerald-500",
    emoji: "👦"
  },
  {
    id: "bia",
    name: "Bia (A Cientista)",
    trait: "Analítica, inteligente e curiosa.",
    role: "Tutora de Testes de Nivelamento.",
    quote: "Minhas equações provam que você tem 99.8% de chances de dominar este idioma com dedicação!",
    styleColor: "from-sky-400 to-blue-500",
    emoji: "👧"
  },
  {
    id: "pingo",
    name: "Pingo (O Pinguim Poliglota)",
    trait: "Tímido na vida real, gigante nos idiomas.",
    role: "Tradutor & Curador Cultural.",
    quote: "No frio do polo sul, aprendi muitas línguas para me aquecer conversando. Deixe-me te contar uma gíria legal de lá!",
    styleColor: "from-cyan-400 to-blue-500",
    emoji: "🐧"
  },
  {
    id: "kiko",
    name: "Kiko (O Macaco Competidor)",
    trait: "Competitivo, brincalhão e engraçado.",
    role: "Mestre das Ligas & Competições.",
    quote: "Suba de galho em galho no ranking! Ninguém consegue acompanhar a nossa agilidade no topo da liga!",
    styleColor: "from-amber-600 to-yellow-700",
    emoji: "🐒"
  }
];

export default function MascotCard() {
  const [mascots, setMascots] = useState<Mascot[]>(MASCOTS);
  const [activeMascot, setActiveMascot] = useState<Mascot | null>(MASCOTS[0]);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        setPermissionStatus(permission);
        if (permission === "granted") {
          try {
            new Notification("Notificações Ativadas! 🎉", {
              body: "Parabéns! Você receberá mensagens e lembretes dos mascotes na barra de notificações do seu aparelho.",
              icon: '/favicon.ico'
            });
          } catch (e) {
            console.warn("Erro ao instanciar Notification de teste:", e);
          }
        }
      });
    } else {
      alert("Seu navegador ou dispositivo não oferece suporte a notificações nativas.");
    }
  };

  useEffect(() => {
    async function fetchMascots() {
      // 1. Start with static base ones + local storage
      const savedCustom = localStorage.getItem('falla_custom_mascots');
      let customList: Mascot[] = [];
      if (savedCustom) {
        try {
          customList = JSON.parse(savedCustom);
        } catch (e) {
          console.warn("Erro ao carregar mascotes customizados:", e);
        }
      }
      
      const combinedDefaultsAndLocal = [...MASCOTS];
      customList.forEach(c => {
        if (!combinedDefaultsAndLocal.some(m => m.id === c.id)) {
          combinedDefaultsAndLocal.push(c);
        }
      });
      
      setMascots(combinedDefaultsAndLocal);
      setActiveMascot(combinedDefaultsAndLocal[0]);

      // 2. Fetch from Supabase if configured
      try {
        const fetchPromise = supabase.from('mascots').select('*');
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout de conexão")), 4000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) throw error;
        if (data && data.length > 0) {
          const dbMascots: Mascot[] = data.map((m: any) => {
            let resolvedUrl = m.image_url;
            if (resolvedUrl && !resolvedUrl.startsWith('http')) {
              const supabaseUrl = (supabase as any).supabaseUrl || '';
              if (supabaseUrl) {
                resolvedUrl = `${supabaseUrl}/storage/v1/object/public/mascots/${resolvedUrl}`;
              }
            }

            return {
              id: m.id,
              name: m.name,
              trait: m.trait || m.description || '',
              role: m.role || '',
              quote: m.quote || '',
              avatarUrl: resolvedUrl || undefined,
              styleColor: m.style_color || 'from-blue-400 to-indigo-500',
              emoji: m.emoji || '🐾'
            };
          });

          const finalMascots = [...MASCOTS];
          dbMascots.forEach(dbm => {
            const idx = finalMascots.findIndex(item => item.id === dbm.id);
            if (idx >= 0) {
              finalMascots[idx] = dbm;
            } else {
              finalMascots.push(dbm);
            }
          });

          setMascots(finalMascots);
          setActiveMascot(finalMascots[0]);
        }
      } catch (e) {
        console.warn("Erro ao buscar mascotes do Supabase, usando fallback:", e);
      }
    }
    fetchMascots();
  }, []);

  const simulatePush = (mascot: Mascot) => {
    const textMsg = `[Notificação Push Simulada - ${mascot.name}]: "${mascot.quote.substring(0, 70)}..."`;
    setNotificationMsg(textMsg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 5000);

    // Dispatch Native Notification
    if ("Notification" in window) {
      const showNative = () => {
        try {
          const title = `Mascote ${mascot.name} do FALLA 🐾`;
          new Notification(title, {
            body: mascot.quote,
            icon: mascot.avatarUrl || '/favicon.ico',
            tag: `falla-mascot-${mascot.id}`,
            badge: '/favicon.ico',
          });
        } catch (err) {
          console.warn("Erro ao emitir Notification nativa:", err);
          // Fallback in case of service worker requirements in mobile
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(`Mascote ${mascot.name} do FALLA 🐾`, {
                body: mascot.quote,
                icon: mascot.avatarUrl || '/favicon.ico',
                tag: `falla-mascot-${mascot.id}`,
              });
            });
          }
        }
      };

      if (Notification.permission === "granted") {
        showNative();
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          setPermissionStatus(permission);
          if (permission === "granted") {
            showNative();
          }
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {notificationMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border-l-4 border-falla-blue text-white p-4.5 rounded-2xl shadow-2xl max-w-sm flex gap-3 items-center border-y border-y-slate-800">
          <BellRing className="text-falla-yellow shrink-0" size={24} />
          <div>
            <div className="text-xs font-black text-falla-blue flex items-center gap-1 uppercase tracking-wider">
              <span>FALLA Notificação</span>
              <Sparkles size={12} className="animate-spin-slow text-falla-yellow" />
            </div>
            <p className="text-xs text-slate-200 mt-1 font-bold">{notificationMsg}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-xs">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-1.5">
          🐾 Conheça os Mascotes do FALLA ({mascots.length})
        </h2>
        <p className="text-xs text-slate-500 font-bold">
          Temos mascotes com personalidades magnéticas projetados para guiar, comemorar, acolher erros e motivar o aprendizado em cada etapa do aplicativo mobile.
        </p>

        {/* Native Notification Permission Bar */}
        <div className="mt-4 p-4 rounded-2xl border-2 transition-all">
          {permissionStatus === "granted" ? (
            <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border-emerald-100">
              <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
              <div className="text-xs">
                <span className="font-black block uppercase tracking-wide text-[10px] text-emerald-600 mb-0.5">Notificações Ativas na Barra do Dispositivo</span>
                <p className="font-bold">O FALLA está autorizado! As notificações agora aparecem diretamente na barra de notificações do seu celular ou computador quando simuladas ou enviadas pelo painel.</p>
              </div>
            </div>
          ) : permissionStatus === "denied" ? (
            <div className="flex items-center gap-3 text-amber-700 bg-amber-50 border-amber-100">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <div className="text-xs">
                <span className="font-black block uppercase tracking-wide text-[10px] text-amber-600 mb-0.5">Notificações Bloqueadas</span>
                <p className="font-bold">As notificações do sistema estão desativadas. Para recebê-las na barra de notificações, clique no ícone de cadeado na barra de endereços do seu navegador e ative as Notificações.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sky-800 bg-sky-50 border-sky-100">
              <div className="flex items-start gap-3 text-xs">
                <Bell className="text-sky-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <span className="font-black block uppercase tracking-wide text-[10px] text-sky-600 mb-0.5">Deseja ver notificações na barra do seu aparelho?</span>
                  <p className="font-bold">Permita que o FALLA envie mensagens importantes diretamente na área de notificações do seu dispositivo (Android, iOS, PC).</p>
                </div>
              </div>
              <button
                onClick={requestPermission}
                className="bg-falla-blue hover:bg-falla-blue/90 text-white font-black text-[10px] px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider shadow-xs shrink-0 whitespace-nowrap cursor-pointer border-b-2 border-sky-600"
              >
                🔔 Ativar na Barra do Aparelho
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          {mascots.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMascot(m)}
              className={`flex flex-col items-center p-3 rounded-2xl border-2 text-center transition-all card-bouncy ${
                activeMascot?.id === m.id
                  ? 'bg-falla-blue/10 border-falla-blue ring-4 ring-sky-100 shadow-xs scale-[1.02]'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {m.avatarUrl ? (
                <img
                  src={m.avatarUrl}
                  alt={m.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border-2 border-slate-200 object-cover shadow-xs mb-2"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-2xs mb-2 border-2 border-slate-200">
                  {m.emoji}
                </div>
              )}
              <span className="text-[11px] font-black text-slate-700 truncate w-full">{m.name.split(' ')[0]}</span>
              <span className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide truncate w-full">{m.role.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {activeMascot && (
          <div className="mt-6 bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row gap-5 items-center">
            {activeMascot.avatarUrl ? (
              <img
                src={activeMascot.avatarUrl}
                alt={activeMascot.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-3xl border-2 border-slate-200 object-cover shadow-md shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center text-5xl border-2 border-slate-200 shadow-md shrink-0">
                {activeMascot.emoji}
              </div>
            )}
            
            <div className="space-y-2.5 flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <h3 className="font-black text-slate-800 text-lg flex items-center gap-1.5 tracking-tight">
                    {activeMascot.name}
                  </h3>
                  <p className="text-xs text-falla-blue font-black uppercase tracking-wider">{activeMascot.role}</p>
                </div>
                <button
                  onClick={() => simulatePush(activeMascot)}
                  className="bg-falla-blue hover:bg-falla-blue/90 border-b-4 border-b-sky-600 text-white font-black text-[10px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 shadow-xs shrink-0 self-start sm:self-center uppercase tracking-wider active:translate-y-0.5 active:border-b-0"
                >
                  <BellRing size={12} />
                  Simular Notificação
                </button>
              </div>

              <div className="text-xs space-y-2 bg-white p-4 rounded-2xl border-2 border-slate-150">
                <p className="text-slate-600 font-medium">
                  <strong className="text-slate-800 font-black">Traço Marcante:</strong> {activeMascot.trait}
                </p>
                <div className="border-t border-slate-100 pt-2 flex gap-2 items-start text-falla-blue">
                  <Volume2 size={16} className="shrink-0 mt-0.5 text-falla-blue animate-pulse" />
                  <p className="italic font-bold leading-relaxed text-falla-blue/90">
                    "{activeMascot.quote}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
