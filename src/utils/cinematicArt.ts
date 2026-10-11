// Client-side cinematic visual generators for Pitch Bible artwork and character/environment sheets

export function createCharacterArtSvg(title: string, artStyle: string, characterNotes?: string): string {
  const safeTitle = (title || 'PROTAGONISTA').replace(/[<>&"]/g, '');
  const safeStyle = (artStyle || 'Cinematográfico').replace(/[<>&"]/g, '');
  const safeNotes = (characterNotes || 'Diseño de personaje protagónico adaptado al estilo visual y dramático de la obra').substring(0, 100).replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
    <defs>
      <linearGradient id="charBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#040711" />
        <stop offset="40%" stop-color="#0b1329" />
        <stop offset="70%" stop-color="#181e36" />
        <stop offset="100%" stop-color="#02040a" />
      </linearGradient>
      <radialGradient id="rimLight" cx="30%" cy="25%" r="70%">
        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35" />
        <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="neonHud" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="silhouetteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="45%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#050814" />
      </linearGradient>
    </defs>
    <!-- Background -->
    <rect width="800" height="1000" fill="url(#charBg)" />
    <rect width="800" height="1000" fill="url(#rimLight)" />
    
    <!-- Framing Border & Grid -->
    <rect x="25" y="25" width="750" height="950" rx="12" fill="none" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="1.5" />
    <line x1="25" y1="80" x2="775" y2="80" stroke="#f59e0b" stroke-opacity="0.2" stroke-width="1" />
    <line x1="25" y1="910" x2="775" y2="910" stroke="#f59e0b" stroke-opacity="0.2" stroke-width="1" />

    <!-- Corner marks -->
    <path d="M 40 40 L 60 40 M 40 40 L 40 60" stroke="#06b6d4" stroke-width="2" fill="none" />
    <path d="M 760 40 L 740 40 M 760 40 L 760 60" stroke="#06b6d4" stroke-width="2" fill="none" />
    <path d="M 40 960 L 60 960 M 40 960 L 40 940" stroke="#06b6d4" stroke-width="2" fill="none" />
    <path d="M 760 960 L 740 960 M 760 960 L 760 940" stroke="#06b6d4" stroke-width="2" fill="none" />

    <!-- Top Badge -->
    <text x="50" y="58" fill="#f59e0b" font-family="monospace" font-size="14" font-weight="bold" letter-spacing="2">CHARACTER DESIGN SHEET • MASTER PROTAGONIST</text>
    <text x="750" y="58" fill="#06b6d4" font-family="monospace" font-size="12" text-anchor="end" letter-spacing="1">IP-ADAPTER FACEID LOCKED</text>

    <!-- Character Silhouette & Form -->
    <!-- Head / Hood / Visor outline -->
    <ellipse cx="400" cy="330" rx="90" ry="110" fill="url(#silhouetteGrad)" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.6" />
    <!-- Tactical Visor HUD -->
    <path d="M 330 310 Q 400 325 470 310 L 465 345 Q 400 365 335 345 Z" fill="#06b6d4" fill-opacity="0.3" stroke="#38bdf8" stroke-width="2" />
    <line x1="340" y1="327" x2="460" y2="327" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.8" />
    <!-- HUD readout overlay -->
    <circle cx="360" cy="327" r="4" fill="#f59e0b" />
    <circle cx="440" cy="327" r="4" fill="#10b981" />
    <!-- Facial contour / jaw -->
    <path d="M 345 370 Q 400 440 455 370" fill="none" stroke="#64748b" stroke-width="2" stroke-opacity="0.5" />

    <!-- Shoulders & Heavy Tactical Raincoat -->
    <path d="M 230 520 Q 330 460 400 455 Q 470 460 570 520 L 610 880 L 190 880 Z" fill="url(#silhouetteGrad)" stroke="#475569" stroke-width="2" />
    <!-- Harness and Straps -->
    <line x1="330" y1="465" x2="310" y2="880" stroke="#f59e0b" stroke-width="3" stroke-opacity="0.7" />
    <line x1="470" y1="465" x2="490" y2="880" stroke="#f59e0b" stroke-width="3" stroke-opacity="0.7" />
    <path d="M 315 620 L 485 620" stroke="#f59e0b" stroke-width="3" stroke-opacity="0.7" />
    <!-- Chest clip / badge -->
    <rect x="380" y="605" width="40" height="30" rx="4" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5" />

    <!-- Atmospheric Rain Particles -->
    <line x1="120" y1="120" x2="90" y2="280" stroke="#06b6d4" stroke-opacity="0.25" stroke-width="1" />
    <line x1="680" y1="160" x2="650" y2="320" stroke="#06b6d4" stroke-opacity="0.25" stroke-width="1" />
    <line x1="220" y1="240" x2="190" y2="400" stroke="#06b6d4" stroke-opacity="0.25" stroke-width="1" />
    <line x1="720" y1="440" x2="690" y2="600" stroke="#06b6d4" stroke-opacity="0.25" stroke-width="1" />

    <!-- Target Reticle & Consistency Markers -->
    <circle cx="400" cy="330" r="140" stroke="#06b6d4" stroke-dasharray="6 8" stroke-opacity="0.3" fill="none" />
    <text x="560" y="325" fill="#06b6d4" font-family="monospace" font-size="11">CRANIAL RATIO 1.42</text>
    <text x="560" y="342" fill="#94a3b8" font-family="monospace" font-size="10">JAW BONE: ANGULAR 88°</text>

    <!-- Bottom Info Panel -->
    <rect x="45" y="810" width="710" height="90" rx="8" fill="#050811" fill-opacity="0.85" stroke="#334155" stroke-width="1" />
    <text x="65" y="838" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">${safeTitle} • Ficha de Personaje</text>
    <text x="65" y="860" fill="#f59e0b" font-family="monospace" font-size="12">ESTILO: ${safeStyle} • ROL PRINCIPAL</text>
    <text x="65" y="882" fill="#94a3b8" font-family="sans-serif" font-size="11">${safeNotes}...</text>

    <!-- Footer -->
    <text x="50" y="938" fill="#64748b" font-family="monospace" font-size="11">CINE AI STUDIO • CHARACTER DESIGN DEPARTMENT • CAPA 2 VISUAL</text>
    <text x="750" y="938" fill="#10b981" font-family="monospace" font-size="11" text-anchor="end">● APPROVED FOR PRODUCTION</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createEnvironmentArtSvg(title: string, artStyle: string, locationNotes?: string): string {
  const safeTitle = (title || 'ENTORNO PRINCIPAL').replace(/[<>&"]/g, '');
  const safeStyle = (artStyle || 'Brutalismo').replace(/[<>&"]/g, '');
  const safeNotes = (locationNotes || 'Andamio suspendido a 120m de altura en torre de hormigón crudo con lluvia ácida').substring(0, 110).replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 680" width="100%" height="100%">
    <defs>
      <linearGradient id="envSky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#020409" />
        <stop offset="50%" stop-color="#091124" />
        <stop offset="85%" stop-color="#141c33" />
        <stop offset="100%" stop-color="#070c1a" />
      </linearGradient>
      <linearGradient id="towerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0a0f1d" />
        <stop offset="50%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#06b6d4" />
        <stop offset="100%" stop-color="#3b82f6" />
      </linearGradient>
      <radialGradient id="cityGlow" cx="50%" cy="85%" r="60%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
        <stop offset="40%" stop-color="#06b6d4" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <!-- Background sky & glow -->
    <rect width="1200" height="680" fill="url(#envSky)" />
    <rect width="1200" height="680" fill="url(#cityGlow)" />

    <!-- Brutalist Mega Structures in distance -->
    <rect x="80" y="240" width="110" height="440" fill="#070c1a" opacity="0.9" />
    <rect x="230" y="160" width="140" height="520" fill="#0b1329" opacity="0.85" />
    <rect x="780" y="140" width="160" height="540" fill="#0b1329" opacity="0.85" />
    <rect x="980" y="220" width="130" height="460" fill="#070c1a" opacity="0.9" />

    <!-- Massive Central Architectural Structure -->
    <polygon points="440,680 480,100 680,100 720,680" fill="url(#towerGrad)" stroke="#334155" stroke-width="1.5" />
    <!-- Architectural concrete ribs & joints -->
    <line x1="500" y1="200" x2="660" y2="200" stroke="#475569" stroke-width="2" />
    <line x1="490" y1="320" x2="670" y2="320" stroke="#475569" stroke-width="2" />
    <line x1="475" y1="440" x2="685" y2="440" stroke="#475569" stroke-width="2" />
    <line x1="460" y1="560" x2="700" y2="560" stroke="#475569" stroke-width="2" />

    <!-- Suspended Scaffolding & Catwalk at 120m -->
    <rect x="360" y="380" width="440" height="24" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
    <!-- Grated floor texture -->
    <line x1="380" y1="380" x2="380" y2="404" stroke="#64748b" stroke-width="1.5" />
    <line x1="420" y1="380" x2="420" y2="404" stroke="#64748b" stroke-width="1.5" />
    <line x1="460" y1="380" x2="460" y2="404" stroke="#64748b" stroke-width="1.5" />
    <line x1="500" y1="380" x2="500" y2="404" stroke="#64748b" stroke-width="1.5" />
    <line x1="540" y1="380" x2="540" y2="404" stroke="#64748b" stroke-width="1.5" />
    <line x1="580" y1="380" x2="580" y2="404" stroke="#64748b" stroke-width="1.5" />
    <line x1="620" y1="380" x2="620" y2="404" stroke="#64748b" stroke-width="1.5" />
    <line x1="660" y1="380" x2="660" y2="404" stroke="#64748b" stroke-width="1.5" />
    <line x1="700" y1="380" x2="700" y2="404" stroke="#64748b" stroke-width="1.5" />
    <line x1="740" y1="380" x2="740" y2="404" stroke="#64748b" stroke-width="1.5" />

    <!-- Hanging Cables to the Abyss -->
    <path d="M 400 404 Q 420 520 410 680" stroke="#f59e0b" stroke-width="2" fill="none" opacity="0.8" />
    <path d="M 720 404 Q 740 540 730 680" stroke="#06b6d4" stroke-width="2" fill="none" opacity="0.8" />
    <path d="M 490 100 L 370 380" stroke="#64748b" stroke-width="2.5" />
    <path d="M 670 100 L 790 380" stroke="#64748b" stroke-width="2.5" />

    <!-- Holographic Display Panel with neon emission -->
    <rect x="520" y="270" width="160" height="90" rx="4" fill="#06b6d4" fill-opacity="0.15" stroke="#06b6d4" stroke-width="2" />
    <line x1="535" y1="300" x2="665" y2="300" stroke="#38bdf8" stroke-width="2" />
    <line x1="535" y1="320" x2="640" y2="320" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 4" />
    <text x="600" y="345" fill="#f59e0b" font-family="monospace" font-size="11" text-anchor="middle">TRANSMISIÓN NIVEL 0</text>

    <!-- Acid Rain Streaks -->
    <line x1="180" y1="60" x2="140" y2="280" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="1" />
    <line x1="320" y1="120" x2="280" y2="360" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="1" />
    <line x1="840" y1="80" x2="800" y2="320" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="1" />
    <line x1="1020" y1="160" x2="980" y2="400" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="1" />

    <!-- HUD Overlay -->
    <rect x="35" y="30" width="1130" height="620" rx="10" fill="none" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="1" />
    <text x="60" y="65" fill="#f59e0b" font-family="monospace" font-size="14" font-weight="bold" letter-spacing="2">ENVIRONMENT BLUEPRINT • ESCENOGRAFÍA Y FONDOS</text>
    <text x="1140" y="65" fill="#06b6d4" font-family="monospace" font-size="12" text-anchor="end">ALTITUD +120M • CONDENSACIÓN 98%</text>

    <!-- Bottom Caption Bar -->
    <rect x="50" y="580" width="1100" height="55" rx="6" fill="#050811" fill-opacity="0.85" stroke="#334155" stroke-width="1" />
    <text x="70" y="605" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">${safeTitle} • Entorno Oficial</text>
    <text x="70" y="624" fill="#94a3b8" font-family="sans-serif" font-size="11">${safeNotes}...</text>
    <text x="1130" y="615" fill="#10b981" font-family="monospace" font-size="12" text-anchor="end">● SCENERY LOCKED</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
