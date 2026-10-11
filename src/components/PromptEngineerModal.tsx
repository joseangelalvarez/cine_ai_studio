import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Wand2,
  Image as ImageIcon,
  Film,
  Volume2,
  Music,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Camera,
  Compass,
  Sliders,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { MovieProject, ProjectMemory, ProviderSettings } from '../types';
import { StorageService } from '../storage';
import {
  MultimediaPromptEngineer,
  PromptModality,
  SynthesizedPromptResult,
  purgeAdministrativeJunk,
  extractProtagonistName,
  extractLocationName,
} from '../utils/orchestratorPromptEngine';
import { synthesizePromptWithEngineerApi } from '../api';

interface PromptEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MovieProject;
  memories: ProjectMemory[];
  providerSettings: ProviderSettings;
  onLaunchImageRender?: (prompt: string, role: string) => void;
  onLaunchVideoRender?: (prompt: string, title: string) => void;
}

export const PromptEngineerModal: React.FC<PromptEngineerModalProps> = ({
  isOpen,
  onClose,
  project,
  memories,
  providerSettings,
  onLaunchImageRender,
  onLaunchVideoRender,
}) => {
  const [activeModality, setActiveModality] = useState<PromptModality>('image');
  const [imageRole, setImageRole] = useState<'protagonist' | 'turnaround' | 'costar' | 'environment'>('protagonist');
  const [videoShotType, setVideoShotType] = useState<'establishing' | 'medium_dramatic' | 'close_up' | 'tracking_action'>('establishing');
  const [audioType, setAudioType] = useState<'ambient_foley' | 'impact_action' | 'props_diegetic'>('ambient_foley');
  const [musicType, setMusicType] = useState<'main_theme' | 'tension_cue' | 'emotional_climax'>('main_theme');

  const [customDirectorNotes, setCustomDirectorNotes] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customizedPrompts, setCustomizedPrompts] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showRawExtraction, setShowRawExtraction] = useState<boolean>(false);

  // Strictly scope memories to active project
  const projectMems = useMemo(() => {
    const pool: ProjectMemory[] = memories && memories.length > 0 ? memories : StorageService.getMemories(project.id);
    return pool.filter((m: ProjectMemory) => m.projectId === project.id);
  }, [memories, project.id]);

  // Reset prompts cache whenever project ID changes
  useEffect(() => {
    setCustomDirectorNotes('');
    setCustomizedPrompts({});
    setStatusMessage(null);
  }, [project.id]);

  const protagonistName = useMemo(() => {
    const charMem = projectMems.find((m: ProjectMemory) => m.key === 'CHARACTER_DESIGNER');
    return extractProtagonistName(charMem?.content, project.description);
  }, [projectMems, project.description]);

  const locationName = useMemo(() => {
    const envMem = projectMems.find((m: ProjectMemory) => m.key === 'PRODUCTION_DESIGNER');
    return extractLocationName(envMem?.content, project.description);
  }, [projectMems, project.description]);

  // Compute baseline deterministic prompt for current modality & subType
  const currentBaseline = useMemo<SynthesizedPromptResult>(() => {
    if (activeModality === 'video') {
      return MultimediaPromptEngineer.synthesizeVideoPrompt(project, projectMems, videoShotType, customDirectorNotes);
    }
    if (activeModality === 'audio') {
      return MultimediaPromptEngineer.synthesizeAudioPrompt(project, projectMems, audioType, customDirectorNotes);
    }
    if (activeModality === 'music') {
      return MultimediaPromptEngineer.synthesizeMusicPrompt(project, projectMems, musicType, customDirectorNotes);
    }
    return MultimediaPromptEngineer.synthesizeImagePrompt(project, projectMems, imageRole, customDirectorNotes);
  }, [activeModality, imageRole, videoShotType, audioType, musicType, project, projectMems, customDirectorNotes]);

  // Current active key for caching manual prompt edits
  const activePromptKey = `${activeModality}_${
    activeModality === 'image'
      ? imageRole
      : activeModality === 'video'
      ? videoShotType
      : activeModality === 'audio'
      ? audioType
      : musicType
  }`;

  const currentDisplayPrompt = customizedPrompts[activePromptKey] ?? currentBaseline.masterPrompt;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSynthesizeWithAi = async () => {
    setIsSynthesizing(true);
    setStatusMessage('El Agente Ingeniero de Prompts está destilando directivas y redactando...');
    try {
      const subType =
        activeModality === 'image'
          ? imageRole
          : activeModality === 'video'
          ? videoShotType
          : activeModality === 'audio'
          ? audioType
          : musicType;

      const res = await synthesizePromptWithEngineerApi({
        project,
        modality: activeModality,
        subType,
        characterDirectives: currentBaseline.rawExtractedLayers.character,
        environmentDirectives: currentBaseline.rawExtractedLayers.environment,
        artDirectives: currentBaseline.rawExtractedLayers.art,
        cameraDirectives: currentBaseline.rawExtractedLayers.camera,
        soundDirectives: currentBaseline.rawExtractedLayers.sound,
        musicDirectives: currentBaseline.rawExtractedLayers.music,
        customNotes: customDirectorNotes,
        providerSettings,
      });

      if (res.success && res.prompt) {
        // Enforce zero administrative junk on final prompt
        const pristinePrompt = purgeAdministrativeJunk(res.prompt);
        setCustomizedPrompts((prev) => ({
          ...prev,
          [activePromptKey]: pristinePrompt,
        }));
        setStatusMessage(`✨ Prompt optimizado exitosamente con ${res.mode === 'gemini-3.8-flash' ? 'Gemini Flash' : 'Motor Especializado'}`);
      }
    } catch (err: any) {
      console.warn('AI prompt synthesis error:', err);
      // Fallback: apply deterministic engine
      setCustomizedPrompts((prev) => ({
        ...prev,
        [activePromptKey]: currentBaseline.masterPrompt,
      }));
      setStatusMessage('✨ Prompt ensamblado con motor determinista de alta fidelidad');
    } finally {
      setIsSynthesizing(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleResetToBaseline = () => {
    setCustomizedPrompts((prev) => {
      const copy = { ...prev };
      delete copy[activePromptKey];
      return copy;
    });
    setStatusMessage('Prompt restablecido a la síntesis base de los orquestadores');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Agente Ingeniero de Prompts Generativos
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                  Multimodal (Imagen, Video, Audio, Música)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  0% Metadatos Burocráticos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Destila los entregables técnicos de los 24 orquestadores de <strong>"{project.title}"</strong> y los traduce en sintaxis maestra para inferencia de IA.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar estudio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Modality Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveModality('image')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeModality === 'image'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>🖼️ Imagen (Diffusion)</span>
            </button>

            <button
              onClick={() => setActiveModality('video')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeModality === 'video'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>🎬 Video (Veo / Runway / Seedance 2.0)</span>
            </button>

            <button
              onClick={() => setActiveModality('audio')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeModality === 'audio'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>🔊 Audio & Foley (SFX)</span>
            </button>

            <button
              onClick={() => setActiveModality('music')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeModality === 'music'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>🎵 Música & Score (Suno / Udio)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawExtraction(!showRawExtraction)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                showRawExtraction
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Alternar vista de capas limpias extraídas"
            >
              <Layers className="w-3 h-3" />
              <span>{showRawExtraction ? 'Ocultar Capas' : 'Ver Capas Extraídas'}</span>
            </button>
          </div>
        </div>

        {/* Status notification toast */}
        {statusMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Subtype Selectors per Modality */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Tipo de Toma / Entregable:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {activeModality === 'image' && (
                <>
                  {[
                    { id: 'protagonist', label: `Retrato (${protagonistName})` },
                    { id: 'turnaround', label: 'Turnaround 3D' },
                    { id: 'costar', label: 'Coprotagonista en Set' },
                    { id: 'environment', label: `Set (${locationName})` },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setImageRole(sub.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        imageRole === sub.id
                          ? 'bg-amber-400 text-slate-950 font-bold shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </>
              )}

              {activeModality === 'video' && (
                <>
                  {[
                    { id: 'establishing', label: '1. Establishing Panorámico' },
                    { id: 'medium_dramatic', label: '2. Plano Medio Dramático' },
                    { id: 'close_up', label: '3. Primer Plano Emocional' },
                    { id: 'tracking_action', label: '4. Tracking Dinámico' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setVideoShotType(sub.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        videoShotType === sub.id
                          ? 'bg-amber-400 text-slate-950 font-bold shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </>
              )}

              {activeModality === 'audio' && (
                <>
                  {[
                    { id: 'ambient_foley', label: '1. Ambiente & Room Tone' },
                    { id: 'impact_action', label: '2. Impactos & Efectos SFX' },
                    { id: 'props_diegetic', label: '3. Foley Ropa & Pasos' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setAudioType(sub.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        audioType === sub.id
                          ? 'bg-amber-400 text-slate-950 font-bold shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </>
              )}

              {activeModality === 'music' && (
                <>
                  {[
                    { id: 'main_theme', label: '1. Tema Principal (Leitmotif)' },
                    { id: 'tension_cue', label: '2. Underscore de Tensión' },
                    { id: 'emotional_climax', label: '3. Clímax Emocional' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setMusicType(sub.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        musicType === sub.id
                          ? 'bg-amber-400 text-slate-950 font-bold shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Optional Raw Extracted Layers Inspection */}
          {showRawExtraction && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Layers className="w-3.5 h-3.5" />
                  Directivas Purificadas de los Orquestadores (Sin Metadatos Burocráticos)
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  ✓ 100% Sanitizado
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                {currentBaseline.rawExtractedLayers.character && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">🎭 Capa Personajes:</span>
                    <p className="text-slate-300 leading-relaxed">{currentBaseline.rawExtractedLayers.character}</p>
                  </div>
                )}
                {currentBaseline.rawExtractedLayers.environment && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-1">🏗️ Capa Set & Entorno:</span>
                    <p className="text-slate-300 leading-relaxed">{currentBaseline.rawExtractedLayers.environment}</p>
                  </div>
                )}
                {currentBaseline.rawExtractedLayers.art && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-purple-400 font-bold block mb-1">🎨 Capa Arte & Paleta:</span>
                    <p className="text-slate-300 leading-relaxed">{currentBaseline.rawExtractedLayers.art}</p>
                  </div>
                )}
                {currentBaseline.rawExtractedLayers.camera && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-1">🎥 Capa DoP & Óptica:</span>
                    <p className="text-slate-300 leading-relaxed">{currentBaseline.rawExtractedLayers.camera}</p>
                  </div>
                )}
                {currentBaseline.rawExtractedLayers.sound && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-indigo-400 font-bold block mb-1">🔊 Capa Audio & Foley:</span>
                    <p className="text-slate-300 leading-relaxed">{currentBaseline.rawExtractedLayers.sound}</p>
                  </div>
                )}
                {currentBaseline.rawExtractedLayers.music && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-rose-400 font-bold block mb-1">🎵 Capa Partitura & Score:</span>
                    <p className="text-slate-300 leading-relaxed">{currentBaseline.rawExtractedLayers.music}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Master Prompt Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg">⚡</span>
                <div>
                  <h3 className="text-sm font-black text-amber-300">
                    PROMPT MAESTRO DEFINITIVO PARA INFERENCIA DE IA
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {currentBaseline.title}
                  </span>
                </div>
              </div>

              {/* Target Engines Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentBaseline.targetEngines.map((engine, idx) => (
                  <span
                    key={`engine_tag_${engine}_${idx}`}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-slate-300"
                  >
                    {engine}
                  </span>
                ))}
              </div>
            </div>

            {/* Editable Prompt Area */}
            <div className="relative">
              <textarea
                value={currentDisplayPrompt}
                onChange={(e) => {
                  setCustomizedPrompts((prev) => ({
                    ...prev,
                    [activePromptKey]: e.target.value,
                  }));
                }}
                rows={5}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 resize-y"
                placeholder="El prompt sintetizado aparecerá aquí..."
              />
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button
                  onClick={() => handleCopy(currentDisplayPrompt, 'master')}
                  className="px-2 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-slate-700"
                  title="Copiar prompt al portapapeles"
                >
                  {copiedKey === 'master' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-amber-400" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Technical Specs pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {Object.entries(currentBaseline.specs).map(([specKey, specVal]) => (
                <div key={specKey} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">{specKey}</span>
                  <span className="text-slate-200 font-medium truncate block">{specVal}</span>
                </div>
              ))}
            </div>

            {/* Negative Prompt if applicable */}
            {currentBaseline.negativePrompt && (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-red-400 block mb-0.5 text-[11px]">
                    🚫 Negative Prompt Recomendado (Evita deformaciones y marcas de agua):
                  </span>
                  <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                    {currentBaseline.negativePrompt}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(currentBaseline.negativePrompt || '', 'negative')}
                  className="shrink-0 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer border border-slate-700"
                  title="Copiar negative prompt"
                >
                  {copiedKey === 'negative' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Actions Bar inside Prompt Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSynthesizeWithAi}
                  disabled={isSynthesizing}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black shadow-md shadow-amber-500/15 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Wand2 className={`w-3.5 h-3.5 stroke-[2.5] ${isSynthesizing ? 'animate-spin' : ''}`} />
                  <span>{isSynthesizing ? 'Sintetizando con IA...' : '✨ Pulir con Ingeniero de Prompts IA'}</span>
                </button>

                {customizedPrompts[activePromptKey] && (
                  <button
                    onClick={handleResetToBaseline}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    title="Restablecer a la versión base calculada"
                  >
                    Restablecer
                  </button>
                )}
              </div>

              {/* Execution Triggers */}
              <div className="flex items-center gap-2">
                {activeModality === 'image' && onLaunchImageRender && (
                  <button
                    onClick={() => {
                      onLaunchImageRender(currentDisplayPrompt, imageRole);
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Renderizar Imagen Ahora</span>
                  </button>
                )}

                {activeModality === 'video' && onLaunchVideoRender && (
                  <button
                    onClick={() => {
                      onLaunchVideoRender(currentDisplayPrompt, currentBaseline.title);
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lanzar en Render Studio</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Director Custom Guidance Input */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              Notas Adicionales del Director (Opcional):
            </span>
            <input
              type="text"
              value={customDirectorNotes}
              onChange={(e) => setCustomDirectorNotes(e.target.value)}
              placeholder="Ej. 'Añadir lluvia ácida más densa, reflejos de neón cian en el suelo mojado, mirada nostálgica'..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Estudio del Ingeniero de Prompts Activo y Conectado a la Memoria Central</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
