import React, { useEffect, useMemo, useState } from 'react';
import { Check, Crown, Save, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  DEFAULT_PREMIUM_FEATURES,
  DEFAULT_PREMIUM_PLANS,
  loadPremiumFeatures,
  loadPremiumPlans,
  PremiumFeature,
  PremiumPlanConfig,
  savePremiumFeatures,
  savePremiumPlans,
} from '../services/premiumService';

export default function PremiumAdmin() {
  const [features, setFeatures] = useState<PremiumFeature[]>(DEFAULT_PREMIUM_FEATURES);
  const [plans, setPlans] = useState<PremiumPlanConfig[]>(DEFAULT_PREMIUM_PLANS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([loadPremiumFeatures(), loadPremiumPlans()])
      .then(([loadedFeatures, loadedPlans]) => {
        setFeatures(loadedFeatures);
        setPlans(loadedPlans);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeBenefits = useMemo(() => features.filter((item) => item.enabled).length, [features]);

  const updatePlan = (id: string, patch: Partial<PremiumPlanConfig>) => {
    setPlans((current) => current.map((plan) => plan.id === id ? { ...plan, ...patch } : plan));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await Promise.all([savePremiumFeatures(features), savePremiumPlans(plans)]);
      setMessage('Configuração Premium salva com sucesso.');
    } catch (error: any) {
      setMessage(`Configuração salva localmente, mas o Supabase respondeu: ${error?.message || 'erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border-2 border-slate-200 bg-white p-8 text-center text-xs font-black text-slate-500">Carregando configurações Premium...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-700">
              <Crown size={20} />
              <h3 className="text-base font-black">Base do FALLA Premium</h3>
            </div>
            <p className="mt-1 max-w-2xl text-[11px] font-bold leading-relaxed text-slate-500">
              Ative ou desative benefícios e ajuste os planos sem precisar alterar o código. Os próximos recursos Premium usarão estas permissões.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-center">
            <strong className="block text-xl font-black text-violet-700">{activeBenefits}</strong>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">benefícios ativos</span>
          </div>
        </div>
      </section>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] font-black text-emerald-800">
          <Check size={15} /> {message}
        </div>
      )}

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={17} className="text-violet-600" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wide text-slate-800">Benefícios configuráveis</h4>
            <p className="text-[10px] font-bold text-slate-400">Desativar um benefício o remove da oferta e bloqueia seu uso.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {features.map((feature) => (
            <button
              key={feature.key}
              type="button"
              onClick={() => setFeatures((current) => current.map((item) => item.key === feature.key ? { ...item, enabled: !item.enabled } : item))}
              className={`flex items-start justify-between gap-3 rounded-2xl border-2 p-4 text-left transition-all ${feature.enabled ? 'border-violet-200 bg-violet-50/60' : 'border-slate-200 bg-slate-50 opacity-70'}`}
            >
              <div>
                <p className="text-xs font-black text-slate-800">{feature.name}</p>
                <p className="mt-1 text-[10px] font-bold leading-relaxed text-slate-500">{feature.description}</p>
              </div>
              {feature.enabled ? <ToggleRight className="shrink-0 text-violet-600" size={26} /> : <ToggleLeft className="shrink-0 text-slate-400" size={26} />}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h4 className="text-xs font-black uppercase tracking-wide text-slate-800">Planos disponíveis</h4>
          <p className="text-[10px] font-bold text-slate-400">Os valores são salvos em centavos para evitar erros de arredondamento.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="space-y-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <input
                  value={plan.name}
                  onChange={(event) => updatePlan(plan.id, { name: event.target.value })}
                  className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                />
                <button type="button" onClick={() => updatePlan(plan.id, { active: !plan.active })} className="shrink-0">
                  {plan.active ? <ToggleRight size={28} className="text-violet-600" /> : <ToggleLeft size={28} className="text-slate-400" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                  Preço em reais
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(plan.priceCents / 100).toFixed(2)}
                    onChange={(event) => updatePlan(plan.id, { priceCents: Math.round(Number(event.target.value || 0) * 100) })}
                    className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                  />
                </label>
                <label className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                  Cobrança
                  <select
                    value={plan.billingCycle}
                    onChange={(event) => updatePlan(plan.id, { billingCycle: event.target.value as PremiumPlanConfig['billingCycle'] })}
                    className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="annual">Anual</option>
                    <option value="lifetime">Vitalício</option>
                  </select>
                </label>
              </div>
              <p className="text-[9px] font-bold text-slate-400">{plan.featureKeys.length} benefícios vinculados</p>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-violet-800 bg-violet-600 py-3 text-xs font-black uppercase text-white transition-all hover:bg-violet-700 disabled:opacity-60"
      >
        <Save size={16} /> {saving ? 'Salvando...' : 'Salvar configuração Premium'}
      </button>
    </div>
  );
}
