import React from 'react';
import { Play, Plus, FolderKanban } from 'lucide-react';
import { MovieProject } from '../types';

interface HomeScreenProps {
  projects: MovieProject[];
  onCreateProjectClick: () => void;
  onOpenProjectsClick: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projects,
  onCreateProjectClick,
  onOpenProjectsClick,
}) => {
  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-6 max-w-2xl mx-auto">
      {/* Central Icon */}
      <div className="w-24 h-24 rounded-3xl bg-amber-500/15 border-2 border-amber-500/80 flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/20">
        <Play className="w-12 h-12 text-amber-500 fill-amber-500 ml-1" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white text-center mb-3">
        CINE AI STUDIO
      </h1>

      <p className="text-slate-400 text-center text-sm sm:text-base leading-relaxed max-w-lg mb-10">
        Escribe tus ideas cinematográficas. Deja que los orquestadores de IA se encarguen de la preproducción y renderizado.
      </p>

      <div className="w-full space-y-5">
        {/* Card 1: Crear nuevo proyecto */}
        <div
          onClick={onCreateProjectClick}
          data-testid="home_generate_short_button"
          className="group cursor-pointer p-6 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border-2 border-amber-500/60 hover:border-amber-500 transition-all duration-200 shadow-lg shadow-amber-500/5 hover:scale-[1.01]"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3 text-amber-400 group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-bold text-amber-400 mb-1.5">
              Crear nuevo proyecto
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              Configura tu título, estilo e idea base para una generación automatizada lineal rápida.
            </p>
          </div>
        </div>

        {/* Card 2: Abrir proyecto existente */}
        <div
          onClick={onOpenProjectsClick}
          className="group cursor-pointer p-6 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-md hover:scale-[1.01]"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3 text-white group-hover:scale-110 transition-transform">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-xl font-bold text-white">
                Abrir proyecto existente
              </h2>
              {projects.length > 0 && (
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium border border-slate-700">
                  {projects.length}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Modifica, edita y consulta el pipeline de tus proyectos generados previamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
