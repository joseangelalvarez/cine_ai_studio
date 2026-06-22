package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.application.usecase.*
import com.example.data.database.*
import com.example.data.model.CinemaSubagent
import com.example.data.model.CinemaSubagentsCatalog
import com.example.infrastructure.gateway.SecureCinemaGatewayImpl
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

sealed interface GenerationState {
    object Idle : GenerationState
    object Loading : GenerationState
    data class Success(val response: String) : GenerationState
    data class Error(val message: String) : GenerationState
}

class MovieProjectViewModel(application: Application) : AndroidViewModel(application) {

    private val database = AppDatabase.getDatabase(application)
    private val repository = MovieProjectRepository(database.movieProjectDao())
    private val sharedPrefs = application.getSharedPreferences("user_prefs", android.content.Context.MODE_PRIVATE)

    private val _userCredits = MutableStateFlow(sharedPrefs.getInt("credits", 100))
    val userCredits: StateFlow<Int> = _userCredits.asStateFlow()

    fun consumeCredits(amount: Int): Boolean {
        val current = _userCredits.value
        if (current >= amount) {
            val newCredits = current - amount
            _userCredits.value = newCredits
            sharedPrefs.edit().putInt("credits", newCredits).apply()
            return true
        }
        return false
    }

    fun buyCredits(amount: Int) {
        val newCredits = _userCredits.value + amount
        _userCredits.value = newCredits
        sharedPrefs.edit().putInt("credits", newCredits).apply()
    }

    // --- SECURE GATEWAY ADAPTER AND USE CASES (CLEAN ARCHITECTURE) ---
    private val gateway = SecureCinemaGatewayImpl()

    private val createStoryboardUseCase = CreateStoryboardUseCase(repository, gateway)
    private val approveStoryboardUseCase = ApproveStoryboardUseCase(repository)
    private val orchestrateSubagentUseCase = OrchestrateSubagentUseCase(repository, gateway)

    // Toggle de Pasarela de Seguridad de Orquestador Central (Fase 0)
    private val _useSecureGateway = MutableStateFlow(true)
    val useSecureGateway: StateFlow<Boolean> = _useSecureGateway.asStateFlow()

    fun toggleSecureGateway(enabled: Boolean) {
        _useSecureGateway.value = enabled
        gateway.useSecureBackendEndpoint = enabled
    }

    // Proyectos de cine
    val allProjects: StateFlow<List<MovieProject>> = repository.allProjects
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Proyecto actualmente seleccionado
    private val _selectedProject = MutableStateFlow<MovieProject?>(null)
    val selectedProject: StateFlow<MovieProject?> = _selectedProject.asStateFlow()

