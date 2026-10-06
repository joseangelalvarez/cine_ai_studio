// ─── Configurador multi-rol (Plan multi-rol) ──────────────────────────────────
// Modal con pestañas por rol: 🧠 Orquestadores · 🎬 Video · 👤 Personajes · 🔍 QA
// Las API keys se gestionan POR PROVEEDOR (una key de Gemini sirve para
// orquestador + Veo + Nano Banana + QA).

import { state, setRoleAssignments, setApiKey, updateApiSettings, setHuggingFaceToken } from '../store';
import { API_PROVIDERS, VIDEO_RENDER_PROVIDERS, CHARACTER_RENDER_PROVIDERS, QA_JUDGE_PROVIDERS, DEFAULT_ROLES } from '../constants';
import { SUBAGENTS, getSubagentTier } from '../subagents';
import type { ApiProvider, RoleConfig, RoleAssignment } from '../types';
import { listAvailableModels } from '../gateway';

export function showApiKeyModal() {
  const existing = document.getElementById('api-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'api-modal-overlay';
  overlay.className = 'overlay';
  overlay.innerHTML = buildRoleModal();
  document.body.appendChild(overlay);
  bindRoleModal(overlay);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assignmentValue(a: RoleAssignment | undefined, fallback: RoleAssignment): string {
  const chosen = a ?? fallback;
  return `${chosen.provider}||${chosen.model}`;
}

function parseAssignment(value: string): RoleAssignment | null {
  const idx = value.indexOf('||');
  if (idx <= 0) return null;
  return { provider: value.slice(0, idx), model: value.slice(idx + 2) };
}

function textProviderOptions(selected: string): string {
  return API_PROVIDERS
    .flatMap((p) => p.models.map((m) => ({ id: `${p.id}||${m}`, label: `${p.name} · ${m}` })))
    .map((o) => `<option value="${o.id}" ${o.id === selected ? 'selected' : ''}>${o.label}</option>`)
    .join('');
}

interface RoleCatalogEntry { id: string; name: string; models: string[]; priceInfo?: string }

function renderProviderOptions(selected: string, catalog: RoleCatalogEntry[]): string {
  const opts: { id: string; label: string }[] = [];
  for (const prov of catalog) {
    for (const m of prov.models) {
      opts.push({ id: `${prov.id}||${m}`, label: `${prov.name} · ${m}` });
    }
  }
  return opts.map((o) => `<option value="${o.id}" ${o.id === selected ? 'selected' : ''}>${o.label}</option>`).join('');
}

function keyRow(providerId: string, name: string, hint: string): string {
  const current = (state.apiSettings.apiKeys as Record<string, string | undefined>)[providerId] ?? '';
  return `
  <div class="input-group">
    <label>API Key — ${name} <span class="text-xs text-muted">(${hint})</span></label>
    <input class="input" id="key-${providerId}" type="password" placeholder="Pega tu key aquí..." value="">
    ${current ? '<div class="text-xs" style="color:var(--green);margin-top:4px">● Key guardada</div>' : ''}
  </div>`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function buildRoleModal(): string {
  const roles = state.apiSettings.roles ?? DEFAULT_ROLES;
  const videoSel = assignmentValue(state.apiSettings.roles?.videoRender, DEFAULT_ROLES.videoRender);
  const charSel = assignmentValue(state.apiSettings.roles?.characterRender, DEFAULT_ROLES.characterRender);
  const qaSel = assignmentValue(state.apiSettings.roles?.visualQA, DEFAULT_ROLES.visualQA);

  return `
<div class="modal slide-up" style="max-width:680px">
  <div class="row-between" style="margin-bottom:16px">
    <div>
      <div class="modal-title">🎛️ Configurador de producción</div>
      <p class="text-sm">Elige el modelo de IA para cada parte de la producción.</p>
    </div>
    <button class="btn btn-ghost btn-icon" id="api-modal-close">✕</button>
  </div>

  <div class="row gap-8" style="margin-bottom:16px" id="role-tabs">
    <button class="btn btn-outline btn-sm role-tab active" data-tab="orchestrator" style="flex:1">🧠 Orquestadores</button>
    <button class="btn btn-outline btn-sm role-tab" data-tab="video" style="flex:1">🎬 Video</button>
    <button class="btn btn-outline btn-sm role-tab" data-tab="characters" style="flex:1">👤 Personajes</button>
    <button class="btn btn-outline btn-sm role-tab" data-tab="qa" style="flex:1">🔍 QA</button>
  </div>

  <div data-panel="orchestrator" class="role-panel">
    <p class="text-xs text-muted" style="margin-bottom:12px">Cada subagente usa el modelo de su tier: creativos pesados → <strong>premium</strong>; documentos → <strong>económico</strong>. Fallback automático entre proveedores con key.</p>
    <div class="col gap-12">
      <div class="input-group">
        <label>🔶 Premium — Showrunner · Guionista · Script Doctor</label>
        <select class="select" id="role-tier-premium">${textProviderOptions(assignmentValue(roles.orchestrator.premium, DEFAULT_ROLES.orchestrator.premium))}</select>
      </div>
      <div class="input-group">
        <label>⚪ Estándar — Arte · Storyboard · Sonido · Edición…</label>
        <select class="select" id="role-tier-standard">${textProviderOptions(assignmentValue(roles.orchestrator.standard, DEFAULT_ROLES.orchestrator.standard))}</select>
      </div>
      <div class="input-group">
        <label>🟢 Económico — Producción · QA doc · Marketing</label>
        <select class="select" id="role-tier-economy">${textProviderOptions(assignmentValue(roles.orchestrator.economy, DEFAULT_ROLES.orchestrator.economy))}</select>
      </div>
    </div>
    <details style="margin-top:14px">
      <summary class="text-sm" style="cursor:pointer">⚙️ Personalizar agentes individuales (${SUBAGENTS.length})</summary>
      <div class="col gap-8" style="margin-top:10px;max-height:240px;overflow-y:auto;padding-right:6px">
        ${SUBAGENTS.map((agent) => {
          const tier = getSubagentTier(agent.key);
          const override = state.apiSettings.roleOverrides?.[agent.key];
          const current = override ? `${override.provider}||${override.model}` : '';
          return `
          <div class="row gap-8" style="align-items:center">
            <span class="text-xs" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${agent.name}">${agent.name} <span class="text-muted">(${tier})</span></span>
            <select class="select" id="ov-${agent.key}" data-override="${agent.key}" style="flex:1.4;min-width:0">
              <option value="">— Hereda (${tier}) —</option>
              ${textProviderOptions(current)}
            </select>
          </div>`;
        }).join('')}
      </div>
    </details>
  </div>

  <div data-panel="video" class="role-panel" style="display:none">
    <p class="text-xs text-muted" style="margin-bottom:12px">Motor que renderiza las tomas. Los motores en la nube requieren la key indicada; los locales corren en tu equipo.</p>
    <div class="input-group">
      <label>🎬 Motor de render de video</label>
      <select class="select" id="role-video">${renderProviderOptions(videoSel, VIDEO_RENDER_PROVIDERS)}</select>
    </div>
    ${VIDEO_RENDER_PROVIDERS.map((p) => `<div class="text-xs text-muted" data-video-info="${p.id}" style="display:none;margin-top:6px">${p.name}: ${p.description} · <strong>${p.priceInfo}</strong>${p.keyProvider ? ` · requiere key de ${p.keyProvider}` : ' · sin key'}</div>`).join('')}
    <div class="input-group" id="video-custom-wrap" style="display:none;margin-top:10px">
      <label>ID de modelo personalizado (Omni Flash — usa «Descubrir modelos»)</label>
      <input class="input" id="role-video-custom" type="text" placeholder="p. ej. gemini-omni-flash-..." value="">
    </div>
  </div>

  <div data-panel="characters" class="role-panel" style="display:none">
    <p class="text-xs text-muted" style="margin-bottom:12px">Motor que genera las imágenes de personajes (agentes de la Capa 2 · Visual).</p>
    <div class="input-group">
      <label>👤 Motor de render de personajes</label>
      <select class="select" id="role-character">${renderProviderOptions(charSel, CHARACTER_RENDER_PROVIDERS)}</select>
    </div>
    ${CHARACTER_RENDER_PROVIDERS.map((p) => `<div class="text-xs text-muted" data-char-info="${p.id}" style="display:none;margin-top:6px">${p.name}: ${p.description} · <strong>${p.priceInfo}</strong></div>`).join('')}
    <div class="row" style="margin-top:12px">
      <button class="btn btn-outline btn-sm" id="char-test-btn">🎨 Probar generación de imagen</button>
    </div>
    <div id="char-test-result" style="margin-top:10px;font-size:0.82rem"></div>
  </div>

  <div data-panel="qa" class="role-panel" style="display:none">
    <p class="text-xs text-muted" style="margin-bottom:12px">Juez multimodal que audita los clips (debe aceptar video o imágenes). Gemini analiza el MP4 completo; GLM-5.3-Flash usa frames.</p>
    <div class="input-group">
      <label>🔍 Juez de Control de Calidad Visual</label>
      <select class="select" id="role-qa">${renderProviderOptions(qaSel, QA_JUDGE_PROVIDERS)}</select>
    </div>
  </div>

  <hr class="divider">

  <div class="fw-bold text-sm" style="margin-bottom:10px">🔑 API Key de Google (sirve para orquestadores, Veo, Nano Banana y QA)</div>
  <div class="col gap-12">
    ${keyRow('gemini', 'Google Gemini', 'orquestadores · Veo · Nano Banana · QA visual')}
    <div class="input-group">
      <label>Token Hugging Face <span class="text-xs text-muted">(descargas Wan/LTX)</span></label>
      <input class="input" id="hf-token-input" type="password" placeholder="hf_..." value="">
    </div>
  </div>
  <div class="row" style="margin-top:10px">
    <button class="btn btn-outline btn-sm" id="discover-models-btn">🔎 Descubrir modelos Gemini (IDs reales)</button>
  </div>
  <div id="discover-result" style="margin-top:10px;font-size:0.78rem;max-height:160px;overflow-y:auto"></div>

  <div class="row gap-16" style="margin-top:16px">
    <label class="toggle-wrap text-sm">
      <span class="toggle">
        <input type="checkbox" id="secure-toggle" ${state.apiSettings.useSecureBackend ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </span>
      <div>
        <div class="fw-bold text-sm">Modo backend seguro</div>
        <div class="text-xs text-muted">Llamadas vía proxy (sin exponer keys al cliente)</div>
      </div>
    </label>
  </div>

  <hr class="divider">

  <div class="row" style="justify-content:flex-end;gap:10px">
    <button class="btn btn-outline" id="api-test-btn">🔌 Probar conexión (estándar)</button>
    <button class="btn btn-primary" id="api-save-btn">Guardar</button>
  </div>
  <div id="api-test-result" style="margin-top:12px;font-size:0.82rem;text-align:center"></div>
</div>`;
}

// ─── Bind ─────────────────────────────────────────────────────────────────────

function selectValue(id: string): string {
  return (document.getElementById(id) as HTMLSelectElement | null)?.value ?? '';
}

function inputValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
}

function bindRoleModal(overlay: HTMLElement) {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.getElementById('api-modal-close')?.addEventListener('click', () => overlay.remove());

  // Tabs
  overlay.querySelectorAll<HTMLElement>('.role-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll<HTMLElement>('.role-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      overlay.querySelectorAll<HTMLElement>('.role-panel').forEach((panel) => {
        panel.style.display = panel.dataset.panel === name ? '' : 'none';
      });
    });
  });

  // Info dinámica del motor de video + input custom para omni-flash
  const videoSelect = document.getElementById('role-video') as HTMLSelectElement | null;
  const refreshVideoInfo = () => {
    if (!videoSelect) return;
    const chosen = parseAssignment(videoSelect.value);
    overlay.querySelectorAll<HTMLElement>('[data-video-info]').forEach((el) => {
      el.style.display = el.dataset.videoInfo === chosen?.provider ? '' : 'none';
    });
    const customWrap = document.getElementById('video-custom-wrap');
    if (customWrap) customWrap.style.display = chosen?.provider === 'omni-flash' ? '' : 'none';
  };
  videoSelect?.addEventListener('change', refreshVideoInfo);
  refreshVideoInfo();

  const charSelect = document.getElementById('role-character') as HTMLSelectElement | null;
  const refreshCharInfo = () => {
    if (!charSelect) return;
    const chosen = parseAssignment(charSelect.value);
    overlay.querySelectorAll<HTMLElement>('[data-char-info]').forEach((el) => {
      el.style.display = el.dataset.charInfo === chosen?.provider ? '' : 'none';
    });
  };
  charSelect?.addEventListener('change', refreshCharInfo);
  refreshCharInfo();

  // Descubridor de modelos Gemini (IDs reales con tu key — anti-404)
  document.getElementById('discover-models-btn')?.addEventListener('click', async () => {
    const resultEl = document.getElementById('discover-result')!;
    const key = inputValue('key-gemini') || (state.apiSettings.apiKeys as Record<string, string | undefined>).gemini || '';
    if (!key) {
      resultEl.innerHTML = '<span style="color:var(--red)">✗ Pega primero tu API key de Gemini</span>';
      return;
    }
    resultEl.innerHTML = '<span class="spinner" style="display:inline-block"></span> Consultando...';
    try {
      const models = await listAvailableModels(key);
      const interesting = models.filter((m) => /veo|video|image|flash|banana|astra/i.test(m));
      resultEl.innerHTML = interesting.length
        ? `<div class="text-xs" style="margin-bottom:6px">Modelos relevantes disponibles (${interesting.length}):</div>` +
          interesting.map((m) => `<div style="font-family:monospace;font-size:0.72rem;padding:2px 0">${m}</div>`).join('')
        : `<div class="text-xs text-muted">Sin modelos de video/imagen con esta key (total: ${models.length})</div>`;
      const omni = models.find((m) => /omni.*flash|astra/i.test(m));
      const customInput = document.getElementById('role-video-custom') as HTMLInputElement | null;
      if (omni && customInput && !customInput.value) customInput.value = omni;
    } catch (err: unknown) {
      resultEl.innerHTML = `<span style="color:var(--red)">✗ ${err instanceof Error ? err.message : String(err)}</span>`;
    }
  });

  // Prueba de generación de personaje (helper local + motor en la nube)
  document.getElementById('char-test-btn')?.addEventListener('click', async () => {
    const resultEl = document.getElementById('char-test-result')!;
    const chosen = parseAssignment(selectValue('role-character'));
    if (!chosen) return;
    resultEl.innerHTML = '<span class="spinner" style="display:inline-block"></span> Generando imagen de prueba...';
    try {
      const res = await fetch('http://127.0.0.1:8787/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Cinematic character concept portrait, dramatic rim lighting, neutral background, film grain, high detail face',
          provider: chosen.provider,
          model: chosen.model,
        }),
      });
      const data = await res.json() as { ok?: boolean; imageUrl?: string; error?: string };
      if (data.ok && data.imageUrl) {
        resultEl.innerHTML = `<img src="${data.imageUrl}" alt="personaje" style="max-width:100%;border-radius:12px;border:1px solid var(--border)">`;
      } else {
        resultEl.innerHTML = `<span style="color:var(--red)">✗ ${data.error ?? 'Error desconocido'}</span>`;
      }
    } catch (err: unknown) {
      resultEl.innerHTML = `<span style="color:var(--red)">✗ Helper no disponible (npm run video:helper) — ${err instanceof Error ? err.message : String(err)}</span>`;
    }
  });

  // Guardar asignaciones por rol + keys
  document.getElementById('api-save-btn')?.addEventListener('click', () => {
    const premium = parseAssignment(selectValue('role-tier-premium')) ?? DEFAULT_ROLES.orchestrator.premium;
    const standard = parseAssignment(selectValue('role-tier-standard')) ?? DEFAULT_ROLES.orchestrator.standard;
    const economy = parseAssignment(selectValue('role-tier-economy')) ?? DEFAULT_ROLES.orchestrator.economy;

    const videoParsed = parseAssignment(selectValue('role-video'));
    const videoCustom = inputValue('role-video-custom').trim();
    const videoRender = videoParsed?.provider === 'omni-flash' && videoCustom
      ? { provider: 'omni-flash', model: videoCustom }
      : (videoParsed ?? DEFAULT_ROLES.videoRender);

    const characterRender = parseAssignment(selectValue('role-character')) ?? DEFAULT_ROLES.characterRender;
    const visualQA = parseAssignment(selectValue('role-qa')) ?? DEFAULT_ROLES.visualQA;

    const roles: RoleConfig = { orchestrator: { premium, standard, economy }, videoRender, characterRender, visualQA };

    const roleOverrides: Partial<Record<string, RoleAssignment>> = {};
    overlay.querySelectorAll<HTMLSelectElement>('[data-override]').forEach((sel) => {
      const assignment = parseAssignment(sel.value);
      if (assignment) roleOverrides[sel.dataset.override!] = assignment;
    });

    // Key de Google (solo se sobreescribe si el usuario la rellenó)
    for (const providerId of ['gemini']) {
      const key = inputValue(`key-${providerId}`).trim();
      if (key) setApiKey(providerId as ApiProvider, key);
    }
    const hfToken = inputValue('hf-token-input').trim();
    if (hfToken) setHuggingFaceToken(hfToken);
    updateApiSettings({ useSecureBackend: (document.getElementById('secure-toggle') as HTMLInputElement | null)?.checked ?? false });

    setRoleAssignments(roles, roleOverrides);
    overlay.remove();
  });

  // Probar conexión con el modelo estándar del rol orquestador
  document.getElementById('api-test-btn')?.addEventListener('click', async () => {
    const resultEl = document.getElementById('api-test-result')!;
    const standard = parseAssignment(selectValue('role-tier-standard')) ?? DEFAULT_ROLES.orchestrator.standard;
    const geminiKey = inputValue('key-gemini').trim();
    const settings = {
      ...state.apiSettings,
      selectedProvider: standard.provider as ApiProvider,
      selectedModels: { ...state.apiSettings.selectedModels, [standard.provider]: standard.model },
      apiKeys: geminiKey ? { ...state.apiSettings.apiKeys, gemini: geminiKey } : state.apiSettings.apiKeys,
    };
    resultEl.innerHTML = '<span class="spinner" style="display:inline-block"></span> Probando...';
    try {
      const { testConnection } = await import('../gateway');
      const result = await testConnection(settings);
      resultEl.innerHTML = `<span style="color:var(--green)">✓ Conexión exitosa: "${result.slice(0, 60)}"</span>`;
    } catch (err: unknown) {
      resultEl.innerHTML = `<span style="color:var(--red)">✗ ${err instanceof Error ? err.message : String(err)}</span>`;
    }
  });
}
