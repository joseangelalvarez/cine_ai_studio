import React, { useState, useEffect, useRef } from 'react';
import {
  MovieProject,
  ProjectMemory,
  ProjectMemoryRevision,
  AuditLog,
  TelemetryMetric,
  CinemaSubagent,
  AppScreen,
  ProviderSettings,
} from './types';
import { StorageService } from './storage';
import { CINEMA_SUBAGENTS_CATALOG } from './catalog';
import { orchestrateSubagentApi, compilePromptsApi } from './api';
import { buildSubagentPrompt } from './utils/promptBuilder';

import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { WizardStep1 } from './components/WizardStep1';
import { WizardStep2 } from './components/WizardStep2';
import { CreationProgressScreen } from './components/CreationProgressScreen';
import { ProjectListScreen } from './components/ProjectListScreen';
import { ProjectDetailsScreen } from './components/ProjectDetailsScreen';
import { OrchestratorContentEditor } from './components/OrchestratorContentEditor';
import { ProviderSettingsModal } from './components/ProviderSettingsModal';
import { TokensAndCostsModal } from './components/TokensAndCostsModal';
import { PitchBibleModal } from './components/PitchBibleModal';
import { CharacterApprovalModal } from './components/CharacterApprovalModal';
import { PromptEngineerModal } from './components/PromptEngineerModal';
import { CascadePropagationModal, CascadeStep } from './components/CascadePropagationModal';
import { RenderStudioModal } from './components/RenderStudioModal';
import { EditProjectModal } from './components/EditProjectModal';

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

  // Multi-Provider & Model Settings State
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>(() =>
    StorageService.getProviderSettings()
  );
  const [showProviderSettingsModal, setShowProviderSettingsModal] = useState<boolean>(false);
  const [showTokensCostsModal, setShowTokensCostsModal] = useState<boolean>(false);

  // Modals
  const [showPitchBibleModal, setShowPitchBibleModal] = useState<boolean>(false);
  const [showCharacterApprovalModal, setShowCharacterApprovalModal] = useState<boolean>(false);
  const [showPromptEngineerModal, setShowPromptEngineerModal] = useState<boolean>(false);
  const [showRenderStudioModal, setShowRenderStudioModal] = useState<boolean>(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState<boolean>(false);
  const [showCascadeModal, setShowCascadeModal] = useState<boolean>(false);
  const [cascadeSteps, setCascadeSteps] = useState<CascadeStep[]>([]);
  const [cascadeStepIndex, setCascadeStepIndex] = useState<number>(0);
  const [isCascadeComplete, setIsCascadeComplete] = useState<boolean>(false);
  const [cascadeError, setCascadeError] = useState<string | null>(null);
  const [isActivatingAllAgents, setIsActivatingAllAgents] = useState<boolean>(false);

  // Wizard State
  const [wizardTitle, setWizardTitle] = useState<string>('');
  const [wizardDuration, setWizardDuration] = useState<string>('3 minutos');
  const [wizardArtStyle, setWizardArtStyle] = useState<string>('Cinemático Ultra-Realista');
  const [wizardIdea, setWizardIdea] = useState<string>('');

  // Pipeline Execution Progress State
  const [progressStepIndex, setProgressStepIndex] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('Iniciando motor de preproducción...');
  const [renderingStatus, setRenderingStatus] = useState<string>('');
  const [lastGenerationError, setLastGenerationError] = useState<string | null>(null);

  // Subagent Editor State
  const [activeSubagentToEdit, setActiveSubagentToEdit] = useState<CinemaSubagent | null>(null);
  const [editedContentText, setEditedContentText] = useState<string>('');

  const cancelExecutionRef = useRef<boolean>(false);

  // Load initial data
  useEffect(() => {
    const loadedProjects = StorageService.getProjects();
    setProjects(loadedProjects);
  }, []);

  // Sync project memories whenever selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      const pMem = StorageService.getMemories(selectedProject.id);
      setMemories(pMem);
      setRevisions(StorageService.getRevisions(selectedProject.id));
      setAuditLogs(StorageService.getAuditLogs(selectedProject.id));
      setMetrics(StorageService.getMetrics(selectedProject.id));
    } else {
      setMemories([]);
      setRevisions([]);
      setAuditLogs([]);
      setMetrics([]);
    }
  }, [selectedProject?.id]);

  // Navigate to Home
  const handleNavigateHome = () => {
    setCurrentScreen('HOME');
    setActiveSubagentToEdit(null);
  };

  // Open Create Wizard Step 1
  const handleHomeCreateProject = () => {
    setWizardTitle('');
    setWizardDuration('3 minutos');
    setWizardArtStyle('Cinemático Ultra-Realista');
    setWizardIdea('');
    setCurrentScreen('CREATE_WIZARD_STEP1');
  };

  // Start Preproduction Execution
  const runPreproductionSequence = async (project: MovieProject) => {
    cancelExecutionRef.current = false;
    setProgressStepIndex(0);
    setRenderingStatus('PROCESSING');
    setLastGenerationError(null);
    setCurrentScreen('CREATION_PROGRESS');

    const preprodAgents = CINEMA_SUBAGENTS_CATALOG.filter((a) => a.layerId <= 2);

    for (let i = 0; i < preprodAgents.length; i++) {
      if (cancelExecutionRef.current) break;

      const agent = preprodAgents[i];
      setProgressStepIndex(i);
      setProgressMessage(`Llamando a ${agent.name} (${agent.layer})...`);

      try {
        const currentMems = StorageService.getMemories(project.id);
        const dynamicPrompt = buildSubagentPrompt(agent, project);
        const res = await orchestrateSubagentApi(
          project,
          agent,
          dynamicPrompt,
          currentMems,
          false,
          providerSettings
        );

        if (res.success && res.content) {
          StorageService.saveMemory({
            projectId: project.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
          });

          StorageService.saveRevision({
            projectId: project.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
            version: 1,
            author: agent.key,
            correlationId: `corr_${Math.random().toString(36).substring(2, 10)}`,
          });

          StorageService.saveAuditLog({
            projectId: project.id,
            correlationId: `corr_${Math.random().toString(36).substring(2, 10)}`,
            actor: agent.key,
            action: 'ORCHESTRATE_COMPLETED',
            details: `Entregable completado. Latencia: ${res.latencyMs}ms con modelo ${res.model || providerSettings.textModel}`,
          });

          // Track real tokens and cost
          const inputTok = res.usage?.inputTokens || Math.round(dynamicPrompt.length / 3.8);
          const outputTok = res.usage?.outputTokens || Math.round(res.content.length / 3.8);
          StorageService.saveMetric({
            projectId: project.id,
            correlationId: `corr_${Math.random().toString(36).substring(2, 10)}`,
            metricName: 'ORCHESTRATION_COST',
            keyIdentifier: agent.key,
            metricValue: res.estimatedCost || 0.0001,
          });
          StorageService.saveMetric({
            projectId: project.id,
            correlationId: `corr_${Math.random().toString(36).substring(2, 10)}`,
            metricName: 'ORCHESTRATION_TOKENS',
            keyIdentifier: agent.key,
            metricValue: inputTok + outputTok,
          });
        }
      } catch (err: any) {
        setLastGenerationError(err?.message || 'Error en la llamada de orquestación');
        setProgressMessage(`Error al ejecutar ${agent.name}: ${err?.message}`);
        setRenderingStatus('ERROR');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!cancelExecutionRef.current) {
      setProgressMessage('Compilando especificaciones de video para Seedance 2.0 y Google Veo...');
      const finalMems = StorageService.getMemories(project.id);
      try {
        await compilePromptsApi(project, finalMems);
      } catch (compileErr) {
        console.warn('Initial prompt compilation notice:', compileErr);
      }
      setRenderingStatus('COMPLETED');
      setMemories(finalMems);
      setSelectedProject(project);
    }
  };

  // Full Cascade Propagation from Showrunner to downstream departments
  const handlePropagateShowrunnerCascade = async (showrunnerContent: string) => {
    if (!selectedProject) return;

    const priorityKeys = [
      'GUIONISTA',
      'SCRIPT_DOCTOR',
      'CONTINUISTA',
      'DIRECTOR_ESCENA',
      'DIRECTOR_ARTE',
      'CHARACTER_DESIGNER',
      'PRODUCTION_DESIGNER',
      'DOP',
      'GAFFER',
      'COMPOSER',
      'SOUND_DESIGNER',
    ];

    const currentMems = StorageService.getMemories(selectedProject.id);
    const targets = CINEMA_SUBAGENTS_CATALOG.filter(
      (a) =>
        priorityKeys.includes(a.key) ||
        currentMems.some((m) => m.key === a.key && m.content.trim().length > 0)
    );

    const initialSteps: CascadeStep[] = targets.map((agent) => ({
      key: agent.key,
      name: agent.name,
      layer: agent.layer,
      status: 'PENDING',
    }));

    setCascadeSteps(initialSteps);
    setCascadeStepIndex(0);
    setIsCascadeComplete(false);
    setCascadeError(null);
    setShowCascadeModal(true);

    for (let i = 0; i < targets.length; i++) {
      const agent = targets[i];
      setCascadeStepIndex(i);
      setCascadeSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'RUNNING' } : s))
      );

      try {
        const curMems = StorageService.getMemories(selectedProject.id);
        const cascadePrompt = `DIRECTIVA ACTUALIZADA DEL SHOWRUNNER:\n${showrunnerContent}\n\nAdapta y regenera el entregable oficial de tu departamento (${agent.name} - ${agent.layer}) para alinearse con esta visión del Showrunner en "${selectedProject.title}".\nFunciones: ${(agent.duties || []).join(', ')}.`;

        const res = await orchestrateSubagentApi(
          selectedProject,
          agent,
          cascadePrompt,
          curMems,
          false,
          providerSettings
        );

        if (res.success && res.content) {
          StorageService.saveMemory({
            projectId: selectedProject.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
          });

          const revs = StorageService.getRevisions(selectedProject.id).filter((r) => r.key === agent.key);
          StorageService.saveRevision({
            projectId: selectedProject.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
            version: revs.length + 1,
            author: 'CASCADE_SHOWRUNNER',
            correlationId: `corr_casc_${Math.random().toString(36).substring(2, 8)}`,
          });
        }

        setCascadeSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'COMPLETED' } : s))
        );
      } catch (err: any) {
        setCascadeSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'ERROR', details: err?.message } : s))
        );
      }

      await new Promise((r) => setTimeout(r, 450));
    }

    setIsCascadeComplete(true);
    setMemories(StorageService.getMemories(selectedProject.id));
    setRevisions(StorageService.getRevisions(selectedProject.id));
  };

  // Activate all 24 subagents in the studio
  const handleActivateAllSubagents = async () => {
    if (!selectedProject) return;
    setIsActivatingAllAgents(true);

    const currentMems = StorageService.getMemories(selectedProject.id);
    const unexecuted = CINEMA_SUBAGENTS_CATALOG.filter(
      (agent) => !currentMems.some((m) => m.key === agent.key && m.content.trim().length > 0)
    );

    for (let i = 0; i < unexecuted.length; i++) {
      const agent = unexecuted[i];
      try {
        const curMems = StorageService.getMemories(selectedProject.id);
        const prompt = buildSubagentPrompt(agent, selectedProject);
        const res = await orchestrateSubagentApi(
          selectedProject,
          agent,
          prompt,
          curMems,
          false,
          providerSettings
        );
        if (res.success && res.content) {
          StorageService.saveMemory({
            projectId: selectedProject.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
          });
          StorageService.saveRevision({
            projectId: selectedProject.id,
            key: agent.key,
            title: `${agent.name} (${agent.layer})`,
            content: res.content,
            version: 1,
            author: agent.key,
            correlationId: `corr_full_${Math.random().toString(36).substring(2, 8)}`,
          });
        }
      } catch (e) {
        console.warn('Activation error for agent:', agent.key, e);
      }
      setMemories(StorageService.getMemories(selectedProject.id));
      await new Promise((r) => setTimeout(r, 350));
    }

    setIsActivatingAllAgents(false);
  };

  // Start Generation from Wizard Step 2
  const handleStartGenerationFromWizard = async () => {
    const newProject = StorageService.saveProject({
      title: wizardTitle,
      genre: 'Drama / Cine',
      artStyle: wizardArtStyle,
      description: wizardIdea,
      targetAudience: 'Público General',
      duration: wizardDuration,
    });

    // Populate Showrunner Bible in Capa 0
    const showrunnerBible = `=======================================================
PROYECTO: "${newProject.title.toUpperCase()}"
GÉNERO: Drama / Cine
ESTILO VISUAL: ${newProject.artStyle}
DURACIÓN ESTIMADA: ${newProject.duration || '3 minutos'}

SINOPSIS / IDEA CENTRAL DEL CREADOR:
${newProject.description}

DIRECTIVA GENERAL:
Entregable oficial del Showrunner para guiar la preproducción y renderizado en Cine AI Studio.`;

    StorageService.saveMemory({
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

  // Subagent update and cascade
  const handleUpdateSubagentMemoryAndCascade = async (key: string, title: string, newContent: string) => {
    if (!selectedProject) return;

    StorageService.saveMemory({
      projectId: selectedProject.id,
      key,
      title,
      content: newContent,
    });

    const existingRevs = StorageService.getRevisions(selectedProject.id).filter((r) => r.key === key);
    StorageService.saveRevision({
      projectId: selectedProject.id,
      key,
      title,
      content: newContent,
      version: existingRevs.length + 1,
      author: 'USER_DIRECTOR',
      correlationId: `corr_edit_${Math.random().toString(36).substring(2, 8)}`,
    });

    if (key === 'SHOWRUNNER') {
      setActiveSubagentToEdit(null);
      setEditedContentText('');
      await handlePropagateShowrunnerCascade(newContent);
      return;
    }

    setActiveSubagentToEdit(null);
    setEditedContentText('');
    setMemories(StorageService.getMemories(selectedProject.id));
  };

  // Execute single subagent manually from Tab 2
  const handleExecuteSubagentManually = async (subagent: CinemaSubagent, prompt: string) => {
    if (!selectedProject) return;

    try {
      const curMems = StorageService.getMemories(selectedProject.id);
      const res = await orchestrateSubagentApi(
        selectedProject,
        subagent,
        prompt,
        curMems,
        false,
        providerSettings
      );

      if (res.success && res.content) {
        StorageService.saveMemory({
          projectId: selectedProject.id,
          key: subagent.key,
          title: `${subagent.name} (${subagent.layer})`,
          content: res.content,
        });

        const revs = StorageService.getRevisions(selectedProject.id).filter((r) => r.key === subagent.key);
        StorageService.saveRevision({
          projectId: selectedProject.id,
          key: subagent.key,
          title: `${subagent.name} (${subagent.layer})`,
          content: res.content,
          version: revs.length + 1,
          author: subagent.key,
          correlationId: `corr_manual_${Math.random().toString(36).substring(2, 8)}`,
        });

        setMemories(StorageService.getMemories(selectedProject.id));
      }
    } catch (err: any) {
      alert(`Error al ejecutar ${subagent.name}: ${err?.message || 'Fallo de inferencia'}`);
    }
  };

  // Delete project
  const handleDeleteProject = (proj: MovieProject) => {
    StorageService.deleteProject(proj.id);
    const updated = StorageService.getProjects();
    setProjects(updated);
    if (selectedProject?.id === proj.id) {
      setSelectedProject(null);
      setCurrentScreen('HOME');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Header
        onNavigateHome={handleNavigateHome}
        providerSettings={providerSettings}
        onOpenProviderSettings={() => setShowProviderSettingsModal(true)}
        onOpenTokensCosts={() => setShowTokensCostsModal(true)}
      />

      <main className="flex-1 flex flex-col">
        {activeSubagentToEdit && selectedProject && (
          <OrchestratorContentEditor
            agent={activeSubagentToEdit}
            initialContent={editedContentText}
            onBack={() => {
              setActiveSubagentToEdit(null);
              setEditedContentText('');
            }}
            onUpdate={(key: string, title: string, newContent: string) =>
              handleUpdateSubagentMemoryAndCascade(
                key,
                title,
                newContent
              )
            }
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
            providerSettings={providerSettings}
            onOpenProviderSettings={() => setShowProviderSettingsModal(true)}
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
            renderingStatus={renderingStatus}
            lastGenerationError={lastGenerationError}
            onRetry={() => {
              if (selectedProject) runPreproductionSequence(selectedProject);
            }}
            onGoToProject={() => setCurrentScreen('PROJECT_DETAILS')}
            onOpenProviderSettings={() => setShowProviderSettingsModal(true)}
          />
        )}

        {!activeSubagentToEdit && currentScreen === 'PROJECT_LIST' && (
          <ProjectListScreen
            projects={projects}
            onBackClick={() => setCurrentScreen('HOME')}
            onSelectProject={(proj) => {
              setSelectedProject(proj);
              setMemories(StorageService.getMemories(proj.id));
              setRevisions(StorageService.getRevisions(proj.id));
              setAuditLogs(StorageService.getAuditLogs(proj.id));
              setMetrics(StorageService.getMetrics(proj.id));
              setCurrentScreen('PROJECT_DETAILS');
            }}
            onEditProject={(proj) => {
              setSelectedProject(proj);
              setMemories(StorageService.getMemories(proj.id));
              setRevisions(StorageService.getRevisions(proj.id));
              setAuditLogs(StorageService.getAuditLogs(proj.id));
              setMetrics(StorageService.getMetrics(proj.id));
              setCurrentScreen('PROJECT_DETAILS');
              setShowEditProjectModal(true);
            }}
            onDeleteProject={handleDeleteProject}
            onCreateNewProject={handleHomeCreateProject}
          />
        )}

        {!activeSubagentToEdit && currentScreen === 'PROJECT_DETAILS' && selectedProject && (
          <ProjectDetailsScreen
            key={`project_details_${selectedProject.id}`}
            project={selectedProject}
            memories={memories.filter((m) => m.projectId === selectedProject.id)}
            revisions={revisions.filter((r) => r.projectId === selectedProject.id)}
            auditLogs={auditLogs.filter((a) => a.projectId === selectedProject.id)}
            metrics={metrics.filter((m) => m.projectId === selectedProject.id)}
            providerSettings={providerSettings}
            onOpenProviderSettings={() => setShowProviderSettingsModal(true)}
            onBackClick={() => setCurrentScreen('PROJECT_LIST')}
            onEditProjectClick={() => setShowEditProjectModal(true)}
            onEditSubagent={(agent, currentContent) => {
              setActiveSubagentToEdit(agent);
              setEditedContentText(currentContent);
            }}
            onOpenPitchBibleModal={() => setShowPitchBibleModal(true)}
            onOpenRenderStudioModal={() => setShowRenderStudioModal(true)}
            onOpenCharacterApprovalModal={() => setShowCharacterApprovalModal(true)}
            onOpenPromptEngineerModal={() => setShowPromptEngineerModal(true)}
            onPropagateShowrunnerCascade={() =>
              handlePropagateShowrunnerCascade(
                memories.find((m) => m.projectId === selectedProject.id && m.key === 'SHOWRUNNER')?.content || ''
              )
            }
            onActivateAllSubagents={handleActivateAllSubagents}
            isActivatingAllAgents={isActivatingAllAgents}
            onExecuteSubagentManually={handleExecuteSubagentManually}
          />
        )}
      </main>

      {/* Global Modals */}
      <ProviderSettingsModal
        isOpen={showProviderSettingsModal}
        onClose={() => setShowProviderSettingsModal(false)}
        settings={providerSettings}
        onSaveSettings={(newSettings) => {
          StorageService.saveProviderSettings(newSettings);
          setProviderSettings(newSettings);
        }}
      />

      <TokensAndCostsModal
        isOpen={showTokensCostsModal}
        onClose={() => setShowTokensCostsModal(false)}
        providerSettings={providerSettings}
        projectId={selectedProject?.id}
        onOpenProviderSettings={() => setShowProviderSettingsModal(true)}
      />

      {selectedProject && (
        <PitchBibleModal
          key={`pitch_bible_${selectedProject.id}`}
          isOpen={showPitchBibleModal}
          onClose={() => setShowPitchBibleModal(false)}
          project={selectedProject}
          memories={memories.filter((m) => Number(m.projectId) === Number(selectedProject.id))}
          providerSettings={providerSettings}
        />
      )}

      {selectedProject && (
        <CharacterApprovalModal
          key={`char_approval_${selectedProject.id}`}
          isOpen={showCharacterApprovalModal}
          onClose={() => setShowCharacterApprovalModal(false)}
          project={selectedProject}
          allMemories={memories.filter((m) => Number(m.projectId) === Number(selectedProject.id))}
          providerSettings={providerSettings}
          onApproveAndProceedToRender={() => setShowCharacterApprovalModal(false)}
          onPostponeRender={() => setShowCharacterApprovalModal(false)}
        />
      )}

      {selectedProject && (
        <PromptEngineerModal
          key={`prompt_engineer_${selectedProject.id}`}
          isOpen={showPromptEngineerModal}
          onClose={() => setShowPromptEngineerModal(false)}
          project={selectedProject}
          memories={memories.filter((m) => Number(m.projectId) === Number(selectedProject.id))}
          providerSettings={providerSettings}
        />
      )}

      {selectedProject && (
        <RenderStudioModal
          isOpen={showRenderStudioModal}
          onClose={() => setShowRenderStudioModal(false)}
          project={selectedProject}
          providerSettings={providerSettings}
          onOpenProviderSettings={() => setShowProviderSettingsModal(true)}
          onStartRender={() => setShowRenderStudioModal(false)}
          onPostponeRender={() => setShowRenderStudioModal(false)}
        />
      )}

      {selectedProject && (
        <EditProjectModal
          isOpen={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          project={selectedProject}
          memories={memories.filter((m) => Number(m.projectId) === Number(selectedProject.id))}
          onSaveProject={(updated) => {
            StorageService.saveProject(updated);
            setSelectedProject(updated);
            setProjects(StorageService.getProjects());
            setShowEditProjectModal(false);
          }}
          onSaveAndCascade={async (updated, showrunnerDirectives) => {
            StorageService.saveProject(updated);
            setSelectedProject(updated);
            setProjects(StorageService.getProjects());
            setShowEditProjectModal(false);
            if (showrunnerDirectives) {
              await handlePropagateShowrunnerCascade(showrunnerDirectives);
            }
          }}
          onPurgeResidues={() => {
            // clean residues
          }}
        />
      )}

      <CascadePropagationModal
        isOpen={showCascadeModal}
        onClose={() => setShowCascadeModal(false)}
        projectTitle={selectedProject?.title || ''}
        steps={cascadeSteps}
        currentStepIndex={cascadeStepIndex}
        isComplete={isCascadeComplete}
        error={cascadeError}
      />
    </div>
  );
};

export default App;

