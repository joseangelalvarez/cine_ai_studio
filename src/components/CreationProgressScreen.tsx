import React from 'react';
import { Check, AlertTriangle, Play, Sparkles, Video, Volume2, SkipForward } from 'lucide-react';
import { MovieProject } from '../types';

interface CreationProgressScreenProps {
  project: MovieProject | null;
  progressStepIndex: number;
  totalSteps: number;
  progressMessage: string;
  isRenderingPromptVisible: boolean;
  renderingStatus: string;
  lastGenerationError: string | null;
  useSecureGateway: boolean;
  onToggleSecureGateway: (val: boolean) => void;
  onRetry: () => void;
  onRenderActionSelected: (choice: 'ALL' | 'VIDEO' | 'AUDIO' | 'NONE') => void;
  onGoToProject: () => void;
}

export const CreationProgressScreen: React.FC<CreationProgressScreenProps> = ({
  project,
  progressStepIndex,
  totalSteps,
  progressMessage,
  isRenderingPromptVisible,
  renderingStatus,
  lastGenerationError,
  onToggleSecureGateway,
  onRetry,
  onRenderActionSelected,
  onGoToProject,
}) => {
  const isCompleted = renderingStatus === 'COMPLETED';
  const progressPercent = isCompleted
    ? 100
    : Math.min(100, Math.round((progressStepIndex / totalSteps) * 100));

  // Circular stroke calculation
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
            ¡Proyecto Generado!
          </h2>

          <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
            Todos los orquestadores han completado sus entregables y la fase de renderizado se ha llevado a cabo con éxito.
          </p>

          <button
            onClick={onGoToProject}
            data-testid="progress_finish_button"
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>Ver Proyecto</span>
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
            La orquestación de la IA se detuvo debido a un problema de configuración o conexión remota.
          </p>

          {/* Error detail */}
          <div className="w-full p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-left mb-5">
            <span className="text-[11px] font-bold text-rose-400 block mb-1 uppercase tracking-wider">
              Detalle técnico:
            </span>
            <p className="text-xs text-rose-200 font-mono break-words">
              {lastGenerationError}
            </p>
          </div>

          {/* Simulation fallback card */}
          <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left mb-6">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Resiliencia L5 (Modo Demo Offline)</span>
            </h4>
            <p className="text-xs text-slate-300 mb-3">
              Puedes activar el "Modo Simulación Segura (L5)" para evitar llamadas de red remotas y emular al instante la producción de los 13 departamentos sin claves ni saldo.
            </p>
            <button
              onClick={() => {
                onToggleSecureGateway(true);
                onRetry();
              }}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Activar Simulación y Reintentar
            </button>
          </div>

          <button
            onClick={onGoToProject}
            className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
          >
            Ir al Proyecto (Incompleto)
          </button>
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
              <span className="text-3xl font-black text-white">
                {progressPercent}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Fase {progressStepIndex + 1}/{totalSteps}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-3">
            Construyendo Corto de Cine...
          </h3>

          {/* Current action card with pulse dot */}
          <div className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3.5 mb-6 text-left shadow-lg">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
            <p className="text-xs sm:text-sm text-slate-200 font-medium">
              {progressMessage}
            </p>
          </div>

          {/* Optional Prompt: Render video/audio stage */}
          {isRenderingPromptVisible && (
            <div className="w-full p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/80 text-left animate-slide-up shadow-xl shadow-amber-500/5">
              <h4 className="text-base font-bold text-amber-400 mb-1 text-center">
                ¿Deseas renderizar Video, Audio y Banda Sonora?
              </h4>
              <p className="text-xs text-slate-300 text-center mb-4 leading-relaxed">
                Estas fases generan vídeo y audio cinematográficos, lo que requiere un mayor procesamiento cómputo.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => onRenderActionSelected('ALL')}
                  data-testid="render_all_button"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Renderizar Todo</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onRenderActionSelected('VIDEO')}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                    <span>Solo Video</span>
                  </button>
                  <button
                    onClick={() => onRenderActionSelected('AUDIO')}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Solo Audio</span>
                  </button>
                </div>

                <button
                  onClick={() => onRenderActionSelected('NONE')}
                  className="w-full py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Saltar esta fase</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
