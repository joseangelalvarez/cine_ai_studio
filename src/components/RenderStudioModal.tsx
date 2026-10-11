import React, { useState } from 'react';
import {
  X,
  Play,
  Video,
  Volume2,
  Sparkles,
  Clock,
  SlidersHorizontal,
  Check,
  Film,
  Zap,
} from 'lucide-react';
import { MovieProject, ProviderSettings, VideoProviderId } from '../types';

interface RenderStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MovieProject;
  providerSettings: ProviderSettings;
  onOpenProviderSettings: () => void;
  onStartRender: (choice: 'ALL' | 'VIDEO' | 'AUDIO', sceneScope: 'ALL' | number) => void;
  onPostponeRender: () => void;
}

export const RenderStudioModal: React.FC<RenderStudioModalProps> = ({
  isOpen,
  onClose,
  project,
  providerSettings,
  onOpenProviderSettings,
  onStartRender,
  onPostponeRender,
}) => {
  const [renderMode, setRenderMode] = useState<'ALL' | 'VIDEO' | 'AUDIO'>('ALL');
  const [sceneScope, setSceneScope] = useState<'ALL' | number>('ALL');

  if (!isOpen) return null;

  const handleStart = () => {
    onStartRender(renderMode, sceneScope);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Film className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-white">
                  Estudio de Renderizado • Video & Audio
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  DISPONIBLE EN CUALQUIER MOMENTO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Proyecto: <span className="text-slate-200 font-semibold">{project.title}</span> • {project.artStyle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Informative Note */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">
                Flexibilidad de Producción Total:
              </span>
              <p className="text-slate-400 leading-relaxed text-xs">
                Siempre que edites el guion, modifiques el prompt o ajustes la directiva del Showrunner, puedes regresar a esta pantalla y volver a renderizar. Si prefieres revisar el material más tarde, puedes posponer la generación con un solo clic.
              </p>
            </div>
          </div>

          {/* 1. Alcance de Escenas */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. Alcance del Renderizado
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <button
                onClick={() => setSceneScope('ALL')}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all ${
                  sceneScope === 'ALL'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                Todas (1 a 4)
              </button>
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={`scene_scope_${num}`}
                  onClick={() => setSceneScope(num)}
                  className={`py-2.5 px-3 rounded-xl font-bold border transition-all ${
                    sceneScope === num
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  Escena {num}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tipo de Medios */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              2. Capas de Medios a Procesar
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Complete */}
              <div
                onClick={() => setRenderMode('ALL')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  renderMode === 'ALL'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">Video + Audio Completo</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Genera la toma visual cinematográfica con score musical y foley sincronizado.
                </p>
              </div>

              {/* Option 2: Video only */}
              <div
                onClick={() => setRenderMode('VIDEO')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  renderMode === 'VIDEO'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Video className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">Solo Video</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Procesa únicamente las tomas de cámara y la física de movimiento visual.
                </p>
              </div>

              {/* Option 3: Audio only */}
              <div
                onClick={() => setRenderMode('AUDIO')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  renderMode === 'AUDIO'
                    ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">Solo Audio / Música</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Genera la banda sonora, leitmotivs del compositor y diseño de sonido.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Motor de IA Configurado */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  Motor de Video Activo
                </span>
                <span className="text-xs font-bold text-white uppercase font-mono">
                  {providerSettings.videoProvider} ({providerSettings.videoModel})
                </span>
              </div>
            </div>

            <button
              onClick={onOpenProviderSettings}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Cambiar Proveedor</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              onPostponeRender();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>⏰ Posponer y Dejar para Después</span>
          </button>

          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>🚀 Iniciar Renderizado Ahora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
