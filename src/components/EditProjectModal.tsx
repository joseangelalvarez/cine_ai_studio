import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  Layers,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Film,
} from 'lucide-react';
import { MovieProject, ProjectMemory } from '../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MovieProject;
  memories: ProjectMemory[];
  onSaveProject: (updated: MovieProject) => void;
  onSaveAndCascade: (updated: MovieProject, showrunnerDirectives?: string) => Promise<void>;
  onPurgeResidues: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  memories,
  onSaveProject,
  onSaveAndCascade,
  onPurgeResidues,
}) => {
  const [title, setTitle] = useState(project.title);
  const [genre, setGenre] = useState(project.genre);
  const [artStyle, setArtStyle] = useState(project.artStyle);
  const [duration, setDuration] = useState((project as any).duration || '3 minutos');
  const [description, setDescription] = useState(project.description);
  const [directorNotes, setDirectorNotes] = useState(() => {
    const showrunnerMem = memories.find((m) => m.key === 'SHOWRUNNER');
    return showrunnerMem ? showrunnerMem.content : '';
  });
  const [isCascading, setIsCascading] = useState(false);

  if (!isOpen) return null;

  // Check if current project has legacy residues
  const hasLegacyResidue = memories.some((m) => {
    const isActuallyKael = title.toLowerCase().includes('kael');
    if (isActuallyKael) return false;
    const lower = (m.content || '').toLowerCase();
    return (
      lower.includes('kael') ||
      lower.includes('megaciudad brutalista') ||
      lower.includes('panel holográfico') ||
      lower.includes('torre 09')
    );
  });

  const handleSimpleSave = () => {
    const updated: MovieProject = {
      ...project,
      title: title.trim() || project.title,
      genre: genre.trim() || project.genre,
      artStyle: artStyle.trim() || project.artStyle,
      duration: duration.trim() || (project as any).duration || '3 minutos',
      description: description.trim() || project.description,
    };
    onSaveProject(updated);
    onClose();
  };

  const handleCascadeSave = async () => {
    setIsCascading(true);
    try {
      const updated: MovieProject = {
        ...project,
        title: title.trim() || project.title,
        genre: genre.trim() || project.genre,
        artStyle: artStyle.trim() || project.artStyle,
        duration: duration.trim() || (project as any).duration || '3 minutos',
        description: description.trim() || project.description,
      };
      await onSaveAndCascade(updated, directorNotes);
      onClose();
    } finally {
      setIsCascading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Editar Datos y Directivas del Proyecto
              </h3>
              <p className="text-xs text-slate-400">
                Ajusta el argumento, género, estética y propaga los cambios a todos los orquestadores.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Legacy residue warning banner */}
          {hasLegacyResidue && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <span className="font-bold text-amber-300 block mb-1">
                  Residuos de plantilla detectados en la memoria
                </span>
                <p className="text-slate-300 mb-2 leading-relaxed">
                  Este proyecto contiene entregables heredados del mockup offline ("Kael / Megaciudad brutalista"). Puedes purgar esos residuos inmediatamente o usar <strong>"Guardar y Propagar con Gemini"</strong> para recalcular todos los departamentos con tu premisa real.
                </p>
                <button
                  type="button"
                  onClick={onPurgeResidues}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>🧹 Purgar Residuos Offline Ahora</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Título del Corto / Película
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none"
                placeholder="Ej. El Despertar del Cosmos"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Género Cinematográfico
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none"
                placeholder="Ej. Ciencia Ficción / Thriller Psicológico"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Estilo Visual & Artístico
              </label>
              <input
                type="text"
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none"
                placeholder="Ej. Cinemático 35mm Grano Fino / Cyberpunk / Noir"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Duración Estimada
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none"
                placeholder="Ej. 3 minutos / 5 minutos"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Sinopsis / Idea Argumental del Creador
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none font-sans leading-relaxed resize-y"
              placeholder="Describe el argumento, conflicto dramático y mundo de tu historia..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Directiva del Director Ejecutivo / Showrunner (Project Bible)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Capa 0 del Pipeline
              </span>
            </div>
            <textarea
              value={directorNotes}
              onChange={(e) => setDirectorNotes(e.target.value)}
              rows={5}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs outline-none font-mono leading-relaxed resize-y"
              placeholder="Directivas maestras que rigen el guion, personajes, iluminación y sonido..."
            />
            <p className="text-[11px] text-slate-400 mt-1">
              💡 Si modificas la directiva del Showrunner y seleccionas "Guardar y Propagar", todos los departamentos dependientes sincronizarán su entregable en tiempo real.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSimpleSave}
            disabled={isCascading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            Guardar Solo Datos
          </button>

          <button
            type="button"
            onClick={handleCascadeSave}
            disabled={isCascading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCascading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Propagando en Cascada con Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>⚡ Guardar y Propagar a Todos los Orquestadores</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
