package com.example.data.model

data class CinemaSubagent(
    val key: String,
    val name: String,
    val role: String,
    val layer: String,
    val layerId: Int,
    val duties: List<String>,
    val inputDescription: String,
    val outputDescription: String,
    val suggestedPrompt: String,
    val iconName: String
)

object CinemaSubagentsCatalog {
    val layers = listOf(
        "Capa 0 – Orquestador General",
        "Capa 1 – Narrativa",
        "Capa 2 – Visual",
        "Capa 3 – Animación y VFX",
        "Capa 4 – Sonido",
        "Capa 5 – Postproducción",
        "Capa 6 – Producción y Control"
    )

    val list: List<CinemaSubagent> = listOf(
        // Capa 0
        CinemaSubagent(
            key = "SHOWRUNNER",
            name = "Director Ejecutivo / Showrunner IA",
            role = "Director + Productor ejecutivo",
            layer = layers[0],
            layerId = 0,
            duties = listOf(
                "Recibe el brief de la producción cinematográfica.",
                "Define la biblia del proyecto (tono, dirección de estilo, target de audiencia).",
                "Coordina a todos los demás subagentes bajo contratos unificados.",
                "Decide cuándo un guion, toma o escena reúne los estándares estéticos."
            ),
            inputDescription = "Sinopsis de base, presupuesto, género literario, duración estimada, formato.",
            outputDescription = "Project Bible unificado + Plan de producción estratégico.",
            suggestedPrompt = "Genera el Project Bible para una miniserie de ciencia ficción ambientada en una megaciudad brutalista. El tono debe ser sombrío, reflexivo y de ritmo pausado, dirigida a público adulto.",
            iconName = "stars"
        ),

        // Capa 1
        CinemaSubagent(
            key = "GUIONISTA",
            name = "Guionista Principal",
            role = "Guionista de Cine",
            layer = layers[1],
            layerId = 1,
            duties = listOf(
                "Genera sinopsis extendida, tratamiento, escaleta técnica y guion literario.",
                "Escribe y estructura los diálogos y las acotaciones.",
                "Maneja el versionado de guion en base a notas de producción."
            ),
            inputDescription = "Project Bible, notas del Showrunner, esquema de personajes.",
            outputDescription = "Guion Literario (Escenas estructuradas con diálogos).",
            suggestedPrompt = "Basado en la biblia brutalista, escribe la primera escena del guion. Presenta a un operario de mantenimiento de paneles holográficos en la cima de una torre inclinada, en una conversación tensa con control.",
            iconName = "description"
        ),
        CinemaSubagent(
            key = "SCRIPT_DOCTOR",
            name = "Script Doctor",
            role = "Asesor y Pulidor de Guion",
            layer = layers[1],
            layerId = 1,
            duties = listOf(
                "Mejora diálogos, ritmo narrativo y coherencia de los arcos del guion.",
                "Ajusta el guion a restricciones físicas y logísticas de la producción."
            ),
            inputDescription = "Guion literario original, notas de revisión del Showrunner.",
            outputDescription = "Guion Pulido con diálogos intensificados y ritmo optimizado.",
            suggestedPrompt = "Pulir los diálogos de la escena anterior. Aumenta la tensión subterránea y la ironía de los personajes, evitando clisés de ciencia ficción.",
            iconName = "healing"
        ),
        CinemaSubagent(
            key = "CONTINUISTA",
            name = "Continuista",
            role = "Script / Continuity Supervisor",
            layer = layers[1],
            layerId = 1,
            duties = listOf(
                "Monitorea el control de continuidad técnica y lógica (vestuario, props, maquillaje, iluminación, posiciones, tiempo del día).",
                "Genera la Continuity Bible para que la usen los agentes visuales de cámara."
            ),
            inputDescription = "Guion literario pulido, esquemas de desglose de arte.",
            outputDescription = "Continuity Bible detallando el estado de cada personaje y escena.",
            suggestedPrompt = "Genera las especificaciones de continuidad para la escena del panel holográfico. Define el estado físico del operario, vestuario desgastado húmedo por la lluvia, herramientas en el cinturón y hora del día al anochecer.",
            iconName = "history"
        ),
        CinemaSubagent(
            key = "DIRECTOR_ESCENA",
            name = "Director de Escena",
            role = "Director Artístico / Bloqueador",
            layer = layers[1],
            layerId = 1,
            duties = listOf(
                "Define la intención emocional profunda de cada escena.",
                "Establece el ritmo actoral, tono o énfasis.",
                "Proporciona marcas concretas de cámara, luz y animación."
            ),
            inputDescription = "Guion literario, Continuity Bible.",
            outputDescription = "Instrucciones de Intención Directorial (Traducción de narrativa a parámetros técnicos).",
            suggestedPrompt = "Genera el plan directorial para el operario del panel. Define el subtexto emocional (aislamiento y vértigo) y traduce esto en instrucciones de encuadre en plano holandés y movimientos lentos con lentes de focal larga.",
            iconName = "movie"
        ),

        // Capa 2
        CinemaSubagent(
            key = "DIRECTOR_ARTE",
            name = "Director de Arte",
            role = "Concept & Environment Director",
            layer = layers[2],
            layerId = 2,
            duties = listOf(
                "Define la estética e identidad visual global de la obra.",
                "Crea la Art Bible (estilo artístico, paleta de colores oficial, texturas y referencias)."
            ),
            inputDescription = "Project Bible, Guion literario.",
            outputDescription = "Art Bible con paleta de colores hexadecimales, materialidad y estilos de referencia.",
            suggestedPrompt = "Define la paleta cromática y estética brutalista para la megaciudad. Describe el uso de hormigón crudo expuesto, luces de neón en tonos turquesa y ámbar apagado, y texturas de asfalto mojado bajo lluvia ácida.",
            iconName = "palette"
        ),
        CinemaSubagent(
            key = "CHARACTER_DESIGNER",
            name = "Diseñador de Personajes",
            role = "Diseñador Creativo de Personajes",
            layer = layers[2],
            layerId = 2,
            duties = listOf(
                "Diseña personajes centrales y extras en turnaround (vistas múltiples).",
                "Define proporciones, silueta, texturas y esquemas de color específicos.",
                "Genera Character Sheets detallados."
            ),
            inputDescription = "Art Bible, descripciones de personajes del guion.",
            outputDescription = "Character Sheets y Turnaround referenciales.",
            suggestedPrompt = "Genera la ficha técnica y de vestuario de 'Kael', el operario. Edad 38 años, marcas de quemaduras por silicio en los dedos, gabardina sintética de lluvia reforzada, visor HUD desgastado con reflejos amarillos.",
            iconName = "face"
        ),
        CinemaSubagent(
            key = "CHARACTER_SUPERVISOR",
            name = "Supervisor de Personajes",
            role = "Character Consistency Supervisor",
            layer = layers[2],
            layerId = 2,
            duties = listOf(
                "Mantiene la consistencia de la cara e identidad visual del personaje en todos los planos.",
                "Gestiona adaptadores IP‑Adapter y FaceID.",
                "Emite tokens de consistencia del personaje."
            ),
            inputDescription = "Character Sheets primarios, renders de prueba.",
            outputDescription = "Guía de Coherencia Facial y Tokens de Consistencia del Rostro.",
            suggestedPrompt = "Escribe el instructivo técnico para mantener la cara de Kael invariable. Detalla la geometría de su mandíbula angular, cicatriz en la ceja izquierda, y parámetros de anclaje de FaceID para el generador visual.",
            iconName = "portrait"
        ),
        CinemaSubagent(
            key = "PRODUCTION_DESIGNER",
            name = "Diseñador de Producción",
            role = "Production / Scenic Designer",
            layer = layers[2],
            layerId = 2,
            duties = listOf(
                "Diseña el entorno, la arquitectura de los sets y props mecánicos o decorativos.",
                "Crea blueprints de escenarios (Environment Blueprints)."
            ),
            inputDescription = "Art Bible, descripciones escénicas de guion.",
            outputDescription = "Environment Blueprint y guías arquitectónicas del set.",
            suggestedPrompt = "Diseña y describe la arquitectura de la torre de control de paneles. Especifica el hormigón agrietado, andamios colgantes de fibra de carbono, cables gruesos cayendo al vacío y la disposición espacial.",
            iconName = "domain"
        ),
        CinemaSubagent(
            key = "DOP",
            name = "Director de Fotografía",
            role = "Director de Fotografía / DoP",
            layer = layers[2],
            layerId = 2,
            duties = listOf(
                "Define lentes, distancia focal, profundidad de campo, composición y encuadres.",
                "Diseña el movimiento físico de la cámara y genera el Camera & Lens Bible."
            ),
            inputDescription = "Director's Plan (Capa 1), Environment Blueprints.",
            outputDescription = "Camera & Lens Bible detallando distancias focales, velocidad de diafragma y movimiento.",
            suggestedPrompt = "Define la configuración de cámara para el plano inicial de Kael en la torre. Elige un lente anamórfico de 35mm para capturar la inmensidad del abismo, con un paneo descendente lento y desenfoque progresivo.",
            iconName = "videocam"
        ),
        CinemaSubagent(
            key = "GAFFER",
            name = "Gaffer / Iluminador",
            role = "Chief Lighting Technician",
            layer = layers[2],
            layerId = 2,
            duties = listOf(
                "Define esquemas de luz precisos por escena (temperatura, intensidad, dirección, tipo de fuente).",
                "Mantiene coherencia lumínica a través de Lighting Blueprints."
            ),
            inputDescription = "Camera & Lens Bible, Art Bible, descripción física del set.",
            outputDescription = "Lighting Blueprint con diagramas y temperaturas de color en grados Kelvin.",
            suggestedPrompt = "Crea el esquema de iluminación para el anochecer húmedo en la torre. Diseña un esquema de tres puntos con una luz de recorte de neón azul de 8000K, un relleno cálido de 3000K proveniente del visor del operario, y sombras profundas.",
            iconName = "wb_sunny"
        ),
        CinemaSubagent(
            key = "STORYBOARD",
            name = "Storyboard Artist",
            role = "Dibujante de Storyboard",
            layer = layers[2],
            layerId = 2,
            duties = listOf(
                "Traduce la secuencia de guion e instrucciones de cámara a dibujos secuenciales.",
                "Estructura los encuadres clave y poses para definir el ritmo visual inicial."
            ),
            inputDescription = "Guion de escena, Camera & Lens Bible.",
            outputDescription = "Secuencia de Storyboard (Descripción técnica y visual de frames clave).",
            suggestedPrompt = "Genera las descripciones detalladas para una secuencia de 4 cuadros de storyboard de la escena 1. Frame 1: Gran plano general de la torre. Frame 2: Detalle de las manos de Kael temblando. Frame 3: Plano medio con Kael mirando al abismo. Frame 4: Primer plano del visor.",
            iconName = "grid_view"
        ),
        CinemaSubagent(
            key = "LAYOUT",
            name = "Layout Artist",
            role = "Artista de Composición de Escena",
            layer = layers[2],
            layerId = 2,
            duties = listOf(
                "Coloca a los personajes y la cámara en un espacio tridimensional o plano maestro.",
                "Define el 'blocking' (posiciones físicas de inicio, trayectorias y descansos actoriales)."
            ),
            inputDescription = "Environment Blueprint, Storyboard, Fichas de personaje.",
            outputDescription = "Layout Spatial Plan (Blocking técnico de personajes y cámara).",
            suggestedPrompt = "Define el blocking de Kael y la cámara en la torre de paneles. Kael inicia arrodillado frente al panel de fusibles, avanza 1.5 metros hacia el borde del andamio, y la cámara se desplaza horizontalmente de derecha a izquierda.",
            iconName = "layers"
        ),

        // Capa 3
        CinemaSubagent(
            key = "LEAD_ANIMATOR",
            name = "Animador Principal",
            role = "Lead Motion & Performance Animator",
            layer = layers[3],
            layerId = 3,
            duties = listOf(
                "Define poses clave, gestualidad actoral primordial y timming del movimiento.",
                "Usa herramientas como AnimateDiff, Mochi o ControlNet Pose."
            ),
            inputDescription = "Storyboard sequences, Layout Spatial Plan.",
            outputDescription = "Instrucciones de Animación Clave y curvas de tiempo/frecuencia.",
            suggestedPrompt = "Genera el plan de animación de poses clave para Kael cuando se levanta del andamio. Describe el movimiento pesado, la fatiga física manifestada en los hombros caídos y el tirón repentino al reaccionar al comunicador.",
            iconName = "run_circle"
        ),
        CinemaSubagent(
            key = "SEC_ANIMATOR",
            name = "Animador Secundario",
            role = "Secondary & Physics Animator",
            layer = layers[3],
            layerId = 3,
            duties = listOf(
                "Diseña e implementa el movimiento secundario (pelo, tela, ropa, correas, accesorios, follow-through).",
                "Configura los adaptadores de movimiento e inercia."
            ),
            inputDescription = "Animación principal aprobada, características materiales de la tela y ropa.",
            outputDescription = "Instructivo de Simulación Física de Ropa y Dinámicas de Viento.",
            suggestedPrompt = "Configura el movimiento de la gabardina de Kael bajo las inclemencias de la megaciudad. Detalla cómo la tela pesada oscila hacia la derecha por ráfagas de viento, y la inercia del agua acumulada húmedamente en los bordes.",
            iconName = "waves"
        ),
        CinemaSubagent(
            key = "TEMPORAL_SUPERVISOR",
            name = "Supervisor de Coherencia Temporal",
            role = "Temporal Consistency Supervisor",
            layer = layers[3],
            layerId = 3,
            duties = listOf(
                "Analiza la transición de píxeles entre frames contiguos (Color, Luz, Estructura, Posición).",
                "Utiliza técnicas de flujo óptico (Optical Flow) y profundidad de ruido para evitar parpadeos no deseados (flicker)."
            ),
            inputDescription = "Flujos de render brutos, mapas de profundidad secuenciales.",
            outputDescription = "Reporte de Consistencia Temporal y Parámetros de Estabilización de Ruido.",
            suggestedPrompt = "Genera el plan de control de consistencia para los andamios metálicos bajo la lluvia. Controla las líneas finas de los cables de tensión para prevenir parpadeos luminosos aplicando anclajes de ruido en un 60%.",
            iconName = "lock"
        ),
        CinemaSubagent(
            key = "VFX_SUPERVISOR",
            name = "Supervisor de Efectos Visuales",
            role = "VFX Supervisor",
            layer = layers[3],
            layerId = 3,
            duties = listOf(
                "Diseña la creación e integración de efectos de partículas (lluvia ácida, chispas eléctricas, fuego, humo).",
                "Asegura la fusión natural de estos generadores con el fondo."
            ),
            inputDescription = "Art Bible, secuencias de animación aprobadas.",
            outputDescription = "VFX Blueprint (Capas y especificaciones de partículas y chispas).",
            suggestedPrompt = "Diseña los efectos visuales del panel holográfico averiado. El cableado expuesto genera chispas ámbar de trayectoria aleatoria y un humo espeso blanco que circula alrededor del visor del casco de Kael.",
            iconName = "bolt"
        ),
        CinemaSubagent(
            key = "SIMULATOR_TD",
            name = "Director Técnico de Simulación",
            role = "FX Technical Director",
            layer = layers[3],
            layerId = 3,
            duties = listOf(
                "Optimiza y simula fluidos complejos, colisiones e interacciones de partículas con geometría.",
                "Establece ecuaciones simplificadas de simulador físico."
            ),
            inputDescription = "VFX Blueprints, Layout Spatial Plan.",
            outputDescription = "Ficha de Parámetros Dinámicos de Colisión Física.",
            suggestedPrompt = "Genera la simulación de las gotas de lluvia colisionando con el andamio de metal y rebotando en salpicaduras esféricas micrométricas, escurriendo por la pendiente de hormigón.",
            iconName = "grain"
        ),

        // Capa 4
        CinemaSubagent(
            key = "COMPOSER",
            name = "Compositor Musical",
            role = "Music Director & Composer",
            layer = layers[4],
            layerId = 4,
            duties = listOf(
                "Genera temas principales, leitmotivs por personaje y variaciones emocionales.",
                "Diseña las atmósferas orquestales o sintéticas."
            ),
            inputDescription = "Guion de la escena, Project Bible (Tono y ritmo).",
            outputDescription = "Score Directives (Estructura de la partitura, instrumentos, acordes, ritmo bpm).",
            suggestedPrompt = "Genera las directivas de partitura para la escena de Kael. Se requiere un tema ambiental oscuro de sintetizador analógico de baja frecuencia a 65 bpm, con un violonchelo melancólico que entra en el momento del abismo.",
            iconName = "music_note"
        ),
        CinemaSubagent(
            key = "SOUND_DESIGNER",
            name = "Diseñador de Sonido",
            role = "Foley & Ambient Sound Designer",
            layer = layers[4],
            layerId = 4,
            duties = listOf(
                "Diseña los efectos acústicos (foley): pasos, ropa, golpes, chirridos mecánicos.",
                "Crea la pista de sonido ambiental detallada."
            ),
            inputDescription = "Guion literario con acciones físicas, Layout Spatial Plan.",
            outputDescription = "Sound FX Cue Sheet (Listado e instrucciones de sonidos de foley).",
            suggestedPrompt = "Diseña el Sound Cue Sheet para los momentos de Kael en el andamio. Incluye: goteo metálico rítmico, zumbido eléctrico en alta frecuencia del panel averiado, viento silbante sordo de gran altura y fricción sintética de su gabardina al levantarse.",
            iconName = "volume_up"
        ),
        CinemaSubagent(
            key = "MIXER",
            name = "Mezclador final",
            role = "Re‑Recording Mixer & Audio Engineer",
            layer = layers[4],
            layerId = 4,
            duties = listOf(
                "Balancea diálogos, música y pistas de efectos de sonido.",
                "Estructura el paneo acústico envolvente, ecualización y reverberaciones de sala."
            ),
            inputDescription = "Diálogos grabados, Score musical, Sound FX cues.",
            outputDescription = "Plan de Mezcla Multicanal y Reverberaciones de Entorno.",
            suggestedPrompt = "Diseña la mezcla de audio para la escena de altura. Estructura el viento con paneo estéreo abierto envolvente, los diálogos del casco con compresión radiofónica de banda estrecha, y la música silenciándose un 30% en los diálogos.",
            iconName = "equalizer"
        ),

        // Capa 5
        CinemaSubagent(
            key = "EDITOR",
            name = "Montador / Editor de Cine",
            role = "Film Editor",
            layer = layers[5],
            layerId = 5,
            duties = listOf(
                "Elige las mejores tomas de cámara y define el corte final.",
                "Ajusta el ritmo, longitud de la secuencia y la fluidez del montaje narrativo."
            ),
            inputDescription = "Secuencias renderizadas, Storyboard, Temas aprobados.",
            outputDescription = "Editing Decision List (EDL) con cortes exactos por segundo.",
            suggestedPrompt = "Genera las pautas de montaje para la escena. Inicia con 4 segundos de atmósfera en plano general, corta bruscamente a 2 segundos del detalle de las manos, 5 segundos del plano medio cuando reacciona y primer plano de 3 segundos de tensión.",
            iconName = "content_cut"
        ),
        CinemaSubagent(
            key = "COLORIST",
            name = "Colorista",
            role = "Colorist / Digital Colorist",
            layer = layers[5],
            layerId = 5,
            duties = listOf(
                "Aplica correcciones cromáticas y gradación de color (Color Grading).",
                "Sincroniza y estandariza looks cromáticos previniendo saltos visuales."
            ),
            inputDescription = "Art Bible, tomas montadas en crudo.",
            outputDescription = "LUT de Color Cinematográfico Oficial y Guía de Look / Hue.",
            suggestedPrompt = "Diseña el LUT de color para la producción. Contempla una desaturación de tonos verdes y cálidos de un 30%, realce severo del contraste en negros y un brillo neón cian prominente por mapeo selectivo.",
            iconName = "compare"
        ),
        CinemaSubagent(
            key = "MASTER_SUPERVISOR",
            name = "Supervisor de Mastering",
            role = "Online / Finishing & Mastering Editor",
            layer = layers[5],
            layerId = 5,
            duties = listOf(
                "Genera versiones finales de exhibición (4K UHD, 1080p, SDR, HDR10, Dolby Vision).",
                "Supervisa conversión de framerates y empaquetado final (DCP)."
            ),
            inputDescription = "Montaje final mezclado y con color definitivo.",
            outputDescription = "Ficha de Envíos Cinematográficos y Configuración de Rendering Ultra-HD.",
            suggestedPrompt = "Define la configuración de remasterización final. Mapea negros en HDR a 0.005 nits, brillo máximo en neones a 1000 nits, exportación a un contenedor de aspecto cinematográfico 2.39:1 anamórfico.",
            iconName = "settings_backup_restore"
        ),

        // Capa 6
        CinemaSubagent(
            key = "PRODUCTION_MANAGER",
            name = "Jefe de Producción",
            role = "Production Manager",
            layer = layers[6],
            layerId = 6,
            duties = listOf(
                "Planifica el orden de cronograma de las escenas de rodaje.",
                "Optimiza los recursos energéticos o de tiempo de renderizado artificial.",
                "Prioriza planos críticos que alimentan a múltiples subagentes."
            ),
            inputDescription = "Project Bible, Escaleta de escenas, número de planos.",
            outputDescription = "Project Schedule (Cronograma de Rodaje y Prioridades de Renderizado).",
            suggestedPrompt = "Crea una hoja de ruta de producción para rodar y pre-renderizar los 5 planos de la escena de la torre de paneles holográficos. Optimiza los tiempos empezando por los sets y props mecánicos.",
            iconName = "schedule"
        ),
        CinemaSubagent(
            key = "PIPELINE_TD",
            name = "Coordinador de Pipeline",
            role = "Pipeline Technical Director",
            layer = layers[6],
            layerId = 6,
            duties = listOf(
                "Gestiona las dependencias e intercambio de archivos entre los subagentes.",
                "Asegura la actualización unificada y sincronizada de la memoria central (Project, Art, Character, Lighting, Camera y Continuity Bibles)."
            ),
            inputDescription = "Archivos generados por cada capa de agentes, alertas de cambios.",
            outputDescription = "Sincronizador Automático de Metadatos y Estructuras.",
            suggestedPrompt = "Genera un reporte de dependencias de pipeline técnico. Muestra cómo un cambio en el 'Environment Blueprint' del Diseñador de Producción afecta al Director de Fotografía, Gaffer y Storyboarder, indicando rutas de datos.",
            iconName = "sync"
        ),
        CinemaSubagent(
            key = "QC_SUPERVISOR",
            name = "Control de Calidad",
            role = "QC Supervisor / Quality Inspector",
            layer = layers[6],
            layerId = 6,
            duties = listOf(
                "Detecta anomalías visuales: parpadeos excesivos, chispas desfasadas, chatarra espacial desalineada, ojos desproporcionados (AI glitches).",
                "Aprueba planos o marca tomas concretas con orden estricta de rehacer."
            ),
            inputDescription = "Fotomontajes finales, tomas renderizadas terminadas.",
            outputDescription = "Reporte de Control de Calidad (QC Audit Report) con marcas de aprobación o reprobación.",
            suggestedPrompt = "Genera un reporte de control de calidad para el plano final de Kael. Revisa si hay deformidades en sus manos robóticas, inconsistencia de neones parpadeantes en el fondo o ruido excesivo HDR.",
            iconName = "fact_check"
        )
    )
}
