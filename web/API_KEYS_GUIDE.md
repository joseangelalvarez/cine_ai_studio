# 🔑 Gestión de API Keys en Cine AI Studio – Web

## Cambiar Provider de IA en Tiempo Real

Una de las **características principales** de la versión web es la capacidad de cambiar entre 8 proveedores de IA **sin necesidad de reiniciar** la aplicación.

### Acceder al Panel de Configuración

Hay 3 formas de abrir el gestor de API keys:

1. **Desde la pantalla de inicio** (HOME):
   - Haz clic en la tarjeta **"🔑 Cambiar proveedor de IA"**

2. **Durante la creación de proyecto** (Paso 2):
   - Haz clic en el botón **"Cambiar"** en la tarjeta de proveedor actual

3. **Cualquier pantalla**: 
   - El panel se abrirá como modal superpuesto (overlay)

### Interfaz del Panel

```
╔═══════════════════════════════════════╗
║  🔑 Configurar proveedor de IA        ║
║  Selecciona el proveedor y pega key   ║
╚═══════════════════════════════════════╝

┌──────────────────────────────────────┐
│ [Google Gemini]    $0.075/1M          │  ← Click para cambiar
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ [Mistral AI] 🏆 Recomendado           │
│ Mejor relación precio-calidad         │
│ $0.14/1M tokens                       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ [OpenAI GPT-3.5]                      │
│ Ultra económico para scripts largos   │
│ $0.50/1M tokens                       │
└──────────────────────────────────────┘

      ... (5 proveedores más)

┌──────────────────────────────────────┐
│ API Key — Mistral AI                  │
│ [●●●●●●●●●●●●●●]  👁️ (toggle)       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Modelo                                │
│ [mistral-large-latest ▼]              │
└──────────────────────────────────────┘

☑ Modo backend seguro
  Simula llamadas a través de proxy

[🔌 Probar conexión]  [Guardar]
```

## Paso a Paso: Cambiar de Proveedor

### Ejemplo: De Google Gemini a Mistral AI

1. **Abre el panel** desde la pantalla de inicio
2. **Selecciona Mistral AI**:
   - Haz clic en la tarjeta de Mistral
   - La tarjeta se destaca (borde primario, fondo azulado)
3. **Pega tu API key**:
   - Ve a https://console.mistral.ai/
   - Crea cuenta (si no tienes) y obtén tu key
   - Copia la key completa
   - En el campo "API Key" pega:  `paste_your_key_here`
4. **Selecciona modelo** (opcional):
   - Por defecto: `mistral-large-latest`
   - Opciones: `mistral-medium-latest`, `mistral-small-latest`, `open-mistral-7b`
5. **Prueba la conexión**:
   - Haz clic **"🔌 Probar conexión"**
   - Espera unos segundos
   - Si dice ✓ "Conexión exitosa", ¡listo!
   - Si hay error ✗, revisa tu key o conexión a internet
6. **Guarda**:
   - Haz clic **"Guardar"**
   - El modal se cierra automáticamente
7. **¡Listo!** Los próximos proyectos usarán Mistral

### Cambiar Múltiples Veces en una Sesión

Puedes cambiar de proveedor entre proyectos sin problemas:

```
Proyecto 1: Usar Mistral (barato)
  └─ Generar preproducción
  
Proyecto 2: Cambiar a Claude (mejor calidad)
  └─ Abre panel, selecciona Claude, pega key
  └─ Generar preproducción con Claude
  
Proyecto 3: Volver a LocalAI (gratis)
  └─ Abre panel, selecciona LocalAI
  └─ (No necesita key, solo localhost:11434)
  └─ Generar preproducción local
```

## Proveedores Detallados

### 1️⃣ Google Gemini (Actual)

**URL**: https://ai.google.dev/  
**Key**: Obtén desde Google AI Studio (gratuito, 60 solicitudes/minuto)  
**Modelos**: `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`  
**Precio**: $0.075/1M tokens (Flash)

```
1. Ve a https://ai.google.dev/
2. Clic "Get API Key"
3. Copia el token
```

### 2️⃣ Mistral AI 🏆 RECOMENDADO

**URL**: https://console.mistral.ai/  
**Key**: Necesita tarjeta de crédito (crédito gratis inicial)  
**Modelos**: `mistral-large-latest`, `mistral-medium-latest`, `mistral-small-latest`  
**Precio**: $0.14/1M tokens (Large) — **La más económica**

```
1. Ve a https://console.mistral.ai/
2. Sign up
3. Dashboard → API Keys → Create New Key
4. Copia la key
```

### 3️⃣ OpenAI GPT-3.5

**URL**: https://platform.openai.com/  
**Key**: Necesita tarjeta de crédito  
**Modelos**: `gpt-3.5-turbo`, `gpt-4o-mini`, `gpt-4o`  
**Precio**: $0.50/1M tokens (GPT-3.5) — **Ultra barato**

