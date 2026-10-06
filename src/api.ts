import { MovieProject, CinemaSubagent, ProjectMemory } from './types';

export interface OrchestrationResponse {
  success: boolean;
  content: string;
  latencyMs: number;
  estimatedCost: number;
  mode?: string;
  error?: string;
  warning?: string;
}

export async function orchestrateSubagentApi(
  project: MovieProject,
  subagent: CinemaSubagent,
  prompt: string,
  accumulatedMemories: ProjectMemory[],
  useSimulation: boolean
): Promise<OrchestrationResponse> {
  try {
    const res = await fetch('/api/orchestrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project,
        subagent,
        prompt,
        accumulatedMemories,
        useSimulation,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Error del servidor' }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('API call failed:', error);
    throw error;
  }
}

export async function exportPackageApi(
  project: MovieProject,
  provider: string,
  characters: string,
  background: string,
  sound: string
) {
  const res = await fetch('/api/export-package', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, provider, characters, background, sound }),
  });
  if (!res.ok) {
    throw new Error('Fallo al exportar el paquete');
  }
  return await res.json();
}
