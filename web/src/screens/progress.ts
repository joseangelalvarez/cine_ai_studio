import { state, navigateTo, abortGeneration, startAutomaticSequence } from '../store';
import { SUBAGENTS } from '../subagents';
import { getMemoryContent } from '../store';

const LAYER_ICONS: Record<number, string> = { 0: '🎬', 1: '📝', 2: '🎨', 3: '✨', 4: '🎵', 5: '🎞', 6: '📊' };

export function renderCreationProgress(): string {
  const p = state.selectedProject;
  const { stepIndex, message, error, renderingStatus } = state.generation;
  const autoSubagents = SUBAGENTS.filter((a) => a.layerId <= 2);
  const total = autoSubagents.length;
  const pct = total > 0 ? Math.round((stepIndex / total) * 100) : 0;
  const isDone = renderingStatus === 'COMPLETED';

  return `
<div class="topbar">
  <button class="btn btn-ghost btn-icon" id="prog-abort" title="Cancelar">✕</button>
  <span class="topbar-title">${p ? escapeHtml(p.title) : 'Generando...'}</span>
  <span class="topbar-credits">💰 ${state.credits}</span>
</div>

<div class="page slide-up">
  <div class="col gap-24">

    <!-- Progress header -->
    <div class="card text-center" style="padding:28px">
      ${isDone
        ? `<div style="font-size:2.5rem;margin-bottom:12px">🎉</div>
           <h2 style="color:var(--green);margin-bottom:8px">¡Preproducción completada!</h2>
           <p class="text-sm">Todos los entregables han sido generados y guardados.</p>`
        : error
        ? `<div style="font-size:2.5rem;margin-bottom:12px">⚠️</div>
           <h2 style="color:var(--red);margin-bottom:8px">Error en generación</h2>
           <p class="text-sm" style="color:var(--red)">${escapeHtml(error)}</p>`
        : `<div style="display:flex;justify-content:center;margin-bottom:16px">
             <div class="spinner spinner-lg"></div>
           </div>
           <p class="text-sm text-muted" style="font-family:'Roboto Mono',monospace">${escapeHtml(message)}</p>`
      }

      <div class="progress-bar" style="margin-top:20px">
        <div class="progress-fill" style="width:${isDone ? 100 : pct}%"></div>
      </div>
      <p class="text-xs text-muted" style="margin-top:8px">${isDone ? total : stepIndex} / ${total} agentes</p>
    </div>

    <!-- Action buttons -->
    <div class="row" style="justify-content:center;gap:12px;flex-wrap:wrap">
      ${error
        ? `<button class="btn btn-primary" id="prog-retry">🔄 Reintentar</button>`
        : isDone
        ? `<button class="btn btn-primary" id="prog-view">Ver proyecto →</button>`
        : `<button class="btn btn-danger btn-sm" id="prog-stop">⏹ Detener</button>`
      }
    </div>

    <!-- Subagent pipeline list -->
    <div class="col gap-8">
      <h3 style="color:var(--gray-text);font-size:0.8rem;text-transform:uppercase;letter-spacing:.08em">Pipeline de subagentes</h3>
      ${autoSubagents.map((agent, idx) => {
        const agentState = state.subagentStates[agent.key] ?? 'PENDING';
        const isRunning = agentState === 'RUNNING';
        const isCompleted = agentState === 'COMPLETED';
        const isError = agentState === 'ERROR';
        const layerIcon = LAYER_ICONS[agent.layerId] ?? '🤖';

        return `
        <div class="agent-item ${isCompleted ? 'completed' : ''} ${isRunning ? 'running' : ''}"
             data-agent-key="${agent.key}" style="${isCompleted ? 'cursor:pointer' : ''}">
          <div class="agent-icon">${layerIcon}</div>
          <div style="flex:1;min-width:0">
            <div class="row-between">
              <div class="agent-name">${escapeHtml(agent.name)}</div>
              <div>
                ${isRunning ? '<span class="pulse-dot pulse-dot-primary"></span>' : ''}
                ${isCompleted ? '<span style="color:var(--green)">✓</span>' : ''}
                ${isError ? '<span style="color:var(--red)">✗</span>' : ''}
                ${agentState === 'PENDING' && !isDone ? `<span class="text-xs text-muted">${idx}</span>` : ''}
              </div>
            </div>
            <div class="agent-layer">${agent.layer}</div>
            ${isRunning ? `<p class="text-xs" style="color:var(--primary);margin-top:4px">Generando contenido...</p>` : ''}
            ${isCompleted ? `<p class="text-xs text-muted" style="margin-top:4px">Completado · clic para ver contenido</p>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>
</div>`;
}

export function bindCreationProgress() {
  document.getElementById('prog-abort')?.addEventListener('click', () => {
    abortGeneration();
    navigateTo('HOME');
  });
  document.getElementById('prog-stop')?.addEventListener('click', () => {
    abortGeneration();
  });
  document.getElementById('prog-retry')?.addEventListener('click', () => {
    const p = state.selectedProject;
    if (p) void startAutomaticSequence(p.id);
  });
  document.getElementById('prog-view')?.addEventListener('click', () => navigateTo('PROJECT_DETAILS'));

  // Click completed agents to view their content
  document.querySelectorAll<HTMLElement>('[data-agent-key]').forEach((el) => {
    el.addEventListener('click', () => {
      const key = el.dataset.agentKey!;
      if (state.subagentStates[key] === 'COMPLETED' && state.selectedProject) {
        const content = getMemoryContent(state.selectedProject.id, key);
        const agent = SUBAGENTS.find((a) => a.key === key);
        if (content) showContentModal(agent?.name ?? key, content);
      }
    });
  });
}

function showContentModal(title: string, content: string) {
  const existing = document.getElementById('content-modal-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'content-modal-overlay';
  overlay.className = 'overlay';
  overlay.innerHTML = `
<div class="modal slide-up" style="max-width:700px">
  <div class="row-between" style="margin-bottom:16px">
    <div class="modal-title">${escapeHtml(title)}</div>
    <button class="btn btn-ghost btn-icon" id="cm-close">✕</button>
  </div>
  <div class="content-box">${escapeHtml(content)}</div>
  <div class="row" style="justify-content:flex-end;margin-top:16px">
    <button class="btn btn-outline btn-sm" id="cm-copy">📋 Copiar</button>
  </div>
</div>`;
  document.body.appendChild(overlay);
  document.getElementById('cm-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('cm-copy')?.addEventListener('click', () => {
    navigator.clipboard.writeText(content).then(() => {
      const btn = document.getElementById('cm-copy') as HTMLButtonElement;
      if (btn) { btn.textContent = '✓ Copiado'; setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000); }
    });
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
