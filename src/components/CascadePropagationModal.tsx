import React from 'react';
import {
  X,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Film,
} from 'lucide-react';

export interface CascadeStep {
  key: string;
  name: string;
  layer: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  details?: string;
}

interface CascadePropagationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  steps: CascadeStep[];
  currentStepIndex: number;
  isComplete: boolean;
  error?: string | null;
}

export const CascadePropagationModal: React.FC<CascadePropagationModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  steps,
  currentStepIndex,
  isComplete,
  error,
}) => {
  if (!isOpen) return null;

  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => s.status === 'COMPLETED').length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalSteps) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw className={`w-5 h-5 ${!isComplete ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Propagación en Cascada del Director Ejecutivo
              </h3>
              <p className="text-xs text-slate-400">
                Sincronizando departamentos dependientes de "{projectTitle}"
              </p>
            </div>
          </div>

          {isComplete && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isComplete
                    ? '¡Propagación completada al 100%!'
                    : `Actualizando departamento ${currentStepIndex + 1} de ${totalSteps}...`}
                </span>
              </span>
              <span className="text-slate-400 font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Description banner */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              La directiva creativa de la Capa 0 (Showrunner) se propaga automáticamente hacia abajo. Cada departamento recalcula su entregable para mantener coherencia estética, tonal y dramática.
            </span>
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isRunning = step.status === 'RUNNING';
              const isDone = step.status === 'COMPLETED';
              const isErr = step.status === 'ERROR';

              return (
                <div
                  key={step.key}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                    isRunning
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                      : isDone
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : isErr
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950'
                          : isRunning
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : isErr
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isRunning ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <div>
                      <h4
                        className={`font-bold ${
                          isDone ? 'text-white' : isRunning ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {step.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{step.layer}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isRunning
                        ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                        : isErr
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? 'Sincronizado' : isRunning ? 'En Proceso...' : isErr ? 'Error' : 'En Espera'}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              Error durante la propagación: {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            disabled={!isComplete && !error}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer"
          >
            {isComplete ? 'Cerrar y Ver Resultados Sincronizados' : 'Propagando en curso...'}
          </button>
        </div>
      </div>
    </div>
  );
};
