import React, { useState } from 'react';
import { loadEngagementConfig, saveEngagementConfig } from '../services/engagementService';

export default function EngagementAdmin() {
  const [config, setConfig] = useState(loadEngagementConfig());
  const save = () => { saveEngagementConfig(config); alert('Configurações de engajamento salvas!'); };
  return <div className="space-y-6">
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6"><h2 className="text-xl font-black">Missões e Recompensas</h2><p className="text-xs font-bold text-slate-500 mt-1">Configure recompensa de login e metas diárias/semanais.</p></div>
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 grid grid-cols-2 gap-4">
      <label className="text-xs font-black">Moedas no login<input type="number" value={config.dailyLoginCoins} onChange={e=>setConfig({...config,dailyLoginCoins:Number(e.target.value)})} className="mt-2 w-full border-2 rounded-xl p-3"/></label>
      <label className="text-xs font-black">XP no login<input type="number" value={config.dailyLoginXp} onChange={e=>setConfig({...config,dailyLoginXp:Number(e.target.value)})} className="mt-2 w-full border-2 rounded-xl p-3"/></label>
    </div>
    <div className="space-y-3">{config.missions.map((m,i)=><div key={m.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4 grid md:grid-cols-5 gap-3 items-end"><div className="md:col-span-2"><span className="font-black text-sm">{m.emoji} {m.title}</span><p className="text-[10px] text-slate-500">{m.cadence === 'daily'?'Diária':'Semanal'} · {m.metric}</p></div><label className="text-[10px] font-black">META<input type="number" value={m.target} onChange={e=>{const missions=[...config.missions];missions[i]={...m,target:Number(e.target.value)};setConfig({...config,missions})}} className="mt-1 w-full border-2 rounded-lg p-2"/></label><label className="text-[10px] font-black">MOEDAS<input type="number" value={m.rewardCoins} onChange={e=>{const missions=[...config.missions];missions[i]={...m,rewardCoins:Number(e.target.value)};setConfig({...config,missions})}} className="mt-1 w-full border-2 rounded-lg p-2"/></label><label className="text-[10px] font-black">XP<input type="number" value={m.rewardXp} onChange={e=>{const missions=[...config.missions];missions[i]={...m,rewardXp:Number(e.target.value)};setConfig({...config,missions})}} className="mt-1 w-full border-2 rounded-lg p-2"/></label></div>)}</div>
    <button onClick={save} className="bg-emerald-500 text-white font-black px-6 py-3 rounded-xl">SALVAR CONFIGURAÇÕES</button>
  </div>;
}
