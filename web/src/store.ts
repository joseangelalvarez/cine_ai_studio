import type { AppState, Screen, MovieProject, ProjectMemory, ApiKeySettings, ApiProvider, RoleConfig, RoleAssignment } from './types';
import { loadProjects, saveProjects, loadMemories, saveMemories, loadCredits, saveCredits, loadApiSettings, saveApiSettings, nextProjectId, nextMemoryId, loadVideoWorkflowSettings, saveVideoWorkflowSettings, saveHuggingFaceToken, setSelectedVideoWorkflow, upsertVideoInventoryItem } from './storage';
import { SUBAGENTS } from './subagents';
import { executeSubagentRequest } from './gateway';
import { DEFAULT_ROLES } from './constants';

// ─── Simple reactive store ─────────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() { listeners.forEach((l) => l()); }

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ─── Initial state ────────────────────────────────────────────────────────────

const projects = loadProjects();
const memories = loadMemories();
const apiSettings = loadApiSettings();
const credits = loadCredits();

export const state: AppState = {
  screen: 'HOME',
  projects,
  selectedProject: null,
  memories: [],
  apiSettings,
  videoWorkflows: loadVideoWorkflowSettings(),
  credits,
  wizard: { title: '', duration: '3 minutos', artStyle: 'Cinemático Ultra-Realista', idea: '' },
  generation: { stepIndex: 0, message: 'Iniciando motor de preproducción...', error: null, renderingStatus: '' },
  subagentStates: {},
  activeSubagentKey: null,
};

// ─── Navigation ───────────────────────────────────────────────────────────────

