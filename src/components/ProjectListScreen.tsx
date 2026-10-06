import React from 'react';
import { ArrowLeft, Trash2, Edit3, Film, Plus } from 'lucide-react';
import { MovieProject } from '../types';

interface ProjectListScreenProps {
  projects: MovieProject[];
  onBackClick: () => void;
  onEditProject: (project: MovieProject) => void;
  onDeleteProject: (project: MovieProject) => void;
  onCreateNewProject: () => void;
}

export const ProjectListScreen: React.FC<ProjectListScreenProps> = ({
  projects,
  onBackClick,
  onEditProject,
  onDeleteProject,
  onCreateNewProject,
}) => {
  return (
    <div className="min-h-[calc(100vh-65px)] max-w-4xl mx-auto p-6 sm:p-8 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackClick}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Atrás"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Proyectos guardados</h2>
            <p className="text-xs text-slate-400">
              {projects.length} {projects.length === 1 ? 'proyecto registrado' : 'proyectos registrados'}
            </p>
          </div>
        </div>

        <button
          onClick={onCreateNewProject}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/10"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {projects.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Aún no tienes ningún proyecto guardado
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            Comienza una nueva producción para generar la biblia, el storyboard y las especificaciones de dirección con IA.
          </p>
          <button
            onClick={onCreateNewProject}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Crear primer proyecto
          </button>
        </div>
      ) : (
        /* List of Projects */
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white">
                    {project.title}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {project.artStyle}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 max-w-2xl">
                  {project.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span>Género: {project.genre}</span>
                  <span>•</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  {project.duration && (
                    <>
                      <span>•</span>
                      <span>{project.duration}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${project.title}"?`)) {
                      onDeleteProject(project);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
                  title="Eliminar proyecto"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>

                <button
                  onClick={() => onEditProject(project)}
                  data-testid={`project_edit_button_${project.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
