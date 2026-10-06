import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  Menu,
  Share2,
  Copy,
  Check,
  Edit3,
  FileText,
  Download,
  Terminal,
  Clock,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Coins,
  Send,
} from 'lucide-react';
import { MovieProject, ProjectMemory, ProjectMemoryRevision, AuditLog, TelemetryMetric, CinemaSubagent } from '../types';
import { CINEMA_SUBAGENTS_CATALOG, CINEMA_LAYERS, getSubagentCostInfo, isSubagentExpensive } from '../catalog';

interface ProjectDetailsScreenProps {
  project: MovieProject;
  memories: ProjectMemory[];
  revisions: ProjectMemoryRevision[];
  auditLogs: AuditLog[];
  metrics: TelemetryMetric[];
  credits: number;
  onBackClick: () => void;
  onEditSubagent: (agent: CinemaSubagent, currentContent: string) => void;
  onOpenExportModal: () => void;
  onOpenSocialModal: () => void;
  onUpdateVeoMetadata: (type: 'char' | 'bg' | 'sound', value: string) => void;
  veoCharacterCustom: string;
  veoBackgroundCustom: string;
  veoSoundCustom: string;
  veoVideoStatus: string;
  onExecuteSubagentManually: (subagent: CinemaSubagent, prompt: string) => Promise<void>;
  onClearMemory: () => void;
}

