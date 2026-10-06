import React from 'react';
import { ArrowLeft, Sparkles, Zap } from 'lucide-react';

interface WizardStep2Props {
  idea: string;
  onIdeaChange: (val: string) => void;
  useSecureGateway: boolean;
  onToggleSecureGateway: (val: boolean) => void;
  onBack: () => void;
  onStartGeneration: () => void;
}

export const WizardStep2: React.FC<WizardStep2Props> = ({
  idea,
  onIdeaChange,
  useSecureGateway,
  onToggleSecureGateway,
  onBack,
  onStartGeneration,
}) => {
  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col max-w-xl mx-auto p-6 sm:p-8">
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Atrás"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Nuevo Proyecto de Cine</h2>
          <p className="text-xs text-slate-400">Paso 2 de 2: Idea del usuario</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {/* Idea TextArea */}
        <div>
          <label className="block text-sm font-bold text-amber-400 mb-1">
            Idea base / Argumento principal
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Escribe resumidamente de qué tratará tu corto de IA. La IA generará y distribuirá automáticamente todas las tareas de preproducción.
          </p>
          <textarea
            value={idea}
            onChange={(e) => onIdeaChange(e.target.value)}
            placeholder="Ej. Un operario de mantenimiento de paneles holográficos en la cima de una torre inclinada descubre una transmisión anómala..."
            data-testid="wizard_idea_input"
            rows={6}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder-slate-500 text-sm outline-none transition-all resize-y"
          />
        </div>

        {/* Modo de Orquestación */}
        <div>
          <label className="block text-sm font-bold text-amber-400 mb-2">
            Modo de Orquestación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: IA Real */}
            <div
              onClick={() => onToggleSecureGateway(false)}
              className={`p-4 rounded-xl cursor-pointer border transition-all ${
                !useSecureGateway
                  ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/5'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-80'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className={`w-4 h-4 ${!useSecureGateway ? 'text-amber-400' : 'text-slate-400'}`} />
                <h4 className={`text-sm font-bold ${!useSecureGateway ? 'text-amber-400' : 'text-white'}`}>
                  IA Real
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                Genera entregables usando los modelos Gemini configurados en el servidor.
              </p>
            </div>

            {/* Card 2: Ejecución Rápida Offline */}
            <div
              onClick={() => onToggleSecureGateway(true)}
              className={`p-4 rounded-xl cursor-pointer border transition-all ${
                useSecureGateway
                  ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/5'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-80'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className={`w-4 h-4 ${useSecureGateway ? 'text-amber-400' : 'text-slate-400'}`} />
                <h4 className={`text-sm font-bold ${useSecureGateway ? 'text-amber-400' : 'text-white'}`}>
                  Ejecución Rápida Offline
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                Sin consumo de cuotas. Emula y genera documentos cinematográficos instantáneos (L5).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-8">
        <button
          onClick={onStartGeneration}
          disabled={!idea.trim()}
          data-testid="wizard_generate_button"
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-bold text-base transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99]"
        >
          Comenzar Generación de IA
        </button>
      </div>
    </div>
  );
};
