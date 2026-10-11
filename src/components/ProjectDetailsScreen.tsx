import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  Menu,
  Copy,
  Check,
  Edit3,
  FileText,
  Download,
  Terminal,
  Clock,
  Sparkles,
  RefreshCw,
  Video,
  Image as ImageIcon,
  SlidersHorizontal,
  Film,
  BookOpen,
  Volume2,
  Music,
  User,
  MapPin,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import {
  MovieProject,
  ProjectMemory,
  ProjectMemoryRevision,
  AuditLog,
  TelemetryMetric,
  CinemaSubagent,
  ProviderSettings,
  VideoJob,
  GeneratedImage,
  MediaAsset,
} from '../types';
import { CINEMA_SUBAGENTS_CATALOG, CINEMA_LAYERS } from '../catalog';
import { StorageService } from '../storage';
import {
  generateImageApi,
  generateAudioApi,
  generateMusicApi,
  startVideoJobApi,
  checkVideoJobStatusApi,
  compilePromptsApi,
  fetchServerConfigApi,
} from '../api';
import { buildSubagentPrompt } from '../utils/promptBuilder';

interface ProjectDetailsScreenProps {
  project: MovieProject;
  memories: ProjectMemory[];
  revisions: ProjectMemoryRevision[];
  auditLogs: AuditLog[];
  metrics: TelemetryMetric[];
  providerSettings: ProviderSettings;
  useSecureGateway?: boolean;
  onToggleSecureGateway?: (val: boolean) => void;
  onOpenProviderSettings: () => void;
  onBackClick: () => void;
  onEditProjectClick?: () => void;
  onPurgeResidues?: () => void;
  onEditSubagent: (agent: CinemaSubagent, currentContent: string) => void;
  onOpenExportModal?: () => void;
  onOpenSocialModal?: () => void;
  onOpenPitchBibleModal: () => void;
  onOpenRenderStudioModal?: () => void;
  onOpenCharacterApprovalModal?: () => void;
  onOpenPromptEngineerModal?: () => void;
  onPropagateShowrunnerCascade?: () => void;
  onActivateAllSubagents?: () => Promise<void>;
  isActivatingAllAgents?: boolean;
  onUpdateVeoMetadata?: (type: 'char' | 'bg' | 'sound', value: string) => void;
  veoCharacterCustom?: string;
  veoBackgroundCustom?: string;
  veoSoundCustom?: string;
  veoVideoStatus?: string;
  onExecuteSubagentManually: (subagent: CinemaSubagent, prompt: string) => Promise<void>;
  onClearMemory?: () => void;
}

