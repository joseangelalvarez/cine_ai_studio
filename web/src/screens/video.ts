import { state, navigateTo, saveAgentMemory, setVideoRenderRole } from '../store';
import { DEFAULT_ROLES } from '../constants';
import { VIDEO_MODEL_CATALOG } from '../constants';
import type { VideoWorkflowKind } from '../types';
import { chooseHelperWorkflow, downloadHelperModel, saveHelperToken, syncHelperInventory, validateHelperToken } from '../videoHelperClient';
import { detectWorkflows, generateVideo, getGenerationProgress, getDownloadProgress } from '../videoWorkflows';

export function renderVideoHub(): string {
  const workflows: { id: VideoWorkflowKind; label: string; description: string }[] = [
    { id: 'animatediff', label: 'AnimateDiff', description: 'Control fino de movimiento y continuidad' },
    { id: 'wan', label: 'Wan-AI', description: 'Descarga automática de modelos de video desde Hugging Face' },
    { id: 'ltx', label: 'Lightricks / LTX', description: 'Flujos de video imagen a video y video a video' },
    { id: 'ollama', label: 'Modo local fácil', description: 'Ollama presentado sin jerga técnica' },
  ];

  const token = state.videoWorkflows.huggingFace.token;
  const selected = state.videoWorkflows.selectedWorkflow;
  const readyModels = state.videoWorkflows.installedModels;

  return `
<div class="topbar">
  <button class="btn btn-ghost btn-icon" id="video-back">←</button>
  <span class="topbar-title">Video local</span>
</div>
<div class="page slide-up">
  <div class="col gap-24">
    <div class="card">
      <h2>Elegir flujo</h2>
      <p class="text-sm">Selecciona la ruta que quieres usar para generar un corto profesional.</p>
      <div class="col gap-8" style="margin-top:16px">
        ${workflows.map((workflow) => `
          <div class="provider-card ${workflow.id === selected ? 'selected' : ''}" data-video-workflow="${workflow.id}">
            <div class="provider-info">
              <div class="provider-name">${workflow.label}</div>
              <div class="provider-desc">${workflow.description}</div>
            </div>
            ${workflow.id === selected ? '<span style="color:var(--primary);margin-left:auto">✓</span>' : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <h2>Credenciales Hugging Face</h2>
      <p class="text-sm">Se usan para descargar modelos Wan o LTX cuando no están disponibles.</p>
      <div class="input-group" style="margin-top:16px">
        <label>Token</label>
        <input class="input" id="hf-token" type="password" placeholder="hf_..." value="${escapeAttr(token)}">
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:14px">
        <button class="btn btn-primary btn-sm" id="hf-save">Guardar token</button>
      </div>
    </div>

    <div class="card">
      <h2>Generar video</h2>
      <p class="text-sm">Crea tu primer video con el flujo seleccionado.</p>
      <div id="workflows-status" style="margin-top:12px;font-size:0.82rem"></div>
      <div class="row gap-8" style="margin-top:16px">
        <button class="btn btn-outline btn-sm" id="detect-workflows" style="flex:1">Detectar flujos</button>
        <button class="btn btn-primary btn-sm" id="generate-video" style="flex:1">Generar</button>
      </div>
      <label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-size:0.82rem">
        <input type="checkbox" id="qa-enabled" checked />
        Control de calidad visual con Gemini (juez multimodal, máx. 3 intentos por clip)
      </label>

    <div class="card">
      <h2>Modelos listos o descargables</h2>
      <p class="text-sm">Si un modelo no está instalado, el helper local puede descargarlo y registrar su estado.</p>
      <div class="row" style="justify-content:space-between;margin-top:8px;margin-bottom:8px">
        <span class="text-xs text-muted">Helper local: http://127.0.0.1:8787</span>
        <button class="btn btn-outline btn-sm" id="sync-helper">Sincronizar inventario</button>
      </div>
      <div id="helper-status" style="margin-bottom:12px;font-size:0.82rem;text-align:center"></div>
      <div class="col gap-8" style="margin-top:16px">
        ${VIDEO_MODEL_CATALOG.map((model) => {
          const installed = readyModels.some((item) => item.modelId === model.id && item.installed);
          const requiresToken = model.requiresCredentials;
          const statusText = installed ? 'Listo' : requiresToken && !token ? 'Requiere token' : 'Descargar';
          return `
            <div class="provider-card ${installed ? 'selected' : ''}" data-download-model="${model.id}">
              <div class="provider-info">
                <div class="provider-name">${model.name}</div>
                <div class="provider-desc">${model.description}</div>
                <div class="provider-price">${model.sourceUrl}</div>
                <div class="download-progress" id="dl-${escapeAttr(model.id.replace(/[^a-zA-Z0-9]/g, '-'))}" style="display:none;margin-top:6px;font-size:0.72rem;font-family:monospace"></div>
              </div>
              <span class="badge ${installed ? 'badge-green' : requiresToken && !token ? 'badge-red' : 'badge-yellow'}">${statusText}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  </div>
</div>`;
}

export function bindVideoHub(): void {
  const token = (document.getElementById('hf-token') as HTMLInputElement | null)?.value ?? state.videoWorkflows.huggingFace.token;
  document.getElementById('video-back')?.addEventListener('click', () => navigateTo('HOME'));
  document.querySelectorAll<HTMLElement>('[data-video-workflow]').forEach((el) => {
    el.addEventListener('click', () => {
      const workflow = el.dataset.videoWorkflow as VideoWorkflowKind;
      void chooseHelperWorkflow(workflow);
      // Plan multi-rol: la card elegida sincroniza el rol de render de video.
      setVideoRenderRole(workflow, `${workflow}-local`);
    });
  });
  document.getElementById('detect-workflows')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('workflows-status');
    if (statusEl) {
      statusEl.innerHTML = '<span style="color:var(--yellow)">🔄 Detectando...</span>';
      try {
        const workflows = await detectWorkflows();
        const statuses = [];
        if (workflows.animatediff?.installed) statuses.push('✓ AnimateDiff disponible');
        if (workflows.ollama?.installed) statuses.push('✓ Ollama disponible');
        if (!workflows.animatediff?.installed && !workflows.ollama?.installed) {
          statuses.push('⚠ Sin flujos locales. Instala: pip install animatediff-cli');
        }
        statusEl.innerHTML = statuses.map(s => `<div>${s}</div>`).join('');
      } catch (error) {
        statusEl.innerHTML = '<span style="color:var(--red)">✗ Error detectando flujos</span>';
      }
    }
  });
  document.getElementById('generate-video')?.addEventListener('click', async () => {
    // Plan multi-rol: el motor de render viene del rol configurado (cloud o local).
    const renderRole = state.apiSettings.roles?.videoRender ?? DEFAULT_ROLES.videoRender;
    const selected = renderRole.provider as VideoWorkflowKind;
    const promptText = globalThis.prompt('Escribe la descripción del video que deseas generar:');
    if (!promptText) return;
    
    const statusEl = document.getElementById('workflows-status');
    if (statusEl) {
      statusEl.innerHTML = '<span style="color:var(--yellow)">🎬 Enviando solicitud...</span>';
    }
    
    const qaEnabled = (document.getElementById('qa-enabled') as HTMLInputElement | null)?.checked ?? false;
    const qaRole = state.apiSettings.roles?.visualQA ?? DEFAULT_ROLES.visualQA;
    // El juez del helper es Gemini (video input nativo); si el rol apunta a GLM se usa el default.
    const qaModel = qaRole.provider === 'gemini' ? qaRole.model : 'gemini-3.8-flash';

    const result = await generateVideo({
      workflow: selected as VideoWorkflowKind,
      prompt: promptText,
      settings: { width: 768, height: 432, steps: 20 },
      model: renderRole.model,
      qa: { enabled: qaEnabled, provider: 'gemini', model: qaModel, maxAttempts: 3 },
    });

    if (!result.success) {
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:var(--red)">✗ Error: ${result.error}</span>`;
      }
      return;
    }

    // Polling para mostrar progreso
    if (statusEl) {
      statusEl.innerHTML = '';
    }
    
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      pollCount++;
      const progress = await getGenerationProgress();
      
      if (statusEl) {
        const barWidth = Math.round((progress.percent / 100) * 30);
        const bar = '█'.repeat(barWidth) + '░'.repeat(30 - barWidth);
        statusEl.innerHTML = `
          <div style="font-size:0.82rem">
            <div style="margin-bottom:8px">${progress.message || 'Generando...'}</div>
            ${progress.qaStatus && progress.qaStatus !== 'disabled' ? `<div style="margin-bottom:8px;font-size:0.78rem">${qaBadge(progress.qaStatus)} · intento ${progress.attempt ?? '?'}/${progress.maxAttempts ?? '?'}</div>` : ''}
            <div style="font-family:monospace;font-size:0.75rem;color:var(--primary)">[${bar}] ${progress.percent}%</div>
          </div>
        `;
      }
      
      if (!progress.active && progress.status === 'completed') {
        clearInterval(pollInterval);
        const qaLine = progress.qaStatus === 'approved'
          ? '<div style="color:var(--green)">✓ Aprobado por el Control de Calidad Visual</div>'
          : progress.qaStatus === 'rejected'
            ? `<div style="color:var(--yellow)">⚠ Conservado con observaciones: ${escapeAttr(progress.qaCriticism ?? '')}</div>`
            : progress.qaStatus === 'skipped'
              ? `<div style="color:var(--yellow)">⚠ Auditoría omitida: ${escapeAttr(progress.qaCriticism ?? '')}</div>`
              : '';
        if (statusEl) {
          statusEl.innerHTML = `
            <div style="color:var(--green)">✓ Video generado</div>
            ${qaLine}
            ${progress.outputPath ? `<div style="margin-top:8px"><a href="${escapeAttr(progress.outputPath)}" target="_blank" style="color:var(--primary)">📹 Ver video</a></div>` : ''}
          `;
        }
        // F4: persistir la trazabilidad del QA en la memoria del proyecto activo.
        const project = state.selectedProject;
        if (project && progress.qaStatus && progress.qaStatus !== 'disabled') {
          saveAgentMemory(project.id, 'VISUAL_QA', 'Supervisor de Calidad Visual IA', [
            `Prompt: ${promptText}`,
            `Intentos: ${progress.attempt ?? 1}/${progress.maxAttempts ?? 1}`,
            `Veredicto: ${progress.qaStatus}`,
            `Crítica: ${progress.qaCriticism || 'Ninguna'}`,
            progress.outputPath ? `Clip: ${progress.outputPath}` : '',
          ].filter(Boolean).join('\n'));
        }
      } else if (!progress.active && progress.status === 'error') {
        clearInterval(pollInterval);
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:var(--red)">✗ Error: ${progress.message}</span>`;
        }
      }
      
      if (pollCount > 300) {
        clearInterval(pollInterval);
        if (statusEl) {
          statusEl.innerHTML = '<span style="color:var(--yellow)">⏱️ Generación tomó demasiado tiempo</span>';
        }
      }
    }, 500);
  });
  document.getElementById('hf-save')?.addEventListener('click', async () => {
    const token = (document.getElementById('hf-token') as HTMLInputElement | null)?.value ?? '';
    if (token) {
      void saveHelperToken(token);
      const result = await validateHelperToken();
      const statusEl = document.getElementById('helper-status');
      if (statusEl) {
        if (result.valid) {
          statusEl.innerHTML = '<span style="color:var(--green)">✓ Token válido</span>';
        } else {
          statusEl.innerHTML = `<span style="color:var(--red)">✗ Token inválido: ${result.error}</span>`;
        }
      }
    }
  });
  document.getElementById('sync-helper')?.addEventListener('click', () => {
    void syncHelperInventory();
  });
  document.querySelectorAll<HTMLElement>('[data-download-model]').forEach((el) => {
    el.addEventListener('click', async () => {
      const modelId = el.dataset.downloadModel!;
      const model = VIDEO_MODEL_CATALOG.find((item) => item.id === modelId);
      if (!model || (model.requiresCredentials && !token)) return;

      const safeId = modelId.replace(/[^a-zA-Z0-9]/g, '-');
      const progressEl = document.getElementById(`dl-${safeId}`);
      if (progressEl) progressEl.style.display = 'block';

      void downloadHelperModel(model);

      // Poll download progress
      let ticks = 0;
      const iv = setInterval(async () => {
        ticks++;
        const allProg = await getDownloadProgress(modelId);
        const prog = allProg[modelId];
        if (!prog || !progressEl) { if (ticks > 10 && !prog) clearInterval(iv); return; }
        if (prog.status === 'downloading') {
          const bar = '█'.repeat(Math.round(prog.percent / 5)).padEnd(20, '░');
          const mb = (prog.bytesDownloaded / 1024 / 1024).toFixed(1);
          const total = prog.totalBytes > 0 ? `/${(prog.totalBytes / 1024 / 1024).toFixed(1)}` : '';
          progressEl.textContent = `[${bar}] ${prog.percent}% · ${mb}${total} MB`;
        } else if (prog.status === 'done') {
          clearInterval(iv);
          if (progressEl) progressEl.innerHTML = '<span style="color:var(--green)">✓ Descarga completa</span>';
        } else if (prog.status === 'error') {
          clearInterval(iv);
          if (progressEl) progressEl.innerHTML = '<span style="color:var(--red)">✗ Error en descarga</span>';
        }
        if (ticks > 1800) clearInterval(iv);
      }, 500);
    });
  });
}

function qaBadge(status: string): string {
  switch (status) {
    case 'approved': return '✅ QA aprobado';
    case 'rejected': return '❌ QA rechazado';
    case 'skipped': return '⚠️ QA omitido';
    default: return '🔍 QA en curso';
  }
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}
