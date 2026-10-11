import React, { useState } from 'react';
import { X, Cpu, Video, Image, Key, Check, ShieldCheck, Sparkles, RefreshCw, AlertCircle, Smartphone, ExternalLink } from 'lucide-react';
import { ProviderSettings, TextProviderId, ImageProviderId, VideoProviderId } from '../types';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProviderSettings;
  onSaveSettings: (settings: ProviderSettings) => void;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video' | 'diag'>('text');
  const [formState, setFormState] = useState<ProviderSettings>({ ...settings });
  const [showKeyVisible, setShowKeyVisible] = useState<{ [k: string]: boolean }>({});
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleVisibility = (key: string) => {
    setShowKeyVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSaveSettings(formState);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    setFormState({
      textProvider: 'google',
      textModel: 'gemini-3.8-flash',
      imageProvider: 'google-imagen',
      imageModel: 'imagen-3.0-generate-002',
      videoProvider: 'google-veo',
      videoModel: 'veo-3.1-generate-preview',
    });
  };

  const applyPreset = (preset: 'low_cost' | 'balanced' | 'hollywood') => {
    if (preset === 'low_cost') {
      setFormState({
        ...formState,
        textProvider: 'google',
        textModel: 'gemini-3.8-flash',
        imageProvider: 'google-imagen',
        imageModel: 'imagen-3.0-generate-002',
        videoProvider: 'google-veo',
        videoModel: 'veo-3.1-generate-preview',
      });
    } else if (preset === 'balanced') {
      setFormState({
        ...formState,
        textProvider: 'google',
        textModel: 'gemini-3.8-flash',
        imageProvider: 'fal-flux',
        imageModel: 'flux-1.1-pro',
        videoProvider: 'luma',
        videoModel: 'ray-2',
      });
    } else {
      setFormState({
        ...formState,
        textProvider: 'anthropic',
        textModel: 'claude-3-7-sonnet',
        imageProvider: 'openai-dalle',
        imageModel: 'dall-e-3',
        videoProvider: 'runway-gen3',
        videoModel: 'gen-3-alpha',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Motores & Proveedores de IA</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  Multi-LLM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona tus modelos para guion, generación de imágenes y render de video
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Presets de Presupuesto (Configuración en 1 Clic):</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('low_cost')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                formState.textModel === 'gemini-3.8-flash' && formState.videoProvider === 'google-veo'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-0.5">
                <span>🟢 Ahorro Máximo (0€)</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Gemini 3.8 Flash (Free Tier) + Veo 3.1 Fast
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('balanced')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                formState.imageProvider === 'fal-flux' && formState.videoProvider === 'luma'
                  ? 'bg-amber-500/15 border-amber-500 text-white'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-0.5">
                <span>🟡 Equilibrado</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Gemini Flash + Flux IP-Adapter + Luma
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('hollywood')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                formState.textProvider === 'anthropic' && formState.videoProvider === 'runway-gen3'
                  ? 'bg-purple-500/15 border-purple-500 text-white'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mb-0.5">
                <span>🔴 Hollywood Pro</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Claude 3.7 Sonnet + DALL-E + Runway Gen-3
              </p>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4 text-xs">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'text' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>1. Orquestador (Texto)</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'image' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>2. Imagen (Personajes)</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'video' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>3. Video (Render)</span>
          </button>

          <button
            onClick={() => setActiveTab('diag')}
            className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'diag' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Android & Sistema</span>
            <span className="sm:hidden">Móvil</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-1">
          {/* TAB 1: TEXT ORCHESTRATION */}
          {activeTab === 'text' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Proveedor Principal de Preproducción:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'google', name: 'Google Gemini', desc: 'Conectado nativo en servidor' },
                    { id: 'openai', name: 'OpenAI (ChatGPT)', desc: 'GPT-4o / o3-mini' },
                    { id: 'anthropic', name: 'Anthropic Claude', desc: 'Claude 3.7 Sonnet' },
                  ].map((p) => {
                    const isSelected = formState.textProvider === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          const defModel = p.id === 'google' ? 'gemini-3.8-flash' : p.id === 'openai' ? 'gpt-4o' : 'claude-3-7-sonnet';
                          setFormState({ ...formState, textProvider: p.id as TextProviderId, textModel: defModel });
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{p.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                        </div>
                        <p className="text-[11px] text-slate-400">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Modelo para las 7 Capas de Producción:
                </label>
                <select
                  value={formState.textModel}
                  onChange={(e) => setFormState({ ...formState, textModel: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none font-mono"
                >
                  {formState.textProvider === 'google' && (
                    <>
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Recomendado · Velocidad y precisión)</option>
                      <option value="gemini-3.8-pro">gemini-3.8-pro (Razonamiento profundo para Showrunner)</option>
                      <option value="gemini-3.7-flash">gemini-3.7-flash (Estándar)</option>
                    </>
                  )}
                  {formState.textProvider === 'openai' && (
                    <>
                      <option value="gpt-4o">gpt-4o (Omni modelo de alta fidelidad)</option>
                      <option value="gpt-4.5-preview">gpt-4.5-preview (Capacidad de dirección avanzada)</option>
                      <option value="o3-mini">o3-mini (Económico de alta lógica)</option>
                    </>
                  )}
                  {formState.textProvider === 'anthropic' && (
                    <>
                      <option value="claude-3-7-sonnet">claude-3-7-sonnet (Narrativa profunda y diálogos)</option>
                      <option value="claude-3-5-sonnet">claude-3-5-sonnet (Estabilidad dramatúrgica)</option>
                      <option value="claude-3-5-haiku">claude-3-5-haiku (Rápido)</option>
                    </>
                  )}
                </select>
              </div>

              {/* API Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clave API ({formState.textProvider.toUpperCase()}):</span>
                  </label>
                  {formState.textProvider === 'google' && (
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ Usando GEMINI_API_KEY del servidor por defecto
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showKeyVisible['text'] ? 'text' : 'password'}
                    value={
                      formState.textProvider === 'google'
                        ? formState.geminiApiKey || ''
                        : formState.textProvider === 'openai'
                        ? formState.openaiApiKey || ''
                        : formState.anthropicApiKey || ''
                    }
                    onChange={(e) => {
                      if (formState.textProvider === 'google') setFormState({ ...formState, geminiApiKey: e.target.value });
                      else if (formState.textProvider === 'openai') setFormState({ ...formState, openaiApiKey: e.target.value });
                      else setFormState({ ...formState, anthropicApiKey: e.target.value });
                    }}
                    placeholder={
                      formState.textProvider === 'google'
                        ? 'Opcional: Dejar en blanco para usar la del servidor'
                        : formState.textProvider === 'openai'
                        ? 'sk-proj-...'
                        : 'sk-ant-api03-...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none font-mono pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility('text')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                  >
                    {showKeyVisible['text'] ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMAGE GENERATION */}
          {activeTab === 'image' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Motor de Arte Conceptual y Personajes:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'google-imagen', name: 'Google Imagen 3', desc: 'Fotorrealismo cinematográfico nativo', model: 'imagen-3.0-generate-002' },
                    { id: 'fal-flux', name: 'Nano Banana / Flux', desc: 'Consistencia facial con IP-Adapter', model: 'flux-1.1-pro' },
                    { id: 'openai-dalle', name: 'OpenAI DALL-E 3', desc: 'Fidelidad al prompt literario', model: 'dall-e-3' },
                  ].map((p) => {
                    const isSelected = formState.imageProvider === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setFormState({ ...formState, imageProvider: p.id as ImageProviderId, imageModel: p.model })}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{p.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                        </div>
                        <p className="text-[11px] text-slate-400">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Provider-specific Key Inputs */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clave API para Google Imagen / Nano Banana:</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    {formState.geminiApiKey ? '✓ Clave Personal Activa' : '○ Usando Servidor'}
                  </span>
                </div>
                <input
                  type="password"
                  value={formState.geminiApiKey || ''}
                  onChange={(e) => setFormState({ ...formState, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy... (Introduce tu Gemini API Key con facturación para Nano Banana)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ⚡ <strong>Importante:</strong> Google asigna cuota 0 en la capa gratuita para modelos de visión directa (Nano Banana / Flash Lite Image). Para generar retratos y escenarios en vivo, introduce aquí tu API Key de Google Studio con facturación habilitada.
                </p>

                {formState.imageProvider === 'fal-flux' && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Clave API de Fal.ai (Flux Pro):
                    </label>
                    <input
                      type="password"
                      value={formState.falApiKey || ''}
                      onChange={(e) => setFormState({ ...formState, falApiKey: e.target.value })}
                      placeholder="fal_key_..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none font-mono"
                    />
                  </div>
                )}

                {formState.imageProvider === 'openai-dalle' && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Clave API de OpenAI (DALL-E 3):
                    </label>
                    <input
                      type="password"
                      value={formState.openaiApiKey || ''}
                      onChange={(e) => setFormState({ ...formState, openaiApiKey: e.target.value })}
                      placeholder="sk-proj-..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO GENERATION */}
          {activeTab === 'video' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Motor de Video Objetivo (Formato del Prompt y Maqueta):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'bytedance-seedance',
                      name: 'ByteDance Seedance 2.0',
                      tag: 'Compilador Multimodal Multi-Toma',
                      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                      desc: 'Estructura secuencias multi-toma con coherencia de personajes, tomas anamórficas 2.39:1 y control direccional de cámara.',
                      model: 'seedance-2.0',
                      apiStatus: 'Soporta especificaciones multi-shot y consistencia de personajes.',
                    },
                    {
                      id: 'runway-gen3',
                      name: 'Runway Gen-3 Alpha',
                      tag: 'Soporta API Directa',
                      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                      desc: 'Estructura cinematográfica con directivas técnicas de cámara ([Camera: 35mm, slow dolly]) y automatización por API.',
                      model: 'gen-3-alpha',
                      apiStatus: 'Soporta automatización con Runway API Key.',
                    },
                    {
                      id: 'luma',
                      name: 'Luma Dream Machine',
                      tag: 'Soporta API Directa',
                      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                      desc: 'Transiciones continuas, travelings y aceleraciones dinámicas con formato para la API de Luma Labs.',
                      model: 'ray-2',
                      apiStatus: 'Soporta automatización con Luma API Key.',
                    },
                    {
                      id: 'google-veo',
                      name: 'Google Veo 3.1',
                      tag: 'Ecosistema Google',
                      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                      desc: 'Encuadres cinematográficos 4K con directiva de audio ambiental y sincronización de moodboards.',
                      model: 'veo-3.1-generate-preview',
                      apiStatus: 'Optimizado para previsualización e integración GCP.',
                    },
                  ].map((p) => {
                    const isSelected = formState.videoProvider === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setFormState({ ...formState, videoProvider: p.id as VideoProviderId, videoModel: p.model })}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-white">{p.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${p.tagColor}`}>
                              {p.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug mb-2">{p.desc}</p>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
                          <span>{p.apiStatus}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3] shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-slate-300 text-[11px] leading-relaxed">
                <span className="font-bold text-amber-400 block mb-0.5">
                  ¿Cómo funciona el flujo de video?
                </span>
                El orquestador LLM adapta la redacción de cada toma y escena al formato exigido por el motor seleccionado. En la pantalla del proyecto dispondrás del botón para copiar el prompt técnico listo para pegar en la aplicación web del proveedor o previsualizar el animatic de referencia.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Credencial de Video (Runway / Seedance / Luma):
                </label>
                <input
                  type="password"
                  value={formState.runwayApiKey || ''}
                  onChange={(e) => setFormState({ ...formState, runwayApiKey: e.target.value })}
                  placeholder="Key opcional para Runway API..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Permite disparar renderizado asíncrono directo y descargar los clips ensamblados.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSTICS */}
          {activeTab === 'diag' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Android & Mobile Ecosystem Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Compatibilidad Android & Ecosistema Móvil</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    PWA Ready
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="font-semibold text-emerald-300 mb-1">
                      📱 1. ¿Cómo instalar la aplicación en Android?
                    </p>
                    <p className="text-[11px] text-slate-400">
                      En Google Chrome o cualquier navegador de tu móvil Android, abre el menú de opciones (⋮) y selecciona <strong className="text-white">«Instalar aplicación»</strong> o <strong className="text-white">«Añadir a la pantalla principal»</strong>. Se abrirá en pantalla completa sin barras del navegador como una app nativa de Android.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="font-semibold text-amber-300 mb-1">
                      🔑 2. ¿Cómo usar tu API Key de Google por solicitud en el móvil?
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Puedes introducir tu propia <strong className="text-white">Google Gemini API Key</strong> en la pestaña <em>«1. Texto (LLMs)»</em>. Al hacerlo:
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-slate-400 pl-1">
                      <li>La clave se almacena de forma segura y privada en el almacenamiento local de tu teléfono móvil.</li>
                      <li>Cada solicitud (Showrunner, Guionista, Storyboarder, etc.) viaja firmada con tu clave puntual hacia la API de Google.</li>
                      <li>El consumo de tokens y la facturación computan directamente en tu cuenta de Google AI Studio, sin consumir saldo ajeno.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <span>Obtener mi API Key de Google gratis</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Estado de la Arquitectura de Motores</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">Backend Server</span>
                    <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Activo (Port 3000)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">Google Gemini API</span>
                    <span className="text-emerald-400 font-mono">Conectado (Servidor + BYOK Móvil)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">Modo de Almacenamiento</span>
                    <span className="text-amber-400 font-mono">LocalStorage (0€ Coste)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">PWA Manifest (Android)</span>
                    <span className="text-emerald-400 font-mono">Configurado (/manifest.json)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  Las claves introducidas se almacenan exclusivamente en el almacenamiento local de tu navegador y se transmiten directamente mediante proxy seguro al backend para las llamadas de inferencia.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Valores por defecto</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aplicar Configuración</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
