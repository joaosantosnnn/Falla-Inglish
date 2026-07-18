import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Trophy, Globe, MapPin, TrendingUp, Sparkles } from 'lucide-react';

interface LeaderboardProps {
  userXp: number;
  userStreak: number;
  userState: string;
  userCountry: string;
}

export default function Leaderboard({ userXp, userStreak, userState, userCountry }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'global' | 'regional' | 'pais'>('global');

  // Fetch from Supabase
  const fetchLeaderboard = async () => {
    try {
      // Race leaderboard query against a 4-second timeout to prevent infinite loading state
      const fetchPromise = supabase
        .from('leaderboard')
        .select('*')
        .order('xp', { ascending: false });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout de conexão")), 4000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        throw error;
      }
      
      // Inject user's live values
      const userEntry: LeaderboardEntry = {
        id: "user",
        name: "Você (Estudante)",
        xp: userXp,
        streak: userStreak,
        state: userState,
        country: userCountry,
        avatar: "🎓",
        isUser: true
      };

      const combined = [...(data || []), userEntry];
      // Sort combined
      combined.sort((a, b) => b.xp - a.xp);
      setEntries(combined);
      setLoading(false);
    } catch (e: any) {
      console.error("Erro ao buscar o ranking no Supabase:", e);
      // Fallback offline mock database to guarantee uninterrupted play
      const fallbackData = [
        { id: "1", name: "Davi", xp: 1240, streak: 45, state: "SP", country: "🇧🇷 Brasil", avatar: "🦊" },
        { id: "2", name: "Alice", xp: 1100, streak: 32, state: "RJ", country: "🇧🇷 Brasil", avatar: "🐼" },
        { id: "3", name: "Gabriel", xp: 950, streak: 12, state: "MG", country: "🇧🇷 Brasil", avatar: "🐸" },
        { id: "4", name: "Lucas", xp: 870, streak: 8, state: "RS", country: "🇧🇷 Brasil", avatar: "🐯" },
        { id: "5", name: "Manuela", xp: 820, streak: 15, state: "BA", country: "🇧🇷 Brasil", avatar: "🦁" },
        { id: "6", name: "Mateo", xp: 740, streak: 20, state: "Madrid", country: "🇪🇸 Espanha", avatar: "🐒" },
        { id: "7", name: "Sofia", xp: 690, streak: 19, state: "Lisboa", country: "🇵🇹 Portugal", avatar: "🦄" },
        { id: "8", name: "Emma", xp: 620, streak: 5, state: "California", country: "🇺🇸 EUA", avatar: "🐻" },
      ];
      
      const userEntry: LeaderboardEntry = {
        id: "user",
        name: "Você (Estudante)",
        xp: userXp,
        streak: userStreak,
        state: userState,
        country: userCountry,
        avatar: "🎓",
        isUser: true
      };

      const combined = [...fallbackData, userEntry];
      combined.sort((a, b) => b.xp - a.xp);
      setEntries(combined);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Refresh ranking entries every 6 seconds to simulate true active real-time updates!
    const interval = setInterval(fetchLeaderboard, 6000);
    return () => clearInterval(interval);
  }, [userXp, userStreak, userState, userCountry]);

  // Apply filters
  const filteredEntries = entries.filter(entry => {
    if (filterType === 'regional') {
      return entry.state.toLowerCase() === userState.toLowerCase() || entry.isUser;
    }
    if (filterType === 'pais') {
      return entry.country.toLowerCase().includes(userCountry.toLowerCase()) || entry.isUser;
    }
    return true; // Global
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <span className="text-xl animate-bounce">🏆</span>
            Liga de Líderes FALLA
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1 uppercase tracking-wider">
            <span>✨</span> Classificação ao Vivo
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterType('global')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              filterType === 'global' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe size={11} />
            Mundo
          </button>
          <button
            onClick={() => setFilterType('pais')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              filterType === 'pais' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapPin size={11} />
            País ({userCountry.split(' ')[0]})
          </button>
          <button
            onClick={() => setFilterType('regional')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              filterType === 'regional' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp size={11} />
            Estado ({userState})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-medium">Carregando liga ao vivo...</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredEntries.map((entry, index) => {
            const rank = index + 1;
            const rankBg = rank === 1 ? 'bg-falla-yellow text-slate-900 border-2 border-yellow-500 shadow-xs' : rank === 2 ? 'bg-slate-300 text-slate-800 border-2 border-slate-400 shadow-xs' : rank === 3 ? 'bg-falla-orange text-white border-2 border-orange-600 shadow-xs' : 'bg-slate-100 text-slate-500 border border-slate-250';
            
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all card-bouncy ${
                  entry.isUser 
                    ? 'bg-falla-blue/10 border-falla-blue shadow-sm font-bold scale-[1.01]' 
                    : 'bg-white hover:bg-slate-50/50 border-slate-150'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Position */}
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${rankBg}`}>
                    {rank}
                  </span>
                  
                  {/* Avatar emoji */}
                  <span className="text-2xl w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                    {entry.avatar}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-800 truncate">{entry.name}</span>
                      {entry.isUser && (
                        <span className="bg-falla-green text-white text-[7px] px-1.5 py-0.5 rounded-full font-black tracking-wider shadow-xs">VOCÊ</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold mt-0.5">
                      <MapPin size={9} className="text-slate-400 shrink-0" />
                      <span className="truncate">{entry.state}, {entry.country}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-bold text-xs">
                  <div className="text-right">
                    <div className="text-slate-800 font-black">{entry.xp} XP</div>
                    <div className="text-[9px] text-falla-orange font-black flex items-center justify-end gap-0.5 mt-0.5">
                      🔥 {entry.streak}d
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
