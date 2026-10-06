import React from 'react';
import { X, Coins, Sparkles, Check } from 'lucide-react';

interface CreditsModalProps {
  currentCredits: number;
  isOpen: boolean;
  onClose: () => void;
  onBuyCredits: (amount: number) => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({
  currentCredits,
  isOpen,
  onClose,
  onBuyCredits,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Recargar Créditos</h3>
            <p className="text-xs text-slate-400">Pay Per Request: Pagas lo que usas</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          Obtén créditos para ejecutar orquestadores premium (generadores de imagen, video y audio) y compilar packages de dirección cinematográfica complejos.
        </p>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Tus créditos actuales:</span>
          <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
            <Coins className="w-4 h-4" />
            {currentCredits}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          {/* Option 1 */}
          <div
            onClick={() => onBuyCredits(100)}
            className="p-4 rounded-2xl border border-slate-800 hover:border-amber-500 bg-slate-850 hover:bg-slate-800/80 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">100 Créditos</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Básico</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Suficiente para ~10 ejecuciones completas</p>
            </div>
            <span className="text-sm font-black text-amber-400 group-hover:scale-105 transition-transform">
              $1.00 USD
            </span>
          </div>

          {/* Option 2 */}
          <div
            onClick={() => onBuyCredits(500)}
            className="p-4 rounded-2xl border-2 border-amber-500/80 hover:border-amber-400 bg-amber-500/10 cursor-pointer transition-all flex items-center justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl">
              Popular
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">500 Créditos</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Para producciones cinematográficas intensivas</p>
            </div>
            <span className="text-sm font-black text-amber-400 group-hover:scale-105 transition-transform">
              $4.50 USD
            </span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
