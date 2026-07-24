import React from 'react';
import { Backpack } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  onUseItem: (itemId: string) => void;
  onGoToShop: () => void;
}

export default function Inventory({ items, onUseItem, onGoToShop }: InventoryProps) {
  const hasItems = items && items.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bag Hero Banner - kept visually consistent with other section banners (Loja, Planos) */}
      <div className="bg-gradient-to-r from-falla-green to-emerald-600 text-white rounded-3xl p-6 md:p-8 shadow-md border-b-4 border-emerald-700 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
        <div className="space-y-2">
          <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
            Seus Itens Guardados 🎒
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Backpack size={26} /> Minha Bolsa
          </h2>
          <p className="text-xs md:text-sm font-bold text-emerald-50 leading-relaxed max-w-xl">
            Tudo o que você compra na Loja fica guardado aqui. Use suas poções e vantagens quando quiser!
          </p>
        </div>
      </div>

      {!hasItems ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-10 shadow-2xs text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-center text-slate-300">
            <Backpack size={32} />
          </div>
          <h3 className="text-sm font-black text-slate-700">Sua bolsa está vazia</h3>
          <p className="text-xs text-slate-400 font-bold max-w-sm">
            Vá até a Loja para comprar poções e vantagens especiais. Elas aparecerão aqui assim que você comprar!
          </p>
          <button
            onClick={onGoToShop}
            className="mt-2 bg-falla-green hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase border-b-4 border-b-emerald-700 active:translate-y-0.5 transition-all cursor-pointer"
          >
            Visitar a Loja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.itemId}
              className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col items-center text-center gap-2 relative"
            >
              {item.type === 'consumable' && item.quantity > 1 && (
                <span className="absolute -top-2 -right-2 bg-falla-pink text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {item.quantity}
                </span>
              )}
              <span className="text-3xl bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-slate-150 shadow-2xs">
                {item.icon}
              </span>
              <div>
                <h5 className="text-xs font-black text-slate-800 leading-tight">{item.name}</h5>
                <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">
                  {item.benefit}
                </span>
              </div>
              {item.type === 'consumable' ? (
                <button
                  onClick={() => onUseItem(item.itemId)}
                  className="mt-1 w-full bg-falla-blue hover:bg-sky-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border-b-4 border-b-sky-700 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  Usar
                </button>
              ) : (
                <span className="mt-1 text-[9px] font-black uppercase text-slate-400 tracking-wide">Item Cosmético</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
