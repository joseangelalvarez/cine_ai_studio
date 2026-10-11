import React, { useState } from 'react';
import { X, ExternalLink, ChevronDown, Check, Loader2, Info, Sparkles, Send, Copy } from 'lucide-react';

interface ExportApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (provider: string, apiKey: string) => Promise<void>;
}

interface ProviderDef {
  id: string;
  name: string;
  type: 'api' | 'prompt_export';
  badge: string;
  badgeColor: string;
  description: string;
  helpText: string;
  keyPlaceholder: string;
  keyLabel: string;
}

const PROVIDER_DEFS: ProviderDef[] = [
  {
    id: 'Runway Gen-3',
    name: 'Runway Gen-3 Alpha',
    type: 'api',
    badge: 'API Automática',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    description: 'Envío directo de la directiva de cámara y relación de aspecto anamórfica a la cola de render de Runway.',
    helpText: 'Utiliza tu Runway API Key para crear la tarea de renderizado sin abrir el navegador.',
    keyPlaceholder: 'sk-runway-dev-...',
    keyLabel: 'Runway API Secret Key',
  },
  {
    id: 'Luma Dream Machine',
    name: 'Luma Dream Machine',
    type: 'api',
    badge: 'API Automática',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    description: 'Despacho automatizado del prompt y parámetros de iluminación a la API de Luma Labs.',
    helpText: 'Lanza la generación del clip directamente en tu cuenta de Luma mediante su API REST.',
    keyPlaceholder: 'luma-key-...',
    keyLabel: 'Luma Labs API Key',
  },
  {
    id: 'Kling AI',
    name: 'Kling AI',
    type: 'api',
    badge: 'API / Agregador',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: 'Generación con física dinámica y control de movimiento mediante API directa o agregadores (Fal.ai / Replicate).',
    helpText: 'Introduce tu token de acceso de Kling o tu agregador compatible.',
    keyPlaceholder: 'kling-token-...',
    keyLabel: 'Kling / Aggregator Key',
  },
  {
    id: 'Seedance 2.0',
    name: 'ByteDance Seedance 2.0',
    type: 'prompt_export',
    badge: 'Compilador & Multi-Shot',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: 'Compila el guion técnico y tomas secuenciales con tokens de consistencia de personaje y sintaxis de cámara para Seedance 2.0.',
    helpText: 'Estructura secuencias multi-toma con relación de aspecto 2.39:1 y movimientos direccionales de cámara (Dolly / Steadicam).',
    keyPlaceholder: 'seedance-token-... (Opcional)',
    keyLabel: 'Seedance Access Token (Opcional)',
  },
];

export const ExportApiModal: React.FC<ExportApiModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState('Runway Gen-3');
  const [apiKey, setApiKey] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentProvider = PROVIDER_DEFS.find((p) => p.id === selectedProviderId) || PROVIDER_DEFS[0];

  const handleExport = async () => {
    if (currentProvider.type === 'api' && !apiKey.trim()) {
      setError(`Por favor, introduce tu ${currentProvider.keyLabel} o un token de prueba.`);
      return;
    }
    setError(null);
    setIsExporting(true);
    try {
      await onConfirmExport(currentProvider.id, apiKey.trim() || 'seedance-compiler-token');
      setIsExporting(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al compilar y exportar');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Exportar / Despachar a Motores de Video</span>
        </h3>

        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Selecciona el motor objetivo. El orquestador adaptará el vocabulario técnico de iluminación, óptica y personajes antes de despachar el paquete.
        </p>

        {/* Provider Cards */}
        <div className="space-y-2.5 mb-5">
          <label className="block text-xs font-bold text-slate-300">
            Motor de Video de Destino
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PROVIDER_DEFS.map((p) => {
              const isSelected = selectedProviderId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProviderId(p.id);
                    if (error) setError(null);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{p.description}</p>
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-end text-[10px] text-amber-400 font-semibold gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Seleccionado
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative banner according to provider */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 mb-5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white text-[11px] block">
              {currentProvider.id === 'Seedance 2.0'
                ? '¿Por qué Seedance 2.0 compila el prompt en lugar de llamada API directa?'
                : `Flujo para ${currentProvider.name}:`}
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {currentProvider.helpText}
            </p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>{currentProvider.keyLabel}</span>
            {currentProvider.type === 'prompt_export' && (
              <span className="text-[10px] text-slate-500 font-normal">Opcional para compilación</span>
            )}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              if (error) setError(null);
            }}
            placeholder={currentProvider.keyPlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder-slate-600 text-xs outline-none font-mono"
          />
          {error && (
            <p className="text-[11px] text-rose-400 mt-1.5 font-medium">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/10"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Compilando paquete...</span>
              </>
            ) : currentProvider.type === 'prompt_export' ? (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Compilar y Generar Paquete Seedance 2.0</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Despachar a {currentProvider.name}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

