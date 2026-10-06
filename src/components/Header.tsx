import React from 'react';
import { Film, Coins, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  credits: number;
  isPremium: boolean;
  onOpenCreditsModal: () => void;
  onOpenPaywallModal: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  credits,
  isPremium,
  onOpenCreditsModal,
  onOpenPaywallModal,
  onNavigateHome,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div 
        onClick={onNavigateHome}
        className="flex items-center gap-3 cursor-pointer group select-none"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
          <Film className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black tracking-wider text-white text-base lg:text-lg group-hover:text-amber-400 transition-colors">
              CINE AI STUDIO
            </h1>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Motor activo" />
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Orquestación de preproducción cinematográfica multi-capa
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pro / Free Badge */}
        {isPremium ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PRO</span>
          </div>
        ) : (
          <button
            onClick={onOpenPaywallModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Mejorar a</span> PRO
          </button>
        )}

        {/* Credits Counter */}
        <button
          onClick={onOpenCreditsModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:border-amber-500/40"
          title="Recargar créditos"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{credits}</span>
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
            + Recargar
          </span>
        </button>
      </div>
    </header>
  );
};
