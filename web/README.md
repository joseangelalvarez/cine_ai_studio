# 🎬 Cine AI Studio – Versión Web App

Versión web de **Cine AI Studio**, replicando el flujo y diseño de la app Android original, con **soporte para 8 proveedores de IA** alternativos a Google Gemini, permitiendo cambiar de proveedor en tiempo real.

## ✨ Características Principales

- **🎨 Diseño idéntico al Android**: Tema oscuro inmersivo, colores cinematográficos
- **🔄 Gestión flexible de APIs**: Cambiar entre 8 proveedores sin reiniciar
- **🚀 Preproducción cinematográfica automatizada**: 24 subagentes IA especializados
- **💾 Almacenamiento local**: Proyectos, memorias y preferencias en IndexedDB/localStorage
- **⚡ Sin dependencias complejas**: Vanilla TypeScript + Vite (solo 15KB gzipped)

## 🤖 Proveedores de IA Soportados

| Proveedor | Precio | Ventajas | Estado |
|-----------|--------|----------|--------|
| **Google Gemini** | $0.075/1M | Modelo actual, buena calidad | ✓ |
| **Mistral AI** | $0.14/1M | 🏆 **Mejor relación** | ✓ |
| **OpenAI GPT-3.5** | $0.50/1M | Ultra económico | ✓ |
| **Anthropic Claude** | $0.25/1M | Alta calidad | ✓ |
| **Cohere** | $0.50/1M | Bueno para narrativa | ✓ |
| **HuggingFace Inference** | $0.01–0.05/1K | Flexible, open-source | ✓ |
| **Perplexity AI** | $0.20/1M | Con búsqueda integrada | ✓ |
| **LocalAI / Ollama** | **GRATIS** 🎁 | Corre localmente sin costos | ✓ |

## 🚀 Instalación & Setup

### Requisitos
- Node.js 18+ (instala desde https://nodejs.org/)

### Pasos

1. **Abre una terminal** en `c:\Users\tu_usuario\Desktop\Cine_ai`

2. **Navega a la carpeta web**:
   ```bash
   cd web
   ```

3. **Instala dependencias** (ya hecho, pero por si acaso):
   ```bash
   npm install
   ```

4. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

5. **Abre en el navegador**: http://localhost:5173

## 📖 Flujo de Uso

### Pantalla de Inicio
- **Crear nuevo proyecto**: Abre un wizard de 2 pasos
  - Paso 1: Título, duración, estilo artístico
  - Paso 2: Sinopsis / idea base
- **Abrir existente**: Accede a tus proyectos guardados
- **🔑 Cambiar proveedor IA**: Selecciona provider, pega API key, ¡listo!

### Durante la Generación
- Observa en tiempo real cómo los 5 subagentes de preproducción (capas 0-2) trabajan
- Haz clic en agentes completados para ver su contenido
- Cancela o reintenta en cualquier momento

### Gestión de Proyectos
- **Ver proyecto**: Consulta todos los entregables por capa
- **Re-generar agente**: Vuelve a ejecutar un subagente específico
- **Editar contenido**: Modifica manualmente los entregables
- **Eliminar**: Borra proyectos completos

## 🔑 Configuración de API Keys

### Opción 1: LocalAI (Gratis, sin internet)

1. **Instala Ollama** desde https://ollama.ai
2. **Descarga un modelo** (Mistral es buena opción):
   ```bash
   ollama pull mistral
   ollama serve
   ```
3. **En la app**: 
   - Selecciona "LocalAI / Ollama"
   - No necesita API key
   - Asegúrate que Ollama corre en localhost:11434

### Opción 2: Mistral AI (Recomendado, $0.14/1M tokens)

1. Ve a https://console.mistral.ai/
2. Crea cuenta y obtén tu API key
3. En la app:
   - Selecciona "Mistral AI"
   - Pega tu API key
   - Elige modelo (default: `mistral-large-latest`)
   - Click "Probar conexión"

### Opción 3: Cualquier otro proveedor

Sigue pasos similares según el proveedor elegido. Todos tienen paneles de API similares.

## 📁 Estructura de Archivos

```
web/
├── src/
│   ├── main.ts              # Enrutador principal
│   ├── store.ts             # Estado global (Zustand-like)
│   ├── gateway.ts           # Llamadas unificadas a APIs
│   ├── storage.ts           # localStorage/IndexedDB
│   ├── types.ts             # Tipos TypeScript
│   ├── constants.ts         # Proveedores, opciones de UI
│   ├── subagents.ts         # Catálogo de 24 subagentes
│   ├── style.css            # Tema oscuro cinematográfico
│   └── screens/
│       ├── home.ts          # Home, wizard, modal de API
│       ├── progress.ts      # Pantalla de generación
│       └── project.ts       # Detalles de proyecto, editor
├── index.html               # HTML raíz
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Personalización

### Cambiar paleta de colores
Edita las variables CSS en `src/style.css`:
```css
:root {
  --primary: #D0BCFF;       /* Lavanda */
  --bg-dark: #0F1113;       /* Fondo oscuro */
  --yellow: #FBBF24;        /* Créditos */
  /* ... más variables */
}
```

### Agregar nuevos proveedores de IA
1. Edita `src/constants.ts` → agregar entrada en `API_PROVIDERS`
2. Implementa función de llamada en `src/gateway.ts`
3. El resto funciona automáticamente

### Modificar flujo de subagentes
- Edita `src/subagents.ts` para cambiar catálogo de 24 agentes
- Cambia condición en `src/store.ts` línea `const subagentsToRun = SUBAGENTS.filter((a) => a.layerId <= 2);` para ejecutar más/menos capas

## 🐛 Troubleshooting

### "API Key Error: Por favor, configura..."
- Abre el panel 🔑 desde la pantalla de inicio
- Asegúrate de pegar tu key correctamente (sin espacios)
- Haz click "Probar conexión" para validar

### "Network Error"
- Verifica conexión a internet
- Si usas LocalAI: `ollama serve` debe estar corriendo en otra terminal
- Revisa la consola del navegador (F12) para detalles

### Proyectos no se guardan
- Habilita localStorage en el navegador (no está bloqueado)
- En navegación privada/incógnito, los datos se pierden

### La app va lenta
- Cierra tabs otras apps pesadas
- Vite corre en localhost, no es un servidor de producción
- Para producción: `npm run build` crea `/dist/` optimizado

## 📝 Licencia

Mismo repositorio que la app Android: [Ver LICENSE](../LICENSE)

## 🔗 Recursos

- **Vite**: https://vite.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Ollama**: https://ollama.ai/
- **Mistral API**: https://console.mistral.ai/

---

**¡Disfruta creando películas con IA!** 🎬✨
