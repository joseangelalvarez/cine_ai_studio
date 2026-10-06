import { state, navigateTo, startAutomaticSequence, saveAgentMemory, getMemoryContent } from '../store';
import { SUBAGENTS } from '../subagents';
import { parseStoryboardShots } from '../storyboardParser';
import { generateVideo, getGenerationProgress, assembleShots } from '../videoWorkflows';
import { loadProjectVideoSettings, saveProjectVideoSettings, saveGeneratedShot, loadGeneratedShots } from '../storage';
import type { VideoWorkflowKind } from '../types';

const LAYER_ICONS: Record<number, string> = { 0: '🎬', 1: '📝', 2: '🎨', 3: '✨', 4: '🎵', 5: '🎞', 6: '📊' };

export function renderProjectDetails(): string {
  const p = state.selectedProject;
  if (!p) return '<div class="page"><p>No hay proyecto seleccionado.</p></div>';

  const memories = state.memories;
  const completedKeys = new Set(memories.map((m) => m.projectId === p.id ? m.key : null).filter(Boolean));

  const layers = [0, 1, 2, 3, 4, 5, 6];

  return `
<div class="topbar">
  <button class="btn btn-ghost btn-icon" id="pd-back">←</button>
  <span class="topbar-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(p.title)}</span>
  <span class="topbar-credits" style="margin-left:auto">💰 ${state.credits}</span>
</div>

<div class="page page-wide slide-up">
  <div class="col gap-24">

    <!-- Project header -->
    <div class="card" style="padding:20px">
      <div class="row-between">
        <div>
          <h2 style="color:var(--pale-white)">${escapeHtml(p.title)}</h2>
          <div class="row gap-8" style="margin-top:6px;flex-wrap:wrap">
            <span class="badge badge-primary">${escapeHtml(p.artStyle)}</span>
            <span class="badge badge-gray">${escapeHtml(p.genre)}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" id="pd-rerun">▶ Re-ejecutar</button>
      </div>
      <p class="text-sm" style="margin-top:12px;line-height:1.7">${escapeHtml(p.description)}</p>
    </div>

    <!-- Progress overview -->
    <div class="row-between">
      <span class="text-sm text-muted">${completedKeys.size} / ${SUBAGENTS.length} agentes completados</span>
      <div class="progress-bar" style="width:200px">
        <div class="progress-fill" style="width:${Math.round((completedKeys.size / SUBAGENTS.length) * 100)}%"></div>
      </div>
    </div>

    <!-- Agents grouped by layer -->
    ${layers.map((layerId) => {
      const layerAgents = SUBAGENTS.filter((a) => a.layerId === layerId);
      if (!layerAgents.length) return '';
      const layerName = layerAgents[0].layer;
      const icon = LAYER_ICONS[layerId] ?? '🤖';
      return `
      <div>
        <h3 style="color:var(--gray-text);font-size:0.78rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">
          ${icon} ${layerName}
        </h3>
        <div class="col gap-8">
          ${layerAgents.map((agent) => {
            const isDone = completedKeys.has(agent.key);
            return `
            <div class="agent-item ${isDone ? 'completed' : ''}"
                 data-agent-key="${agent.key}" style="${isDone ? 'cursor:pointer' : ''}">
              <div class="agent-icon">${icon}</div>
              <div style="flex:1;min-width:0">
                <div class="row-between">
                  <div class="agent-name">${escapeHtml(agent.name)}</div>
                  <div class="row gap-8">
                    ${isDone
                      ? `<button class="btn btn-outline btn-sm" data-agent-view="${agent.key}">👁 Ver</button>
                         <button class="btn btn-ghost btn-sm" data-agent-run="${agent.key}">↩ Re-gen</button>`
                      : `<button class="btn btn-primary btn-sm" data-agent-run="${agent.key}">▶ Generar</button>`
                    }
                  </div>
                </div>
                <div class="agent-layer">${agent.role}</div>
                ${isDone ? `<p class="text-xs" style="color:var(--green);margin-top:4px">✓ Completado · clic para ver o editar</p>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}

    <!-- Video generation from storyboard -->
    ${(() => {
      const storyboardContent = getMemoryContent(p.id, 'STORYBOARD');
      const shots = storyboardContent ? parseStoryboardShots(storyboardContent) : [];
      const workflow = state.videoWorkflows.selectedWorkflow;
      const vidSettings = loadProjectVideoSettings(p.id);
      const prevShots = loadGeneratedShots(p.id);
      return `
      <div class="card" style="padding:20px">
        <div class="row-between" style="margin-bottom:12px">
          <h2>🎞 Generar video</h2>
          <span class="badge ${workflow ? 'badge-primary' : 'badge-gray'}">${workflow ? escapeHtml(workflow) : 'Sin flujo'}</span>
        </div>
        ${!workflow
          ? `<p class="text-sm text-muted">Ve a <strong>Video local</strong> y selecciona un flujo antes de generar.</p>
             <button class="btn btn-outline btn-sm" id="pd-goto-video" style="margin-top:12px">Configurar flujo →</button>`
          : `
        <!-- Video generation settings -->
        <details style="margin-bottom:16px">
          <summary class="text-sm" style="cursor:pointer;color:var(--gray-text)">⚙ Configuración de generación</summary>
          <div class="col gap-8" style="margin-top:12px;padding:12px;background:var(--bg-input);border-radius:8px" id="vid-settings-panel">
            <div class="row gap-8" style="flex-wrap:wrap">
              <div class="input-group" style="flex:1;min-width:120px">
                <label>Ancho</label>
                <input class="input input-sm" id="vs-width" type="number" value="${vidSettings.width}" min="256" max="1920" step="64">
              </div>
              <div class="input-group" style="flex:1;min-width:120px">
                <label>Alto</label>
                <input class="input input-sm" id="vs-height" type="number" value="${vidSettings.height}" min="144" max="1080" step="64">
              </div>
              <div class="input-group" style="flex:1;min-width:120px">
                <label>Pasos</label>
                <input class="input input-sm" id="vs-steps" type="number" value="${vidSettings.steps}" min="10" max="100">
              </div>
              <div class="input-group" style="flex:1;min-width:120px">
                <label>Guidance</label>
                <input class="input input-sm" id="vs-guidance" type="number" value="${vidSettings.guidance}" min="1" max="20" step="0.5">
              </div>
            </div>
            <div class="input-group">
              <label>Prompt negativo</label>
              <input class="input input-sm" id="vs-negative" type="text" value="${escapeAttr(vidSettings.negativePrompt)}">
            </div>
            <button class="btn btn-outline btn-sm" id="vs-save" style="align-self:flex-end">Guardar configuración</button>
          </div>
        </details>
        ${shots.length === 0
          ? `<p class="text-sm text-muted">${storyboardContent ? 'No se detectaron tomas estructuradas.' : 'Primero genera el agente Storyboarder para obtener las tomas.'}</p>`
          : `<p class="text-sm text-muted" style="margin-bottom:16px">${shots.length} toma${shots.length !== 1 ? 's' : ''} detectada${shots.length !== 1 ? 's' : ''}. Genera cada una con el flujo seleccionado.</p>
             <div class="col gap-8" id="shots-list">
               ${shots.map((shot) => {
                 const prev = prevShots.find((s) => s.shotIndex === shot.index);
                 return `
               <div class="agent-item" id="shot-item-${shot.index}" style="align-items:flex-start">
                 <div class="agent-icon" style="font-size:1rem;min-width:28px;text-align:center">${shot.index}</div>
                 <div style="flex:1;min-width:0">
                   <div class="row-between">
                     <div class="agent-name">${escapeHtml(shot.title)}</div>
                     <button class="btn btn-primary btn-sm" data-generate-shot="${shot.index}">▶ Generar</button>
                   </div>
                   <p class="text-xs" style="margin-top:4px;color:var(--gray-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(shot.description.slice(0, 120))}</p>
                   <div class="shot-status" id="shot-status-${shot.index}" style="font-size:0.75rem;margin-top:4px">${prev ? `<span style="color:var(--green)">✓ Generado · <a href="${escapeAttr(prev.outputUrl)}" target="_blank" style="color:var(--primary)">Ver</a></span>` : ''}</div>
                 </div>
               </div>`;
               }).join('')}
             </div>
             ${prevShots.length >= 2 ? `
             <div class="row" style="justify-content:flex-end;margin-top:16px;gap:8px">
               <div id="assemble-status" style="font-size:0.82rem;align-self:center"></div>
               <button class="btn btn-primary btn-sm" id="pd-assemble">🎬 Ensamblar corto (${prevShots.length} tomas)</button>
             </div>` : ''}
          `
        }`
        }
      </div>`;
    })()}
  </div>
</div>`;
}

export function bindProjectDetails() {
  document.getElementById('pd-back')?.addEventListener('click', () => navigateTo('PROJECT_LIST'));
  document.getElementById('pd-goto-video')?.addEventListener('click', () => navigateTo('VIDEO_HUB'));
  document.getElementById('pd-rerun')?.addEventListener('click', () => {
    if (state.selectedProject) void startAutomaticSequence(state.selectedProject.id);
  });

  // Save video generation settings
  document.getElementById('vs-save')?.addEventListener('click', () => {
    const p = state.selectedProject;
    if (!p) return;
    const width = parseInt((document.getElementById('vs-width') as HTMLInputElement)?.value ?? '768', 10);
    const height = parseInt((document.getElementById('vs-height') as HTMLInputElement)?.value ?? '432', 10);
    const steps = parseInt((document.getElementById('vs-steps') as HTMLInputElement)?.value ?? '20', 10);
    const guidance = parseFloat((document.getElementById('vs-guidance') as HTMLInputElement)?.value ?? '7.5');
    const negativePrompt = (document.getElementById('vs-negative') as HTMLInputElement)?.value ?? '';
    saveProjectVideoSettings(p.id, { width, height, steps, guidance, negativePrompt });
    const btn = document.getElementById('vs-save') as HTMLButtonElement;
    if (btn) { btn.textContent = '✓ Guardado'; setTimeout(() => { btn.textContent = 'Guardar configuración'; }, 1500); }
  });

  // Assemble shots
  document.getElementById('pd-assemble')?.addEventListener('click', async () => {
    const p = state.selectedProject;
    if (!p) return;
    const shots = loadGeneratedShots(p.id);
    if (shots.length < 2) return;
    const statusEl = document.getElementById('assemble-status');
    const btn = document.getElementById('pd-assemble') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Ensamblando...'; }
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--yellow)">Ejecutando ffmpeg...</span>';
    const sortedUrls = shots.sort((a, b) => a.shotIndex - b.shotIndex).map((s) => s.outputUrl);
    const result = await assembleShots(sortedUrls);
    if (result.ok) {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--green)">✓ <a href="${escapeAttr(result.outputPath ?? '')}" target="_blank" style="color:var(--primary)">Ver corto final</a></span>`;
      if (btn) { btn.disabled = false; btn.textContent = '🎬 Re-ensamblar'; }
    } else {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--red)">✗ ${escapeHtml(result.error ?? 'Error')}</span>`;
      if (btn) { btn.disabled = false; btn.textContent = '🎬 Ensamblar corto'; }
    }
  });

  // View agent content
  document.querySelectorAll<HTMLButtonElement>('[data-agent-view]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.agentView!;
      if (!state.selectedProject) return;
      const content = getMemoryContent(state.selectedProject.id, key);
      const agent = SUBAGENTS.find((a) => a.key === key);
      showAgentEditor(agent?.key ?? key, agent?.name ?? key, content);
    });
  });

  // Click completed agent row → view
  document.querySelectorAll<HTMLElement>('[data-agent-key]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      const key = el.dataset.agentKey!;
      if (!state.selectedProject) return;
      const content = getMemoryContent(state.selectedProject.id, key);
      if (!content) return;
      const agent = SUBAGENTS.find((a) => a.key === key);
      showAgentEditor(agent?.key ?? key, agent?.name ?? key, content);
    });
  });

  // Run individual agent
  document.querySelectorAll<HTMLButtonElement>('[data-agent-run]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const key = btn.dataset.agentRun!;
      const agent = SUBAGENTS.find((a) => a.key === key);
      const p = state.selectedProject;
      if (!agent || !p) return;

      btn.disabled = true;
      btn.textContent = '⏳';

      const { loadMemories } = await import('../storage');
      const contextMemory = loadMemories()
        .filter((m) => m.projectId === p.id)
        .map((m) => `## ${m.title}\n${m.content}`)
        .join('\n\n');

      const systemPrompt = `Eres ${agent.name} (${agent.role}) en la producción cinematográfica "${p.title}".
Contexto de producción acumulado:\n${contextMemory || '(Sin contexto previo)'}`;

      const { executeAIRequest } = await import('../gateway');
      try {
        const result = await executeAIRequest(state.apiSettings, {
          prompt: `${agent.suggestedPrompt}\n\nAdapta tu respuesta al proyecto "${p.title}".`,
          systemInstruction: systemPrompt,
        });
        saveAgentMemory(p.id, agent.key, agent.name, result.text);
        showAgentEditor(agent.key, agent.name, result.text);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Error: ${msg}`);
      } finally {
        btn.disabled = false;
        btn.textContent = '↩ Re-gen';
      }
    });
  });

  // Generate individual shots from storyboard
  const storyboardContent = state.selectedProject ? getMemoryContent(state.selectedProject.id, 'STORYBOARD') : '';
  const shots = storyboardContent ? parseStoryboardShots(storyboardContent) : [];
  document.querySelectorAll<HTMLButtonElement>('[data-generate-shot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.generateShot ?? '0', 10);
      const shot = shots.find((s) => s.index === idx);
      const workflow = state.videoWorkflows.selectedWorkflow as VideoWorkflowKind | undefined;
      if (!shot || !workflow) {
        alert(!workflow ? 'Selecciona un flujo de video primero' : 'Toma no encontrada');
        return;
      }
      startShotGeneration(idx, shot.description || shot.title, workflow);
    });
  });
}

function startShotGeneration(shotIndex: number, prompt: string, workflow: VideoWorkflowKind) {
  const p = state.selectedProject;
  const statusEl = document.getElementById(`shot-status-${shotIndex}`);
  const btn = document.querySelector<HTMLButtonElement>(`[data-generate-shot="${shotIndex}"]`);
  if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
  if (statusEl) statusEl.innerHTML = '<span style="color:var(--yellow)">Iniciando...</span>';

  const vidSettings = p ? loadProjectVideoSettings(p.id) : { width: 768, height: 432, steps: 20, guidance: 7.5, negativePrompt: 'blurry, low quality' };

  void generateVideo({ workflow, prompt, settings: { width: vidSettings.width, height: vidSettings.height, steps: vidSettings.steps, guidance: vidSettings.guidance } }).then((res) => {
    if (!res.success) {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--red)">✗ ${escapeHtml(res.error ?? 'Error')}</span>`;
      if (btn) { btn.disabled = false; btn.textContent = '▶ Generar'; }
      return;
    }

    // Poll progress
    let ticks = 0;
    const iv = setInterval(async () => {
      ticks++;
      const prog = await getGenerationProgress();
      if (statusEl) {
        const bar = '█'.repeat(Math.round(prog.percent / 10)).padEnd(10, '░');
        statusEl.innerHTML = `<span style="font-family:monospace;font-size:0.72rem;color:var(--primary)">[${bar}] ${prog.percent}% ${prog.message ?? ''}</span>`;
      }
      if (!prog.active && prog.status === 'completed') {
        clearInterval(iv);
        if (p && prog.outputPath) {
          saveGeneratedShot(p.id, { shotIndex, prompt, outputUrl: prog.outputPath, workflow, generatedAt: Date.now() });
        }
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--green)">✓ Completado</span>${prog.outputPath ? ` · <a href="${prog.outputPath}" target="_blank" style="color:var(--primary)">Ver video</a>` : ''}`;
        if (btn) { btn.disabled = false; btn.textContent = '↩ Re-gen'; }
      } else if (!prog.active && prog.status === 'error') {
        clearInterval(iv);
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--red)">✗ ${escapeHtml(prog.message ?? 'Error')}</span>`;
        if (btn) { btn.disabled = false; btn.textContent = '▶ Generar'; }
      } else if (ticks > 600) {
        clearInterval(iv);
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--yellow)">⏱ Tiempo agotado</span>';
        if (btn) { btn.disabled = false; btn.textContent = '▶ Generar'; }
      }
    }, 1000);
  });
}

