import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { CinemaSubagent } from '../types';

interface OrchestratorContentEditorProps {
  agent: CinemaSubagent;
  initialContent: string;
  onBack: () => void;
  onUpdate: (key: string, title: string, content: string) => void;
}

export const OrchestratorContentEditor: React.FC<OrchestratorContentEditorProps> = ({
  agent,
  initialContent,
  onBack,
  onUpdate,
}) => {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="min-h-[calc(100vh-65px)] max-w-4xl mx-auto p-6 sm:p-8 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Atrás"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Editar Orquestador</h2>
          <p className="text-xs text-slate-400">{agent.name}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            DEPARTAMENTO: {agent.layer}
          </span>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
            {agent.role}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Tareas y Funciones del Agente:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {agent.duties.map((duty, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                <span className="text-amber-400 font-bold">•</span>
                <span>{duty}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="flex-1 flex flex-col mb-6">
        <label className="block text-sm font-bold text-amber-400 mb-2">
          Entregable / Resultado narrativo
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          data-testid="editor_content_input"
          rows={16}
          className="w-full flex-1 p-4 rounded-2xl bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-100 font-mono text-xs leading-relaxed outline-none resize-y"
          placeholder="Escribe o ajusta las directivas técnicas del subagente..."
        />
        <p className="text-[11px] text-slate-500 mt-2">
          💡 Al guardar este entregable, todos los orquestadores dependientes posteriores del pipeline actualizarán automáticamente su coherencia contra este cambio.
        </p>
      </div>

      {/* Save Button */}
      <div>
        <button
          onClick={() => onUpdate(agent.key, agent.name, content)}
          data-testid="editor_submit_button"
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>Actualizar y Propagar en Cascada</span>
        </button>
      </div>
    </div>
  );
};