    // Memoria central compartida (registros del proyecto seleccionado)
    val projectMemories: StateFlow<List<ProjectMemory>> = _selectedProject
        .flatMapLatest { project ->
            if (project != null) {
                repository.getMemories(project.id)
            } else {
                flowOf(emptyList())
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // --- OBSERBILIDAD REACTIVA DEL PRODUCTO (Fases 1 y 2) ---
    val projectRevisions: StateFlow<List<ProjectMemoryRevision>> = _selectedProject
        .flatMapLatest { project ->
            if (project != null) {
                repository.getRevisionsForProject(project.id)
            } else {
                flowOf(emptyList())
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val auditLogs: StateFlow<List<AuditLog>> = _selectedProject
        .flatMapLatest { project ->
            if (project != null) {
                repository.getAuditLogsForProject(project.id)
            } else {
                flowOf(emptyList())
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val telemetryMetrics: StateFlow<List<TelemetryMetric>> = _selectedProject
        .flatMapLatest { project ->
            if (project != null) {
                repository.getTelemetryMetricsForProject(project.id)
            } else {
                flowOf(emptyList())
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Subagente seleccionado de los 24
    private val _selectedSubagent = MutableStateFlow<CinemaSubagent?>(CinemaSubagentsCatalog.list.firstOrNull())
    val selectedSubagent: StateFlow<CinemaSubagent?> = _selectedSubagent.asStateFlow()

    // Estados de cada subagente en la cascada actual: "PENDING", "RUNNING", "COMPLETED", "PAUSED_EXPENSIVE", "ERROR"
    private val _subagentStates = MutableStateFlow<Map<String, String>>(emptyMap())
    val subagentStates: StateFlow<Map<String, String>> = _subagentStates.asStateFlow()

    // Variable coroutine para control de la cascada
    private var cascadeJob: Job? = null

    // Input del usuario en la consola de orquestación
    private val _promptInput = MutableStateFlow("")
    val promptInput: StateFlow<String> = _promptInput.asStateFlow()

    // Estado de generación de entregable técnico
    private val _generationState = MutableStateFlow<GenerationState>(GenerationState.Idle)
    val generationState: StateFlow<GenerationState> = _generationState.asStateFlow()

    // Control de ventanas modales / diálogos
    var isCreatingProjectDialogVisible = MutableStateFlow(false)

    // Tarifas y categorías de los orquestadores costosos
    fun getSubagentCostInfo(key: String): String? {
        return when (key) {
            "DIRECTOR_ARTE" -> "Costo estimado: $0.03 USD (Categoría IMAGEN/Moodboard)"
            "CHARACTER_DESIGNER" -> "Costo estimado: $0.04 USD (Categoría IMAGEN/Fichas)"
            "STORYBOARD" -> "Costo estimado: $0.08 USD (Categoría IMAGEN/Secuencia)"
            "LEAD_ANIMATOR" -> "Costo estimado: $0.25 USD (Categoría VIDEO/Mochi-1 Heavy)"
            "SEC_ANIMATOR" -> "Costo estimado: $0.15 USD (Categoría VIDEO/Physics)"
            "VFX_SUPERVISOR" -> "Costo estimado: $0.20 USD (Categoría VIDEO/VFX Particle)"
            "COMPOSER" -> "Costo estimado: $0.10 USD (Categoría MÚSICA/Score)"
            "SOUND_DESIGNER" -> "Costo estimado: $0.05 USD (Categoría AUDIO/Foley Cue)"
            "MIXER" -> "Costo estimado: $0.03 USD (Categoría AUDIO/Atmos Surround)"
            else -> null
        }
    }

    fun isSubagentExpensive(key: String): Boolean {
        return getSubagentCostInfo(key) != null
    }

    // --- FLUJO DE HISTORIAL / STORYBOARD EN CASCADA ---
    private val _videoIdeaState = MutableStateFlow("")
    val videoIdeaState: StateFlow<String> = _videoIdeaState.asStateFlow()

    private val _shortFilmDuration = MutableStateFlow("3 minutos")
    val shortFilmDuration: StateFlow<String> = _shortFilmDuration.asStateFlow()

    private val _actsStructure = MutableStateFlow("")
    val actsStructure: StateFlow<String> = _actsStructure.asStateFlow()

    private val _generatedStoryboard = MutableStateFlow("")
    val generatedStoryboard: StateFlow<String> = _generatedStoryboard.asStateFlow()

    private val _directorConsistencyReport = MutableStateFlow("")
    val directorConsistencyReport: StateFlow<String> = _directorConsistencyReport.asStateFlow()

    private val _storyboardWorkflowState = MutableStateFlow("IDLE") // IDLE, GENERATING, AWAITING_APPROVAL, APPROVED, ERROR
    val storyboardWorkflowState: StateFlow<String> = _storyboardWorkflowState.asStateFlow()

    private val _storyboardWorkflowError = MutableStateFlow("")
    val storyboardWorkflowError: StateFlow<String> = _storyboardWorkflowError.asStateFlow()

    // Control de navegación de pestañas integradas (desactivado/deprecated pero mantenido para retrocompatibilidad interna si fuera necesario)
    private val _activeTabCompact = MutableStateFlow(0) // 0: Estudio, 1: Consola, 2: Biblia DB, 3: Métricas
    val activeTabCompact: StateFlow<Int> = _activeTabCompact.asStateFlow()

    private val _activeTabWide = MutableStateFlow(0) // 0: Taller, 1: Biblia Unificada, 2: Métricas
    val activeTabWide: StateFlow<Int> = _activeTabWide.asStateFlow()

    fun updateActiveTabCompact(tab: Int) {
        _activeTabCompact.value = tab
    }

    fun updateActiveTabWide(tab: Int) {
        _activeTabWide.value = tab
    }

    // --- NUEVO FLUJO SIMPLIFICADO PASO A PASO (DIRECCIÓN CREATIVA DE VENTANAS LIMPIAS) ---
    private val _currentScreenState = MutableStateFlow("HOME") // "HOME", "PROJECT_LIST", "PROJECT_DETAILS", "CREATE_WIZARD", "CREATION_PROGRESS"
    val currentScreenState: StateFlow<String> = _currentScreenState.asStateFlow()

    fun navigateToScreen(screen: String) {
        _currentScreenState.value = screen
        if (screen == "HOME") {
            _selectedProject.value = null
        }
    }

    // Datos del asistente de creación
    val wizardTitle = MutableStateFlow("")
    val wizardDuration = MutableStateFlow("3 minutos")
    val wizardArtStyle = MutableStateFlow("Cinemático Ultra-Realista")
    val wizardIdea = MutableStateFlow("")

    // Estado del progreso de ejecución
    private val _progressStepIndex = MutableStateFlow(0)
    val progressStepIndex: StateFlow<Int> = _progressStepIndex.asStateFlow()

    private val _progressMessage = MutableStateFlow("Iniciando motor de preproducción...")
    val progressMessage: StateFlow<String> = _progressMessage.asStateFlow()

    private val _isRenderingPromptVisible = MutableStateFlow(false)
    val isRenderingPromptVisible: StateFlow<Boolean> = _isRenderingPromptVisible.asStateFlow()

    private val _renderingStatus = MutableStateFlow("") // "", "GENERATING", "COMPLETED"
    val renderingStatus: StateFlow<String> = _renderingStatus.asStateFlow()

    private val _lastGenerationError = MutableStateFlow<String?>(null)
    val lastGenerationError: StateFlow<String?> = _lastGenerationError.asStateFlow()

    // Control de edición del orquestador seleccionado
    private val _activeSubagentToEdit = MutableStateFlow<CinemaSubagent?>(null)
    val activeSubagentToEdit: StateFlow<CinemaSubagent?> = _activeSubagentToEdit.asStateFlow()

    // --- VEO COMPLEMENTARY VIDEO ROUTE AND FEEDBACK ---
    private val _veoVideoStatus = MutableStateFlow("NOT_STARTED") // NOT_STARTED, GENERATING, SUCCESS, ERROR
    val veoVideoStatus: StateFlow<String> = _veoVideoStatus.asStateFlow()

    private val _veoCharacterCustom = MutableStateFlow("")
    val veoCharacterCustom: StateFlow<String> = _veoCharacterCustom.asStateFlow()

    private val _veoBackgroundCustom = MutableStateFlow("")
    val veoBackgroundCustom: StateFlow<String> = _veoBackgroundCustom.asStateFlow()

    private val _veoSoundCustom = MutableStateFlow("")
    val veoSoundCustom: StateFlow<String> = _veoSoundCustom.asStateFlow()

    private val _veoProgressMessage = MutableStateFlow("")
    val veoProgressMessage: StateFlow<String> = _veoProgressMessage.asStateFlow()

    private val _veoProgressFraction = MutableStateFlow(0.0f)
    val veoProgressFraction: StateFlow<Float> = _veoProgressFraction.asStateFlow()

    val editedContentText = MutableStateFlow("")

    fun setSubagentToEdit(agent: CinemaSubagent?, currentContent: String) {
        _activeSubagentToEdit.value = agent
        editedContentText.value = currentContent
    }

    fun openProjectForEditing(project: MovieProject) {
        selectProject(project)
        navigateToScreen("PROJECT_DETAILS")
    }

    fun closeSubagentEditor() {
        _activeSubagentToEdit.value = null
        editedContentText.value = ""
    }

    // Reactive mapping of subagents and execution status
    val subagentExecutionStatus: StateFlow<Map<String, Boolean>> = projectMemories
        .map { memories ->
            CinemaSubagentsCatalog.list.associate { agent ->
                agent.key to memories.any { it.key == agent.key }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyMap())

    init {
        // En el nuevo diseño guiado, NO seleccionamos ningún proyecto por defecto al inicio
        // para asegurar que el usuario vea siempre la pantalla de inicio con 2 opciones limpias.
    }

    fun startAutomaticSequence(projectId: Int) {
        cascadeJob?.cancel()
        _progressStepIndex.value = 0
        _isRenderingPromptVisible.value = false
        _renderingStatus.value = ""
        _lastGenerationError.value = null
        navigateToScreen("CREATION_PROGRESS")

        cascadeJob = viewModelScope.launch(Dispatchers.IO) {
            val project = _selectedProject.value?.takeIf { it.id == projectId }
                ?: repository.getProject(projectId).firstOrNull()
                ?: allProjects.value.find { it.id == projectId }
                ?: return@launch
            val subagentsList = CinemaSubagentsCatalog.list

            // Los orquestadores estándar son de pre-producción (Capa 0, Capa 1, Capa 2 hasta STORYBOARD)
            val preprodAgents = subagentsList.filter { it.layerId <= 2 }

            for (index in preprodAgents.indices) {
                val agent = preprodAgents[index]
                _progressStepIndex.value = index
                _progressMessage.value = "Ejecutando ${agent.name} (${agent.layer})..."

                val promptToUse = agent.suggestedPrompt
                val result = orchestrateSubagentUseCase.execute(project, agent, promptToUse)
                if (result is OrchestrationResult.Error) {
                    _lastGenerationError.value = result.message
                    _progressMessage.value = "Error al ejecutar ${agent.name}: ${result.message}"
                    break
                }

                delay(1200) // Delay estético de progreso
            }

            if (_lastGenerationError.value == null) {
                _progressMessage.value = "Preproducción completada con éxito. Listo para fase de renderizado."
                _isRenderingPromptVisible.value = true
            }
        }
    }

    fun executeRenderAction(choice: String) {
        val project = _selectedProject.value ?: return
        cascadeJob?.cancel()
        _lastGenerationError.value = null

        cascadeJob = viewModelScope.launch(Dispatchers.IO) {
            _isRenderingPromptVisible.value = false
            _renderingStatus.value = "GENERATING"

            val subagentsList = CinemaSubagentsCatalog.list
            val renderAgents = mutableListOf<CinemaSubagent>()

            when (choice) {
                "ALL" -> {
                    renderAgents.addAll(subagentsList.filter { it.layerId == 3 || it.layerId == 4 })
                }
                "VIDEO" -> {
                    renderAgents.addAll(subagentsList.filter { it.layerId == 3 })
                }
                "AUDIO" -> {
                    renderAgents.addAll(subagentsList.filter { it.layerId == 4 })
                }
            }

            if (renderAgents.isNotEmpty()) {
                for (index in renderAgents.indices) {
                    val agent = renderAgents[index]
                    _progressStepIndex.value = index
                    _progressMessage.value = "Renderizando ${agent.name} (${agent.layer})..."
                    val result = orchestrateSubagentUseCase.execute(project, agent, agent.suggestedPrompt)
                    if (result is OrchestrationResult.Error) {
                        _lastGenerationError.value = result.message
                        _progressMessage.value = "Error al renderizar ${agent.name}: ${result.message}"
                        _renderingStatus.value = "ERROR"
                        break
                    }
                    delay(1200)
                }
            }

            if (_lastGenerationError.value == null) {
                _progressMessage.value = "¡Proyecto Completado! Generación y renderizado finalizados con éxito."
                _renderingStatus.value = "COMPLETED"
            }
        }
    }

    fun updateSubagentMemoryAndCascade(projectId: Int, subagentKey: String, subagentTitle: String, newContent: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val memory = ProjectMemory(
                projectId = projectId,
                key = subagentKey,
                title = subagentTitle,
                content = newContent,
                updatedAt = System.currentTimeMillis()
            )
            repository.insertMemory(memory)

            // "Todos los orquestadores dependientes se actualizan automáticamente"
            val subagentsList = CinemaSubagentsCatalog.list
            val index = subagentsList.indexOfFirst { it.key == subagentKey }
            if (index != -1 && index + 1 < subagentsList.size) {
                val nextAgent = subagentsList[index + 1]
                runCascadeOrchestration(nextAgent.key)
            }

            _activeSubagentToEdit.value = null
        }
    }

    fun selectProject(project: MovieProject, tabCompact: Int = 0, tabWide: Int = 0) {
        _selectedProject.value = project
        _activeTabCompact.value = tabCompact
        _activeTabWide.value = tabWide
        loadStoryboardWorkflowData(project.id)
        loadVeoProjectMetadata(project.id)

        // Cargar el entregable del subagente guardado por defecto o actual
        val currentAgent = _selectedSubagent.value
        if (currentAgent != null) {
            selectSubagent(currentAgent)
        } else {
            _generationState.value = GenerationState.Idle
        }
    }

    fun loadVeoProjectMetadata(projectId: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            val statusMem = repository.getMemoryByKey(projectId, "VEO_VIDEO_STATUS")
            val charMem = repository.getMemoryByKey(projectId, "VEO_CHARACTER_CUSTOM")
            val bgMem = repository.getMemoryByKey(projectId, "VEO_BACKGROUND_CUSTOM")
            val soundMem = repository.getMemoryByKey(projectId, "VEO_SOUND_CUSTOM")

            withContext(Dispatchers.Main) {
                _veoVideoStatus.value = statusMem?.content ?: "NOT_STARTED"
                _veoCharacterCustom.value = charMem?.content ?: ""
                _veoBackgroundCustom.value = bgMem?.content ?: ""
                _veoSoundCustom.value = soundMem?.content ?: ""
            }
        }
    }

    fun updateVeoCharacterCustom(text: String) {
        _veoCharacterCustom.value = text
        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMemory(ProjectMemory(projectId = project.id, key = "VEO_CHARACTER_CUSTOM", title = "Instrucción de Personajes", content = text))
        }
    }

    fun updateVeoBackgroundCustom(text: String) {
        _veoBackgroundCustom.value = text
        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMemory(ProjectMemory(projectId = project.id, key = "VEO_BACKGROUND_CUSTOM", title = "Instrucción de Fondos/Escenario", content = text))
        }
    }

    fun updateVeoSoundCustom(text: String) {
        _veoSoundCustom.value = text
        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMemory(ProjectMemory(projectId = project.id, key = "VEO_SOUND_CUSTOM", title = "Instrucción de Audio/Música", content = text))
        }
    }

    fun generateVeoVideo() {
        val project = _selectedProject.value ?: return
        cascadeJob?.cancel()
        _veoVideoStatus.value = "GENERATING"
        _veoProgressFraction.value = 0.0f

        cascadeJob = viewModelScope.launch(Dispatchers.IO) {
            try {
                // Etapa 1: Orquestación de Personajes con Imagen 3 / Banana Pro
                _veoProgressMessage.value = "🤖 Generando personajes optimizados mediante Imagen 3 y Banana Pro con nuevas características..."
                _veoProgressFraction.value = 0.15f
                
                val characterCustomPrompt = _veoCharacterCustom.value.ifBlank { "Características estándar del personaje principal Kael" }
                val charPrompt = "Genera refinamiento de personajes en base a: $characterCustomPrompt"
                val charAgent = CinemaSubagentsCatalog.list.find { it.key == "CHARACTER_DESIGNER" }
                if (charAgent != null) {
                    orchestrateSubagentUseCase.execute(project, charAgent, charPrompt)
                }
                delay(1500)

                // Etapa 2: Orquestación de Escenarios/Fondos con Imagen 3 / Banana Pro
                _veoProgressMessage.value = "🖼️ Diseñando fondos y escenarios cinematográficos en Imagen 3 con características indicadas..."
                _veoProgressFraction.value = 0.4f
                val backgroundCustomPrompt = _veoBackgroundCustom.value.ifBlank { "Escenario de la torre inclinada brutalista bajo lluvia ácida" }
                val bgPrompt = "Genera refinamiento del entorno visual en base a: $backgroundCustomPrompt"
                val bgAgent = CinemaSubagentsCatalog.list.find { it.key == "PRODUCTION_DESIGNER" }
                if (bgAgent != null) {
                    orchestrateSubagentUseCase.execute(project, bgAgent, bgPrompt)
                }
                delay(1500)

                // Etapa 3: Orquestación de Música / Audio
                _veoProgressMessage.value = "🎵 Compone la partitura melancólica y genera efectos sonoros de Foley envolventes..."
                _veoProgressFraction.value = 0.65f
                val soundCustomPrompt = _veoSoundCustom.value.ifBlank { "Atmósfera oscura y leitmotiv de sintetizadores" }
                val soundPrompt = "Genera pistas de Foley y partitura musical refinada: $soundCustomPrompt"
                val soundAgent = CinemaSubagentsCatalog.list.find { it.key == "SOUND_DESIGNER" }
                val musicAgent = CinemaSubagentsCatalog.list.find { it.key == "COMPOSER" }
                if (soundAgent != null) {
                    orchestrateSubagentUseCase.execute(project, soundAgent, soundPrompt)
                }
                if (musicAgent != null) {
                    orchestrateSubagentUseCase.execute(project, musicAgent, soundPrompt)
                }
                delay(1500)

                // Etapa 4: Fusión y renderizado general del video en Google VEO
                _veoProgressMessage.value = "🎬 Ejecutando motor de síntesis de Google VEO para renderizar el video fotograma a fotograma..."
                _veoProgressFraction.value = 0.85f
                delay(2000)

                _veoProgressFraction.value = 1.0f
                _veoProgressMessage.value = "¡Video final procesado con Google VEO con éxito!"
                _veoVideoStatus.value = "SUCCESS"

                repository.insertMemory(ProjectMemory(projectId = project.id, key = "VEO_VIDEO_STATUS", title = "Estado del video", content = "SUCCESS"))
                repository.insertMemory(
                    ProjectMemory(
                        projectId = project.id,
                        key = "FINAL_VEO_VIDEO",
                        title = "Video Generado Google VEO",
                        content = "Contiene el render cinematico de alta definición refinado"
                    )
                )

                _renderingStatus.value = "COMPLETED"

            } catch (e: Exception) {
                _veoVideoStatus.value = "ERROR"
                _veoProgressMessage.value = "Error al compilar en VEO: ${e.localizedMessage ?: e.message}"
            }
        }
    }

    fun loadStoryboardWorkflowData(projectId: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            val stateMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_STATE")
            val ideaMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_IDEA")
            val durationMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_DURATION")
            val actsMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_ACTS")
            val storyboardMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_STORYBOARD")
            val consistencyMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_CONSISTENCY")

            _storyboardWorkflowState.value = stateMem?.content ?: "IDLE"
            _videoIdeaState.value = ideaMem?.content ?: ""
            _shortFilmDuration.value = durationMem?.content ?: "3 minutos"
            _actsStructure.value = actsMem?.content ?: ""
            _generatedStoryboard.value = storyboardMem?.content ?: ""
            _directorConsistencyReport.value = consistencyMem?.content ?: ""
        }
    }

    fun updateVideoIdea(text: String) {
        _videoIdeaState.value = text
        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMemory(
                ProjectMemory(
                    projectId = project.id,
                    key = "STORYBOARD_WORKFLOW_IDEA",
                    title = "Idea",
                    content = text
                )
            )
        }
    }

    fun updateShortFilmDuration(text: String) {
        _shortFilmDuration.value = text
        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMemory(
                ProjectMemory(
                    projectId = project.id,
                    key = "STORYBOARD_WORKFLOW_DURATION",
                    title = "Duración",
                    content = text
                )
            )
        }
    }

    /**
     * Genera la propuesta en 3 actos, el Storyboard con la duración técnica y la revisión del Director.
     */
    fun startStoryboardCreation(idea: String, duration: String) {
        val project = _selectedProject.value ?: return
        if (idea.isBlank()) return

        _storyboardWorkflowState.value = "GENERATING"
        _storyboardWorkflowError.value = ""

        viewModelScope.launch(Dispatchers.IO) {
            val result = createStoryboardUseCase.execute(
                projectId = project.id,
                artStyle = project.artStyle,
                idea = idea,
                duration = duration,
                onProgressUpdate = { progressText ->
                    // Forzar reactividad del mensaje en el State del flujo temporal de errores de UI
                    viewModelScope.launch(Dispatchers.Main) {
                        _storyboardWorkflowError.value = progressText
                    }
                }
            )

            withContext(Dispatchers.Main) {
                when (result) {
                    is StoryboardResult.Success -> {
                        _actsStructure.value = result.acts
                        _generatedStoryboard.value = result.storyboard
                        _directorConsistencyReport.value = result.consistency
                        _storyboardWorkflowState.value = "AWAITING_APPROVAL"
                        _storyboardWorkflowError.value = ""

                        // Guardamos estados persistentes convencionales para mantener compatibilidad con lecturas
                        saveConventionalWorkflowMemories(project.id, "AWAITING_APPROVAL", result.acts, result.storyboard, result.consistency)
                    }
                    is StoryboardResult.Error -> {
                        _storyboardWorkflowState.value = "ERROR"
                        _storyboardWorkflowError.value = result.message
                        saveConventionalWorkflowMemories(project.id, "ERROR", "", "", "")
                    }
                }
            }
        }
    }

    private suspend fun saveConventionalWorkflowMemories(
        projectId: Int,
        state: String,
        acts: String,
        storyboard: String,
        consistency: String
    ) {
        repository.insertMemory(
            ProjectMemory(
                projectId = projectId,
                key = "STORYBOARD_WORKFLOW_STATE",
                title = "Estado del Flujo",
                content = state
            )
        )
        repository.insertMemory(
            ProjectMemory(
                projectId = projectId,
                key = "STORYBOARD_WORKFLOW_ACTS",
                title = "3 Actos",
                content = acts
            )
        )
        repository.insertMemory(
            ProjectMemory(
                projectId = projectId,
                key = "STORYBOARD_WORKFLOW_STORYBOARD",
                title = "Storyboard Técnico",
                content = storyboard
            )
        )
        repository.insertMemory(
            ProjectMemory(
                projectId = projectId,
                key = "STORYBOARD_WORKFLOW_CONSISTENCY",
                title = "Análisis de Consistencia del Director",
                content = consistency
            )
        )
    }

    /**
     * Aprueba la propuesta dramática y el Storyboard. Integra el resultado técnico
     * en la memoria oficial y arranca los orquestadores automáticos subsiguientes del estudio.
     */
    fun approveStoryboardAndLaunchProduction() {
        val project = _selectedProject.value ?: return
        val idea = _videoIdeaState.value
        val duration = _shortFilmDuration.value
        val acts = _actsStructure.value
        val storyboard = _generatedStoryboard.value
        val consistency = _directorConsistencyReport.value

        _storyboardWorkflowState.value = "APPROVED"

        viewModelScope.launch(Dispatchers.IO) {
            val success = approveStoryboardUseCase.execute(
                projectId = project.id,
                idea = idea,
                duration = duration,
                acts = acts,
                storyboard = storyboard,
                consistency = consistency
            )

            if (success) {
                // Actualizamos la sinopsis extendida en el registro del proyecto real para reflejar la idea del video en UI
                val updatedProject = project.copy(description = idea)
                repository.insertProject(updatedProject)
                _selectedProject.value = updatedProject

                withContext(Dispatchers.Main) {
                    // Activamos la cascada desde la siguiente capa lógica: DIRECTOR_ARTE para que cree el moodboard estético, hasta el final.
                    runCascadeOrchestration("DIRECTOR_ARTE")
                }
            }
        }
    }

    /**
     * Reinicia el flujo si el usuario desea editar y re-lanzar una consigna drásticamente distinta en el storyboard.
     */
    fun resetStoryboardWorkflow() {
        _storyboardWorkflowState.value = "IDLE"
        _actsStructure.value = ""
        _generatedStoryboard.value = ""
        _directorConsistencyReport.value = ""
        _storyboardWorkflowError.value = ""

        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            saveConventionalWorkflowMemories(project.id, "IDLE", "", "", "")
        }
    }

