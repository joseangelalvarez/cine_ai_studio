import React, { useState, useEffect, useRef } from 'react';
import {
  MovieProject,
  ProjectMemory,
  ProjectMemoryRevision,
  AuditLog,
  TelemetryMetric,
  CinemaSubagent,
  AppScreen,
} from './types';
import { StorageService } from './storage';
import { CINEMA_SUBAGENTS_CATALOG } from './catalog';
import { orchestrateSubagentApi, exportPackageApi } from './api';

import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { WizardStep1 } from './components/WizardStep1';
import { WizardStep2 } from './components/WizardStep2';
import { CreationProgressScreen } from './components/CreationProgressScreen';
import { ProjectListScreen } from './components/ProjectListScreen';
import { ProjectDetailsScreen } from './components/ProjectDetailsScreen';
import { OrchestratorContentEditor } from './components/OrchestratorContentEditor';
import { CreditsModal } from './components/CreditsModal';
import { PaywallModal } from './components/PaywallModal';
import { ExportApiModal } from './components/ExportApiModal';
import { SocialMediaModal } from './components/SocialMediaModal';

export const App: React.FC = () => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('HOME');

  // Stored Data State
  const [projects, setProjects] = useState<MovieProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<MovieProject | null>(null);
  const [memories, setMemories] = useState<ProjectMemory[]>([]);
  const [revisions, setRevisions] = useState<ProjectMemoryRevision[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<TelemetryMetric[]>([]);

  // Credits & Premium
  const [credits, setCredits] = useState<number>(100);
  const [isPremium, setIsPremium] = useState<boolean>(false);

  // Modals
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  const [showExportApiModal, setShowExportApiModal] = useState<boolean>(false);
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);

  // Wizard State
  const [wizardTitle, setWizardTitle] = useState<string>('');
  const [wizardDuration, setWizardDuration] = useState<string>('3 minutos');
  const [wizardArtStyle, setWizardArtStyle] = useState<string>('Cinemático Ultra-Realista');
  const [wizardIdea, setWizardIdea] = useState<string>('');
  const [useSecureGateway, setUseSecureGateway] = useState<boolean>(true);

  // Pipeline Execution Progress State
  const [progressStepIndex, setProgressStepIndex] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('Iniciando motor de preproducción...');
  const [isRenderingPromptVisible, setIsRenderingPromptVisible] = useState<boolean>(false);
  const [renderingStatus, setRenderingStatus] = useState<string>('');
  const [lastGenerationError, setLastGenerationError] = useState<string | null>(null);

  // Subagent Editor State
  const [activeSubagentToEdit, setActiveSubagentToEdit] = useState<CinemaSubagent | null>(null);
  const [editedContentText, setEditedContentText] = useState<string>('');

  // Veo Video Storyboard Metadata
  const [veoCharacterCustom, setVeoCharacterCustom] = useState<string>('');
  const [veoBackgroundCustom, setVeoBackgroundCustom] = useState<string>('');
  const [veoSoundCustom, setVeoSoundCustom] = useState<string>('');
  const [veoVideoStatus, setVeoVideoStatus] = useState<string>('NOT_STARTED');

  const cancelExecutionRef = useRef<boolean>(false);

  // Load initial data
  useEffect(() => {
    const loadedProjects = StorageService.getProjects();
    setProjects(loadedProjects);
    setCredits(StorageService.getCredits());
    setIsPremium(StorageService.getIsPremium());
  }, []);

  // Sync project memories whenever selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      const pMem = StorageService.getMemories(selectedProject.id);
      setMemories(pMem);
      setRevisions(StorageService.getRevisions(selectedProject.id));
      setAuditLogs(StorageService.getAuditLogs(selectedProject.id));
      setMetrics(StorageService.getMetrics(selectedProject.id));

      const statusMem = pMem.find((m) => m.key === 'VEO_VIDEO_STATUS');
      const charMem = pMem.find((m) => m.key === 'VEO_CHARACTER_CUSTOM');
      const bgMem = pMem.find((m) => m.key === 'VEO_BACKGROUND_CUSTOM');
      const soundMem = pMem.find((m) => m.key === 'VEO_SOUND_CUSTOM');

      setVeoVideoStatus(statusMem?.content || 'NOT_STARTED');
      setVeoCharacterCustom(charMem?.content || '');
      setVeoBackgroundCustom(bgMem?.content || '');
      setVeoSoundCustom(soundMem?.content || '');
    } else {
      setMemories([]);
      setRevisions([]);
      setAuditLogs([]);
      setMetrics([]);
    }
  }, [selectedProject]);

  // Handle Home Create Project Click
  const handleHomeCreateProject = () => {
    if (projects.length > 0 && !isPremium) {
      setShowPaywallModal(true);
    } else {
      setWizardTitle('');
      setWizardDuration('3 minutos');
      setWizardArtStyle('Cinemático Ultra-Realista');
      setWizardIdea('');
      setCurrentScreen('CREATE_WIZARD_STEP1');
    }
  };

  // Start Preproduction Linear Execution
  const runPreproductionSequence = async (project: MovieProject) => {
    cancelExecutionRef.current = false;
    setProgressStepIndex(0);
    setIsRenderingPromptVisible(false);
    setRenderingStatus('');
    setLastGenerationError(null);
    setCurrentScreen('CREATION_PROGRESS');

    const preprodAgents = CINEMA_SUBAGENTS_CATALOG.filter((a) => a.layerId <= 2);

    for (let i = 0; i < preprodAgents.length; i++) {
      if (cancelExecutionRef.current) break;

      const agent = preprodAgents[i];
      setProgressStepIndex(i);
      setProgressMessage(`Ejecutando ${agent.name} (${agent.layer})...`);

      try {
        const currentMems = StorageService.getMemories(project.id);
        const res = await orchestrateSubagentApi(
          project,
          agent,
          agent.suggestedPrompt,
          currentMems,
          useSecureGateway
        );

        if (res.success && res.content) {
          StorageService.insertMemory({
            projectId: project.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
          });

          StorageService.insertRevision({
            projectId: project.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
            version: 1,
            author: agent.key,
            correlationId: `corr_${Math.random().toString(36).substring(2, 10)}`,
          });

          StorageService.insertAuditLog({
            projectId: project.id,
            correlationId: `corr_${Math.random().toString(36).substring(2, 10)}`,
            actor: agent.key,
            action: 'ORCHESTRATE_COMPLETED',
            details: `Entregable completado. Latencia: ${res.latencyMs}ms`,
          });
        }
      } catch (err: any) {
        setLastGenerationError(err?.message || 'Error en la llamada de orquestación');
        setProgressMessage(`Error al ejecutar ${agent.name}: ${err?.message}`);
        return;
      }

      // Aesthetic pacing delay
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    if (!cancelExecutionRef.current) {
      setProgressMessage('Preproducción completada con éxito. Listo para fase de renderizado.');
      setIsRenderingPromptVisible(true);
      // Refresh memory state
      setMemories(StorageService.getMemories(project.id));
    }
  };

  // Start Generation from Wizard Step 2
  const handleStartGenerationFromWizard = async () => {
    const newProject = StorageService.insertProject({
      title: wizardTitle,
      genre: 'Drama / Ciencia Ficción',
      artStyle: wizardArtStyle,
      description: wizardIdea,
      targetAudience: 'Público General',
      duration: wizardDuration,
    });

    // Populate Showrunner Bible in Capa 0
    const showrunnerBible = `=======================================================
PROYECTO: "${newProject.title.toUpperCase()}"
GÉNERO: Drama / Ciencia Ficción
ESTILO VISUAL: ${newProject.artStyle}
AUDIENCIA OBJETIVO: Público General
DURACIÓN ESTIMADA: ${newProject.duration || '3 minutos'}

SINOPSIS / IDEA CENTRAL DEL VIDEO:
${newProject.description}

ESTADO DE LA DIRECTIVA:
Este documento actúa como la Directiva General (Showrunner Bible) para guiar de manera centralizada a todos los subagentes del estudio IA.`;

    StorageService.insertMemory({
      projectId: newProject.id,
      key: 'SHOWRUNNER',
      title: 'Showrunner Project Bible (Capa 0 – Orquestador General)',
      content: showrunnerBible,
    });

    const updatedProjects = StorageService.getProjects();
    setProjects(updatedProjects);
    setSelectedProject(newProject);

    await runPreproductionSequence(newProject);
  };

  // Handle Render Action (All, Video, Audio, None)
  const handleRenderActionSelected = async (choice: 'ALL' | 'VIDEO' | 'AUDIO' | 'NONE') => {
    if (!selectedProject) return;

    if (choice === 'NONE') {
      setRenderingStatus('COMPLETED');
      return;
    }

    setIsRenderingPromptVisible(false);
    setRenderingStatus('GENERATING');
    setLastGenerationError(null);

    const subagentsList = CINEMA_SUBAGENTS_CATALOG;
    const renderAgents = choice === 'ALL'
      ? subagentsList.filter((a) => a.layerId === 3 || a.layerId === 4)
      : choice === 'VIDEO'
      ? subagentsList.filter((a) => a.layerId === 3)
      : subagentsList.filter((a) => a.layerId === 4);

    for (let i = 0; i < renderAgents.length; i++) {
      const agent = renderAgents[i];
      setProgressStepIndex(i);
      setProgressMessage(`Renderizando ${agent.name} (${agent.layer})...`);

      try {
        const currentMems = StorageService.getMemories(selectedProject.id);
        const res = await orchestrateSubagentApi(
          selectedProject,
          agent,
          agent.suggestedPrompt,
          currentMems,
          useSecureGateway
        );

        if (res.success && res.content) {
          StorageService.insertMemory({
            projectId: selectedProject.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
          });

          StorageService.insertRevision({
            projectId: selectedProject.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
            version: 1,
            author: agent.key,
            correlationId: `corr_${Math.random().toString(36).substring(2, 10)}`,
          });
        }
      } catch (err: any) {
        setLastGenerationError(err?.message || 'Error al renderizar');
        setProgressMessage(`Error al renderizar ${agent.name}: ${err?.message}`);
        setRenderingStatus('ERROR');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setProgressMessage('¡Proyecto Completado! Generación y renderizado finalizados con éxito.');
    setRenderingStatus('COMPLETED');
    setMemories(StorageService.getMemories(selectedProject.id));
  };

  // Subagent update and cascade
  const handleUpdateSubagentMemoryAndCascade = async (key: string, title: string, newContent: string) => {
    if (!selectedProject) return;

    StorageService.insertMemory({
      projectId: selectedProject.id,
      key,
      title,
      content: newContent,
    });

    const existingRevs = StorageService.getRevisions(selectedProject.id).filter((r) => r.key === key);
    StorageService.insertRevision({
      projectId: selectedProject.id,
      key,
      title,
      content: newContent,
      version: existingRevs.length + 1,
      author: 'USER_DIRECTOR',
      correlationId: `corr_edit_${Math.random().toString(36).substring(2, 8)}`,
    });

    // Cascade: run next agent in catalog to adapt to user changes
    const list = CINEMA_SUBAGENTS_CATALOG;
    const idx = list.findIndex((a) => a.key === key);
    if (idx !== -1 && idx + 1 < list.length) {
      const nextAgent = list[idx + 1];
      try {
        const curMems = StorageService.getMemories(selectedProject.id);
        const res = await orchestrateSubagentApi(
          selectedProject,
          nextAgent,
          `Adapta las directivas de tu departamento tras la actualización en ${title}.`,
          curMems,
          useSecureGateway
        );
        if (res.success && res.content) {
          StorageService.insertMemory({
            projectId: selectedProject.id,
            key: nextAgent.key,
            title: `${nextAgent.name} (${nextAgent.layer})`,
            content: res.content,
          });
        }
      } catch (e) {
        console.warn('Cascade update error for next agent:', e);
      }
    }

    setMemories(StorageService.getMemories(selectedProject.id));
    setRevisions(StorageService.getRevisions(selectedProject.id));
    setActiveSubagentToEdit(null);
    setEditedContentText('');
  };

  // Manual run in workstation
  const handleExecuteSubagentManually = async (agent: CinemaSubagent, prompt: string) => {
    if (!selectedProject) return;
    const cost = 10;
    StorageService.consumeCredits(cost);
    setCredits(StorageService.getCredits());

    const curMems = StorageService.getMemories(selectedProject.id);
    const res = await orchestrateSubagentApi(selectedProject, agent, prompt, curMems, useSecureGateway);

    if (res.success && res.content) {
      StorageService.insertMemory({
        projectId: selectedProject.id,
        key: agent.key,
        title: `${agent.name} (${agent.layer})`,
        content: res.content,
      });

      const existingRevs = StorageService.getRevisions(selectedProject.id).filter((r) => r.key === agent.key);
      StorageService.insertRevision({
        projectId: selectedProject.id,
        key: agent.key,
        title: `${agent.name} (${agent.layer})`,
        content: res.content,
        version: existingRevs.length + 1,
        author: agent.key,
        correlationId: `corr_manual_${Math.random().toString(36).substring(2, 8)}`,
      });

      StorageService.insertAuditLog({
        projectId: selectedProject.id,
        correlationId: `corr_manual_${Math.random().toString(36).substring(2, 8)}`,
        actor: agent.key,
        action: 'MANUAL_EXECUTION_COMPLETED',
        details: `Ejecución completada por consola. Latencia: ${res.latencyMs}ms`,
      });

      setMemories(StorageService.getMemories(selectedProject.id));
      setRevisions(StorageService.getRevisions(selectedProject.id));
      setAuditLogs(StorageService.getAuditLogs(selectedProject.id));
    }
  };

  // Export to external video engine
  const handleConfirmExportPackage = async (provider: string) => {
    if (!selectedProject) return;
    setVeoVideoStatus('GENERATING');

    try {
      await exportPackageApi(
        selectedProject,
        provider,
        veoCharacterCustom,
        veoBackgroundCustom,
        veoSoundCustom
      );

      StorageService.insertMemory({
        projectId: selectedProject.id,
        key: 'VEO_VIDEO_STATUS',
        title: 'Estado del Motor de Storyboard',
        content: 'SUCCESS',
      });

      StorageService.insertMemory({
        projectId: selectedProject.id,
        key: 'FINAL_PACKAGE',
        title: `Paquete de Dirección Final (${provider})`,
        content: `Contiene los prompts y secuencias estructuradas para ${provider}.`,
      });

      setVeoVideoStatus('SUCCESS');
      setMemories(StorageService.getMemories(selectedProject.id));
    } catch (err: any) {
      setVeoVideoStatus('ERROR');
      throw err;
    }
  };

  // Clear memory
  const handleClearMemory = () => {
    if (!selectedProject) return;
    if (window.confirm('¿Reiniciar todas las memorias del proyecto excepto la Biblia del Showrunner inicial?')) {
      StorageService.clearMemories(selectedProject.id);
      const initialBible = `PROYECTO: "${selectedProject.title}"\nGÉNERO: ${selectedProject.genre}\nESTILO VISUAL: ${selectedProject.artStyle}\nSINOPSIS: ${selectedProject.description}`;
      StorageService.insertMemory({
        projectId: selectedProject.id,
        key: 'SHOWRUNNER',
        title: 'Showrunner Project Bible (Capa 0 – Orquestador General)',
        content: initialBible,
      });
      setMemories(StorageService.getMemories(selectedProject.id));
    }
  };

  // Delete Project
  const handleDeleteProject = (proj: MovieProject) => {
    StorageService.deleteProject(proj.id);
    setProjects(StorageService.getProjects());
    if (selectedProject?.id === proj.id) {
      setSelectedProject(null);
    }
  };

  // Credits & Premium Actions
  const handleBuyCredits = (amount: number) => {
    StorageService.addCredits(amount);
    setCredits(StorageService.getCredits());
    setShowCreditsModal(false);
  };

  const handleUnlockPremium = () => {
    StorageService.setIsPremium(true);
    setIsPremium(true);
    setShowPaywallModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <Header
        credits={credits}
        isPremium={isPremium}
        onOpenCreditsModal={() => setShowCreditsModal(true)}
        onOpenPaywallModal={() => setShowPaywallModal(true)}
        onNavigateHome={() => {
          setSelectedProject(null);
          setCurrentScreen('HOME');
        }}
      />

      {/* Main Body Switcher */}
      <main className="flex-1">
        {/* Active Subagent Editor Modal / Screen */}
        {activeSubagentToEdit && (
          <OrchestratorContentEditor
            agent={activeSubagentToEdit}
            initialContent={editedContentText}
            onBack={() => {
              setActiveSubagentToEdit(null);
              setEditedContentText('');
            }}
            onUpdate={handleUpdateSubagentMemoryAndCascade}
          />
        )}

        {!activeSubagentToEdit && currentScreen === 'HOME' && (
          <HomeScreen
            projects={projects}
            onCreateProjectClick={handleHomeCreateProject}
            onOpenProjectsClick={() => setCurrentScreen('PROJECT_LIST')}
          />
        )}

        {!activeSubagentToEdit && currentScreen === 'CREATE_WIZARD_STEP1' && (
          <WizardStep1
            title={wizardTitle}
            onTitleChange={setWizardTitle}
            duration={wizardDuration}
            onDurationChange={setWizardDuration}
            artStyle={wizardArtStyle}
            onArtStyleChange={setWizardArtStyle}
            onBack={() => setCurrentScreen('HOME')}
            onNext={() => setCurrentScreen('CREATE_WIZARD_STEP2')}
          />
        )}

        {!activeSubagentToEdit && currentScreen === 'CREATE_WIZARD_STEP2' && (
          <WizardStep2
            idea={wizardIdea}
            onIdeaChange={setWizardIdea}
            useSecureGateway={useSecureGateway}
            onToggleSecureGateway={setUseSecureGateway}
            onBack={() => setCurrentScreen('CREATE_WIZARD_STEP1')}
            onStartGeneration={handleStartGenerationFromWizard}
          />
        )}

        {!activeSubagentToEdit && currentScreen === 'CREATION_PROGRESS' && (
          <CreationProgressScreen
            project={selectedProject}
            progressStepIndex={progressStepIndex}
            totalSteps={CINEMA_SUBAGENTS_CATALOG.filter((a) => a.layerId <= 2).length}
            progressMessage={progressMessage}
            isRenderingPromptVisible={isRenderingPromptVisible}
            renderingStatus={renderingStatus}
            lastGenerationError={lastGenerationError}
            useSecureGateway={useSecureGateway}
            onToggleSecureGateway={setUseSecureGateway}
            onRetry={() => {
              if (selectedProject) runPreproductionSequence(selectedProject);
            }}
            onRenderActionSelected={handleRenderActionSelected}
            onGoToProject={() => setCurrentScreen('PROJECT_DETAILS')}
          />
        )}

        {!activeSubagentToEdit && currentScreen === 'PROJECT_LIST' && (
          <ProjectListScreen
            projects={projects}
            onBackClick={() => setCurrentScreen('HOME')}
            onEditProject={(proj) => {
              setSelectedProject(proj);
              setCurrentScreen('PROJECT_DETAILS');
            }}
            onDeleteProject={handleDeleteProject}
            onCreateNewProject={handleHomeCreateProject}
          />
        )}

        {!activeSubagentToEdit && currentScreen === 'PROJECT_DETAILS' && selectedProject && (
          <ProjectDetailsScreen
            project={selectedProject}
            memories={memories}
            revisions={revisions}
            auditLogs={auditLogs}
            metrics={metrics}
            credits={credits}
            onBackClick={() => setCurrentScreen('PROJECT_LIST')}
            onEditSubagent={(agent, currentContent) => {
              setActiveSubagentToEdit(agent);
              setEditedContentText(currentContent);
            }}
            onOpenExportModal={() => setShowExportApiModal(true)}
            onOpenSocialModal={() => setShowSocialModal(true)}
            onUpdateVeoMetadata={(type, value) => {
              if (type === 'char') {
                setVeoCharacterCustom(value);
                StorageService.insertMemory({
                  projectId: selectedProject.id,
                  key: 'VEO_CHARACTER_CUSTOM',
                  title: 'Instrucción de Personajes',
                  content: value,
                });
              } else if (type === 'bg') {
                setVeoBackgroundCustom(value);
                StorageService.insertMemory({
                  projectId: selectedProject.id,
                  key: 'VEO_BACKGROUND_CUSTOM',
                  title: 'Instrucción de Fondos/Escenario',
                  content: value,
                });
              } else {
                setVeoSoundCustom(value);
                StorageService.insertMemory({
                  projectId: selectedProject.id,
                  key: 'VEO_SOUND_CUSTOM',
                  title: 'Instrucción de Audio/Música',
                  content: value,
                });
              }
            }}
            veoCharacterCustom={veoCharacterCustom}
            veoBackgroundCustom={veoBackgroundCustom}
            veoSoundCustom={veoSoundCustom}
            veoVideoStatus={veoVideoStatus}
            onExecuteSubagentManually={handleExecuteSubagentManually}
            onClearMemory={handleClearMemory}
          />
        )}
      </main>

      {/* Global Modals */}
      <CreditsModal
        currentCredits={credits}
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        onBuyCredits={handleBuyCredits}
      />

      <PaywallModal
        isOpen={showPaywallModal}
        onDismiss={() => setShowPaywallModal(false)}
        onSubscribe={handleUnlockPremium}
      />

      <ExportApiModal
        isOpen={showExportApiModal}
        onClose={() => setShowExportApiModal(false)}
        onConfirmExport={handleConfirmExportPackage}
      />

      <SocialMediaModal
        isOpen={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        onPublishSuccess={() => {
          // feedback
        }}
      />
    </div>
  );
};

export default App;
