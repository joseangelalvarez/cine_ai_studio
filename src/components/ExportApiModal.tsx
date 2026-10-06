import React, { useState } from 'react';
import { X, ExternalLink, ChevronDown, Check, Loader2 } from 'lucide-react';

interface ExportApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (provider: string, apiKey: string) => Promise<void>;
}

const PROVIDERS = ['Runway Gen-3', 'Luma Dream Machine', 'Kling AI', 'Sora'];

export const ExportApiModal: React.FC<ExportApiModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
}) => {
  const [provider, setProvider] = useState('Runway Gen-3');
  const [apiKey, setApiKey] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!apiKey.trim()) {
      setError('Por favor, introduce tu API Key o un identificador de prueba');
      return;
    }
    setError(null);
    setIsExporting(true);
    try {
      await onConfirmExport(provider, apiKey);
      setIsExporting(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al exportar');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
          <span>Exportar a Proveedor AI Externo</span>
        </h3>

        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Introduce la API Key del proveedor al que deseas enviar los datos de preproducción. Se compilarán y optimizarán las directivas de cámara y los prompts.
        </p>

        <div className="space-y-4 mb-6">
          {/* Provider selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Proveedor de IA
            </label>
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-xs outline-none appearance-none cursor-pointer pr-10"
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              API Key del Proveedor
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (error) setError(null);
              }}
              placeholder={`sk-${provider.toLowerCase().replace(/[^a-z0-9]/g, '')}...`}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder-slate-600 text-xs outline-none"
            />
            {error && (
              <p className="text-[11px] text-rose-400 mt-1.5 font-medium">{error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Compilando...</span>
              </>
            ) : (
              <span>Exportar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