export const ProjectDetailsScreen: React.FC<ProjectDetailsScreenProps> = ({
  project,
  memories,
  revisions,
  providerSettings,
  onOpenProviderSettings,
  onBackClick,
  onEditProjectClick,
  onEditSubagent,
  onOpenPitchBibleModal,
  onOpenRenderStudioModal,
  onOpenCharacterApprovalModal,
  onOpenPromptEngineerModal,
  onPropagateShowrunnerCascade,
  onActivateAllSubagents,
  isActivatingAllAgents = false,
  onExecuteSubagentManually,
}) => {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0); // 0: Galería de Producción, 1: Biblias / Departamentos, 2: Taller & Consola
  const [selectedSubagentKey, setSelectedSubagentKey] = useState<string>('SHOWRUNNER');
  const [manualPrompt, setManualPrompt] = useState<string>(() =>
    buildSubagentPrompt(CINEMA_SUBAGENTS_CATALOG[0], project)
  );

  // Real media assets state
  const [assets, setAssets] = useState<MediaAsset[]>(() => StorageService.getAssets(project.id));
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>(() => StorageService.getVideoJobs(project.id));
  
  // Real-time server config & provider availability
  const [availability, setAvailability] = useState<{ google: boolean; openai: boolean; anthropic: boolean }>({
    google: false,
    openai: false,
    anthropic: false,
  });

  // Prompt compiler state
  const [compiledPackage, setCompiledPackage] = useState<any | null>(null);
  const [isCompilingPrompts, setIsCompilingPrompts] = useState<boolean>(false);

  // Active generating states
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState<boolean>(false);
  const [isGeneratingEnvironment, setIsGeneratingEnvironment] = useState<boolean>(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch provider availability and compile prompts
  useEffect(() => {
    fetchServerConfigApi()
      .then((res) => {
        if (res.availability) setAvailability(res.availability);
      })
      .catch((err) => console.warn('Could not load server config:', err));
  }, []);

  useEffect(() => {
    // Refresh local assets
    setAssets(StorageService.getAssets(project.id));
    setVideoJobs(StorageService.getVideoJobs(project.id));

    // Compile prompts for Seedance 2.0 and Veo
    setIsCompilingPrompts(true);
    compilePromptsApi(project, memories)
      .then((res) => {
        if (res.compiled) setCompiledPackage(res.compiled);
      })
      .catch((err) => {
        console.warn('Prompt compilation failed:', err);
      })
      .finally(() => setIsCompilingPrompts(false));
  }, [project.id, memories]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const selectedAgent = useMemo(
    () => CINEMA_SUBAGENTS_CATALOG.find((a) => a.key === selectedSubagentKey) || CINEMA_SUBAGENTS_CATALOG[0],
    [selectedSubagentKey]
  );

  const selectedMemory = useMemo(
    () => memories.find((m) => m.key === selectedSubagentKey),
    [memories, selectedSubagentKey]
  );

  // Provider keys check
  const hasGeminiKey = availability.google || Boolean(providerSettings.geminiApiKey?.trim());
  const hasOpenAiKey = availability.openai || Boolean(providerSettings.openaiApiKey?.trim());

  // Generation Handlers
  const handleGenerateCharacterImage = async () => {
    if (!hasGeminiKey && !hasOpenAiKey) {
      setActionError('Se requiere configurar una clave de API (Google Gemini o OpenAI) para generar imágenes reales.');
      return;
    }
    setActionError(null);
    setIsGeneratingCharacter(true);
    try {
      const charMem = memories.find((m) => m.key === 'CHARACTER_DESIGNER')?.content || '';
      const prompt = charMem.slice(0, 300) || `${project.description}. Retrato cinematográfico del protagonista en ${project.artStyle}`;
      const res = await generateImageApi(project.id, 'CHARACTER_DESIGNER', 'Diseño de Personaje', prompt, providerSettings, {
        role: 'character',
        style: project.artStyle,
      });
      if (res.image) {
        setAssets(StorageService.getAssets(project.id));
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error al generar imagen de personaje');
    } finally {
      setIsGeneratingCharacter(false);
    }
  };

  const handleGenerateEnvironmentImage = async () => {
    if (!hasGeminiKey && !hasOpenAiKey) {
      setActionError('Se requiere configurar una clave de API (Google Gemini o OpenAI) para generar fondos.');
      return;
    }
    setActionError(null);
    setIsGeneratingEnvironment(true);
    try {
      const envMem = memories.find((m) => m.key === 'PRODUCTION_DESIGNER')?.content || '';
      const prompt = envMem.slice(0, 300) || `${project.description}. Escenario principal y arquitectura en ${project.artStyle}`;
      const res = await generateImageApi(project.id, 'PRODUCTION_DESIGNER', 'Fondo de Escenario', prompt, providerSettings, {
        role: 'environment',
        style: project.artStyle,
      });
      if (res.image) {
        setAssets(StorageService.getAssets(project.id));
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error al generar fondo');
    } finally {
      setIsGeneratingEnvironment(false);
    }
  };

  const handleGenerateAudioTts = async () => {
    if (!hasGeminiKey && !hasOpenAiKey) {
      setActionError('Se requiere configurar una clave de API para la síntesis de voz / foley.');
      return;
    }
    setActionError(null);
    setIsGeneratingAudio(true);
    try {
      const scriptMem = memories.find((m) => m.key === 'GUIONISTA')?.content || '';
      const speechText = scriptMem.slice(0, 250) || `Producción cinematográfica: ${project.title}. ${project.description}`;
      const res = await generateAudioApi(project.id, speechText, 'Aoede', providerSettings);
      if (res.audio) {
        setAssets(StorageService.getAssets(project.id));
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error al sintetizar audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateMusicScore = async () => {
    if (!hasGeminiKey) {
      setActionError('La generación musical con Google Lyria requiere clave de Google Gemini.');
      return;
    }
    setActionError(null);
    setIsGeneratingMusic(true);
    try {
      const prompt = compiledPackage?.musicPrompt || `Cinematic score for ${project.title}. Orchestral strings, emotional cello, 72 BPM`;
      const res = await generateMusicApi(project.id, prompt, providerSettings);
      if (res.music) {
        setAssets(StorageService.getAssets(project.id));
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error al generar música');
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const handleStartVeoVideo = async () => {
    if (!hasGeminiKey) {
      setActionError('El motor Google Veo requiere clave de Google Gemini.');
      return;
    }
    setActionError(null);
    setIsGeneratingVideo(true);
    try {
      const prompt = compiledPackage?.veoVideoPrompt || `Cinematic tracking shot for ${project.title}`;
      const res = await startVideoJobApi(project.id, 1, 'Toma 1 (Apertura)', prompt, 4, providerSettings);
      if (res.job) {
        StorageService.saveVideoJob(res.job);
        setVideoJobs(StorageService.getVideoJobs(project.id));
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error al iniciar render de video con Veo');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Asset filtering
  const imageAssets = assets.filter((a) => a.type === 'image');
  const audioAssets = assets.filter((a) => a.type === 'audio');
  const musicAssets = assets.filter((a) => a.type === 'music');
  const videoAssets = assets.filter((a) => a.type === 'video');

  const hasCharacterImg = imageAssets.some((a) => a.role === 'character' || a.role === 'CHARACTER_DESIGNER');
  const hasEnvImg = imageAssets.some((a) => a.role === 'environment' || a.role === 'PRODUCTION_DESIGNER');
  const hasAudioTrack = audioAssets.length > 0;
  const hasMusicScore = musicAssets.length > 0;
  const hasVideoRender = videoAssets.length > 0 || videoJobs.some((j) => j.status === 'COMPLETED');

  return (
    <div className="min-h-[calc(100vh-65px)] max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackClick}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Volver a proyectos"
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
              {onEditProjectClick && (
                <button
                  onClick={onEditProjectClick}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Género: {project.genre} · {project.duration || '3 minutos'} · {memories.length}/24 entregables técnicos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCharacterApprovalModal && (
            <button
              onClick={onOpenCharacterApprovalModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Personajes ({imageAssets.length})</span>
            </button>
          )}

          {onOpenPromptEngineerModal && (
            <button
              onClick={onOpenPromptEngineerModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Ingeniero de Prompts</span>
            </button>
          )}

          <button
            onClick={onOpenPitchBibleModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/15 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>📖 Pitch Bible (PDF)</span>
          </button>
        </div>
      </div>

      {/* Premise Context Note */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3 mb-6">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-amber-300 mr-2">Premisa del Creador:</span>
          <span>"{project.description || 'Sin premisa registrada.'}"</span>
        </div>
      </div>

      {/* Error alert if any */}
      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 mb-6 max-w-xl">
        <button
          onClick={() => setActiveTab(0)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 0 ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Galería de Producción</span>
        </button>

        <button
          onClick={() => setActiveTab(1)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 1 ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Biblias de Producción ({memories.length}/24)</span>
        </button>

        <button
          onClick={() => setActiveTab(2)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 2 ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Taller & Consola</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: GALERÍA DE PRODUCCIÓN (ACTIVOS REALES & PROMPTS COMPILADOS)         */}
      {/* ========================================================================= */}
      {activeTab === 0 && (
        <div className="space-y-6 flex-1 animate-fade-in">
          {/* Action Hub & Real Checklist */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <span>Generadores Multimedia & Activos Reales</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Produce fotogramas fotorrealistas, voces TTS, música y clips con los modelos configurados
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProviderSettings}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                  <span>Ajustes de Modelos</span>
                </button>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasCharacterImg ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {hasCharacterImg ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="text-[10px] font-bold">×</span>}
                </div>
                <span className={hasCharacterImg ? 'text-slate-200' : 'text-slate-500'}>Personaje ({imageAssets.filter(a => a.role === 'character' || a.role === 'CHARACTER_DESIGNER').length})</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasEnvImg ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {hasEnvImg ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="text-[10px] font-bold">×</span>}
                </div>
                <span className={hasEnvImg ? 'text-slate-200' : 'text-slate-500'}>Escenario ({imageAssets.filter(a => a.role === 'environment' || a.role === 'PRODUCTION_DESIGNER').length})</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasAudioTrack ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {hasAudioTrack ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="text-[10px] font-bold">×</span>}
                </div>
                <span className={hasAudioTrack ? 'text-slate-200' : 'text-slate-500'}>Audio TTS ({audioAssets.length})</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasMusicScore ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {hasMusicScore ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="text-[10px] font-bold">×</span>}
                </div>
                <span className={hasMusicScore ? 'text-slate-200' : 'text-slate-500'}>Banda Sonora ({musicAssets.length})</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasVideoRender ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {hasVideoRender ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="text-[10px] font-bold">×</span>}
                </div>
                <span className={hasVideoRender ? 'text-slate-200' : 'text-slate-500'}>Video Veo ({videoJobs.length})</span>
              </div>
            </div>

            {/* Generator Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {/* Generate Character */}
              <button
                onClick={handleGenerateCharacterImage}
                disabled={isGeneratingCharacter || (!hasGeminiKey && !hasOpenAiKey)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1 group-hover:text-amber-400">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isGeneratingCharacter ? 'Generando...' : 'Retrato Personaje'}</span>
                </div>
                <span className="text-[10px] text-slate-400 block">{hasGeminiKey || hasOpenAiKey ? 'Google Imagen / DALL-E' : 'Clave requerida'}</span>
              </button>

              {/* Generate Environment */}
              <button
                onClick={handleGenerateEnvironmentImage}
                disabled={isGeneratingEnvironment || (!hasGeminiKey && !hasOpenAiKey)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1 group-hover:text-amber-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isGeneratingEnvironment ? 'Generando...' : 'Fondo Escenario'}</span>
                </div>
                <span className="text-[10px] text-slate-400 block">{hasGeminiKey || hasOpenAiKey ? 'Google Imagen 16:9' : 'Clave requerida'}</span>
              </button>

              {/* Generate Audio TTS */}
              <button
                onClick={handleGenerateAudioTts}
                disabled={isGeneratingAudio || (!hasGeminiKey && !hasOpenAiKey)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1 group-hover:text-amber-400">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isGeneratingAudio ? 'Sintetizando...' : 'Voz / Foley TTS'}</span>
                </div>
                <span className="text-[10px] text-slate-400 block">{hasGeminiKey || hasOpenAiKey ? 'Gemini TTS / OpenAI' : 'Clave requerida'}</span>
              </button>

              {/* Generate Music */}
              <button
                onClick={handleGenerateMusicScore}
                disabled={isGeneratingMusic || !hasGeminiKey}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1 group-hover:text-amber-400">
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isGeneratingMusic ? 'Componiendo...' : 'Banda Sonora'}</span>
                </div>
                <span className="text-[10px] text-slate-400 block">{hasGeminiKey ? 'Google Lyria Clip' : 'Gemini Key requerida'}</span>
              </button>

              {/* Generate Veo Video */}
              <button
                onClick={handleStartVeoVideo}
                disabled={isGeneratingVideo || !hasGeminiKey}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1 group-hover:text-amber-400">
                  <Video className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isGeneratingVideo ? 'Iniciando...' : 'Render Video'}</span>
                </div>
                <span className="text-[10px] text-slate-400 block">{hasGeminiKey ? 'Google Veo 3.1' : 'Gemini Key requerida'}</span>
              </button>
            </div>
          </div>

          {/* Real Assets Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>Galería Visual y Activos Generados ({assets.length})</span>
            </h4>

            {assets.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-dashed border-slate-800 text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Aún no has generado activos multimedia para este proyecto. Usa los botones superiores para crear retratos, fondos o audios reales.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset, idx) => (
                  <div
                    key={`asset_${asset.id}_${idx}`}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-white truncate max-w-[180px]">{asset.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                          {asset.provider}
                        </span>
                      </div>

                      {/* Image Asset */}
                      {asset.type === 'image' && (
                        <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-slate-800 mb-2">
                          <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Audio or Music Asset */}
                      {(asset.type === 'audio' || asset.type === 'music') && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-2 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
                            {asset.type === 'music' ? <Music className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            <span>{asset.type === 'music' ? 'Tema Musical' : 'Pista de Voz / Foley'}</span>
                          </div>
                          <audio src={asset.url} controls className="w-full h-8" />
                        </div>
                      )}

                      {/* Video Asset */}
                      {asset.type === 'video' && (
                        <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-slate-800 mb-2">
                          <video src={asset.url} controls className="w-full h-full object-cover" />
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 font-mono line-clamp-2 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        "{asset.prompt}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-[10px] text-slate-500">{new Date(asset.createdAt).toLocaleTimeString()}</span>
                      <a
                        href={asset.url}
                        download
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px]"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compiled Prompts Specification for ByteDance Seedance 2.0 & Google Veo */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  <span>Especificaciones de Video: ByteDance Seedance 2.0 & Google Veo</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prompts maestros multi-toma compilados automáticamente a partir de tus 24 entregables técnicos
                </p>
              </div>

              {compiledPackage && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  ● Compilación Sincronizada
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ByteDance Seedance 2.0 Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>🎬 ByteDance Seedance 2.0</span>
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      2.39:1 Anamórfico
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Estructurado para coherencia de personajes, tomas secuenciales y movimientos de cámara (Dolly / Steadicam).
                  </p>
                  <pre className="text-xs text-slate-200 font-mono p-3 rounded-lg bg-slate-900 border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {compiledPackage?.seedanceVideoPrompt || 'Compilando especificación para Seedance 2.0...'}
                  </pre>
                </div>

                <button
                  onClick={() => copyToClipboard(compiledPackage?.seedanceVideoPrompt || '', 'seedance_p')}
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedId === 'seedance_p' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado al Portapapeles</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Prompt Seedance 2.0</span>
                    </>
                  )}
                </button>
              </div>

              {/* Google Veo Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>⚡ Google Veo 3.1</span>
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      Fotorrealismo 24fps
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Optimizado para iluminación volumétrica y simulación de físicas cinematográficas avanzadas.
                  </p>
                  <pre className="text-xs text-slate-200 font-mono p-3 rounded-lg bg-slate-900 border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {compiledPackage?.veoVideoPrompt || 'Compilando especificación para Google Veo...'}
                  </pre>
                </div>

                <button
                  onClick={() => copyToClipboard(compiledPackage?.veoVideoPrompt || '', 'veo_p')}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  {copiedId === 'veo_p' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado al Portapapeles</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Prompt Google Veo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BIBLIAS DE PRODUCCIÓN (24 DEPARTAMENTOS & MODELOS REALES)          */}
      {/* ========================================================================= */}
      {activeTab === 1 && (
        <div className="space-y-6 flex-1 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Departamentos de Producción Cinematográfica
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold border border-slate-700">
                  {memories.filter((m) => m.content?.trim().length > 0).length} / 24 Entregables
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Memoria acumulativa por capas con modelos fundacionales (Gemini 3.8 Flash, GPT-4o, Claude Sonnet)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onActivateAllSubagents && (
                <button
                  onClick={onActivateAllSubagents}
                  disabled={isActivatingAllAgents}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isActivatingAllAgents ? 'animate-spin' : ''}`} />
                  <span>{isActivatingAllAgents ? 'Ejecutando 24 Agentes...' : '⚡ Re-ejecutar Todos (24/24)'}</span>
                </button>
              )}

              {onPropagateShowrunnerCascade && (
                <button
                  onClick={onPropagateShowrunnerCascade}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>🔄 Propagar Showrunner</span>
                </button>
              )}
            </div>
          </div>

          {/* Department List Grid */}
          <div className="space-y-6">
            {CINEMA_LAYERS.map((layerName, layerIdx) => {
              const agentsInLayer = CINEMA_SUBAGENTS_CATALOG.filter((a) => a.layerId === layerIdx);
              return (
                <div key={`layer_${layerIdx}`} className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
                    {layerName}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {agentsInLayer.map((agent) => {
                      const mem = memories.find((m) => m.key === agent.key);
                      const isGenerated = Boolean(mem && mem.content?.trim().length > 0);
                      return (
                        <div
                          key={`agent_card_${agent.key}`}
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                {agent.name}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isGenerated ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                {isGenerated ? 'Listo' : 'Pendiente'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mb-2">{agent.role}</span>
                            {isGenerated ? (
                              <p className="text-xs text-slate-300 font-mono line-clamp-3 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                                {mem?.content}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 italic p-2 rounded-lg bg-slate-950 border border-slate-900">
                                Sin entregable generado aún.
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                            <span className="text-[10px] text-slate-500">{providerSettings.textModel}</span>
                            <button
                              onClick={() => onEditSubagent(agent, mem?.content || '')}
                              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{isGenerated ? 'Editar Entregable' : 'Generar en Taller'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TALLER & CONSOLA MANUAL                                             */}
      {/* ========================================================================= */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 animate-fade-in">
          {/* Agent Selector Sidebar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Seleccionar Agente:
            </span>
            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {CINEMA_SUBAGENTS_CATALOG.map((agent) => {
                const isSelected = selectedSubagentKey === agent.key;
                const isDone = memories.some((m) => m.key === agent.key);
                return (
                  <button
                    key={`taller_agent_${agent.key}`}
                    onClick={() => {
                      setSelectedSubagentKey(agent.key);
                      setManualPrompt(buildSubagentPrompt(agent, project));
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                    }`}
                  >
                    <span className="truncate">{agent.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-slate-950 font-black' : isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isDone ? '●' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt & Terminal Output */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{selectedAgent.name}</h4>
                <p className="text-xs text-slate-400">{selectedAgent.role} · {selectedAgent.layer}</p>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {providerSettings.textModel}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Prompt para Inferencia en Vivo:
              </label>
              <textarea
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-amber-500 outline-none resize-y"
              />
            </div>

            <button
              onClick={() => onExecuteSubagentManually(selectedAgent, manualPrompt)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Ejecutar Agente con Modelo Real</span>
            </button>

            {/* Current Deliverable Viewer */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-400 block mb-1.5">
                Entregable Actual en Memoria:
              </span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                {selectedMemory?.content || 'Aún no se ha generado un entregable para este subagente.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