function showAgentEditor(key: string, title: string, initialContent: string) {
  const existing = document.getElementById('agent-editor-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'agent-editor-overlay';
  overlay.className = 'overlay';
  overlay.innerHTML = `
<div class="modal slide-up" style="max-width:760px">
  <div class="row-between" style="margin-bottom:16px">
    <div class="modal-title">${escapeHtml(title)}</div>
    <button class="btn btn-ghost btn-icon" id="ae-close">✕</button>
  </div>
  <textarea class="textarea" id="ae-content" rows="16" style="font-family:'Roboto Mono',monospace;font-size:0.82rem">${escapeHtml(initialContent)}</textarea>
  <div class="row" style="justify-content:flex-end;gap:10px;margin-top:16px">
    <button class="btn btn-outline btn-sm" id="ae-copy">📋 Copiar</button>
    <button class="btn btn-primary" id="ae-save">💾 Guardar cambios</button>
  </div>
</div>`;
  document.body.appendChild(overlay);

  document.getElementById('ae-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('ae-copy')?.addEventListener('click', () => {
    const content = (document.getElementById('ae-content') as HTMLTextAreaElement).value;
    navigator.clipboard.writeText(content);
  });
  document.getElementById('ae-save')?.addEventListener('click', () => {
    const content = (document.getElementById('ae-content') as HTMLTextAreaElement).value;
    if (state.selectedProject) {
      saveAgentMemory(state.selectedProject.id, key, title, content);
    }
    overlay.remove();
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}
