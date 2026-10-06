# 🚀 Despliegue en Producción – Cine AI Studio Web

Guía para desplegar la versión web a producción con backend seguro (Node.js/Express).

## 🏗️ Arquitectura Recomendada

```
┌─────────────────┐
│  Browser (Web)  │ ← Cliente desplega en Vercel, Netlify, GitHub Pages
│  (Sin API keys) │   Las keys NUNCA se envían al cliente
└────────┬────────┘
         │ fetch(/api/ai-request)
         ↓
┌─────────────────┐
│  Backend (Node) │ ← Express.js en Heroku, Railway, DigitalOcean
│  (API Keys)     │   Guarda las keys en ENV variables
└─────────────────┘
         │
         ↓
    [ Mistral ]
    [ Gemini  ]  ← Proveedores de IA
    [ Claude  ]
```

## 📋 Fase 1: Preparar Cliente Web

### 1. Build para producción

```bash
cd web
npm run build
```

Esto crea carpeta `dist/` lista para servir.

### 2. Configurar variables de entorno

Crea archivo `.env.production` en `web/`:

```env
VITE_API_BASE_URL=https://api.cineai.tu-dominio.com
VITE_USE_SECURE_BACKEND=true
```

Actualiza `src/gateway.ts` para leer estas variables:

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.cineai.tu-dominio.com';
const USE_SECURE = import.meta.env.VITE_USE_SECURE_BACKEND === 'true';

if (USE_SECURE) {
  // Enviar calls a /api/ai-request en lugar de a APIs directas
}
```

### 3. Deploy web a Vercel (recomendado)

```bash
# 1. Instala CLI de Vercel
npm i -g vercel

# 2. Deploy desde carpeta web
cd web
vercel

# 3. Sigue instrucciones:
#    - Conecta GitHub
#    - Vercel auto-recompila en cada push
#    - Se sirve en https://cineai-web.vercel.app (o tu dominio)
```

## 📋 Fase 2: Backend Seguro (Express.js)

### 1. Estructura del proyecto

```
backend/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   └── ai.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── services/
│       └── providers.ts
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

### 2. `backend/package.json`

```json
{
  "name": "cine-ai-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.20",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.3.0"
  }
}
```