export function navigateTo(screen: Screen) {
  state.screen = screen;
  if (screen === 'HOME') state.selectedProject = null;
  notify();
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function createProject(data: Omit<MovieProject, 'id' | 'createdAt'>): MovieProject {
  const project: MovieProject = { ...data, id: nextProjectId(state.projects), createdAt: Date.now() };
  state.projects = [project, ...state.projects];
  saveProjects(state.projects);
  state.selectedProject = project;
  return project;
}

export function deleteProject(id: number) {
  state.projects = state.projects.filter((p) => p.id !== id);
  state.memories = state.memories.filter((m) => m.projectId !== id);
  saveProjects(state.projects);
  saveMemories(state.memories);
  if (state.selectedProject?.id === id) state.selectedProject = null;
  notify();
}

export function openProject(project: MovieProject) {
  state.selectedProject = project;
  state.memories = memories.filter((m) => m.projectId === project.id);
  notify();
}

// ─── Memories ─────────────────────────────────────────────────────────────────

function allMemories(): ProjectMemory[] {
  return loadMemories();
}

export function saveAgentMemory(projectId: number, key: string, title: string, content: string) {
  const all = allMemories();
  const existing = all.findIndex((m) => m.projectId === projectId && m.key === key);
  const now = Date.now();
  if (existing >= 0) {
    all[existing] = { ...all[existing], title, content, updatedAt: now };
  } else {
    all.push({ id: nextMemoryId(all), projectId, key, title, content, updatedAt: now });
  }
  saveMemories(all);
  state.memories = all.filter((m) => m.projectId === projectId);
  notify();
}

export function getMemoryContent(projectId: number, key: string): string {
  return allMemories().find((m) => m.projectId === projectId && m.key === key)?.content ?? '';
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export function consumeCredits(amount: number): boolean {
  if (state.credits >= amount) {
    state.credits -= amount;
    saveCredits(state.credits);
    notify();
    return true;
  }
  return false;
}

// ─── API Key settings ─────────────────────────────────────────────────────────

export function updateApiSettings(partial: Partial<ApiKeySettings>) {
  state.apiSettings = { ...state.apiSettings, ...partial };
  saveApiSettings(state.apiSettings);
  notify();
}

export function setApiKey(provider: ApiProvider, key: string) {
  state.apiSettings.apiKeys = { ...state.apiSettings.apiKeys, [provider]: key };
  saveApiSettings(state.apiSettings);
  notify();
}

export function setSelectedProvider(provider: ApiProvider) {
  state.apiSettings.selectedProvider = provider;
  saveApiSettings(state.apiSettings);
  notify();
}

export function setSelectedModel(provider: ApiProvider, model: string) {
  state.apiSettings.selectedModels = { ...state.apiSettings.selectedModels, [provider]: model };
  saveApiSettings(state.apiSettings);
  notify();
}

export function updateVideoWorkflowSettings(partial: Partial<AppState['videoWorkflows']>) {
  state.videoWorkflows = {
    ...state.videoWorkflows,
    ...partial,
  };
  saveVideoWorkflowSettings(state.videoWorkflows);
  notify();
}

export function setVideoWorkflow(workflow: AppState['videoWorkflows']['selectedWorkflow']) {
  state.videoWorkflows = { ...state.videoWorkflows, selectedWorkflow: workflow };
  setSelectedVideoWorkflow(workflow);
  notify();
}

export function setHuggingFaceToken(token: string, username?: string) {
  state.videoWorkflows = {
    ...state.videoWorkflows,
    huggingFace: { token, username, lastValidatedAt: Date.now() },
  };
  saveHuggingFaceToken(token, username);
  notify();
}

export function registerInstalledVideoModel(modelId: string, provider: AppState['videoWorkflows']['selectedWorkflow'], version?: string) {
  upsertVideoInventoryItem({
    modelId,
    provider,
    installed: true,
    version,
    downloadedAt: Date.now(),
  });
  state.videoWorkflows = loadVideoWorkflowSettings();
  notify();
}

// ─── Multi-role assignments (Plan multi-rol) ──────────────────────────────────

export function setRoleAssignments(roles: RoleConfig, roleOverrides: Partial<Record<string, RoleAssignment>>) {
  state.apiSettings = { ...state.apiSettings, roles, roleOverrides };
  saveApiSettings(state.apiSettings);
  notify();
}

/** Atajo para cambiar solo el rol de render de video (usado por las cards del Video Hub). */
export function setVideoRenderRole(provider: string, model: string) {
  const roles = state.apiSettings.roles ?? DEFAULT_ROLES_FALLBACK;
  setRoleAssignments({ ...roles, videoRender: { provider, model } }, state.apiSettings.roleOverrides ?? {});
}

const DEFAULT_ROLES_FALLBACK = DEFAULT_ROLES;

// ─── Wizard ───────────────────────────────────────────────────────────────────

export function updateWizard(key: keyof AppState['wizard'], value: string) {
  state.wizard = { ...state.wizard, [key]: value };
  queueMicrotask(() => notify());
}

// ─── Subagent pipeline ────────────────────────────────────────────────────────

let abortController: AbortController | null = null;

export function abortGeneration() {
  abortController?.abort();
  abortController = null;
}

export async function startAutomaticSequence(projectId: number) {
  abortController = new AbortController();
  const signal = abortController.signal;

  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return;

  state.generation = { stepIndex: 0, message: 'Iniciando motor de preproducción...', error: null, renderingStatus: '' };
  state.subagentStates = {};
  SUBAGENTS.forEach((a) => { state.subagentStates[a.key] = 'PENDING'; });
  navigateTo('CREATION_PROGRESS');

  const subagentsToRun = SUBAGENTS.filter((a) => a.layerId <= 2); // Capas 0-2 automáticas

  for (let i = 0; i < subagentsToRun.length; i++) {
    if (signal.aborted) break;

    const agent = subagentsToRun[i];
    state.generation = {
      stepIndex: i,
      message: `[${agent.layer}] Ejecutando: ${agent.name}...`,
      error: null,
      renderingStatus: '',
    };
    state.subagentStates = { ...state.subagentStates, [agent.key]: 'RUNNING' };
    notify();

    const contextMemory = allMemories()
      .filter((m) => m.projectId === projectId)
      .map((m) => `## ${m.title}\n${m.content}`)
      .join('\n\n');

    const systemPrompt = `Eres ${agent.name} (${agent.role}) en la producción cinematográfica "${project.title}".
Proyecto: ${project.description}
Estilo artístico: ${project.artStyle}
Duración objetivo: ${project.genre}

Contexto de producción acumulado:
${contextMemory || '(Sin contexto previo — eres el primer agente)'}

Entrega tu trabajo de forma completa, detallada y profesional.`;

    const userPrompt = `${agent.suggestedPrompt}

Adapta tu respuesta específicamente para el proyecto "${project.title}".
Audiencia objetivo: ${project.targetAudience}`;

    try {
      const result = await executeSubagentRequest(state.apiSettings, agent.key, {
        prompt: userPrompt,
        systemInstruction: systemPrompt,
      });
      if (!signal.aborted) {
        saveAgentMemory(projectId, agent.key, agent.name, result.text);
        state.subagentStates = { ...state.subagentStates, [agent.key]: 'COMPLETED' };
        notify();
      }
    } catch (err: unknown) {
      if (!signal.aborted) {
        const msg = err instanceof Error ? err.message : String(err);
        state.generation = { ...state.generation, error: `Error en ${agent.name}: ${msg}` };
        state.subagentStates = { ...state.subagentStates, [agent.key]: 'ERROR' };
        notify();
        return;
      }
    }

    // Small pacing delay between agents
    await new Promise((res) => setTimeout(res, 300));
  }

  if (!signal.aborted) {
    state.generation = {
      stepIndex: subagentsToRun.length,
      message: '¡Preproducción completada! Todos los entregables generados.',
      error: null,
      renderingStatus: 'COMPLETED',
    };
    notify();
  }
}