export const ProjectDetailsScreen: React.FC<ProjectDetailsScreenProps> = ({
  project,
  memories,
  revisions,
  auditLogs,
  metrics,
  credits,
  onBackClick,
  onEditSubagent,
  onOpenExportModal,
  onOpenSocialModal,
  onUpdateVeoMetadata,
  veoCharacterCustom,
  veoBackgroundCustom,
  veoSoundCustom,
  veoVideoStatus,
  onExecuteSubagentManually,
  onClearMemory,
}) => {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(1); // 0: Storyboard, 1: Departamentos, 2: Taller / Workstation
  const [selectedSubagentKey, setSelectedSubagentKey] = useState<string>('SHOWRUNNER');
  const [manualPrompt, setManualPrompt] = useState<string>('');
  const [isExecutingManual, setIsExecutingManual] = useState<boolean>(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedAgent = CINEMA_SUBAGENTS_CATALOG.find((a) => a.key === selectedSubagentKey) || CINEMA_SUBAGENTS_CATALOG[0];
  const selectedMemory = memories.find((m) => m.key === selectedSubagentKey);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    showToast('Prompt copiado al portapapeles');
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  const handleDownloadZip = () => {
    const markdownContent = memories
      .map((m) => `# ${m.title}\n\n${m.content}\n\n---\n`)
      .join('\n');
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_completo.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Documentación cinematográfica descargada');
  };

  const handleManualRun = async () => {
    const cost = isSubagentExpensive(selectedAgent.key) ? 50 : 10;
    if (credits < cost) {
      showToast(`Créditos insuficientes. Se requieren ${cost} créditos.`);
      return;
    }
    setIsExecutingManual(true);
    try {
      await onExecuteSubagentManually(selectedAgent, manualPrompt || selectedAgent.suggestedPrompt);
      showToast(`Entregable generado con éxito para ${selectedAgent.name}`);
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Fallo de ejecución'}`);
    } finally {
      setIsExecutingManual(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-slide-up">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackClick}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Volver a la lista de proyectos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {project.title}
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                {project.artStyle}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Género: {project.genre} {project.duration ? `• ${project.duration}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={onOpenSocialModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Redes Sociales</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 mb-6 max-w-lg">
        <button
          onClick={() => setActiveTab(0)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 0
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Storyboard & Prompts</span>
        </button>

        <button
          onClick={() => setActiveTab(1)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 1
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Orquestadores ({memories.length}/24)</span>
        </button>

        <button
          onClick={() => setActiveTab(2)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 2
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Taller & Consola</span>
        </button>
      </div>

      {/* TAB 0: STORYBOARD & PROMPTS EXTRACTOR */}
      {activeTab === 0 && (
        <div className="space-y-6 flex-1 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-base font-bold text-amber-400 mb-1 flex items-center gap-2">
              <span>📋 STORYBOARD & EXPORTACIÓN DE PROMPTS PARA VIDEO AI</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl mb-5">
              Gana control total sobre tu película. Utiliza estos prompts de preproducción generados a partir de tu idea para copiarlos en generadores externos (Runway Gen-3, Luma Dream Machine, Kling o Sora) y obtendrás los videos exactos para tu cortometraje.
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-5">
              {[
                { label: 'Diseño de Personajes', key: 'CHARACTER_DESIGNER' },
                { label: 'Escenarios y Fondos', key: 'PRODUCTION_DESIGNER' },
                { label: 'Música y Leitmotivs', key: 'COMPOSER' },
                { label: 'Efectos de Sonido Foley', key: 'SOUND_DESIGNER' },
              ].map((item, idx) => {
                const ok = memories.some((m) => m.key === item.key);
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {ok ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="text-[10px] font-bold">×</span>}
                    </div>
                    <span className={ok ? 'text-slate-200' : 'text-slate-500'}>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Particularizar campos */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                ✍️ Particularizar características antes de exportar
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    👤 Personajes de Referencia
                  </label>
                  <input
                    type="text"
                    value={veoCharacterCustom}
                    onChange={(e) => onUpdateVeoMetadata('char', e.target.value)}
                    placeholder="Ej. Kael con gabardina húmeda y visor..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    🖼️ Fondo y Escenarios
                  </label>
                  <input
                    type="text"
                    value={veoBackgroundCustom}
                    onChange={(e) => onUpdateVeoMetadata('bg', e.target.value)}
                    placeholder="Ej. Plataforma brutalista con lluvia..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    🔊 Audio / Música / Foley
                  </label>
                  <input
                    type="text"
                    value={veoSoundCustom}
                    onChange={(e) => onUpdateVeoMetadata('sound', e.target.value)}
                    placeholder="Ej. Banda sonora oscura a 60 bpm..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenExportModal}
                  data-testid="generate_veo_button"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>EJECUTAR ORQUESTADORES Y EXPORTAR A PROVEEDOR</span>
                </button>
              </div>
            </div>
          </div>

          {/* Storyboard Prompts Render Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Scene 1 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                ESCENA 1: ESTABLECIMIENTO - PLANO GENERAL
              </span>

              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
                <img
                  src="/movie_placeholder.jpg"
                  alt="Plano general de establecimiento"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-slate-300 font-mono">
                  Aspecto 2.39:1 • Anamórfico 35mm
                </div>
              </div>

              {(() => {
                const prompt1 = `Cinematic wide aspect ratio 2.39:1, establishing shot. High detail, octane render, 8k resolution. ${project.description}. ${project.artStyle} style, moody lighting, lens flares, dramatic atmosphere. ${veoBackgroundCustom ? `Environment: ${veoBackgroundCustom}.` : ''} ${veoCharacterCustom ? `Character: ${veoCharacterCustom}.` : ''}`;
                return (
                  <div>
                    <p className="text-xs text-slate-200 font-mono leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 line-clamp-3">
                      {prompt1}
                    </p>

                    <button
                      onClick={() => copyToClipboard(prompt1, 'p1')}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {copiedPromptId === 'p1' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Prompt Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copiar Prompt para IA de Video</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Scene 2 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                ESCENA 2: ACCIÓN & CLÍMAX - PRIMER PLANO
              </span>

              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
                <img
                  src="/movie_placeholder.jpg"
                  alt="Primer plano"
                  className="w-full h-full object-cover filter contrast-125"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-slate-300 font-mono">
                  Cooke Anamorphic 65mm • T2.0
                </div>
              </div>

              {(() => {
                const prompt2 = `Close up, shallow depth of field, 2.39:1 aspect ratio. Subject expressing intense emotion facing the camera. ${project.artStyle} style. Cinematic lighting, soft shadows, sharp focus on eyes. ${veoCharacterCustom ? `Character details: ${veoCharacterCustom}.` : ''}`;
                return (
                  <div>
                    <p className="text-xs text-slate-200 font-mono leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3 line-clamp-3">
                      {prompt2}
                    </p>

                    <button
                      onClick={() => copyToClipboard(prompt2, 'p2')}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {copiedPromptId === 'p2' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Prompt Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copiar Prompt para IA de Video</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Resumen de composición */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              📝 RESUMEN DE COMPOSICIÓN FINAL
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-bold text-amber-400 block mb-0.5">👤 Personajes:</span>
                <p className="text-slate-300">{veoCharacterCustom || 'Características del Character Designer registradas.'}</p>
              </div>
              <div>
                <span className="font-bold text-amber-400 block mb-0.5">🖼️ Fondos y Escenarios:</span>
                <p className="text-slate-300">{veoBackgroundCustom || 'Arquitectura y atmósfera del Production Designer.'}</p>
              </div>
              <div>
                <span className="font-bold text-amber-400 block mb-0.5">🔊 Audio y Banda Sonora:</span>
                <p className="text-slate-300">{veoSoundCustom || 'Directivas del Composer y Sound Designer integradas.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: LISTA DE LOS 24 DEPARTAMENTOS / ORQUESTADORES */}
      {activeTab === 1 && (
        <div className="space-y-4 flex-1 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              Departamentos / Orquestadores del Estudio
            </h3>
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar ZIP / Markdown</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {CINEMA_SUBAGENTS_CATALOG.map((agent) => {
              const mem = memories.find((m) => m.key === agent.key);
              const isExecuted = !!mem && mem.content.trim().length > 0;

              return (
                <div
                  key={agent.key}
                  data-testid={`subagent_card_${agent.key}`}
                  className={`p-5 rounded-2xl border transition-all ${
                    isExecuted
                      ? 'bg-amber-500/5 border-amber-500/40 hover:border-amber-500/70 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${isExecuted ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-slate-600'}`} />
                      <h4 className="text-sm font-bold text-white">
                        {agent.name}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isExecuted ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isExecuted ? 'Ejecutado' : 'Pendiente'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-2">
                    {agent.role} • <span className="text-slate-500">{agent.layer}</span>
                  </p>

                  {/* Snippet if executed */}
                  {isExecuted && mem && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-3 text-xs text-slate-300 font-mono line-clamp-3">
                      {mem.content}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isExecuted && mem && (
                      <button
                        onClick={() => copyToClipboard(mem.content, agent.key)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Exportar</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditSubagent(agent, mem?.content || '')}
                      data-testid={`subagent_edit_${agent.key}`}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TALLER / CONSOLA DE TRABAJO & MEMORIA CENTRAL */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 animate-fade-in">
          {/* Left: Layer Tree Navigation */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Mapa de Capas</span>
              </span>
              <button
                onClick={onClearMemory}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                title="Reiniciar a Project Bible inicial"
              >
                Reiniciar Memoria
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
              {CINEMA_LAYERS.map((layerName, layerIdx) => {
                const agentsInLayer = CINEMA_SUBAGENTS_CATALOG.filter((a) => a.layerId === layerIdx);
                return (
                  <div key={layerIdx} className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                      {layerName}
                    </span>
                    <div className="space-y-1">
                      {agentsInLayer.map((agent) => {
                        const isSelected = selectedSubagentKey === agent.key;
                        const isExecuted = memories.some((m) => m.key === agent.key);
                        return (
                          <div
                            key={agent.key}
                            onClick={() => {
                              setSelectedSubagentKey(agent.key);
                              setManualPrompt(agent.suggestedPrompt);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                                : 'bg-slate-950/70 hover:bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                isSelected ? 'bg-slate-950' : isExecuted ? 'bg-amber-400' : 'bg-slate-600'
                              }`} />
                              <span className="truncate">{agent.name}</span>
                            </div>
                            {isSubagentExpensive(agent.key) && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                $$$
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Workstation Console & Bible Viewer */}
          <div className="lg:col-span-8 space-y-6 flex flex-col">
            {/* Active Subagent Workstation Console */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedAgent.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedAgent.role} • {selectedAgent.layer}
                  </p>
                </div>

                {getSubagentCostInfo(selectedAgent.key) && (
                  <span className="text-[11px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg font-mono">
                    {getSubagentCostInfo(selectedAgent.key)}
                  </span>
                )}
              </div>

              {/* Duties snippet */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Funciones asignadas:
                </span>
                {selectedAgent.duties.map((d, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Consola de Instrucción / Prompt:
                </label>
                <textarea
                  value={manualPrompt || selectedAgent.suggestedPrompt}
                  onChange={(e) => setManualPrompt(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none font-mono resize-y"
                  placeholder="Instrucción cinematográfica para el agente..."
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Coste: {isSubagentExpensive(selectedAgent.key) ? 50 : 10} créditos</span>
                </div>

                <button
                  onClick={handleManualRun}
                  disabled={isExecutingManual}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10 flex items-center gap-2"
                >
                  {isExecutingManual ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Ejecutando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ejecutar Subagente</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Deliverable Output Preview */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Entregable Oficial en Memoria ({selectedAgent.key})</span>
                </span>

                {selectedMemory && (
                  <button
                    onClick={() => copyToClipboard(selectedMemory.content, 'deliv')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex-1 overflow-y-auto max-h-[400px]">
                {selectedMemory && selectedMemory.content ? (
                  <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedMemory.content}
                  </pre>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    (Aún no se ha generado ningún entregable para este orquestador. Haz clic en "Ejecutar Subagente" o realiza una edición manual.)
                  </div>
                )}
              </div>
            </div>

            {/* Revisions & Audit Log Mini-Tabs */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Historial de Versiones & Auditoría de Pipeline ({revisions.length} revisiones)</span>
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {revisions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No hay revisiones históricas adicionales aún.</p>
                ) : (
                  revisions.slice(0, 5).map((rev) => (
                    <div key={rev.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-amber-400">v{rev.version}</span> •{' '}
                        <span className="text-white">{rev.title}</span>
                        <span className="text-slate-500 text-[10px] ml-2">por {rev.author}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(rev.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
