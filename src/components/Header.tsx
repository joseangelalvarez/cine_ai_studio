import React from 'react';
import { Film, Sparkles, SlidersHorizontal, Cpu, Coins } from 'lucide-react';
import { ProviderSettings } from '../types';
import { StorageService } from '../storage';

interface HeaderProps {
  onNavigateHome: () => void;
  providerSettings: ProviderSettings;
  onOpenProviderSettings: () => void;
  onOpenTokensCosts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
  providerSettings,
  onOpenProviderSettings,
  onOpenTokensCosts,
}) => {
  const providerLabel =
    providerSettings.textProvider === 'openai'
      ? 'OpenAI'
      : providerSettings.textProvider === 'anthropic'
      ? 'Anthropic'
      : 'Google';

  const realCost = typeof StorageService?.getRealCostUsd === 'function' ? StorageService.getRealCostUsd() : 0;

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between">
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
            Preproducción cinematográfica & guion técnico con LLMs
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Tokens & Costes Button */}
        <button
          onClick={onOpenTokensCosts}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm group"
          title="Ver balance de tokens y costes reales en USD de la sesión"
          data-testid="tokens-and-costs-btn"
        >
          <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Coste Real</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-slate-950 font-black font-mono">
            ${realCost.toFixed(4)}
          </span>
        </button>

        {/* Active Provider Badge & Button */}
        <button
          onClick={onOpenProviderSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-amber-500/50 text-xs transition-all cursor-pointer group"
          title="Configurar motores de IA y proveedores"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium hidden md:inline">{providerLabel}:</span>
          <span className="text-amber-400 font-mono text-[11px] font-semibold">
            {providerSettings.textModel}
          </span>
          <div className="p-1 rounded-md bg-slate-700/50 group-hover:bg-amber-500/20 group-hover:text-amber-400 text-slate-400 ml-1">
            <SlidersHorizontal className="w-3 h-3" />
          </div>
        </button>

        {/* Video Storyboard Engine Indicator */}
        <button
          onClick={onOpenProviderSettings}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/70 text-slate-300 text-xs font-semibold hover:border-amber-500/30 transition-colors cursor-pointer"
          title="Prompts optimizados para generadores de video"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="capitalize">{providerSettings.videoProvider.replace('-', ' ')}</span>
        </button>
      </div>
    </header>
  );
};


