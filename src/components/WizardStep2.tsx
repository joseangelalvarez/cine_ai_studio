import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, Settings2 } from 'lucide-react';
import { ProviderSettings } from '../types';
import { fetchServerConfigApi } from '../api';

interface WizardStep2Props {
  idea: string;
  onIdeaChange: (val: string) => void;
  providerSettings: ProviderSettings;
  onOpenProviderSettings: () => void;
  onBack: () => void;
  onStartGeneration: () => void;
}

export const WizardStep2: React.FC<WizardStep2Props> = ({
  idea,
  onIdeaChange,
  providerSettings,
  onOpenProviderSettings,
  onBack,
  onStartGeneration,
}) => {
  const [availability, setAvailability] = useState<{ google: boolean; openai: boolean; anthropic: boolean }>({
    google: false,
    openai: false,
    anthropic: false,
  });
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchServerConfigApi()
      .then((res) => {
        if (isMounted && res.availability) {
          setAvailability(res.availability);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server config:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingConfig(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const hasGoogle = availability.google || Boolean(providerSettings.geminiApiKey?.trim());
  const hasOpenAi = availability.openai || Boolean(providerSettings.openaiApiKey?.trim());
  const hasAnthropic = availability.anthropic || Boolean(providerSettings.anthropicApiKey?.trim());
  const hasAnyLlm = hasGoogle || hasOpenAi || hasAnthropic;

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
          <p className="text-xs text-slate-400">Paso 2 de 2: Premisa & Estado de Proveedores</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {/* Idea TextArea */}
        <div>
          <label className="block text-sm font-bold text-amber-400 mb-1">
            Idea base / Argumento principal
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Escribe de qué tratará tu producción audiovisual. Los 24 subagentes crearán los entregables técnicos de cada departamento basándose en esta premisa.
          </p>
          <textarea
            value={idea}
            onChange={(e) => onIdeaChange(e.target.value)}
            placeholder="Ej. Tras una avería de presurización en la estación orbital Kepler-4, dos astrofísicos deben decidir qué sector aislar mientras descubren un organismo fotosensible adherido al casco exterior..."
            data-testid="wizard_idea_input"
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder-slate-500 text-sm outline-none transition-all resize-y"
          />
        </div>

        {/* Live Provider Availability Status Panel */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Estado de Proveedores LLM en Tiempo Real
            </span>
            <button
              onClick={onOpenProviderSettings}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
            >
              <Settings2 className="w-3 h-3" />
              Configurar Claves
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Por norma estricta de Cine AI Studio, <strong>no se simula ningún contenido</strong>. Se verifican las credenciales reales antes de iniciar el pipeline:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Google Gemini */}
            <div className={`p-2.5 rounded-lg border text-center transition-colors ${hasGoogle ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
              <div className="flex items-center justify-center gap-1 text-xs font-bold mb-0.5">
                {hasGoogle ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
                Gemini
              </div>
              <span className="text-[10px] block opacity-80">{hasGoogle ? 'Listo (Texto/Media)' : 'Sin clave'}</span>
            </div>

            {/* OpenAI */}
            <div className={`p-2.5 rounded-lg border text-center transition-colors ${hasOpenAi ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
              <div className="flex items-center justify-center gap-1 text-xs font-bold mb-0.5">
                {hasOpenAi ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
                OpenAI
              </div>
              <span className="text-[10px] block opacity-80">{hasOpenAi ? 'Listo (GPT-4o/DALL-E)' : 'Sin clave'}</span>
            </div>

            {/* Anthropic */}
            <div className={`p-2.5 rounded-lg border text-center transition-colors ${hasAnthropic ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
              <div className="flex items-center justify-center gap-1 text-xs font-bold mb-0.5">
                {hasAnthropic ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
                Claude
              </div>
              <span className="text-[10px] block opacity-80">{hasAnthropic ? 'Listo (Sonnet)' : 'Sin clave'}</span>
            </div>
          </div>

          {!hasAnyLlm && !isLoadingConfig && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              ⚠️ No se detectó ninguna clave de API configurada en el servidor ni en ajustes. Haz clic en "Configurar Claves" para ingresar al menos una clave (Google Gemini, OpenAI o Anthropic).
            </div>
          )}
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-8">
        <button
          onClick={onStartGeneration}
          disabled={!idea.trim() || !hasAnyLlm}
          data-testid="wizard_generate_button"
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-bold text-base transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99]"
        >
          {hasAnyLlm ? 'Iniciar Preproducción con IA Real' : 'Se Requiere Clave de API para Iniciar'}
        </button>
      </div>
    </div>
  );
};