```
1. Ve a https://platform.openai.com/
2. Login / Sign up
3. Settings → API Keys → Create New Secret Key
4. Copia la key
```

### 4️⃣ Anthropic Claude

**URL**: https://console.anthropic.com/  
**Key**: Necesita tarjeta de crédito  
**Modelos**: `claude-3-haiku`, `claude-3-5-sonnet`, `claude-3-opus`  
**Precio**: $0.25/1M tokens (Haiku)

```
1. Ve a https://console.anthropic.com/
2. Sign up con Google o email
3. Billing → API Keys → Create Key
4. Copia la key
```

### 5️⃣ Cohere

**URL**: https://cohere.ai/  
**Key**: Gratis (versión developer)  
**Modelos**: `command-r`, `command-r-plus`, `command-light`  
**Precio**: $0.50/1M tokens

```
1. Ve a https://cohere.ai/
2. Sign up
3. Dashboard → API Keys
4. Copia la key
```

### 6️⃣ HuggingFace Inference

**URL**: https://huggingface.co/  
**Key**: Token de usuario (libre, sin tarjeta)  
**Modelos**: Cientos disponibles (Mistral-7B, Falcon, Llama, etc.)  
**Precio**: $0.01–0.05 por 1K tokens (variable)

```
1. Ve a https://huggingface.co/
2. Sign up
3. Settings → Access Tokens → New Token
4. Copia el token
```

### 7️⃣ Perplexity AI

**URL**: https://www.perplexity.ai/  
**Key**: Requiere plan Pro ($20/mes) o API separada  
**Modelos**: `sonar`, `sonar-pro`, `sonar-reasoning`  
**Precio**: $0.20/1M tokens

```
1. Ve a https://perplexity.ai/
2. Sign up / Login
3. Settings → API → Create Key
4. Copia la key
```

### 8️⃣ LocalAI / Ollama 🎁 GRATIS

**URL**: https://ollama.ai/  
**Key**: **No necesita API Key**  
**Modelos**: Mistral, Llama3, Phi3, Gemma2, Qwen2 (locales)  
**Precio**: **GRATUITO** (corre en tu PC)

```
1. Descarga Ollama desde https://ollama.ai/
2. Instala (macOS, Windows, Linux)
3. Terminal: ollama pull mistral (o tu modelo favorito)
4. Terminal: ollama serve
5. En la app: Selecciona LocalAI
   (Sin API Key, funciona en localhost:11434)
```

**Ventajas de LocalAI**:
- ✅ Completamente gratis
- ✅ Funciona sin internet (después de descargar modelo)
- ✅ Sin límites de rate
- ✅ Privacidad total (todo en tu PC)
- ❌ Más lento que API cloud (depende de tu hardware)

## Gestión de Créditos Virtuales

Aunque no hay integración real de pagos, la app simula un sistema de créditos:

```
1. Comienza con 100 créditos
2. Cada proyecto consume ~10-20 créditos
3. Visualiza en la esquina superior derecha: 💰 80
4. Cuando llegues a 0, puedes seguir usando (es solo UI)
```

Para resetear créditos (desarrollo):
- Abre DevTools (F12) → Console
- `localStorage.setItem('cineai_credits', '100')`
- Recarga la página

## Modo "Backend Seguro"

El toggle **"Modo backend seguro"** en el panel simula un escenario de producción:

```
☑ Modo backend seguro

En PRODUCCIÓN (no implementado aquí):
- Las API keys se guardarían SOLO en el servidor
- El cliente nunca vería las keys
- Llamadas se harían a través de /api/ai-request
- Mayor seguridad, pero requiere backend Node.js

En DESARROLLO (actual):
- Las keys se guardan en localStorage (navegador)
- El cliente llama directamente a las APIs
- Más flexible para testing
```

## Tips & Mejores Prácticas

### 🛡️ Seguridad

- **Nunca** compartas tu API Key con nadie
- Limpia el navegador si usas PC pública
- En producción, usa backend seguro (ver `../DEPLOY.md`)
- Revoca keys compromet idas desde paneles de proveedores

### 💰 Ahorro de costos

1. **Empieza con LocalAI** si tu hardware lo permite (GRATIS)
2. **Prueba Mistral** para relación calidad/precio
3. **GPT-3.5** es ultra barato para scripts largos
4. **Cambia entre proveedores** según necesidad:
   - Narrativa → Mistral, Claude
   - Visual → Gemini, GPT-4o
   - Sonido → Cualquiera (no consume much)

### ⚡ Performance

- LocalAI es lento (15-30s por respuesta)
- APIs cloud son rápidas (2-5s)
- Los tiempos no incluyen latencia de generación (depende del proveedor)

---

**¿Necesitas ayuda?** Abre DevTools (F12) y revisa la consola para mensajes de error detallados.
