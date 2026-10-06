import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';

interface WizardStep1Props {
  title: string;
  onTitleChange: (val: string) => void;
  duration: string;
  onDurationChange: (val: string) => void;
  artStyle: string;
  onArtStyleChange: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const DURATION_OPTIONS = ['1 minuto', '3 minutos', '5 minutos', '10 minutos'];
const ART_STYLE_OPTIONS = [
  'Cinemático Ultra-Realista',
  'Ciencia Ficción Brutalista',
  'Anime Cyberpunk',
  'Fantasía Épica',
  'Noir de Autor',
];

export const WizardStep1: React.FC<WizardStep1Props> = ({
  title,
  onTitleChange,
  duration,
  onDurationChange,
  artStyle,
  onArtStyleChange,
  onBack,
  onNext,
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
          <p className="text-xs text-slate-400">Paso 1 de 2: Datos iniciales</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-bold text-amber-400 mb-2">
            Título del proyecto
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ej. El Último Operador"
            data-testid="wizard_title_input"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder-slate-500 text-sm outline-none transition-all"
          />
        </div>

        {/* Duration Dropdown */}
        <div>
          <label className="block text-sm font-bold text-amber-400 mb-2">
            Duración aproximada
          </label>
          <div className="relative">
            <select
              value={duration}
              onChange={(e) => onDurationChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-sm outline-none appearance-none cursor-pointer pr-10"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-white">
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Art Style Dropdown */}
        <div>
          <label className="block text-sm font-bold text-amber-400 mb-2">
            Estilo visual
          </label>
          <div className="relative">
            <select
              value={artStyle}
              onChange={(e) => onArtStyleChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-sm outline-none appearance-none cursor-pointer pr-10"
            >
              {ART_STYLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-white">
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="pt-8">
        <button
          onClick={onNext}
          disabled={!title.trim()}
          data-testid="wizard_next_button"
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-bold text-base transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99]"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
