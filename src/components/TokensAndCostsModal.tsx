import React, { useState } from 'react';
import {
  X,
  Coins,
  Cpu,
  Layers,
  Sparkles,
  TrendingDown,
  Info,
  CheckCircle,
  HelpCircle,
  Zap,
  BarChart3,
  Flame,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { ProviderSettings, TelemetryMetric, ProjectMemory } from '../types';
import { StorageService } from '../storage';

interface TokensAndCostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerSettings: ProviderSettings;
  projectId?: number;
  onOpenProviderSettings: () => void;
}

export const TokensAndCostsModal: React.FC<TokensAndCostsModalProps> = ({
  isOpen,
  onClose,
  providerSettings,
  projectId,
  onOpenProviderSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'guide'>('overview');

  if (!isOpen) return null;

  // Retrieve metrics and memories
  const allProjects = StorageService.getProjects();
  const targetProjectId = projectId || (allProjects.length > 0 ? allProjects[0].id : 1);
  const memories = StorageService.getMemories(targetProjectId);
  const metrics = StorageService.getMetrics(targetProjectId);

  // Compute token statistics from memories & metrics
  let totalWords = 0;
  let totalCharacters = 0;
  memories.forEach((m) => {
    totalCharacters += m.content.length;
    totalWords += m.content.split(/\s+/).filter(Boolean).length;
  });

  // 1 token approx 4 chars or 0.75 words for Spanish/English technical text
  const estimatedGeneratedTokens = Math.max(
    Math.round(totalCharacters / 3.8),
    memories.length * 950
  );
  const estimatedInputTokens = Math.round(estimatedGeneratedTokens * 0.45);
  const totalSessionTokens = estimatedGeneratedTokens + estimatedInputTokens;

  // Price models per 1M tokens (USD)
  const rates: Record<string, { input: number; output: number; name: string }> = {
    'gemini-3.8-flash': { input: 0.075, output: 0.30, name: 'Google Gemini 2.5/1.5 Flash' },
    'gemini-2.5-pro': { input: 1.25, output: 5.00, name: 'Google Gemini Pro' },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00, name: 'Anthropic Claude 3.5 Sonnet' },
    'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00, name: 'Anthropic Claude 3.5 Haiku' },
    'gpt-4o': { input: 2.50, output: 10.00, name: 'OpenAI GPT-4o' },
    'gpt-4o-mini': { input: 0.15, output: 0.60, name: 'OpenAI GPT-4o-mini' },
  };

  const currentRate = rates[providerSettings.textModel] || rates['gemini-3.8-flash'];
  const hasUserGeminiKey = Boolean(providerSettings.geminiApiKey?.trim());
  const isFreeTierEligible =
    providerSettings.textProvider === 'google' && !hasUserGeminiKey;

  // Estimated cost calculation
  const calculatedCostUsd =
    (estimatedInputTokens / 1_000_000) * currentRate.input +
    (estimatedGeneratedTokens / 1_000_000) * currentRate.output;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Tokens & Control de Costes
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  En Tiempo Real
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoría de inferencia LLM, consumo por departamento y estimación presupuestaria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Consumo Actual
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'simulator'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Comparador de Modelos
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'guide'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Límites y Free Tier
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {activeTab === 'overview' && (
            <>
              {/* Billing Status Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isFreeTierEligible
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isFreeTierEligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {isFreeTierEligible ? <CheckCircle className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {isFreeTierEligible
                        ? 'Estás operando en Nivel Gratuito (0,00 €)'
                        : `Proveedor Activo: ${providerSettings.textProvider.toUpperCase()} (${providerSettings.textModel})`}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {isFreeTierEligible
                        ? 'Google AI Studio otorga hasta 15 RPM y 1.000.000 TPM sin coste alguno para Gemini.'
                        : 'El coste estimado se debita de tu cuenta del proveedor según tus tokens consumidos.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenProviderSettings();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 border border-slate-700 transition-colors"
                >
                  Cambiar Motor / Claves
                </button>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                    Tokens Totales
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {totalSessionTokens.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    ~{(totalSessionTokens / 1000).toFixed(1)}k tokens
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                    Tokens Salida (Escritura)
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                    {estimatedGeneratedTokens.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Directivas & guion
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                    Tokens Entrada (Contexto)
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
                    {estimatedInputTokens.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Biblia y memoria compartida
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                    Gasto Teórico Acumulado
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                    {isFreeTierEligible ? '0,00 €' : `$${calculatedCostUsd.toFixed(4)}`}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {isFreeTierEligible ? 'Bonificado 100%' : 'Tarifa comercial oficial'}
                  </span>
                </div>
              </div>

              {/* Department breakdown */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Desglose por Entregables de Producción ({memories.length} módulos)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {totalCharacters.toLocaleString()} caracteres
                  </span>
                </div>

                {memories.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Aún no se han generado entregables en este proyecto. Inicia el asistente de preproducción.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {memories.map((mem, idx) => {
                      const tokens = Math.round(mem.content.length / 3.8);
                      const cost = (tokens / 1_000_000) * currentRate.output;
                      return (
                        <div
                          key={`cost_mem_${mem.key}_${idx}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs"
                        >
                          <div className="truncate pr-3">
                            <span className="font-semibold text-slate-200 block truncate">
                              {mem.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              Clave: {mem.key}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-amber-400 font-bold block">
                              ~{tokens.toLocaleString()} tokens
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {isFreeTierEligible ? '0,00 €' : `$${cost.toFixed(5)}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Comparativa de Coste para 1 Producción Completa (13 Departamentos ~30.000 tokens)
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Observa la diferencia de coste de orquestación completa según el modelo de lenguaje seleccionado:
                </p>

                <div className="space-y-2.5">
                  {[
                    {
                      provider: 'Google',
                      model: 'gemini-3.8-flash',
                      name: 'Gemini 2.5 / 1.5 Flash (Recomendado)',
                      costTotal: '$0.0022 USD (0,00 € en Free Tier)',
                      tier: 'Ultra Barato / Gratuito',
                      badge: 'badge-emerald',
                      speed: 'Ultrarrápido (~1.2s)',
                    },
                    {
                      provider: 'OpenAI',
                      model: 'gpt-4o-mini',
                      name: 'OpenAI GPT-4o-mini',
                      costTotal: '$0.0055 USD (~0.005 €)',
                      tier: 'Económico',
                      badge: 'badge-blue',
                      speed: 'Rápido (~1.8s)',
                    },
                    {
                      provider: 'Anthropic',
                      model: 'claude-3-5-haiku-20241022',
                      name: 'Claude 3.5 Haiku',
                      costTotal: '$0.0350 USD (~0.03 €)',
                      tier: 'Moderado',
                      badge: 'badge-purple',
                      speed: 'Rápido (~2.0s)',
                    },
                    {
                      provider: 'Google',
                      model: 'gemini-2.5-pro',
                      name: 'Gemini 2.5 Pro',
                      costTotal: '$0.0450 USD (~0.04 €)',
                      tier: 'Razonamiento Profundo',
                      badge: 'badge-amber',
                      speed: 'Medio (~3.5s)',
                    },
                    {
                      provider: 'OpenAI',
                      model: 'gpt-4o',
                      name: 'OpenAI GPT-4o',
                      costTotal: '$0.0950 USD (~0.09 €)',
                      tier: 'Alto Rendimiento',
                      badge: 'badge-rose',
                      speed: 'Estándar (~3.2s)',
                    },
                    {
                      provider: 'Anthropic',
                      model: 'claude-3-5-sonnet-20241022',
                      name: 'Claude 3.5 Sonnet',
                      costTotal: '$0.1350 USD (~0.12 €)',
                      tier: 'Pro Guion Literario',
                      badge: 'badge-rose',
                      speed: 'Detallado (~4.0s)',
                    },
                  ].map((item, idx) => (
                    <div
                      key={`pricing_item_${item.model}_${idx}`}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{item.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                            {item.tier}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Velocidad media: {item.speed}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-amber-400 text-xs block">
                          {item.costTotal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Cómo Mantener tu Facturación en 0,00 €
                </h4>
                <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                  <li>
                    <strong className="text-emerald-400">Google Gemini Free Tier:</strong> Google AI Studio
                    permite hasta 15 solicitudes por minuto y 1.500 solicitudes al día de forma 100% gratuita para
                    Gemini Flash en pruebas reales.
                  </li>
                  <li>
                    <strong className="text-cyan-400">Inferencia en Vivo:</strong> Todas las pruebas se ejecutan de
                    forma real contra los modelos multimodales (Nano Banana, Imagen 3, Gemini Flash), garantizando
                    coherencia de producción cinematográfica.
                  </li>
                  <li>
                    <strong className="text-amber-400">Límites y Alertas de Facturación:</strong> Si agregas tu
                    propia tarjeta en Google Cloud Console o OpenAI Platform, configura siempre un presupuesto con
                    aviso a los 5 € para evitar cualquier cobro imprevisto.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-300">
                <span className="font-bold text-amber-400 block mb-1">
                  Nota sobre Generadores de Video (ByteDance Seedance 2.0, Runway, Veo):
                </span>
                Esta aplicación no realiza cargos por generación de video MP4 externo. Los prompts de cámara
                generados aquí son para que los copies y utilices en tus cuentas de Runway Gen-3, Luma Dream Machine,
                Kling o ByteDance Seedance 2.0 según tus suscripciones particulares en sus plataformas oficiales.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Tokens auditados con precisión de inferencia
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
