import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Printer,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Check,
  Copy,
  Layers,
  Palette,
  Film,
  User,
  MapPin,
  Volume2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { MovieProject, ProjectMemory, ProviderSettings, GeneratedImage } from '../types';
import { CINEMA_SUBAGENTS_CATALOG } from '../catalog';
import { createCharacterArtSvg, createEnvironmentArtSvg } from '../utils/cinematicArt';
import { generatePitchBiblePdf } from '../utils/pdfGenerator';
import { generateImageApi } from '../api';
import { StorageService } from '../storage';
import { buildOrchestratedPrompt } from '../utils/orchestratorPromptEngine';

interface PitchBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MovieProject;
  memories: ProjectMemory[];
  providerSettings: ProviderSettings;
  veoCharacterCustom?: string;
  veoBackgroundCustom?: string;
  veoSoundCustom?: string;
}

export const PitchBibleModal: React.FC<PitchBibleModalProps> = ({
  isOpen,
  onClose,
  project,
  memories,
  providerSettings,
  veoCharacterCustom,
  veoBackgroundCustom,
  veoSoundCustom,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingCharArt, setIsGeneratingCharArt] = useState(false);
  const [isGeneratingEnvArt, setIsGeneratingEnvArt] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Images state
  const [characterImage, setCharacterImage] = useState<string>('');
  const [environmentImage, setEnvironmentImage] = useState<string>('');
  const [storyboard1Image, setStoryboard1Image] = useState<string>('');
  const [storyboard2Image, setStoryboard2Image] = useState<string>('');

  const printableRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch artwork
  useEffect(() => {
    if (!isOpen) return;

    const storedImages = StorageService.getGeneratedImages(project.id);
    const charImg = storedImages.find((img) => img.subagentKey === 'CHARACTER_DESIGNER' || img.subagentKey === 'CHARACTER');
    const envImg = storedImages.find((img) => img.subagentKey === 'PRODUCTION_DESIGNER' || img.subagentKey === 'ENVIRONMENT');
    const s1Img = storedImages.find((img) => img.subagentKey === 'SCENE_1');
    const s2Img = storedImages.find((img) => img.subagentKey === 'SCENE_2');

    setCharacterImage(charImg ? charImg.imageUrl : createCharacterArtSvg(project.title, project.artStyle, veoCharacterCustom));
    setEnvironmentImage(envImg ? envImg.imageUrl : createEnvironmentArtSvg(project.title, project.artStyle, veoBackgroundCustom));
    setStoryboard1Image(s1Img ? s1Img.imageUrl : '/movie_placeholder.jpg');
    setStoryboard2Image(s2Img ? s2Img.imageUrl : '/movie_placeholder.jpg');
  }, [isOpen, project.id, project.title, project.artStyle, veoCharacterCustom, veoBackgroundCustom]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Generate Character Art via API
  const handleGenerateCharacterArt = async () => {
    setIsGeneratingCharArt(true);
    try {
      const promptData = buildOrchestratedPrompt({
        role: 'turnaround',
        project,
        characterMemory: memories.find((m) => m.key === 'CHARACTER_DESIGNER'),
        environmentMemory: memories.find((m) => m.key === 'PRODUCTION_DESIGNER'),
        artMemory: memories.find((m) => m.key === 'DIRECTOR_ARTE'),
        dopMemory: memories.find((m) => m.key === 'DOP' || m.key === 'DIRECTOR_FOTOGRAFIA'),
        customNotes: veoCharacterCustom,
      });
      const prompt = promptData.fullPrompt;
      const res = await generateImageApi(project.id, 'CHARACTER_DESIGNER', `Personaje: ${project.title}`, prompt, providerSettings);
      if (res.success && res.image) {
        StorageService.saveGeneratedImage(res.image);
        setCharacterImage(res.image.imageUrl);
        showToast('¡Arte de personaje renderizado con éxito!');
      }
    } catch (err: any) {
      showToast(`Error al renderizar personaje: ${err?.message || 'Fallo de inferencia'}`);
    } finally {
      setIsGeneratingCharArt(false);
    }
  };

  // Generate Environment Art via API
  const handleGenerateEnvironmentArt = async () => {
    setIsGeneratingEnvArt(true);
    try {
      const promptData = buildOrchestratedPrompt({
        role: 'environment',
        project,
        characterMemory: memories.find((m) => m.key === 'CHARACTER_DESIGNER'),
        environmentMemory: memories.find((m) => m.key === 'PRODUCTION_DESIGNER'),
        artMemory: memories.find((m) => m.key === 'DIRECTOR_ARTE'),
        dopMemory: memories.find((m) => m.key === 'DOP' || m.key === 'DIRECTOR_FOTOGRAFIA'),
        customNotes: veoBackgroundCustom,
      });
      const prompt = promptData.fullPrompt;
      const res = await generateImageApi(project.id, 'PRODUCTION_DESIGNER', `Escenario: ${project.title}`, prompt, providerSettings);
      if (res.success && res.image) {
        StorageService.saveGeneratedImage(res.image);
        setEnvironmentImage(res.image.imageUrl);
        showToast('¡Arte de escenario renderizado con éxito!');
      }
    } catch (err: any) {
      showToast(`Error al renderizar escenario: ${err?.message || 'Fallo de inferencia'}`);
    } finally {
      setIsGeneratingEnvArt(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      showToast('Compilando dossier y renderizando páginas PDF...');
      const blob = await generatePitchBiblePdf({
        project,
        memories,
        characterImage,
        environmentImage,
        characterCustomNotes: veoCharacterCustom,
        environmentCustomNotes: veoBackgroundCustom,
        soundCustomNotes: veoSoundCustom,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanFileName = project.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.download = `${cleanFileName}_Pitch_Bible.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('¡PDF de Libro de Arte descargado correctamente!');
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      showToast(`Error al generar PDF: ${err?.message || 'Fallo desconocido'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print / Native Save to PDF
  const handlePrint = () => {
    window.print();
  };

  // Copy Executive Pitch Summary
  const handleCopyPitchSummary = () => {
    const summary = `# PITCH BIBLE: ${project.title.toUpperCase()}
Género: ${project.genre} | Estilo Visual: ${project.artStyle}
Duración: ${project.duration || '3 minutos'} | Audiencia: ${project.targetAudience}

## LOGLINE & PREMISA
${project.description}

## VISIÓN DEL SHOWRUNNER
${memories.find((m) => m.key === 'SHOWRUNNER')?.content || 'Visión registrada en el estudio.'}

## DISEÑO DE PERSONAJES
${memories.find((m) => m.key === 'CHARACTER_DESIGNER')?.content || 'Dossier de personajes.'}

## ESCENARIOS & DIRECCIÓN DE ARTE
${memories.find((m) => m.key === 'PRODUCTION_DESIGNER')?.content || 'Blueprints de set.'}

## GUION & PLANOS
${memories.find((m) => m.key === 'GUIONISTA')?.content || 'Guion literario registrado.'}

Generado con Cine AI Studio (24 Subagentes Especializados).`;
    copyToClipboard(summary, 'executive_summary');
  };

  // Memory accessors
  const showrunnerMem = memories.find((m) => m.key === 'SHOWRUNNER');
  const characterMem = memories.find((m) => m.key === 'CHARACTER_DESIGNER');
  const consistencyMem = memories.find((m) => m.key === 'CHARACTER_SUPERVISOR');
  const environmentMem = memories.find((m) => m.key === 'PRODUCTION_DESIGNER');
  const artDirectorMem = memories.find((m) => m.key === 'DIRECTOR_ARTE');
  const scriptMem = memories.find((m) => m.key === 'GUIONISTA');
  const dopMem = memories.find((m) => m.key === 'DOP');
  const composerMem = memories.find((m) => m.key === 'COMPOSER');
  const soundMem = memories.find((m) => m.key === 'SOUND_DESIGNER');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-slide-up">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-5xl w-full h-[94vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header Controls Bar */}
        <div className="p-4 sm:px-6 sm:py-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Pitch Bible & Libro de Arte
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  PDF EXPORT READY
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {project.title} • {project.artStyle} • {memories.length}/24 orquestadores
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
            <button
              onClick={handleCopyPitchSummary}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Copiar texto resumen para correo a productores"
            >
              {copiedId === 'executive_summary' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'executive_summary' ? 'Copiado' : 'Copiar Pitch'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Imprimir o guardar con el diálogo del navegador"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Descargar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-4 sm:px-6 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all', label: '📖 Todo el Dossier' },
            { id: 'cover', label: '1. Portada & Ficha' },
            { id: 'world', label: '2. Showrunner & Mundo' },
            { id: 'character', label: '3. Personajes (Arte)' },
            { id: 'environment', label: '4. Fondos & Sets' },
            { id: 'storyboard', label: '5. Guion & Storyboard' },
            { id: 'art', label: '6. Paleta Cromática' },
            { id: 'orchestrators', label: '7. Los 24 Orquestadores' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Document Body (Scrollable Reader) */}
        <div ref={printableRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 print:p-0 print:space-y-4">
          {/* SECTION 1: COVER & PRODUCTION SPECS */}
          {(activeTab === 'all' || activeTab === 'cover') && (
            <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl relative overflow-hidden">
              {/* Corner Accent Ornaments */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-3xl mx-auto space-y-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest">
                  <Film className="w-3.5 h-3.5" />
                  <span>Cinematic Pitch Bible & Art Book</span>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
                    {project.title}
                  </h1>
                  <p className="text-sm sm:text-base text-amber-400 font-semibold mt-2 tracking-wide">
                    {project.artStyle} • {project.genre}
                  </p>
                </div>

                {/* Hero Artwork Box */}
                <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl aspect-[21/9] bg-slate-950 relative group">
                  <img
                    src={environmentImage || characterImage}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 left-3 text-left">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold block">
                      HERO KEY ART FRAME • MASTER PRODUCTION
                    </span>
                    <span className="text-xs text-slate-200 font-semibold">
                      {project.artStyle} • 2.39:1 Anamorphic Scope
                    </span>
                  </div>
                </div>

                {/* Logline Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left">
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Premisa & Logline Oficial:
                  </span>
                  <p className="text-sm sm:text-base text-slate-200 italic leading-relaxed">
                    "{project.description}"
                  </p>
                </div>

                {/* Production Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Género</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">{project.genre}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Audiencia</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">{project.targetAudience}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Duración</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">{project.duration || '3 minutos'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Orquestadores</span>
                    <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{memories.length} / 24 Verificados</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SHOWRUNNER BIBLE & WORLD-BUILDING */}
          {(activeTab === 'all' || activeTab === 'world') && (
            <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                    L0
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      1. Visión Ejecutiva & Reglas del Mundo (Showrunner Bible)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Capa 0 – Orquestador General • Tono, premisa y filosofía de producción
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(showrunnerMem?.content || '', 'showrunner')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Copiar texto del Showrunner"
                >
                  {copiedId === 'showrunner' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {showrunnerMem?.content || project.description}
              </div>

              {/* Thematic Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs font-bold text-amber-400 block mb-1">🎭 Tono Narrativo</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Atmósfera densa, ritmo reflexivo y tensión psicológica sin recurrir a tropos trillados.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs font-bold text-sky-400 block mb-1">🎥 Enfoque Óptico</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Composición anamórfica 2.39:1, lentes de focal fija y claroscuro de alto contraste.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 block mb-1">⚙️ Coherencia L0-L6</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sincronización de memoria viva entre arte, personajes, guion y pistas de audio foley.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: CHARACTER DOSSIER & ART */}
          {(activeTab === 'all' || activeTab === 'character') && (
            <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    L2
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>2. Dossier de Personajes & Arte Conceptual</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Character Designer & Character Supervisor • Turnarounds y consistencia FaceID
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateCharacterArt}
                    disabled={isGeneratingCharArt}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs text-white font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {isGeneratingCharArt ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <ImageIcon className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isGeneratingCharArt ? 'Renderizando...' : 'Renderizar Arte con IA'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left: Character Portrait Card */}
                <div className="md:col-span-5 space-y-3">
                  <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-[4/5] relative group shadow-xl">
                    <img
                      src={characterImage}
                      alt="Personaje Principal"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] text-amber-400 font-mono font-bold border border-amber-500/30">
                      CHARACTER SHEET • PROTAGONISTA
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Consistencia Facial:</span>
                      <span className="text-emerald-400 font-bold">IP-Adapter FaceID Activo</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Vestuario Técnico:</span>
                      <span className="text-slate-200">Gabardina térmica & Visor HUD</span>
                    </div>
                  </div>
                </div>

                {/* Right: Character Sheet & Memory */}
                <div className="md:col-span-7 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Ficha Técnica y Perfil Psicológico:</span>
                    </h4>
                    <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {characterMem?.content || 'Detalles del personaje registrados en el estudio.'}
                    </div>
                  </div>

                  {/* Consistency Supervisor Directives */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      Directiva del Supervisor de Consistencia:
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {consistencyMem?.content || 'Control de rasgos anatómicos y anclaje de semillas latentes para evitar variaciones de apariencia en tomas sucesivas.'}
                    </p>
                  </div>

                  {veoCharacterCustom && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                      <span className="font-bold text-amber-400 block mb-0.5">Nota Particular del Director:</span>
                      <p className="text-slate-200">{veoCharacterCustom}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: ENVIRONMENT & PRODUCTION DESIGN */}
          {(activeTab === 'all' || activeTab === 'environment') && (
            <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
                    L2
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-400" />
                      <span>3. Entornos, Escenarios & Fondos (Production Blueprints)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Production Designer • Arquitectura del set, meteorología y física de escenarios
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateEnvironmentArt}
                    disabled={isGeneratingEnvArt}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs text-white font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {isGeneratingEnvArt ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <ImageIcon className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isGeneratingEnvArt ? 'Renderizando...' : 'Renderizar Fondo con IA'}</span>
                  </button>
                </div>
              </div>

              {/* Environment Artwork Landscape Box */}
              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-[16/9] sm:aspect-[21/9] relative group shadow-xl">
                <img
                  src={environmentImage}
                  alt="Escenario Principal"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] text-sky-400 font-mono font-bold border border-sky-500/30">
                  ENVIRONMENT BLUEPRINT • ESCENOGRAFÍA
                </div>
              </div>

              {/* Blueprint Description */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Especificaciones Arquitectónicas & Materialidad:
                </h4>
                <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {environmentMem?.content || 'Blueprints de escenarios registrados.'}
                </div>
              </div>

              {veoBackgroundCustom && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs">
                  <span className="font-bold text-sky-400 block mb-0.5">Modificación de Escenario Solicitada:</span>
                  <p className="text-slate-200">{veoBackgroundCustom}</p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: ART BIBLE & COLOR PALETTE */}
          {(activeTab === 'all' || activeTab === 'art') && (
            <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-xs">
                  L2
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-400" />
                    <span>4. Dirección de Arte & Paleta Cromática (Color Script)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Art Director & DoP • Paleta de color oficial, texturas y referencias lumínicas
                  </p>
                </div>
              </div>

              {/* Color Swatches Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { name: 'Negro Abisal', hex: '#090D16', desc: 'Sombra dominante' },
                  { name: 'Hormigón Mojado', hex: '#1E293B', desc: 'Materialidad' },
                  { name: 'Neón Turquesa', hex: '#06B6D4', desc: 'Emisiones de luz fría' },
                  { name: 'Ámbar Alerta', hex: '#F59E0B', desc: 'Acentos cálidos' },
                  { name: 'Cian Profundo', hex: '#0284C7', desc: 'Destellos de lente' },
                ].map((swatch, idx) => (
                  <div
                    key={`swatch_${swatch.hex}_${idx}`}
                    onClick={() => copyToClipboard(swatch.hex, `hex_${idx}`)}
                    className="p-3 rounded-2xl border border-slate-800 hover:border-slate-700 bg-slate-900 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-28"
                  >
                    <div className="w-full h-10 rounded-xl border border-white/10 shadow-inner" style={{ backgroundColor: swatch.hex }} />
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-white">
                        <span>{swatch.hex}</span>
                        {copiedId === `hex_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                      </div>
                      <span className="text-[10px] text-slate-400 block">{swatch.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                  Directiva del Director de Arte:
                </h4>
                <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {artDirectorMem?.content || 'Guía de estilo y referencias visuales.'}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: SCREENPLAY & STORYBOARD */}
          {(activeTab === 'all' || activeTab === 'storyboard') && (
            <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                  L1
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-amber-400" />
                    <span>5. Guion Literario & Planos Clave de Storyboard</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Guionista & DoP • Diálogos oficiales y prompts listos para Runway, Seedance 2.0, Luma y Kling
                  </p>
                </div>
              </div>

              {/* Screenplay */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                <div className="text-amber-400 font-bold text-[11px] mb-2 border-b border-slate-800 pb-1">
                  GUION LITERARIO - ESCENA 1
                </div>
                {scriptMem?.content || 'Escenas estructuradas del guion.'}
              </div>

              {/* Storyboard Key Frames Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="rounded-xl overflow-hidden aspect-video bg-black relative border border-slate-800">
                    <img src={storyboard1Image} alt="Plano 1" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-amber-400 font-mono font-bold">
                      PLANO 1 • GRAN PLANO GENERAL
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Lente Anamórfico 35mm • T2.4</span>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      Extreme wide shot, cinematic 2.39:1. Lone worker on wet scaffolding at 120m high. Acid rain, brutalist towers.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="rounded-xl overflow-hidden aspect-video bg-black relative border border-slate-800">
                    <img src={storyboard2Image} alt="Plano 2" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-amber-400 font-mono font-bold">
                      PLANO 2 • PRIMER PLANO DRAMÁTICO
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Cooke Anamorphic 65mm • T2.0</span>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      Close up, shallow depth of field. Weathered technician with HUD visor reflecting amber glitch codes. Eyes widening.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: SOUND & MUSIC */}
          {(activeTab === 'all' || activeTab === 'world') && (
            <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                  L4
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span>6. Banda Sonora, Leitmotiv Musical & Efectos Foley</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Composer & Sound Designer • Directivas armónicas y capas subsónicas
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Score & Leitmotiv (Composer):
                  </h4>
                  <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {composerMem?.content || 'Tempo: 60 BPM. Sintetizador monofónico sub-grave con violonchelo.'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Efectos de Sonido Foley (Sound Designer):
                  </h4>
                  <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {soundMem?.content || '- Viento de altitud con resonancia de 30Hz.\n- Goteo de agua ácida.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: 24 ORCHESTRATORS DIRECTORY */}
          {(activeTab === 'all' || activeTab === 'orchestrators') && (
            <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    L0-L6
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>7. Compendio de los 24 Orquestadores del Estudio</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pipeline completo de 7 capas • Auditoría de coherencia de memoria
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  {memories.length} / 24 ACTIVOS
                </span>
              </div>

              {/* Subagents Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {CINEMA_SUBAGENTS_CATALOG.map((agent) => {
                  const hasMemory = memories.some((m) => m.key === agent.key);
                  return (
                    <div
                      key={agent.key}
                      className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                        hasMemory
                          ? 'bg-slate-900 border-slate-700/80 text-white shadow-sm'
                          : 'bg-slate-950/50 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold truncate text-[11px]">{agent.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              hasMemory ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-700'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{agent.role}</span>
                      </div>
                      <span className="text-[9px] font-mono text-amber-500/80 mt-2 block">
                        Capa {agent.layerId}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Official Studio Certification */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Dossier Certificado por Cine AI Studio</span>
                  </span>
                  <p className="text-slate-300 mt-0.5">
                    Memoria central unificada. Listo para exportar a PDF o presentar a coproductores e inversores.
                  </p>
                </div>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Descargar Pitch Bible (.PDF)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
