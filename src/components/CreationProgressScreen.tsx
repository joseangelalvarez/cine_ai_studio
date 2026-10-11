import React from 'react';
import { Check, AlertTriangle, Play, RotateCcw } from 'lucide-react';
import { MovieProject } from '../types';

interface CreationProgressScreenProps {
  project: MovieProject | null;
  progressStepIndex: number;
  totalSteps: number;
  progressMessage: string;
  renderingStatus: string;
  lastGenerationError: string | null;
  onRetry: () => void;
  onGoToProject: () => void;
  onOpenProviderSettings?: () => void;
}

export const CreationProgressScreen: React.FC<CreationProgressScreenProps> = ({
  project,
  progressStepIndex,
  totalSteps,
  progressMessage,
  renderingStatus,
  lastGenerationError,
  onRetry,
  onGoToProject,
  onOpenProviderSettings,
}) => {
  const isCompleted = renderingStatus === 'COMPLETED';
  const progressPercent = isCompleted
    ? 100
    : Math.min(100, Math.round((progressStepIndex / totalSteps) * 100));

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-6 max-w-xl mx-auto">
      {isCompleted ? (
        /* COMPLETED STATE */
        <div className="flex flex-col items-center text-center animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
            <Check className="w-12 h-12 text-emerald-400 stroke-[3]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            ¡Preproducción Completada con Éxito!
          </h2>

          <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
            Los 24 departamentos han finalizado sus entregables técnicos con modelos de IA reales. Tu biblia narrativa, diseño de personajes y prompts compilados están listos en el estudio.
          </p>

          <button
            onClick={onGoToProject}
            data-testid="progress_finish_button"
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explorar Galería de Producción</span>
            <Play className="w-4 h-4 fill-slate-950" />
          </button>
        </div>
      ) : lastGenerationError ? (
        /* ERROR STATE */
        <div className="flex flex-col items-center text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/15 border-2 border-rose-500 flex items-center justify-center mb-5">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>

          <h3 className="text-xl font-bold text-rose-400 mb-2">
            Generación Interrumpida
          </h3>

          <p className="text-slate-400 text-xs sm:text-sm mb-4">
            La llamada a los modelos de IA se detuvo debido a un problema con la clave API, cuenta o cuota del proveedor.
          </p>

          {/* Error detail */}
          <div className="w-full p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-left mb-5">
            <span className="text-[11px] font-bold text-rose-400 block mb-1 uppercase tracking-wider">
              Diagnóstico técnico:
            </span>
            <p className="text-xs text-rose-200 font-mono break-words leading-relaxed">
              {lastGenerationError}
            </p>
          </div>

          <div className="w-full space-y-2.5">
            {onOpenProviderSettings && (
              <button
                onClick={onOpenProviderSettings}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>🔑 Configurar API Key / Cambiar Proveedor</span>
              </button>
            )}

            <button
              onClick={onRetry}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                onOpenProviderSettings
                  ? 'border border-slate-700 hover:bg-slate-800 text-slate-200'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar Llamada al Proveedor</span>
            </button>

            <button
              onClick={onGoToProject}
              className="w-full py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Ir al Proyecto (Revisar avances guardados)
            </button>
          </div>
        </div>
      ) : (
        /* IN PROGRESS STATE */
        <div className="flex flex-col items-center text-center w-full max-w-md animate-fade-in">
          {/* Circular Progress Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-amber-500 transition-all duration-500 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white font-mono">
                {progressPercent}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Paso {progressStepIndex + 1} de {totalSteps}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xl font-bold text-white">
              Ejecutando Pipeline Cinematográfico...
            </h3>
          </div>

          {/* Current action card with pulse dot */}
          <div className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3.5 text-left shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
            <p className="text-xs sm:text-sm text-slate-200 font-medium">
              {progressMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