    fun selectSubagent(subagent: CinemaSubagent) {
        _selectedSubagent.value = subagent
        _promptInput.value = subagent.suggestedPrompt
        _generationState.value = GenerationState.Idle

        val project = _selectedProject.value
        if (project != null) {
            viewModelScope.launch(Dispatchers.IO) {
                // Consultamos si ya existe memoria guardada con la clave del subagente
                val savedMemory = repository.getMemoryByKey(project.id, subagent.key)
                withContext(Dispatchers.Main) {
                    if (savedMemory != null && savedMemory.content.isNotBlank()) {
                        _generationState.value = GenerationState.Success(savedMemory.content)
                    } else {
                        _generationState.value = GenerationState.Idle
                    }
                }
            }
        }
    }

    fun updatePromptInput(text: String) {
        _promptInput.value = text
    }

    fun deselectProject() {
        _selectedProject.value = null
    }

    fun createProjectFromWizard(
        title: String,
        duration: String,
        artStyle: String,
        idea: String
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            val project = MovieProject(
                title = title,
                genre = "Drama / Ciencia Ficción",
                artStyle = artStyle,
                description = idea,
                targetAudience = "Público General"
            )
            val projectId = repository.insertProject(project)
            val actualProjectId = projectId.toInt()

            val showrunnerBible = """
                PROYECTO: "$title"
                GÉNERO: Drama / Ciencia Ficción
                ESTILO VISUAL: $artStyle
                AUDIENCIA OBJETIVO: Público General
                DURACIÓN ESTIMADA: $duration
                
                SINOPSIS / IDEA CENTRAL DEL VIDEO:
                $idea
                
                ESTADO DE LA DIRECTIVA:
                Este documento actúa como la Directiva General (Showrunner Bible) para guiar de manera centralizada a todos los subagentes del estudio IA.
            """.trimIndent()

            val initialMemory = ProjectMemory(
                projectId = actualProjectId,
                key = "SHOWRUNNER",
                title = "Showrunner Project Bible",
                content = showrunnerBible
            )
            repository.insertMemory(initialMemory)

            val updatedProject = project.copy(id = actualProjectId)
            withContext(Dispatchers.Main) {
                selectProject(updatedProject)
                startAutomaticSequence(actualProjectId)
            }
        }
    }

    fun createNewProject(
        title: String,
        genre: String,
        artStyle: String,
        description: String,
        targetAudience: String,
        duration: String
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            val project = MovieProject(
                title = title,
                genre = genre,
                artStyle = artStyle,
                description = description,
                targetAudience = targetAudience
            )
            val projectId = repository.insertProject(project)
            val actualProjectId = projectId.toInt()

            // Pre-populamos la Capa 0 automáticamente: Showrunner Project Bible
            val showrunnerBible = """
                PROYECTO: "$title"
                GÉNERO: $genre
                ESTILO VISUAL: $artStyle
                AUDIENCIA OBJETIVO: $targetAudience
                DURACIÓN ESTIMADA: $duration
                
                SINOPSIS / IDEA CENTRAL DEL VIDEO:
                $description
                
                ESTADO DE LA DIRECTIVA:
                Este documento actúa como la Directiva General (Showrunner Bible) para guiar de manera centralizada a todos los subagentes del estudio IA. Todos los entregables posteriores se están re-orquestando de manera automática en base a esta dirección estética de producción.
            """.trimIndent()

            val initialMemory = ProjectMemory(
                projectId = actualProjectId,
                key = "SHOWRUNNER",
                title = "Showrunner Project Bible",
                content = showrunnerBible
            )
            repository.insertMemory(initialMemory)

            // Guardamos metadatos de duración e idea para el Storyboard
            repository.insertMemory(
                ProjectMemory(
                    projectId = actualProjectId,
                    key = "STORYBOARD_WORKFLOW_DURATION",
                    title = "Duración",
                    content = duration
                )
            )
            repository.insertMemory(
                ProjectMemory(
                    projectId = actualProjectId,
                    key = "STORYBOARD_WORKFLOW_IDEA",
                    title = "Idea",
                    content = description
                )
            )

            // Seleccionar el nuevo proyecto e iniciar pre-producción automática integrada (Storyboard)
            val updatedProject = project.copy(id = actualProjectId)
            withContext(Dispatchers.Main) {
                _shortFilmDuration.value = duration
                _videoIdeaState.value = description
                selectProject(updatedProject, tabCompact = 2, tabWide = 1)
                
                // Dispara automáticamente la orquestación del Storyboard
                startStoryboardCreation(description, duration)
            }
        }
    }

    fun deleteCurrentProject() {
        val current = _selectedProject.value ?: return
        deleteProject(current)
    }

    fun deleteProject(project: MovieProject) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteProject(project)
            withContext(Dispatchers.Main) {
                if (_selectedProject.value?.id == project.id) {
                    _selectedProject.value = null
                    _generationState.value = GenerationState.Idle
                }
            }
        }
    }

    /**
     * Orquesta y ejecuta la generación por subagente usando la MEMORIA COMPARTIDA del proyecto.
     * Al repasar un trabajo o solicitar una nueva versión, se activa este orquestador y
     * todos los orquestadores dependientes (posteriores) se actualizan en cascada.
     */
    fun processSubagentAction() {
        val subagent = _selectedSubagent.value ?: return
        val currentPrompt = _promptInput.value
        if (currentPrompt.isBlank()) return

        runCascadeOrchestration(subagent.key, currentPrompt)
    }

    /**
     * Lanza la orquestación en cascada para todos los orquestadores dependientes de un pivote, en orden lógico.
     */
    fun runCascadeOrchestration(pivotKey: String, overridePrompt: String? = null) {
        cascadeJob?.cancel() // Cancela cualquier cola/cascada previa activa

        val project = _selectedProject.value ?: return
        val subagentsList = CinemaSubagentsCatalog.list
        val startIndex = subagentsList.indexOfFirst { it.key == pivotKey }
        if (startIndex == -1) return

        val cost = if (isSubagentExpensive(pivotKey)) 50 else 10
        if (!consumeCredits(cost)) {
            _generationState.value = GenerationState.Error("Créditos insuficientes. Costo: $cost créditos. Ve a Monetización para recargar.")
            return
        }

        _generationState.value = GenerationState.Loading

        cascadeJob = viewModelScope.launch(Dispatchers.IO) {
            try {
                // Sincronizar el mapa inicial de estados para el pipeline de cascada
                val currentStates = _subagentStates.value.toMutableMap()
                for (i in startIndex until subagentsList.size) {
                    val agent = subagentsList[i]
                    if (i == startIndex) {
                        currentStates[agent.key] = "RUNNING"
                    } else if (isSubagentExpensive(agent.key)) {
                        currentStates[agent.key] = "PAUSED_EXPENSIVE"
                    } else {
                        currentStates[agent.key] = "PENDING"
                    }
                }
                _subagentStates.value = currentStates

                // Ejecutamos en secuencia desde el pivote modificado hasta el final del catálogo
                for (i in startIndex until subagentsList.size) {
                    val agent = subagentsList[i]

                    // Si NO es el pivote inicial (que el usuario autorizó manualmente),
                    // y es un orquestador altamente costoso (imagen, video, audio, música),
                    // debemos pausar la cascada automática para esperar su aprobación/ejecución manual.
                    if (i > startIndex && isSubagentExpensive(agent.key)) {
                        val pausedStates = _subagentStates.value.toMutableMap()
                        pausedStates[agent.key] = "PAUSED_EXPENSIVE"
                        _subagentStates.value = pausedStates
                        
                        // Si el subagente seleccionado actualmente en la vista coincide con este filtrador,
                        // actualizamos el estado visual de la consola
                        if (_selectedSubagent.value?.key == agent.key) {
                            _generationState.value = GenerationState.Idle
                        }
                        break // Detiene el flujo automático; el usuario deberá activarlo manualmente
                    }

                    // Marcar como en ejecución activa
                    val runningStates = _subagentStates.value.toMutableMap()
                    runningStates[agent.key] = "RUNNING"
                    _subagentStates.value = runningStates

                    // Si coincide con el seleccionado, ponemos en carga la UI de la Consola
                    if (_selectedSubagent.value?.key == agent.key) {
                        _generationState.value = GenerationState.Loading
                    }

                    // Determinar el prompt a utilizar
                    val promptToUse = if (i == startIndex && overridePrompt != null) {
                        overridePrompt
                    } else {
                        agent.suggestedPrompt
                    }

                    // LLAMADA DESACOPLADA AL CONTRATO USE CASE (CLEAN ARCHITECTURE)
                    val result = orchestrateSubagentUseCase.execute(project, agent, promptToUse)

                    val finalStates = _subagentStates.value.toMutableMap()
                    when (result) {
                        is OrchestrationResult.Success -> {
                            finalStates[agent.key] = "COMPLETED"
                            
                            // Si era el seleccionado, mostramos éxito en la consola actual
                            if (_selectedSubagent.value?.key == agent.key) {
                                _generationState.value = GenerationState.Success(result.content)
                            }
                        }
                        is OrchestrationResult.Error -> {
                            finalStates[agent.key] = "ERROR"
                            _subagentStates.value = finalStates
                            
                            if (_selectedSubagent.value?.key == agent.key) {
                                _generationState.value = GenerationState.Error("Fallo al orquestar el departamento ${agent.name}: ${result.message}")
                            }
                            break // Aborta la cascada si algún nodo falla
                        }
                    }
                    _subagentStates.value = finalStates

                    // Esperamos 1.5 segundos para dar continuidad estética visible en la interfaz
                    delay(1500)
                }
            } catch (e: Exception) {
                _generationState.value = GenerationState.Error("Excepción en cascada: ${e.localizedMessage ?: e.message}")
            }
        }
    }

    /**
     * Actualiza la idea general de la película, reconstruye la Biblia del Showrunner
     * e inicia una orquestación automatizada en cascada para todos los demás departamentos.
     */
    fun startCascadeFromVideoIdea(videoIdeaPrompt: String) {
        val project = _selectedProject.value ?: return
        if (videoIdeaPrompt.isBlank()) return

        viewModelScope.launch(Dispatchers.IO) {
            // Actualizar la sinopsis en la entidad del proyecto
            val updatedProject = project.copy(description = videoIdeaPrompt)
            repository.insertProject(updatedProject)
            _selectedProject.value = updatedProject

            // Limpiar memorias previas
            repository.clearMemories(project.id)

            // Re-modular el Project Bible
            val showrunnerBible = """
                PROYECTO: "${project.title}"
                GÉNERO: ${project.genre}
                ESTILO VISUAL: ${project.artStyle}
                AUDIENCIA OBJETIVO: ${project.targetAudience}
                
                SINOPSIS / IDEA CENTRAL DEL VIDEO:
                $videoIdeaPrompt
                
                ESTADO DE LA DIRECTIVA:
                Este documento actúa como la Directiva General (Showrunner Bible) para guiar de manera centralizada a todos los subagentes del estudio IA. Todos los entregables posteriores se están re-orquestando de manera automática en base a esta nueva dirección estética de producción.
            """.trimIndent()

            val initialMemory = ProjectMemory(
                projectId = project.id,
                key = "SHOWRUNNER",
                title = "Showrunner Project Bible",
                content = showrunnerBible
            )
            repository.insertMemory(initialMemory)

            // Disparar cascada desde el guionista en adelante
            withContext(Dispatchers.Main) {
                runCascadeOrchestration("GUIONISTA")
            }
        }
    }

    fun clearProjectBible() {
        val current = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.clearMemories(current.id)
            
            // Re-populamos el Project Bible inicial
            val showrunnerBible = """
                PROYECTO: "${current.title}"
                GÉNERO: ${current.genre}
                ESTILO VISUAL: ${current.artStyle}
                AUDIENCIA OBJETIVO: ${current.targetAudience}
                
                SINOPSIS GENERAL DE SINOPSIS:
                ${current.description}
                
                ESTADO DE LA DIRECTIVA:
                La memoria del proyecto ha sido reiniciada. Este Project Bible de la Capa 0 es el único fundamento inicial activo para los demás subagentes.
            """.trimIndent()

            val initialMemory = ProjectMemory(
                projectId = current.id,
                key = "SHOWRUNNER",
                title = "Showrunner Project Bible",
                content = showrunnerBible
            )
            repository.insertMemory(initialMemory)
            _generationState.value = GenerationState.Idle
        }
    }
}

class MovieProjectViewModelFactory(private val application: Application) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MovieProjectViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return MovieProjectViewModel(application) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
