import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Sparkles,
  User,
  Clock,
  Film,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Trash2,
  Layers,
  Wand2,
  Camera,
  Compass,
  Palette,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  HelpCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clapperboard,
} from 'lucide-react';
import { MovieProject, ProjectMemory, ProviderSettings, GeneratedImage } from '../types';
import { StorageService } from '../storage';
import { generateImageApi, synthesizeImagePromptApi, synthesizePromptWithEngineerApi } from '../api';
import { buildOrchestratedPrompt, PromptLayerBreakdown } from '../utils/orchestratorPromptEngine';

interface CharacterApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MovieProject;
  characterMemory?: ProjectMemory;
  environmentMemory?: ProjectMemory;
  artMemory?: ProjectMemory;
  dopMemory?: ProjectMemory;
  scriptMemory?: ProjectMemory;
  allMemories?: ProjectMemory[];
  providerSettings: ProviderSettings;
  onUpdateProviderSettings?: (settings: ProviderSettings) => void;
  onApproveAndProceedToRender: () => void;
  onPostponeRender: () => void;
  onRegenerateCharacterArt?: (notes?: string) => Promise<void>;
  onImagesUpdated?: (images: GeneratedImage[]) => void;
  onOpenPromptEngineer?: () => void;
}

export const CharacterApprovalModal: React.FC<CharacterApprovalModalProps> = ({
  isOpen,
  onClose,
  project,
  characterMemory,
  environmentMemory,
  artMemory,
  dopMemory,
  scriptMemory,
  allMemories,
  providerSettings,
  onUpdateProviderSettings,
  onApproveAndProceedToRender,
  onPostponeRender,
  onImagesUpdated,
  onOpenPromptEngineer,
}) => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderingStep, setRenderingStep] = useState<string>('');
  
  // Navigation tab inside modal: Gallery & Studio vs Prompt Inspector & Constructor
  const [activeModalTab, setActiveModalTab] = useState<'gallery' | 'prompt_inspector'>('gallery');
  
  // Role selector
  const [selectedRole, setSelectedRole] = useState<'protagonist' | 'turnaround' | 'costar' | 'environment'>('protagonist');
  const [selectedEngine, setSelectedEngine] = useState<string>('google-imagen');
  const [filterTab, setFilterTab] = useState<'all' | 'protagonist' | 'turnaround' | 'costar' | 'environment'>('all');
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isPaidKeyRequired, setIsPaidKeyRequired] = useState<boolean>(false);

  // Custom prompt overrides
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [editableFinalPrompt, setEditableFinalPrompt] = useState<string>('');
  const [isPromptCustomized, setIsPromptCustomized] = useState<boolean>(false);
  const [showPromptDetails, setShowPromptDetails] = useState<boolean>(false);
  const [isSynthesizingPrompt, setIsSynthesizingPrompt] = useState<boolean>(false);
  const [inlineApiKey, setInlineApiKey] = useState<string>('');

  // Extract memories - strictly scoped to active project to prevent cross-project memory contamination
  const projectMems = useMemo(() => {
    const pool = allMemories && allMemories.length > 0
      ? allMemories
      : StorageService.getMemories(project.id);
    return pool.filter((m) => m.projectId === project.id);
  }, [allMemories, project.id]);

  const charMem = characterMemory && Number(characterMemory.projectId) === Number(project.id)
    ? characterMemory
    : projectMems.find((m) => m.key === 'CHARACTER_DESIGNER');
  const envMem = environmentMemory && Number(environmentMemory.projectId) === Number(project.id)
    ? environmentMemory
    : projectMems.find((m) => m.key === 'PRODUCTION_DESIGNER');
  const artMem = artMemory && Number(artMemory.projectId) === Number(project.id)
    ? artMemory
    : projectMems.find((m) => m.key === 'DIRECTOR_ARTE');
  const dMem = dopMemory && Number(dopMemory.projectId) === Number(project.id)
    ? dopMemory
    : projectMems.find((m) => m.key === 'DOP' || m.key === 'DIRECTOR_FOTOGRAFIA');
  const scriptMem = scriptMemory && Number(scriptMemory.projectId) === Number(project.id)
    ? scriptMemory
    : projectMems.find((m) => m.key === 'GUIONISTA');

  // Dynamically extract protagonist and environment names from active project/memories
  const { protagonistName, locationName } = useMemo(() => {
    let prot = '';
    if (charMem?.content) {
      const lines = charMem.content.split('\n');
      for (const line of lines) {
        const match = line.match(/(?:Nombre|Personaje|Protagonista|Character|Protagonist|FICHA DE PERSONAJE|CHARACTER SHEET)[:\s*-]+([A-Za-zÀ-ÿ0-9'\s]+)/i);
        if (match && match[1]?.trim() && match[1].trim().length < 25) {
          const cand = match[1].trim().replace(/[.,;:]/g, '');
          if (cand.length > 2 && !cand.toLowerCase().includes('sheet')) {
            prot = cand;
            break;
          }
        }
      }
    }
    if (!prot && project.description) {
      const descMatch = project.description.match(/(?:protagonista|sigue a|trata de|historia de)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i);
      if (descMatch && descMatch[1]) {
        prot = descMatch[1].trim();
      }
    }
    if (!prot) {
      prot = 'Protagonista';
    }

    let loc = '';
    if (envMem?.content) {
      const lines = envMem.content.split('\n');
      for (const line of lines) {
        const match = line.match(/(?:Localización|Entorno|Lugar|Set|Escenario|Location|ENVIRONMENT BLUEPRINT)[:\s*-]+([A-Za-zÀ-ÿ0-9'\s]+)/i);
        if (match && match[1]?.trim() && match[1].trim().length < 35) {
          const cand = match[1].trim().replace(/[.,;:]/g, '');
          if (cand.length > 2 && !cand.toLowerCase().includes('blueprint')) {
            loc = cand;
            break;
          }
        }
      }
    }
    if (!loc) {
      loc = 'Entorno Principal';
    }

    return { protagonistName: prot, locationName: loc };
  }, [charMem, envMem, project]);

  // Compute orchestrated prompt breakdown
  const promptBreakdown: PromptLayerBreakdown = useMemo(() => {
    return buildOrchestratedPrompt({
      role: selectedRole,
      project,
      characterMemory: charMem,
      environmentMemory: envMem,
      artMemory: artMem,
      dopMemory: dMem,
      scriptMemory: scriptMem,
      customNotes: customPrompt,
    });
  }, [selectedRole, project, charMem, envMem, artMem, dMem, scriptMem, customPrompt]);

  // Sync editable prompt whenever breakdown changes (unless user manually typed into final prompt)
  useEffect(() => {
    if (!isPromptCustomized) {
      setEditableFinalPrompt(promptBreakdown.fullPrompt);
    }
  }, [promptBreakdown, isPromptCustomized]);

  // Reset all modal prompt and error states when project ID changes to prevent cross-project leaks
  useEffect(() => {
    setCustomPrompt('');
    setEditableFinalPrompt('');
    setIsPromptCustomized(false);
    setSelectedRole('protagonist');
    setFilterTab('all');
    setRenderError(null);
    setIsPaidKeyRequired(false);
    setIsAccepted(false);

    if (isOpen && project) {
      const stored = StorageService.getGeneratedImages(project.id);
      setImages(stored);
      if (stored.length > 0) {
        setSelectedImageId(stored[0].id);
        setIsAccepted(true);
      } else {
        setSelectedImageId(null);
        setIsAccepted(false);
      }
    }
  }, [isOpen, project.id]);

  if (!isOpen) return null;

  const currentSelectedImage = images.find((i) => i.id === selectedImageId) || (images.length > 0 ? images[0] : null);

  // Filtered list based on tab
  const filteredImages = images.filter((img) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'protagonist') return img.subagentKey === 'CHARACTER_DESIGNER';
    if (filterTab === 'turnaround') return img.subagentKey === 'CHARACTER_TURNAROUND';
    if (filterTab === 'costar') return img.subagentKey === 'CHARACTER_COSTAR';
    if (filterTab === 'environment') return img.subagentKey === 'ENVIRONMENT_ART';
    return true;
  });

  // Render an orchestrated image
  const handleRenderSingleImage = async (
    role: 'protagonist' | 'turnaround' | 'costar' | 'environment',
    overridePrompt?: string
  ) => {
    setIsRendering(true);
    setRenderError(null);
    setIsPaidKeyRequired(false);
    try {
      let subagentKey = 'CHARACTER_DESIGNER';
      let title = `Retrato del Protagonista - ${project.title}`;

      if (role === 'turnaround') {
        subagentKey = 'CHARACTER_TURNAROUND';
        title = `Ficha Técnica & Turnaround Sheet - ${project.title}`;
      } else if (role === 'costar') {
        subagentKey = 'CHARACTER_COSTAR';
        title = `Encuentro con Coprotagonista en Set - ${project.title}`;
      } else if (role === 'environment') {
        subagentKey = 'ENVIRONMENT_ART';
        title = `Escenografía Master & Entorno - ${project.title}`;
      }

      // Compute prompt if not passed
      const stored = StorageService.getProviderSettings();
      const effectiveGeminiKey = inlineApiKey.trim() || providerSettings.geminiApiKey || stored.geminiApiKey || '';

      const targetPrompt =
        overridePrompt ||
        (role === selectedRole && editableFinalPrompt) ||
        buildOrchestratedPrompt({
          role,
          project,
          characterMemory: charMem,
          environmentMemory: envMem,
          artMemory: artMem,
          dopMemory: dMem,
          scriptMemory: scriptMem,
          customNotes: customPrompt,
        }).fullPrompt;

      setRenderingStep('1/4: Extrayendo ADN de personajes, guion y set de los orquestadores...');
      await new Promise((r) => setTimeout(r, 450));

      setRenderingStep('2/4: Ensamblando capas visuales (Guion + Fisiología + Set + Paleta #HEX + Lente 85mm)...');
      await new Promise((r) => setTimeout(r, 450));

      setRenderingStep(`3/4: Renderizando con motor ${selectedEngine}...`);
      const res = await generateImageApi(
        project.id,
        subagentKey,
        title,
        targetPrompt,
        {
          ...providerSettings,
          ...stored,
          geminiApiKey: effectiveGeminiKey,
          imageProvider: selectedEngine as any,
        },
        { role, style: project.artStyle }
      );

      setRenderingStep('4/4: Guardando render en el archivo del proyecto...');
      await new Promise((r) => setTimeout(r, 300));

      if (res.success && res.image) {
        // Enforce the rich orchestrated prompt on the saved image
        const savedImg: GeneratedImage = {
          ...res.image,
          prompt: targetPrompt,
          title,
        };
        StorageService.saveGeneratedImage(savedImg);
        const updated = StorageService.getGeneratedImages(project.id);
        setImages(updated);
        setSelectedImageId(savedImg.id);
        setIsAccepted(true);
        if (onImagesUpdated) onImagesUpdated(updated);
      }
    } catch (err: any) {
      console.error('Error rendering character image:', err);
      const msg = err.message || 'Error al generar imagen con Nano Banana';
      setRenderError(msg);
      if (
        msg.includes('Paid API Key') ||
        msg.includes('facturación') ||
        msg.includes('429') ||
        msg.includes('cuota') ||
        msg.includes('RESOURCE_EXHAUSTED')
      ) {
        setIsPaidKeyRequired(true);
      }
    } finally {
      setIsRendering(false);
      setRenderingStep('');
    }
  };

  // Render Full Pack (Protagonist + Turnaround + Co-star + Environment) in one click
  const handleRenderFullPack = async () => {
    setIsRendering(true);
    try {
      setRenderingStep('Generando [1/4]: Retrato de Protagonista orquestado...');
      await handleRenderSingleImage('protagonist');

      setRenderingStep('Generando [2/4]: Ficha de Turnaround y vistas front/perfil...');
      await handleRenderSingleImage('turnaround');

      setRenderingStep('Generando [3/4]: Coprotagonista en el set de producción...');
      await handleRenderSingleImage('costar');

      setRenderingStep('Generando [4/4]: Escenario y arquitectura de fondo...');
      await handleRenderSingleImage('environment');

      const updated = StorageService.getGeneratedImages(project.id);
      setImages(updated);
      if (updated.length > 0) {
        setSelectedImageId(updated[0].id);
        setIsAccepted(true);
      }
      if (onImagesUpdated) onImagesUpdated(updated);
    } finally {
      setIsRendering(false);
      setRenderingStep('');
    }
  };

  // Synthesize master cinematic prompt using Prompt Engineer Agent (Gemini AI)
  const handleSynthesizeWithAi = async () => {
    setIsSynthesizingPrompt(true);
    try {
      const res = await synthesizePromptWithEngineerApi({
        project,
        modality: 'image',
        subType: selectedRole,
        characterDirectives: promptBreakdown.characterDirectives,
        environmentDirectives: promptBreakdown.environmentDirectives,
        artDirectives: promptBreakdown.artDirectives,
        cameraDirectives: promptBreakdown.cameraDirectives,
        scriptDirectives: promptBreakdown.scriptDirectives,
        customNotes: customPrompt,
        providerSettings,
      });
      if (res.success && res.prompt) {
        setEditableFinalPrompt(res.prompt);
        setIsPromptCustomized(true);
      }
    } catch (err: any) {
      console.error('Error synthesizing prompt:', err);
    } finally {
      setIsSynthesizingPrompt(false);
    }
  };

  // Reset or clear images to render fresh
  const handleClearImages = () => {
    StorageService.resetProjectImagesToDefault(project.id);
    setImages([]);
    setSelectedImageId(null);
    setIsAccepted(false);
    if (onImagesUpdated) onImagesUpdated([]);
  };

  // Delete an image
  const handleDeleteImage = (imgId: string) => {
    StorageService.deleteGeneratedImage(imgId);
    const updated = StorageService.getGeneratedImages(project.id);
    setImages(updated);
    if (selectedImageId === imgId) {
      setSelectedImageId(updated.length > 0 ? updated[0].id : null);
    }
    if (updated.length === 0) setIsAccepted(false);
    if (onImagesUpdated) onImagesUpdated(updated);
  };

  // Color palette items extracted from art memory
  const colorSwatches = [
    { label: 'Negro Abisal', hex: '#090D16' },
    { label: 'Hormigón Mojado', hex: '#1E293B' },
    { label: 'Neón Turquesa', hex: '#06B6D4' },
    { label: 'Ámbar Alerta', hex: '#F59E0B' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Aprobación de Personajes & Arte Visual
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  ORQUESTACIÓN COHERENTE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {images.length} {images.length === 1 ? 'render' : 'renders'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generación guiada 100% por los orquestadores (Diseño de Personajes, Set de Producción y Paleta de Arte).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch inside modal */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveModalTab('gallery')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'gallery'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Galería & Render</span>
              </button>
              <button
                onClick={() => setActiveModalTab('prompt_inspector')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'prompt_inspector'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>🔬 Inspector de Prompts</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Callout Explaining Prompt Construction */}
        <div className="px-4 sm:px-6 pt-4 shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  Construcción de Prompts Vinculada a los Orquestadores
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  El prompt se construye en 4 capas:{' '}
                  <span className="text-amber-400 font-medium">1. Personajes</span> (edad, fisionomía, traje) +{' '}
                  <span className="text-cyan-400 font-medium">2. Set</span> (entorno, altura, lluvia) +{' '}
                  <span className="text-purple-400 font-medium">3. Paleta #HEX</span> (arte) +{' '}
                  <span className="text-emerald-400 font-medium">4. Fotografía</span> (óptica 85mm T1.4).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPromptDetails(!showPromptDetails)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{showPromptDetails ? 'Ocultar Explicación' : '¿Cómo se construye el prompt?'}</span>
              </button>

              {images.length > 0 ? (
                <button
                  onClick={handleClearImages}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-semibold border border-rose-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Elimina los renders actuales para generar un pack limpio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar Galería</span>
                </button>
              ) : (
                <button
                  onClick={handleRenderFullPack}
                  disabled={isRendering}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Renderiza el pack completo con las directivas de tus orquestadores"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Renderizar Pack</span>
                </button>
              )}
            </div>
          </div>

          {/* Educational prompt construction helper box if expanded */}
          {showPromptDetails && (
            <div className="mt-2.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-200 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>¿Cómo se construye el prompt 100% dinámico con tus orquestadores?</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                El prompt no utiliza plantillas genéricas fijas; se ensambla en tiempo real extrayendo los entregables que cada departamento cinematográfico generó específicamente para <strong>"{project.title}"</strong>:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1">🎭 Capa 1: Fisiología de {protagonistName} (Personajes)</span>
                  <span className="text-slate-300">
                    {promptBreakdown.characterDirectives || `Fisiognomía y vestuario según el guion de "${project.title}".`}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">🏗️ Capa 2: Set {locationName} (Producción)</span>
                  <span className="text-slate-300">
                    {promptBreakdown.environmentDirectives || `Arquitectura y ambientación del universo de "${project.title}".`}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-purple-400 font-bold block mb-1">🎨 Capa 3: Paleta Cromática (Arte)</span>
                  <span className="text-slate-300">
                    {promptBreakdown.artDirectives || `Estilo visual ${project.artStyle} y armonía cromática.`}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">🎥 Capa 4: Cinematografía (DOP)</span>
                  <span className="text-slate-300">
                    {promptBreakdown.cameraDirectives || `Óptica cinematográfica, encuadre y tratamiento lumínico.`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeModalTab === 'gallery' ? (
            /* TAB 1: GALLERY & RENDER STUDIO */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Visual Viewport / Render Studio (Left 7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                {/* Filter Tabs if multiple images exist */}
                {images.length > 0 && (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {[
                        { id: 'all', label: 'Todos' },
                        { id: 'protagonist', label: `Protagonista (${protagonistName})` },
                        { id: 'turnaround', label: 'Turnaround' },
                        { id: 'costar', label: 'Coprotagonista' },
                        { id: 'environment', label: `Entorno (${locationName})` },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setFilterTab(tab.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            filterTab === tab.id
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ● FaceID & Background Coherent
                    </span>
                  </div>
                )}

                {/* Main Image Viewport OR Empty State with Render Studio */}
                {currentSelectedImage ? (
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group">
                    <img
                      src={currentSelectedImage.imageUrl}
                      alt={currentSelectedImage.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                    />

                    {/* Gradient HUD Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                      <span className="text-[10px] font-mono font-bold bg-slate-900/85 backdrop-blur-md text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg shadow">
                        {currentSelectedImage.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setIsLightboxOpen(true)}
                          className="p-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md transition-colors cursor-pointer"
                          title="Ver en pantalla completa"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(currentSelectedImage.id)}
                          className="p-1.5 rounded-lg bg-slate-900/85 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 backdrop-blur-md transition-colors cursor-pointer"
                          title="Eliminar este render"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Image Metadata & Orchestrated Prompt */}
                    <div className="absolute bottom-3 left-3 right-3 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <span>FaceID Anclado</span>
                          <span>• Anamorphic Scope</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          Motor: {currentSelectedImage.provider}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                        "{currentSelectedImage.prompt}"
                      </p>
                    </div>
                  </div>
                ) : (
                  /* EMPTY STATE */
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 border-dashed border-amber-500/40 bg-slate-950/70 p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                      <Wand2 className="w-8 h-8 animate-pulse" />
                    </div>

                    <div className="max-w-md space-y-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        SIN RENDERIZADO VISUAL AÚN
                      </span>
                      <h4 className="text-base font-black text-white">
                        Renderiza los personajes y fondos orquestados
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Los orquestadores han definido las directivas para {protagonistName}, la ambientación de {locationName} y la paleta de arte. Renderiza el pack completo para validar los modelos antes de la postproducción.
                      </p>
                    </div>

                    <button
                      onClick={handleRenderFullPack}
                      disabled={isRendering}
                      className="w-full max-w-sm py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 ${isRendering ? 'animate-spin' : ''}`} />
                      <span>
                        {isRendering
                          ? renderingStep || 'Renderizando Pack Orquestado...'
                          : `⚡ Renderizar Pack Completo (${protagonistName} + ${locationName})`}
                      </span>
                    </button>
                  </div>
                )}

                {/* Thumbnails Carousel */}
                {filteredImages.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {filteredImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImageId(img.id)}
                        className={`relative w-16 h-20 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                          selectedImageId === img.id
                            ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105'
                            : 'border-slate-800 opacity-65 hover:opacity-100 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={img.imageUrl}
                          alt={img.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 text-[8px] font-mono text-slate-300 px-1 py-0.5 truncate text-center">
                          {img.subagentKey === 'CHARACTER_DESIGNER'
                            ? protagonistName
                            : img.subagentKey === 'CHARACTER_TURNAROUND'
                            ? 'Turnaround'
                            : img.subagentKey === 'CHARACTER_COSTAR'
                            ? 'Coprotagonista'
                            : locationName}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Render Controls Panel */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Estudio de Renderizado con Directivas de Orquestador</span>
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500 font-mono">Motor:</span>
                      <select
                        value={selectedEngine}
                        onChange={(e) => setSelectedEngine(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-[10px] outline-none"
                      >
                        <option value="google-imagen">Google Imagen 3 / Nano Banana (Fotorrealista)</option>
                        <option value="fal-flux" disabled={!providerSettings.falApiKey}>
                          Fal Flux Pro {!providerSettings.falApiKey ? '🔒 (Bloqueado - Sin Clave API)' : ''}
                        </option>
                        <option value="openai-dalle" disabled={!providerSettings.openaiApiKey}>
                          DALL-E 3 {!providerSettings.openaiApiKey ? '🔒 (Bloqueado - Sin Clave API)' : ''}
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Active Role Selector for individual rendering */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { role: 'protagonist', label: `👤 Protagonista (${protagonistName})`, icon: User },
                      { role: 'turnaround', label: '📐 Turnaround Sheet', icon: Layers },
                      { role: 'costar', label: '👥 Coprotagonista', icon: Camera },
                      { role: 'environment', label: `🏗️ Entorno (${locationName})`, icon: Compass },
                    ].map((item) => (
                      <button
                        key={item.role}
                        onClick={() => setSelectedRole(item.role as any)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedRole === item.role
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Prompt Preview Box for the currently selected role */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-mono text-amber-400 font-bold flex items-center gap-1">
                        <span>Prompt Activo:</span>
                        <span className="text-slate-300 font-normal">
                          {selectedRole === 'protagonist'
                            ? `${protagonistName} en plano cinematográfico`
                            : selectedRole === 'turnaround'
                            ? 'Ficha técnica frontal/perfil'
                            : selectedRole === 'costar'
                            ? 'Escena con coprotagonista'
                            : `Plano general de ${locationName}`}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSynthesizeWithAi}
                          disabled={isSynthesizingPrompt}
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer flex items-center gap-1 transition-colors disabled:opacity-50"
                          title="Sintetizar prompt con Gemini eliminando metadatos para inferencia de difusión"
                        >
                          <Sparkles className={`w-3 h-3 text-purple-400 ${isSynthesizingPrompt ? 'animate-spin' : ''}`} />
                          <span>{isSynthesizingPrompt ? 'Sintetizando...' : '✨ Optimizar IA'}</span>
                        </button>
                        <button
                          onClick={() => setActiveModalTab('prompt_inspector')}
                          className="text-[10px] text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span>Inspector</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 italic line-clamp-2 font-mono">
                      "{editableFinalPrompt}"
                    </p>
                  </div>

                  {/* Custom adjustment input */}
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => {
                      setCustomPrompt(e.target.value);
                      setIsPromptCustomized(false);
                    }}
                    placeholder={`Añadir directiva extra (ej. lluvia ácida intensa, chispas eléctricas, traje mojado)...`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none"
                  />

                  {/* Render Execution Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleRenderSingleImage(selectedRole, editableFinalPrompt)}
                      disabled={isRendering}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Renderizar Esta Toma ({selectedRole.toUpperCase()})</span>
                    </button>

                    <button
                      onClick={handleRenderFullPack}
                      disabled={isRendering}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>Pack Completo (4 Tomas)</span>
                    </button>
                  </div>

                  {isRendering && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
                      <RotateCcw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                      <span className="font-mono text-[11px]">{renderingStep || 'Renderizando con motor IA...'}</span>
                    </div>
                  )}

                  {renderError && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-3">
                      <div className="flex items-center gap-2 font-bold text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Aviso del Motor de Generación</span>
                      </div>
                      <p className="text-[11px] text-rose-200 leading-relaxed font-mono">
                        {renderError}
                      </p>

                      {/* Inline API Key Injection & Retry Card */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-amber-300 block">
                            🔑 Introduce tu Gemini API Key (Paid Tier para Nano Banana):
                          </label>
                          <span className="text-[10px] text-amber-400 font-mono">
                            {providerSettings.geminiApiKey ? '● Clave Guardada' : '○ Sin Clave'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                          La cuota gratuita de Google para modelos de imagen (Nano Banana) es 0. Pega aquí tu clave personal con facturación para que el estudio use tus credenciales reales:
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={inlineApiKey}
                            onChange={(e) => setInlineApiKey(e.target.value)}
                            placeholder="AIzaSy... (Tu clave con facturación)"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono outline-none focus:border-amber-500"
                          />
                          <button
                            onClick={async () => {
                              if (!inlineApiKey.trim()) return;
                              const current = StorageService.getProviderSettings();
                              const updated = { ...current, geminiApiKey: inlineApiKey.trim() };
                              StorageService.saveProviderSettings(updated);
                              if (onUpdateProviderSettings) onUpdateProviderSettings(updated);
                              setRenderError(null);
                              setIsPaidKeyRequired(false);
                              await handleRenderSingleImage(selectedRole);
                            }}
                            disabled={!inlineApiKey.trim() || isRendering}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md disabled:opacity-50 transition-all shrink-0"
                          >
                            Guardar y Reintentar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Character Breakdown Dossier (Right 5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ficha del Personaje ({protagonistName})</span>
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono font-bold">
                      {project.artStyle}
                    </span>
                  </div>

                  {/* Character Sheet Content */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 max-h-56 sm:max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap shadow-inner">
                    {charMem?.content || `FICHA DE PERSONAJE: ${protagonistName.toUpperCase()}
- Fisiognomía, rasgos y vestuario definidos según el guion de "${project.title}".
- Estilo estético: ${project.artStyle}.`}
                  </div>

                  {/* Color Palette Swatches from Art Director */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-purple-400" />
                        <span>Paleta Cromática Oficial</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Director de Arte</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {colorSwatches.map((swatch) => (
                        <div key={swatch.hex} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="w-5 h-5 rounded-md shrink-0 border border-white/20" style={{ backgroundColor: swatch.hex }} />
                          <div className="text-[10px] overflow-hidden leading-tight">
                            <span className="text-slate-200 block truncate font-medium">{swatch.label}</span>
                            <span className="text-slate-400 font-mono">{swatch.hex}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Environment & Set Blueprint */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Entorno: {locationName}</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">Diseñador de Producción</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {envMem?.content?.substring(0, 160) || `Set y ambientación arquitectónica principal para "${project.title}".`}...
                    </p>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div
                  onClick={() => setIsAccepted(!isAccepted)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isAccepted
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      isAccepted
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-600 bg-slate-900'
                    }`}
                  >
                    {isAccepted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="text-xs select-none">
                    <span className="font-bold text-white block">
                      Confirmo que el diseño de los personajes es aceptable
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Listo para sincronizar el storyboard y proceder al render de video y audio.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: PROMPT INSPECTOR & CONSTRUCTOR */
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                    <span>Constructor de Prompts Orquestados (Desglose por Capas)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inspecciona exactamente cómo se ensambla el prompt de imagen fusionando los entregables de cada departamento cinematográfico.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {onOpenPromptEngineer && (
                    <button
                      onClick={onOpenPromptEngineer}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      title="Abrir el estudio multimodal del Ingeniero de Prompts (Imagen, Video, Audio y Música)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>⚡ Abrir Ingeniero de Prompts</span>
                    </button>
                  )}

                  <button
                    onClick={handleSynthesizeWithAi}
                    disabled={isSynthesizingPrompt}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold border border-purple-400/30 flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    title="Optimiza las directivas departamentales con IA para convertirlas en un prompt fotográfico continuo y evocador"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isSynthesizingPrompt ? 'animate-spin' : ''}`} />
                    <span>{isSynthesizingPrompt ? 'Sintetizando...' : '✨ Sintetizar con IA (Gemini)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPromptCustomized(false);
                      setEditableFinalPrompt(promptBreakdown.fullPrompt);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sincronizar con Orquestadores</span>
                  </button>
                </div>
              </div>

              {/* 4 Discrete Layers Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Layer 1: Character Designer */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-400" />
                      <span>Capa 1: Personaje (CHARACTER_DESIGNER)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {promptBreakdown.hasCharacterMemory ? '● Conectado' : '○ Default'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    {promptBreakdown.characterDirectives}
                  </p>
                </div>

                {/* Layer 2: Production Designer */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <span>Capa 2: Entorno y Set (PRODUCTION_DESIGNER)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      {promptBreakdown.hasEnvironmentMemory ? '● Conectado' : '○ Default'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    {promptBreakdown.environmentDirectives}
                  </p>
                </div>

                {/* Layer 3: Art Director */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-purple-400" />
                      <span>Capa 3: Paleta Cromática y Materialidad (DIRECTOR_ARTE)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                      {promptBreakdown.hasArtMemory ? '● Conectado' : '○ Default'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    {promptBreakdown.artDirectives}
                  </p>
                </div>

                {/* Layer 4: DOP / Cinematography */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Capa 4: Óptica y Encuadre (DOP / FOTOGRAFÍA)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      {promptBreakdown.hasDopMemory ? '● Conectado' : '○ Default'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    {promptBreakdown.cameraDirectives}
                  </p>
                </div>

                {/* Layer 5: Scriptwriter / Guionista Narrative & Scene Directives */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/40 space-y-2 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <Clapperboard className="w-4 h-4 text-blue-400" />
                      <span>Capa Guionista: Transcripción Narrativa y Situación de Escena (GUIONISTA)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                      {promptBreakdown.hasScriptMemory ? '● Conectado (Guion Literario Activo)' : '○ Premisa Base'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-900 p-2.5 rounded-xl border border-blue-500/30">
                      {promptBreakdown.scriptDirectives}
                    </p>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      ℹ️ <strong>Transcripción del Guionista:</strong> Este archivo extrae las acotaciones visuales, acciones físicas y clima dramático de la escena del guionista y las inyecta de forma limpia y directa al prompt del modelo de imagen (sin encabezados burocráticos ni etiquetas de diálogo).
                    </span>
                  </div>
                </div>
              </div>

              {/* Combined Prompt Editor Box */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Prompt Compuesto Final para Inferencia Gráfica
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Este es el texto exacto que se envía a Google Imagen 3 o Flux Pro al hacer clic en Renderizar.
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400">
                    Rol: {selectedRole.toUpperCase()}
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={editableFinalPrompt}
                  onChange={(e) => {
                    setEditableFinalPrompt(e.target.value);
                    setIsPromptCustomized(true);
                  }}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs font-mono outline-none leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    {editableFinalPrompt.length} caracteres • 4 capas integradas
                  </span>

                  <button
                    onClick={() => {
                      handleRenderSingleImage(selectedRole, editableFinalPrompt);
                      setActiveModalTab('gallery');
                    }}
                    disabled={isRendering}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Renderizar con Este Prompt</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onPostponeRender}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
            title="Guardar el proyecto en el estado actual y dejar el renderizado para más tarde"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>⏰ Posponer Renderizado y Guardar</span>
          </button>

          <button
            onClick={onApproveAndProceedToRender}
            disabled={!isAccepted}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>✅ Aprobar y Proceder al Renderizado de Video</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {isLightboxOpen && currentSelectedImage && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-amber-400 text-xs flex items-center gap-1 font-bold cursor-pointer"
            >
              <X className="w-5 h-5" />
              <span>Cerrar</span>
            </button>
            <img
              src={currentSelectedImage.imageUrl}
              alt={currentSelectedImage.title}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-auto object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
            <div className="mt-3 text-center text-xs text-slate-300 max-w-xl">
              <span className="font-bold text-amber-400 block mb-0.5">{currentSelectedImage.title}</span>
              <span className="italic text-slate-400">{currentSelectedImage.prompt}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
