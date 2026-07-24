import React, { useEffect, useMemo, useState } from 'react';
import { Check, Gift, Lock, Sparkles, Trophy } from 'lucide-react';
import { claimDailyLogin, claimMission, canClaimDailyLogin, loadEngagementConfig, loadMissionProgress, MissionCadence } from '../services/engagementService';

interface Props {
  isPremium: boolean;
  onReward: (coins: number, xp: number, message: string) => void;
}

export default function MissionCenter({ isPremium, onReward }: Props) {
  const [version, setVersion] = useState(0);
  const config = useMemo(() => loadEngagementConfig(), [version]);
  const progress = useMemo(() => loadMissionProgress(), [version]);
  const [cadence, setCadence] = useState<MissionCadence>('daily');

  useEffect(() => {
    const refresh = () => setVersion(v => v + 1);
    window.addEventListener('falla-missions-updated', refresh);
    window.addEventListener('falla-engagement-updated', refresh);
    return () => {
      window.removeEventListener('falla-missions-updated', refresh);
      window.removeEventListener('falla-engagement-updated', refresh);
    };
  }, []);

  const loginAvailable = canClaimDailyLogin();
  const missions = config.missions.filter(m => m.cadence === cadence);

  return <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-16">
    <div className="rounded-3xl p-6 text-white bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.2em] opacity-80">Entrega 5</p><h2 className="text-2xl font-black mt-1">Missões & Recompensas</h2><p className="text-xs font-bold mt-2 opacity-85">Complete metas, resgate prêmios e mantenha seu ritmo de estudos.</p></div>
        <Trophy className="w-14 h-14 opacity-80" />
      </div>
    </div>

    <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl">🎁</div><div><h3 className="font-black text-slate-800">Recompensa diária</h3><p className="text-xs font-bold text-slate-500">Volte todos os dias e receba {config.dailyLoginCoins} moedas + {config.dailyLoginXp} XP.</p></div></div>
      <button disabled={!loginAvailable} onClick={() => { const reward = claimDailyLogin(); if (reward) { onReward(reward.coins, reward.xp, 'Recompensa diária resgatada!'); setVersion(v => v + 1); } }} className={`px-5 py-3 rounded-xl text-xs font-black ${loginAvailable ? 'bg-amber-400 text-amber-950 hover:scale-105' : 'bg-slate-100 text-slate-400'}`}>{loginAvailable ? 'RESGATAR' : 'RESGATADO HOJE'}</button>
    </div>

    <div className="flex gap-2 bg-white border-2 border-slate-200 p-2 rounded-2xl w-fit">
      {(['daily','weekly'] as MissionCadence[]).map(c => <button key={c} onClick={() => setCadence(c)} className={`px-5 py-2.5 rounded-xl text-xs font-black ${cadence === c ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>{c === 'daily' ? 'DIÁRIAS' : 'SEMANAIS'}</button>)}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {missions.map(mission => {
        const value = progress.values[mission.id] || 0;
        const completed = value >= mission.target;
        const claimed = progress.claimed.includes(mission.id);
        const locked = !!mission.premium && !isPremium;
        const pct = Math.min(100, Math.round(value / mission.target * 100));
        return <div key={mission.id} className={`bg-white border-2 rounded-3xl p-5 ${completed ? 'border-emerald-300' : 'border-slate-200'} ${locked ? 'opacity-70' : ''}`}>
          <div className="flex justify-between gap-3"><div className="flex gap-3"><div className="text-3xl">{mission.emoji}</div><div><div className="flex items-center gap-2"><h3 className="font-black text-slate-800">{mission.title}</h3>{mission.premium && <span className="text-[9px] font-black bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">PREMIUM</span>}</div><p className="text-xs font-bold text-slate-500 mt-1">{mission.description}</p></div></div>{locked && <Lock className="w-5 h-5 text-purple-500" />}</div>
          <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500" style={{width: `${pct}%`}} /></div>
          <div className="flex items-center justify-between mt-3"><span className="text-xs font-black text-slate-500">{value}/{mission.target}</span><span className="text-xs font-black text-amber-600">🪙 {mission.rewardCoins} · ✨ {mission.rewardXp} XP</span></div>
          <button disabled={locked || !completed || claimed} onClick={() => { const reward = claimMission(mission.id); if (reward) { onReward(reward.coins, reward.xp, `Missão concluída: ${mission.title}`); setVersion(v => v + 1); } }} className={`mt-4 w-full py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 ${claimed ? 'bg-emerald-50 text-emerald-600' : completed && !locked ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{claimed ? <><Check className="w-4 h-4"/> RESGATADO</> : locked ? <><Lock className="w-4 h-4"/> EXCLUSIVO PREMIUM</> : completed ? <><Gift className="w-4 h-4"/> RESGATAR RECOMPENSA</> : <><Sparkles className="w-4 h-4"/> EM PROGRESSO</>}</button>
        </div>
      })}
    </div>
  </div>;
}
