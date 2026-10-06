import React from 'react';
import { X, Sparkles, Check, Film, Zap, Layers, Video } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSubscribe: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onDismiss,
  onSubscribe,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onDismiss}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/20">
            <Sparkles className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h3 className="text-2xl font-black text-white mb-1.5">
            CINE AI STUDIO <span className="text-amber-400">PRO</span>
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
            Lleva tu visión cinematográfica al siguiente nivel sin límites de creación ni restricciones de cuota.
          </p>
        </div>

        {/* Benefits list */}
        <div className="space-y-3 mb-8 relative z-10">
          {[
            { icon: Film, title: 'Proyectos ilimitados', desc: 'Crea y conserva cuantas biblias y cortos desees.' },
            { icon: Layers, title: 'Orquestación de las 7 Capas completas', desc: 'Acceso inmediato a los 24 subagentes especializados.' },
            { icon: Video, title: 'Exportación multi-proveedor', desc: 'Prompts y directivas para Runway, Luma, Kling y Sora.' },
            { icon: Zap, title: 'Prioridad de cálculo sin esperas', desc: 'Respuestas de alta velocidad y máxima cuota en servidor.' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade Button */}
        <div className="space-y-3 text-center relative z-10">
          <button
            onClick={onSubscribe}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>Desbloquear Cine AI Studio Pro</span>
            <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded font-mono font-bold">
              $9.99 / mes
            </span>
          </button>

          <button
            onClick={onDismiss}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Continuar en plan gratuito (1 proyecto)
          </button>
        </div>
      </div>
    </div>
  );
};