### 3. `backend/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRouter from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://cineai-web.vercel.app',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI endpoint
app.use('/api', aiRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### 4. `backend/src/routes/ai.ts`

```typescript
import express from 'express';
import { executeAIRequest } from '../services/providers.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

interface AIRequest {
  provider: string;
  model?: string;
  prompt: string;
  systemInstruction?: string;
}

router.post('/ai-request', authenticateUser, async (req: express.Request<{}, {}, AIRequest>, res) => {
  try {
    const { provider, model, prompt, systemInstruction } = req.body;
    const userId = (req as any).userId || 'anonymous';

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // Rate limiting por usuario (opcional)
    // await checkRateLimit(userId);

    const result = await executeAIRequest({
      provider,
      model,
      prompt,
      systemInstruction,
    });

    // Log para auditoría
    console.log(`[${new Date().toISOString()}] ${userId} → ${provider} (${result.estimatedCost} USD)`);

    res.json({
      text: result.text,
      estimatedCost: result.estimatedCost,
      latencyMs: result.latencyMs,
      provider,
    });
  } catch (error: any) {
    console.error('AI Request error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Error al procesar la solicitud de IA',
    });
  }
});

export default router;
```

### 5. `backend/src/services/providers.ts`

```typescript
import axios from 'axios';

export async function executeAIRequest(opts: {
  provider: string;
  model?: string;
  prompt: string;
  systemInstruction?: string;
}) {
  const start = performance.now();
  const provider = opts.provider || 'mistral';
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];

  if (!apiKey) {
    throw { status: 500, message: `API key not configured for ${provider}` };
  }

  let text: string;

  switch (provider.toLowerCase()) {
    case 'mistral':
      text = await callMistral(apiKey, opts.model || 'mistral-large-latest', opts);
      break;
    case 'gemini':
      text = await callGemini(apiKey, opts.model || 'gemini-2.0-flash', opts);
      break;
    case 'openai':
      text = await callOpenAI(apiKey, opts.model || 'gpt-3.5-turbo', opts);
      break;
    // ... más proveedores
    default:
      throw { status: 400, message: `Unknown provider: ${provider}` };
  }

  const latencyMs = performance.now() - start;
  const tokens = (opts.prompt.length + text.length) / 4;
  const costPerToken = provider === 'openai' ? 0.0000005 : 0.000000075;
  const estimatedCost = tokens * costPerToken;

  return { text, estimatedCost, latencyMs };
}

async function callMistral(apiKey: string, model: string, opts: any): Promise<string> {
  const res = await axios.post('https://api.mistral.ai/v1/chat/completions', {
    model,
    messages: [
      { role: 'system', content: opts.systemInstruction || '' },
      { role: 'user', content: opts.prompt },
    ],
  }, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return res.data.choices[0].message.content;
}

// ... implementar otros proveedores igual
```

### 6. `backend/.env`

```env
# Server
PORT=3001
FRONTEND_URL=https://cineai-web.vercel.app

# API Keys (NUNCA en git, solo en .env local y .env.production en hosting)
MISTRAL_API_KEY=tu_key_mistral
GEMINI_API_KEY=tu_key_gemini
OPENAI_API_KEY=tu_key_openai
CLAUDE_API_KEY=tu_key_claude
COHERE_API_KEY=tu_key_cohere
HUGGINGFACE_API_KEY=tu_key_hf
PERPLEXITY_API_KEY=tu_key_perplexity

# Auth (si usas)
JWT_SECRET=tu_secret_jwt_random
```

### 7. Deploy backend a Railway (recomendado)

```bash
# 1. Ve a https://railway.app/
# 2. Conecta GitHub
# 3. Selecciona este repo
# 4. Add Environment Variables:
#    - MISTRAL_API_KEY=...
#    - GEMINI_API_KEY=...
#    - etc.
# 5. Railway auto-deploya en cada push
# 6. Obtén URL: https://cineai-backend.railway.app

# Actualiza frontend .env.production:
VITE_API_BASE_URL=https://cineai-backend.railway.app
```

## 🛡️ Fase 3: Seguridad

### CORS (Cross-Origin Resource Sharing)

```typescript
app.use(cors({
  origin: 'https://cineai-web.vercel.app',  // Solo tu dominio
  credentials: true,
  methods: ['POST'],
}));
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                   // 100 solicitudes por IP
});

app.use('/api/', limiter);
```

### Auditoría

```typescript
// Log todas las llamadas de IA
console.log(`[${timestamp}] ${userId} → ${provider} (${cost} USD)`);

// Alertas si alguien abuza
if (cost > 100) {
  sendAlert(`High cost request: $${cost}`);
}
```

## 🔍 Monitoreo

### Error tracking (Sentry)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());
```

### Logs (Winston)

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

logger.info(`AI request from ${userId}: $${cost}`);
```

## 🧪 Testing

```bash
# Test local
curl -X POST http://localhost:3001/api/ai-request \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "mistral",
    "prompt": "Hola",
    "systemInstruction": "Eres un asistente cinematográfico"
  }'

# Response esperada:
# {
#   "text": "Hola! Soy tu asistente...",
#   "estimatedCost": 0.0002,
#   "latencyMs": 1234,
#   "provider": "mistral"
# }
```

## 📚 Variables de Entorno Completas

### Cliente (web/.env.production)
```env
VITE_API_BASE_URL=https://api.cineai.com
VITE_USE_SECURE_BACKEND=true
```

### Servidor (backend/.env)
```env
PORT=3001
FRONTEND_URL=https://cineai.vercel.app
NODE_ENV=production

MISTRAL_API_KEY=...
GEMINI_API_KEY=...
OPENAI_API_KEY=...
CLAUDE_API_KEY=...
COHERE_API_KEY=...
HUGGINGFACE_API_KEY=...
PERPLEXITY_API_KEY=...

JWT_SECRET=...
SENTRY_DSN=...
```

## 🎯 Checklist de Deployment

- [ ] `npm run build` en `web/` compila sin errores
- [ ] Backend Express implementado
- [ ] Variables de entorno configuradas en hosting
- [ ] CORS restringido a dominio frontend
- [ ] Rate limiting activo
- [ ] Logging/monitoring configurado
- [ ] HTTPS habilitado (automático en Vercel/Railway)
- [ ] API keys rotadas si fueron expuestas
- [ ] Test de punta a punta funciona
- [ ] Documentación actualizada

## 🔗 Hosts Recomendados

| Componente | Host | Plan | Precio |
|-----------|------|------|--------|
| Frontend Web | Vercel | Hobby | **Gratis** |
| Backend API | Railway | Starter | ~$5/mes |
| Base de datos | Supabase | Free | **Gratis** (para histórico de proyectos) |
| Logs | Sentry | Free | **Gratis** |

---

**Total costo mensual**: ~$5 (ajustable según uso)

Para soporte: abre issue en GitHub o contacta al equipo.
