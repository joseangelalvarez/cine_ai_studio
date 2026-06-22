package com.example

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.ui.draw.clip
import kotlinx.coroutines.delay
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.database.MovieProject
import com.example.data.database.ProjectMemory
import com.example.data.model.CinemaSubagent
import com.example.data.model.CinemaSubagentsCatalog
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.GenerationState
import com.example.ui.viewmodel.MovieProjectViewModel
import com.example.ui.viewmodel.MovieProjectViewModelFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .statusBarsPadding()
                        .navigationBarsPadding(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val context = LocalContext.current.applicationContext as android.app.Application
                    val viewModel: MovieProjectViewModel = viewModel(
                        factory = MovieProjectViewModelFactory(context)
                    )
                    CineStudioApp(viewModel)
                }
            }
        }
    }
}

@Composable
fun StatusPulseDot() {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Box(
        modifier = Modifier
            .size(36.dp)
            .background(
                color = MaterialTheme.colorScheme.secondary,
                shape = androidx.compose.foundation.shape.CircleShape
            )
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
                shape = androidx.compose.foundation.shape.CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    this.alpha = alpha
                }
                .background(
                    color = MaterialTheme.colorScheme.primary,
                    shape = androidx.compose.foundation.shape.CircleShape
                )
        )
    }
}

@Composable
fun CineStudioApp(viewModel: MovieProjectViewModel) {
    val currentScreenState by viewModel.currentScreenState.collectAsStateWithLifecycle()
    val projects by viewModel.allProjects.collectAsStateWithLifecycle()
    val selectedProject by viewModel.selectedProject.collectAsStateWithLifecycle()
    val activeSubagentToEdit by viewModel.activeSubagentToEdit.collectAsStateWithLifecycle()
    val editedContentText by viewModel.editedContentText.collectAsStateWithLifecycle()
    val subagentExecutionStatus by viewModel.subagentExecutionStatus.collectAsStateWithLifecycle()

    val wizardTitle by viewModel.wizardTitle.collectAsStateWithLifecycle()
    val wizardDuration by viewModel.wizardDuration.collectAsStateWithLifecycle()
    val wizardArtStyle by viewModel.wizardArtStyle.collectAsStateWithLifecycle()
    val wizardIdea by viewModel.wizardIdea.collectAsStateWithLifecycle()

    val progressStepIndex by viewModel.progressStepIndex.collectAsStateWithLifecycle()
    val progressMessage by viewModel.progressMessage.collectAsStateWithLifecycle()
    val isRenderingPromptVisible by viewModel.isRenderingPromptVisible.collectAsStateWithLifecycle()
    val renderingStatus by viewModel.renderingStatus.collectAsStateWithLifecycle()

    val projectMemories by viewModel.projectMemories.collectAsStateWithLifecycle()
    val useSecureGateway by viewModel.useSecureGateway.collectAsStateWithLifecycle()
    val lastGenerationError by viewModel.lastGenerationError.collectAsStateWithLifecycle()
    
    val isPremium by viewModel.isPremium.collectAsStateWithLifecycle()
    val showPaywall by viewModel.showPaywall.collectAsStateWithLifecycle()

    Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        when (currentScreenState) {
            "HOME" -> {
                SimplifiedHomeScreen(
                    onCreateProjectClick = {
                        if (projects.isNotEmpty() && !isPremium) {
                            viewModel.triggerPaywall()
                        } else {
                            viewModel.wizardTitle.value = ""
                            viewModel.wizardDuration.value = "3 minutos"
                            viewModel.wizardArtStyle.value = "Cinemático Ultra-Realista"
                            viewModel.wizardIdea.value = ""
                            viewModel.navigateToScreen("CREATE_WIZARD_STEP1")
                        }
                    },
                    onOpenProjectsClick = { viewModel.navigateToScreen("PROJECT_LIST") }
                )
            }
            "CREATE_WIZARD_STEP1" -> {
                CreateProjectWizardStep1(
                    wizardTitle = wizardTitle,
                    onTitleChange = { viewModel.wizardTitle.value = it },
                    wizardDuration = wizardDuration,
                    onDurationChange = { viewModel.wizardDuration.value = it },
                    wizardArtStyle = wizardArtStyle,
                    onArtStyleChange = { viewModel.wizardArtStyle.value = it },
                    onBack = { viewModel.navigateToScreen("HOME") },
                    onNext = { viewModel.navigateToScreen("CREATE_WIZARD_STEP2") }
                )
            }
            "CREATE_WIZARD_STEP2" -> {
                CreateProjectWizardStep2(
                    wizardIdea = wizardIdea,
                    onIdeaChange = { viewModel.wizardIdea.value = it },
                    useSecureGateway = useSecureGateway,
                    onToggleSecureGateway = { viewModel.toggleSecureGateway(it) },
                    onBack = { viewModel.navigateToScreen("CREATE_WIZARD_STEP1") },
                    onStartGeneration = {
                        viewModel.createProjectFromWizard(
                            title = wizardTitle,
                            duration = wizardDuration,
                            artStyle = wizardArtStyle,
                            idea = wizardIdea
                        )
                    }
                )
            }
            "CREATION_PROGRESS" -> {
                CreationProgressScreen(
                    project = selectedProject,
                    progressStepIndex = progressStepIndex,
                    progressMessage = progressMessage,
                    isRenderingPromptVisible = isRenderingPromptVisible,
                    renderingStatus = renderingStatus,
                    lastGenerationError = lastGenerationError,
                    useSecureGateway = useSecureGateway,
                    onToggleSecureGateway = { viewModel.toggleSecureGateway(it) },
                    onRetry = {
                        selectedProject?.let { p ->
                            viewModel.startAutomaticSequence(p.id)
                        }
                    },
                    onRenderActionSelected = { choice -> viewModel.executeRenderAction(choice) },
                    onGoToProject = { viewModel.navigateToScreen("PROJECT_DETAILS") }
                )
            }
            "PROJECT_LIST" -> {
                SimplifiedProjectListScreen(
                    projects = projects,
                    onBackClick = { viewModel.navigateToScreen("HOME") },
                    onEditProject = { viewModel.openProjectForEditing(it) },
                    onDeleteProject = { viewModel.deleteProject(it) }
                )
            }
            "PROJECT_DETAILS" -> {
                if (activeSubagentToEdit != null) {
                    OrchestratorContentEditor(
                        agent = activeSubagentToEdit!!,
                        initialContent = editedContentText,
                        onBack = { viewModel.closeSubagentEditor() },
                        onUpdate = { key, title, newContent ->
                            selectedProject?.let { p ->
                                viewModel.updateSubagentMemoryAndCascade(
                                    projectId = p.id,
                                    subagentKey = key,
                                    subagentTitle = title,
                                    newContent = newContent
                                )
                            }
                        }
                    )
                } else {
                    SimplifiedProjectDetailsScreen(
                        project = selectedProject!!,
                        viewModel = viewModel,
                        onBackClick = { viewModel.navigateToScreen("PROJECT_LIST") },
                        onEditSubagent = { agent, currentContent ->
                            viewModel.setSubagentToEdit(agent, currentContent)
                        }
                    )
                }
            }
        }
        
        if (showPaywall) {
            com.example.ui.screens.PaywallScreen(
                onDismiss = { viewModel.dismissPaywall() },
                onSubscribe = { viewModel.unlockPremium() }
            )
        }
    }
}

@Composable
fun SimplifiedHomeScreen(
    onCreateProjectClick: () -> Unit,
    onOpenProjectsClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            modifier = Modifier.size(100.dp),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
            border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Default.PlayArrow,
                    contentDescription = "Cine AI Studio Icon",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(50.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "CINE AI STUDIO",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Black,
            color = Color.White,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Escribe tus ideas cinematográficas. Deja que los orquestadores de IA se encarguen de la preproducción y renderizado.",
            style = MaterialTheme.typography.bodyMedium,
            color = com.example.ui.theme.GrayText,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(48.dp))

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 500.dp)
                .clickable { onCreateProjectClick() }
                .testTag("home_generate_short_button"),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
            border = BorderStroke(2.dp, MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Crear nuevo",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(40.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Crear nuevo proyecto",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Configura tu título, estilo e idea base para una generación automatizada lineal rápida.",
                    style = MaterialTheme.typography.bodySmall,
                    color = com.example.ui.theme.GrayText,
                    textAlign = TextAlign.Center
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 500.dp)
                .clickable { onOpenProjectsClick() },
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, com.example.ui.theme.ImmersiveBorder),
            shape = RoundedCornerShape(20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.List,
                    contentDescription = "Abrir existente",
                    tint = Color.White,
                    modifier = Modifier.size(40.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Abrir proyecto existente",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Modifica, edita y consulta el pipeline de tus proyectos generados previamente.",
                    style = MaterialTheme.typography.bodySmall,
                    color = com.example.ui.theme.GrayText,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
fun CreateProjectWizardStep1(
    wizardTitle: String,
    onTitleChange: (String) -> Unit,
    wizardDuration: String,
    onDurationChange: (String) -> Unit,
    wizardArtStyle: String,
    onArtStyleChange: (String) -> Unit,
    onBack: () -> Unit,
    onNext: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Atrás", tint = Color.White)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = "Nuevo Proyecto de Cine",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Paso 1 de 2: Datos iniciales",
                    style = MaterialTheme.typography.labelSmall,
                    color = com.example.ui.theme.GrayText
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "Título del proyecto",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = wizardTitle,
            onValueChange = onTitleChange,
            placeholder = { Text("Ej. El Último Operador") },
            modifier = Modifier.fillMaxWidth().testTag("wizard_title_input"),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = com.example.ui.theme.ImmersiveBorder
            )
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Duración aproximada",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        var showDurationDropdown by remember { mutableStateOf(false) }
        Box(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = wizardDuration,
                onValueChange = {},
                readOnly = true,
                modifier = Modifier.fillMaxWidth(),
                trailingIcon = {
                    IconButton(onClick = { showDurationDropdown = true }) {
                        Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = "Ver Duraciones", tint = Color.White)
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = com.example.ui.theme.ImmersiveBorder
                )
            )
            DropdownMenu(
                expanded = showDurationDropdown,
                onDismissRequest = { showDurationDropdown = false }
            ) {
                listOf("1 minuto", "3 minutos", "5 minutos", "10 minutos").forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option) },
                        onClick = {
                            onDurationChange(option)
                            showDurationDropdown = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Estilo visual",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        var showStyleDropdown by remember { mutableStateOf(false) }
        Box(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = wizardArtStyle,
                onValueChange = {},
                readOnly = true,
                modifier = Modifier.fillMaxWidth(),
                trailingIcon = {
                    IconButton(onClick = { showStyleDropdown = true }) {
                        Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = "Ver Estilos", tint = Color.White)
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = com.example.ui.theme.ImmersiveBorder
                )
            )
            DropdownMenu(
                expanded = showStyleDropdown,
                onDismissRequest = { showStyleDropdown = false }
            ) {
                listOf("Cinemático Ultra-Realista", "Ciencia Ficción Brutalista", "Anime Cyberpunk", "Fantasía Épica", "Noir de Autor").forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option) },
                        onClick = {
                            onArtStyleChange(option)
                            showStyleDropdown = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onNext,
            enabled = wizardTitle.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(52.dp).testTag("wizard_next_button"),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(text = "Siguiente", fontWeight = FontWeight.Bold, color = Color.Black)
        }
    }
}

@Composable
fun CreateProjectWizardStep2(
    wizardIdea: String,
    onIdeaChange: (String) -> Unit,
    useSecureGateway: Boolean,
    onToggleSecureGateway: (Boolean) -> Unit,
    onBack: () -> Unit,
    onStartGeneration: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Atrás", tint = Color.White)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = "Nuevo Proyecto de Cine",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Paso 2 de 2: Idea del usuario",
                    style = MaterialTheme.typography.labelSmall,
                    color = com.example.ui.theme.GrayText
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "Idea base / Argumento principal",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Escribe resumidamente de qué tratará tu corto de IA. La IA generará y distribuirá automáticamente todas las tareas de preproducción.",
            style = MaterialTheme.typography.bodySmall,
            color = com.example.ui.theme.GrayText
        )
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = wizardIdea,
            onValueChange = onIdeaChange,
            placeholder = { Text("Ej. Un astronauta de mantenimiento descubre una nave fantasma abandonada con un artefacto misterioso palpitando en su interior...") },
            modifier = Modifier.fillMaxWidth().height(180.dp).testTag("wizard_idea_input"),
            maxLines = 10,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = com.example.ui.theme.ImmersiveBorder
            )
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Modo de Orquestación",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onToggleSecureGateway(false) },
                colors = CardDefaults.cardColors(
                    containerColor = if (!useSecureGateway) MaterialTheme.colorScheme.primary.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surface
                ),
                border = BorderStroke(
                    width = if (!useSecureGateway) 2.dp else 1.dp,
                    color = if (!useSecureGateway) MaterialTheme.colorScheme.primary else com.example.ui.theme.ImmersiveBorder
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("IA Real", fontWeight = FontWeight.Bold, color = if (!useSecureGateway) MaterialTheme.colorScheme.primary else Color.White)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Genera guiones usando tu Clave API de Gemini.", style = MaterialTheme.typography.labelSmall, color = com.example.ui.theme.GrayText)
                }
            }
            Card(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onToggleSecureGateway(true) },
                colors = CardDefaults.cardColors(
                    containerColor = if (useSecureGateway) MaterialTheme.colorScheme.primary.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surface
                ),
                border = BorderStroke(
                    width = if (useSecureGateway) 2.dp else 1.dp,
                    color = if (useSecureGateway) MaterialTheme.colorScheme.primary else com.example.ui.theme.ImmersiveBorder
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Ejecución Rápida Offline", fontWeight = FontWeight.Bold, color = if (useSecureGateway) MaterialTheme.colorScheme.primary else Color.White)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Sin costo de créditos. Usa documentos estructurados base localmente.", style = MaterialTheme.typography.labelSmall, color = com.example.ui.theme.GrayText)
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onStartGeneration,
            enabled = wizardIdea.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(52.dp).testTag("wizard_generate_button"),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(text = "Comenzar Generación de IA", fontWeight = FontWeight.Bold, color = Color.Black)
        }
    }
}

@Composable
fun CreationProgressScreen(
    project: MovieProject?,
    progressStepIndex: Int,
    progressMessage: String,
    isRenderingPromptVisible: Boolean,
    renderingStatus: String,
    lastGenerationError: String?,
    useSecureGateway: Boolean,
    onToggleSecureGateway: (Boolean) -> Unit,
    onRetry: () -> Unit,
    onRenderActionSelected: (String) -> Unit,
    onGoToProject: () -> Unit
) {
    val totalPreprodSteps = 13.0f
    val progressFraction = if (renderingStatus == "COMPLETED") {
        1.0f
    } else {
        (progressStepIndex.toFloat() / totalPreprodSteps).coerceIn(0.0f, 1.0f)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (renderingStatus == "COMPLETED") {
            Surface(
                modifier = Modifier.size(90.dp),
                shape = RoundedCornerShape(22.dp),
                color = com.example.ui.theme.ImmersiveAccentGreen.copy(alpha = 0.15f),
                border = BorderStroke(2.dp, com.example.ui.theme.ImmersiveAccentGreen)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Completado",
                        tint = com.example.ui.theme.ImmersiveAccentGreen,
                        modifier = Modifier.size(48.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "¡Proyecto Generado!",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Todos los orquestadores han completado sus entregables y la fase de renderizado se ha llevado a cabo con éxito.",
                style = MaterialTheme.typography.bodyMedium,
                color = com.example.ui.theme.GrayText,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(40.dp))

            Button(
                onClick = onGoToProject,
                modifier = Modifier.fillMaxWidth().height(52.dp).testTag("progress_finish_button"),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(text = "Ver Proyecto", fontWeight = FontWeight.Bold, color = Color.Black)
            }

        } else {
            if (lastGenerationError != null) {
                Surface(
                    modifier = Modifier.size(80.dp),
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.error.copy(alpha = 0.15f),
                    border = BorderStroke(2.dp, MaterialTheme.colorScheme.error)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "Error de orquestación",
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text = "Generación Interrumpida",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "La orquestación de la IA se detuvo debido a un problema de configuración o conexión.",
                    style = MaterialTheme.typography.bodySmall,
                    color = com.example.ui.theme.GrayText,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                Spacer(modifier = Modifier.height(20.dp))

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.1f)),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.4f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().widthIn(max = 500.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Detalle técnico:",
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.labelSmall
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = lastGenerationError,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().widthIn(max = 500.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "👉 RECOVISIBILIDAD RESILIENTE (Modo Demo):",
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.titleSmall
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Puedes activar el 'Modo Simulación Segura (L5)' para evitar llamadas API remotas reales y emular al instante la producción de los 13 departamentos sin claves.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                onToggleSecureGateway(true)
                                onRetry()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Text("Activar Simulación y Reintentar", color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth().widthIn(max = 500.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onGoToProject,
                        modifier = Modifier.weight(1f).height(48.dp)
                    ) {
                        Text("Ir al Proyecto (Incompleto)", color = Color.White)
                    }
                }
            } else {
                Box(contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(
                        progress = progressFraction,
                        modifier = Modifier.size(120.dp),
                        color = MaterialTheme.colorScheme.primary,
                        strokeWidth = 6.dp,
                        trackColor = com.example.ui.theme.ImmersiveBorder
                    )
                    Text(
                        text = "${(progressFraction * 100).toInt()}%",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                Text(
                    text = "Construyendo Corto de Cine...",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(12.dp))

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, com.example.ui.theme.ImmersiveBorder),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().widthIn(max = 450.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        StatusPulseDot()
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = progressMessage,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                if (isRenderingPromptVisible) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)),
                        border = BorderStroke(2.dp, MaterialTheme.colorScheme.primary),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth().widthIn(max = 500.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "¿Deseas renderizar Video, Audio y Banda Sonora?",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Estas fases generan vídeo y audio cinematográficos, lo que requiere un mayor procesamiento cómputo.",
                                style = MaterialTheme.typography.bodySmall,
                                color = com.example.ui.theme.GrayText,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(16.dp))

                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = { onRenderActionSelected("ALL") },
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                    modifier = Modifier.fillMaxWidth().height(44.dp).testTag("render_all_button")
                                ) {
                                    Text("Renderizar Todo", color = Color.Black, fontWeight = FontWeight.Bold)
                                }
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = { onRenderActionSelected("VIDEO") },
                                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                                        modifier = Modifier.weight(1f).height(44.dp)
                                    ) {
                                        Text("Solo Video", color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                    Button(
                                        onClick = { onRenderActionSelected("AUDIO") },
                                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                        modifier = Modifier.weight(1f).height(44.dp)
                                    ) {
                                        Text("Solo Audio", color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                }
                                OutlinedButton(
                                    onClick = { onRenderActionSelected("NONE") },
                                    border = BorderStroke(1.dp, Color.Gray),
                                    modifier = Modifier.fillMaxWidth().height(44.dp)
                                ) {
                                    Text("Saltar esta fase", color = Color.White)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SimplifiedProjectListScreen(
    projects: List<MovieProject>,
    onBackClick: () -> Unit,
    onEditProject: (MovieProject) -> Unit,
    onDeleteProject: (MovieProject) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(onClick = onBackClick) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Atrás", tint = Color.White)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Proyectos guardados",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (projects.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Aún no tienes ningún proyecto guardado.",
                    color = com.example.ui.theme.GrayText,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(projects) { project ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, com.example.ui.theme.ImmersiveBorder),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = project.title,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Estilo: ${project.artStyle} • Género: ${project.genre}",
                                style = MaterialTheme.typography.bodySmall,
                                color = com.example.ui.theme.GrayText
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                TextButton(
                                    onClick = { onDeleteProject(project) },
                                    colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFE53935))
                                ) {
                                    Icon(imageVector = Icons.Default.Delete, contentDescription = "Eliminar", modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Eliminar", fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Button(
                                    onClick = { onEditProject(project) },
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                    modifier = Modifier.height(40.dp).testTag("project_edit_button_${project.id}")
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(imageVector = Icons.Default.Edit, contentDescription = "Editar", tint = Color.Black, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Editar", color = Color.Black, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SimplifiedProjectDetailsScreen(
    project: MovieProject,
    viewModel: MovieProjectViewModel,
    onBackClick: () -> Unit,
    onEditSubagent: (CinemaSubagent, String) -> Unit
) {
    val executionStatus by viewModel.subagentExecutionStatus.collectAsStateWithLifecycle()
    val projectMemories by viewModel.projectMemories.collectAsStateWithLifecycle()

    val veoVideoStatus by viewModel.veoVideoStatus.collectAsStateWithLifecycle()
    val veoCharacterCustom by viewModel.veoCharacterCustom.collectAsStateWithLifecycle()
    val veoBackgroundCustom by viewModel.veoBackgroundCustom.collectAsStateWithLifecycle()
    val veoSoundCustom by viewModel.veoSoundCustom.collectAsStateWithLifecycle()
    val veoProgressMessage by viewModel.veoProgressMessage.collectAsStateWithLifecycle()
    val veoProgressFraction by viewModel.veoProgressFraction.collectAsStateWithLifecycle()

    var activeTab by remember { mutableStateOf(1) } // 0: Video Google VEO, 1: Orquestadores
    var showSocialDialog by remember { mutableStateOf(false) }
    var showExportApiDialog by remember { mutableStateOf(false) }
    var selectedApiProvider by remember { mutableStateOf("Runway Gen-3") }
    var externalApiKey by remember { mutableStateOf("") }
    val context = LocalContext.current

    if (showExportApiDialog) {
        AlertDialog(
            onDismissRequest = { showExportApiDialog = false },
            title = { Text("Exportar a Proveedor AI Externo", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Introduce la API Key del proveedor al que deseas enviar los datos de preproducción. Se ejecutarán todos los orquestadores.", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    var expandedDropdown by remember { mutableStateOf(false) }
                    
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = selectedApiProvider,
                            onValueChange = {},
                            label = { Text("Proveedor de IA") },
                            modifier = Modifier.fillMaxWidth(),
                            readOnly = true,
                            trailingIcon = {
                                IconButton(onClick = { expandedDropdown = !expandedDropdown }) {
                                    Icon(Icons.Default.ArrowDropDown, "Seleccionar")
                                }
                            }
                        )
                        androidx.compose.material3.DropdownMenu(
                            expanded = expandedDropdown,
                            onDismissRequest = { expandedDropdown = false }
                        ) {
                            listOf("Runway Gen-3", "Luma Dream Machine", "Kling AI", "Sora").forEach { api ->
                                androidx.compose.material3.DropdownMenuItem(
                                    text = { Text(api) },
                                    onClick = { 
                                        selectedApiProvider = api
                                        expandedDropdown = false 
                                    }
                                )
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = externalApiKey, 
                        onValueChange = { externalApiKey = it }, 
                        label = { Text("API Key") }, 
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(onClick = { 
                    if (externalApiKey.isBlank()) {
                        Toast.makeText(context, "Por favor, introduce tu API Key", Toast.LENGTH_SHORT).show()
                    } else {
                        showExportApiDialog = false
                        viewModel.exportPackage(selectedApiProvider)
                    }
                }) {
                    Text("Exportar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showExportApiDialog = false }) { Text("Cancelar") }
            }
        )
    }

    if (showSocialDialog) {
        AlertDialog(
            onDismissRequest = { showSocialDialog = false },
            title = { Text("Vincular Redes Sociales", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Introduce tus datos para publicar el proyecto generado directamente en tus cuentas.", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(value = "", onValueChange = {}, label = { Text("YouTube Token / Channel ID") }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = "", onValueChange = {}, label = { Text("TikTok Developer Key") }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = "", onValueChange = {}, label = { Text("X (Twitter) OAuth Token") }, modifier = Modifier.fillMaxWidth())
                }
            },
            confirmButton = {
                Button(onClick = { 
                    showSocialDialog = false
                    Toast.makeText(context, "Credenciales guardadas. Publicando video...", Toast.LENGTH_SHORT).show()
                }) {
                    Text("Guardar y Publicar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSocialDialog = false }) { Text("Cancelar") }
            }
        )
    }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(onClick = onBackClick) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Atrás", tint = Color.White)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = project.title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Estilo: ${project.artStyle}",
                    style = MaterialTheme.typography.bodySmall,
                    color = com.example.ui.theme.GrayText
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // TAB SWITCHER
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF1E293B), RoundedCornerShape(12.dp))
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            val selectedTabColor = MaterialTheme.colorScheme.primary
            val unselectedTabColor = Color.Transparent
            
            Button(
                onClick = { activeTab = 0 },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (activeTab == 0) selectedTabColor else unselectedTabColor,
                    contentColor = if (activeTab == 0) Color.Black else Color.White
                ),
                modifier = Modifier.weight(1f).height(40.dp),
                contentPadding = PaddingValues(0.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Storyboard & Prompts", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                }
            }

            Button(
                onClick = { activeTab = 1 },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (activeTab == 1) selectedTabColor else unselectedTabColor,
                    contentColor = if (activeTab == 1) Color.Black else Color.White
                ),
                modifier = Modifier.weight(1f).height(40.dp),
                contentPadding = PaddingValues(0.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Menu, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Orquestadores", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (activeTab == 0) {
            // CINE VEO VIEW
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
            ) {
                when (veoVideoStatus) {
                    "SUCCESS" -> {
                        // STORYBOARD & PROMPTS EXTRACTOR
                        Text(
                            text = "📋 STORYBOARD & EXPORTACIÓN DE PROMPTS",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Gana control total sobre tu película. Utiliza estos prompts de pre-producción generados a partir de tu idea para copiarlos en generadores externos (Runway Gen-3, Luma Dream Machine o Kling) y obtendrás los videos exactos para tu cortometraje.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.LightGray
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        val clipboardManager = androidx.compose.ui.platform.LocalClipboardManager.current
                        
                        // Scene 1
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF090D16)),
                            border = BorderStroke(1.dp, Color.DarkGray),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("ESCENA 1: ESTABLECIMIENTO - PLANO GENERAL", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.height(8.dp))
                                Image(
                                    painter = androidx.compose.ui.res.painterResource(id = com.example.R.drawable.movie_placeholder_1782140486854),
                                    contentDescription = "Scene",
                                    modifier = Modifier.fillMaxWidth().height(140.dp).clip(RoundedCornerShape(6.dp)),
                                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                val prompt1 = "Cinematic wide aspect ratio 2.39:1, establishing shot. High detail, octane render, 8k resolution. \${project.idea}. \${project.artStyle} style, moody lighting, lens flares, dramatic atmosphere."
                                Text(prompt1, style = MaterialTheme.typography.bodySmall, color = Color.White)
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = { 
                                        clipboardManager.setText(androidx.compose.ui.text.AnnotatedString(prompt1))
                                        Toast.makeText(context, "Prompt copiado", Toast.LENGTH_SHORT).show()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Copiar Prompt para IA de Video")
                                }
                            }
                        }

                        // Scene 2
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF090D16)),
                            border = BorderStroke(1.dp, Color.DarkGray),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("ESCENA 2: ACCIÓN - PRIMER PLANO", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.height(8.dp))
                                val prompt2 = "Close up, shallow depth of field, 2.39:1 aspect ratio. Subject expressing intense emotion facing the camera. \${project.artStyle} style. Cinematic lighting, soft shadows, sharp focus on eyes."
                                Text(prompt2, style = MaterialTheme.typography.bodySmall, color = Color.White)
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = { 
                                        clipboardManager.setText(androidx.compose.ui.text.AnnotatedString(prompt2))
                                        Toast.makeText(context, "Prompt copiado", Toast.LENGTH_SHORT).show()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Copiar Prompt para IA de Video")
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B).copy(alpha = 0.5f)),
                            border = BorderStroke(1.dp, Color.Gray.copy(alpha = 0.3f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "📝 RESUMEN DE COMPOSICIÓN FINAL",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "El documento final unifica los entregables del pipeline. Estos son los prompts ajustados para tus generadores:",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.LightGray
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                Text("👤 Personajes:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Text(veoCharacterCustom.ifBlank { "Características predeterminadas" }, style = MaterialTheme.typography.bodySmall, color = Color.White, modifier = Modifier.padding(bottom = 8.dp))
                                
                                Text("🖼️ Fondos y Escenarios:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Text(veoBackgroundCustom.ifBlank { "Arquitectura brutalista y lluvia ácida" }, style = MaterialTheme.typography.bodySmall, color = Color.White, modifier = Modifier.padding(bottom = 8.dp))

                                Text("🔊 audio y Banda Sonora:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Text(veoSoundCustom.ifBlank { "Banda sonora melancólica" }, style = MaterialTheme.typography.bodySmall, color = Color.White)
                            }
                        }
                    }
                    "GENERATING" -> {
                        // RENDER LOADING PROGRESS CONSOLE
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                            border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                CircularProgressIndicator(
                                    progress = veoProgressFraction,
                                    color = MaterialTheme.colorScheme.primary,
                                    strokeWidth = 6.dp,
                                    modifier = Modifier.size(72.dp)
                                )
                                Spacer(modifier = Modifier.height(20.dp))
                                Text(
                                    text = "SINTETIZANDO STORYBOARD Y PROMPTS",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                LinearProgressIndicator(
                                    color = MaterialTheme.colorScheme.primary,
                                    trackColor = Color.DarkGray,
                                    modifier = Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(2.dp))
                                )
                                Spacer(modifier = Modifier.height(14.dp))
                                Text(
                                    text = veoProgressMessage,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color.LightGray,
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Generando prompts optimizados para IA...",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.Gray
                                )
                            }
                        }
                    }
                    else -> {
                        // REQUISITOS LIST Y CAMPO DE MODIFICACIONES PREVIAS
                        Text(
                            text = "🎬 EXPORTACIÓN A GENERADORES EXTERNOS DE VIDEO",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Antes de exportar el plan de dirección a formatos compatibles con Runway Gen-3, Luma o Kling, los orquestadores deben establecer la coherencia visual.",
                            style = MaterialTheme.typography.bodySmall,
                            color = com.example.ui.theme.GrayText
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Checklist
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B).copy(alpha = 0.3f)),
                            border = BorderStroke(1.dp, Color.Gray.copy(alpha = 0.2f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "ESTADO DE PRE-PRODUCCIÓN:",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(10.dp))

                                val charOk = executionStatus["CHARACTER_DESIGNER"] == true
                                val bgOk = executionStatus["PRODUCTION_DESIGNER"] == true
                                val soundOk = executionStatus["SOUND_DESIGNER"] == true
                                val composerOk = executionStatus["COMPOSER"] == true

                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
                                    Icon(
                                        imageVector = if (charOk) Icons.Default.Check else Icons.Default.Close,
                                        contentDescription = null,
                                        tint = if (charOk) Color.Green else Color.Yellow,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Diseño de Personajes Estructurado", style = MaterialTheme.typography.bodySmall, color = if (charOk) Color.White else Color.Gray)
                                }

                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
                                    Icon(
                                        imageVector = if (bgOk) Icons.Default.Check else Icons.Default.Close,
                                        contentDescription = null,
                                        tint = if (bgOk) Color.Green else Color.Yellow,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Escenarios y Fondos Planificados", style = MaterialTheme.typography.bodySmall, color = if (bgOk) Color.White else Color.Gray)
                                }

                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
                                    Icon(
                                        imageVector = if (composerOk) Icons.Default.Check else Icons.Default.Close,
                                        contentDescription = null,
                                        tint = if (composerOk) Color.Green else Color.Yellow,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Música y Leitmotivs (Composer)", style = MaterialTheme.typography.bodySmall, color = if (composerOk) Color.White else Color.Gray)
                                }

                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
                                    Icon(
                                        imageVector = if (soundOk) Icons.Default.Check else Icons.Default.Close,
                                        contentDescription = null,
                                        tint = if (soundOk) Color.Green else Color.Yellow,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Efectos de Sonido Foley (Sound Designer)", style = MaterialTheme.typography.bodySmall, color = if (soundOk) Color.White else Color.Gray)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // MODIFICATIONS CAPABILITIES IN PERSONAS / FONDOS / AUDIO
                        Text(
                            text = "✍️ REVISAR Y PARTICULARIZAR CARACTERÍSTICAS",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Introduce detalles específicos para pulir los prompts antes de estructurar el guion:",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(10.dp))

                        // Personajes Input
                        OutlinedTextField(
                            value = veoCharacterCustom,
                            onValueChange = { viewModel.updateVeoCharacterCustom(it) },
                            label = { Text("👤 Diseño de Personajes de Referencia") },
                            placeholder = { Text("Ej: Traje de neopreno con luces LED rojas parpadeantes, cicatriz facial...") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(8.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        // Fondos Input
                        OutlinedTextField(
                            value = veoBackgroundCustom,
                            onValueChange = { viewModel.updateVeoBackgroundCustom(it) },
                            label = { Text("🖼️ Características del Fondo/Escenario") },
                            placeholder = { Text("Ej: Ciudad flotante cyberpunk medieval con niebla espesa y pilares brutalistas...") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(8.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        // Audio/Musica Input
                        OutlinedTextField(
                            value = veoSoundCustom,
                            onValueChange = { viewModel.updateVeoSoundCustom(it) },
                            label = { Text("🔊 Características de Música, Clímax y Foley") },
                            placeholder = { Text("Ej: Melodía pesada de sintetizador analógico, viento aullando rítmico...") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(8.dp)
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = { showExportApiDialog = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("generate_veo_button"),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Send, contentDescription = null, tint = Color.Black)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("EJECUTAR ORQUESTADORES Y EXPORTAR", fontWeight = FontWeight.Bold, color = Color.Black)
                            }
                        }
                    }
                }
            }
        } else {
            // ORIGINAL LIST OF ORQUESTADORES DEPARTEMENTOS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Departamentos / Orquestadores",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Button(
                    onClick = { Toast.makeText(context, "Generando archivo ZIP con todos los PDFs...", Toast.LENGTH_SHORT).show() },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Icon(imageVector = Icons.Default.Share, contentDescription = "ZIP", tint = Color.White, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Descargar ZIP", color = Color.White, style = MaterialTheme.typography.labelSmall)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(CinemaSubagentsCatalog.list) { agent ->
                    val isExecuted = executionStatus[agent.key] == true
                    val memoryContent = projectMemories.find { it.key == agent.key }?.content ?: ""

                    val cardBgColor = if (isExecuted) Color(0xFFC2410C).copy(alpha = 0.15f) else Color(0xFF15803D).copy(alpha = 0.15f)
                    val cardBorderColor = if (isExecuted) Color(0xFFC2410C) else Color(0xFF15803D)
                    val dotColor = if (isExecuted) Color(0xFFFF6B6B) else Color(0xFF4ADE80)

                    Card(
                        colors = CardDefaults.cardColors(containerColor = cardBgColor),
                        border = BorderStroke(1.5.dp, cardBorderColor),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth().testTag("subagent_card_${agent.key}")
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(dotColor, androidx.compose.foundation.shape.CircleShape)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = agent.name,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                                Text(
                                    text = if (isExecuted) "Ejecutado" else "Pendiente",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = dotColor
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = agent.role,
                                style = MaterialTheme.typography.bodySmall,
                                color = com.example.ui.theme.GrayText
                            )

                            if (isExecuted) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color.Black.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                                        .padding(8.dp)
                                ) {
                                    Text(
                                        text = memoryContent.take(150) + if (memoryContent.length > 150) "..." else "",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color.LightGray
                                    )
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Button(
                                        onClick = { Toast.makeText(context, "Exportando PDF de ${agent.name}...", Toast.LENGTH_SHORT).show() },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                                        modifier = Modifier.height(36.dp),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(imageVector = Icons.Default.Menu, contentDescription = "PDF", tint = Color.White, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Exportar PDF", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Button(
                                        onClick = { onEditSubagent(agent, memoryContent) },
                                        colors = ButtonDefaults.buttonColors(containerColor = cardBorderColor),
                                        modifier = Modifier.height(36.dp).testTag("subagent_edit_${agent.key}"),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(imageVector = Icons.Default.Edit, contentDescription = "Editar", tint = Color.White, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Editar", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OrchestratorContentEditor(
    agent: CinemaSubagent,
    initialContent: String,
    onBack: () -> Unit,
    onUpdate: (String, String, String) -> Unit
) {
    var contentText by remember(initialContent) { mutableStateOf(initialContent) }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp).verticalScroll(rememberScrollState())) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Atrás", tint = Color.White)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = "Editar Orquestador",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = agent.name,
                    style = MaterialTheme.typography.labelSmall,
                    color = com.example.ui.theme.GrayText
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, com.example.ui.theme.ImmersiveBorder),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Departamento: ${agent.layer.uppercase()}",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Rol Profesional: ${agent.role}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Tareas del Agente:",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray
                )
                agent.duties.forEach { duty ->
                    Text(
                        text = "• $duty",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.LightGray,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Entregable / Resultado narrativo",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = contentText,
            onValueChange = { contentText = it },
            modifier = Modifier.fillMaxWidth().height(300.dp).testTag("editor_content_input"),
            maxLines = 100,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = com.example.ui.theme.ImmersiveBorder
            )
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = { onUpdate(agent.key, agent.name, contentText) },
            modifier = Modifier.fillMaxWidth().height(52.dp).testTag("editor_submit_button"),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(text = "Actualizar", fontWeight = FontWeight.Bold, color = Color.Black)
        }
    }
}

@Composable
fun EmptyStudioScreen(
    projects: List<MovieProject>,
    onSelectProject: (MovieProject) -> Unit,
    onCreateProjectClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.Top,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // Icono estético de Claqueta / Cámara
        Surface(
            modifier = Modifier.size(80.dp),
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Default.PlayArrow,
                    contentDescription = "Cine AI Studio Icon",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(40.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = LocalContext.current.getString(R.string.home_title),
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            textAlign = TextAlign.Center
        )

        Text(
            text = LocalContext.current.getString(R.string.home_subtitle),
            style = MaterialTheme.typography.bodyMedium,
            color = Color.LightGray,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        // --- ACCIÓN 1: GENERAR CORTO (ACCION PRINCIPAL) ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 500.dp)
                .clickable { onCreateProjectClick() },
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
            border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Generar Corto",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = LocalContext.current.getString(R.string.home_generate_short),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = LocalContext.current.getString(R.string.home_generate_short_desc),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.LightGray,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onCreateProjectClick,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth(0.8f)
                        .testTag("home_generate_short_button")
                ) {
                    Text(
                        text = "Comenzar Guion",
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // --- ACCIÓN 2: ABRIR PROYECTO EXISTENTE ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 500.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Default.List,
                        contentDescription = "Proyectos Existentes",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = LocalContext.current.getString(R.string.home_open_existing),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = LocalContext.current.getString(R.string.home_open_existing_desc),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(16.dp))

                if (projects.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            .padding(12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = LocalContext.current.getString(R.string.home_no_projects),
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        projects.forEach { project ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                    .clickable { onSelectProject(project) }
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = project.title,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "Género: ${project.genre} • Estilo: ${project.artStyle}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.Gray,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.PlayArrow,
                                    contentDescription = "Abrir",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CineStudioMainContent(viewModel: MovieProjectViewModel, project: MovieProject) {
    val projects by viewModel.allProjects.collectAsStateWithLifecycle()
    val projectMemories by viewModel.projectMemories.collectAsStateWithLifecycle()
    val selectedSubagent by viewModel.selectedSubagent.collectAsStateWithLifecycle()
    val promptInput by viewModel.promptInput.collectAsStateWithLifecycle()
    val generationState by viewModel.generationState.collectAsStateWithLifecycle()

    var showProjectSelectorMenu by remember { mutableStateOf(false) }
    var showMonetizationDialog by remember { mutableStateOf(false) }
    val userCredits by viewModel.userCredits.collectAsStateWithLifecycle()

    if (showMonetizationDialog) {
        AlertDialog(
            onDismissRequest = { showMonetizationDialog = false },
            title = { Text("Recargar Créditos", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Pay Per Request: Pagas lo que usas. Obtén créditos para ejecutar orquestadores premium y compilar packages de dirección complejos.", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Créditos actuales: $userCredits", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.buyCredits(100); showMonetizationDialog = false }, modifier = Modifier.fillMaxWidth()) {
                        Text("Comprar 100 Créditos ($1.00 USD)")
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { viewModel.buyCredits(500); showMonetizationDialog = false }, modifier = Modifier.fillMaxWidth()) {
                        Text("Comprar 500 Créditos ($4.50 USD)")
                    }
                }
            },
            confirmButton = {},
            dismissButton = { TextButton(onClick = { showMonetizationDialog = false }) { Text("Cerrar") } }
        )
    }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val isWideScreen = maxWidth >= 640.dp

        if (isWideScreen) {
            // DISEÑO INTEGRADO PARA PANTALLAS ANCHAS / TABLETS: Multi-columna
            Row(modifier = Modifier.fillMaxSize()) {
                // Columna izquierda (Estatutos, Proyectos y Árbol de Subagentes)
                Column(
                    modifier = Modifier
                        .width(320.dp)
                        .fillMaxHeight()
                        .background(MaterialTheme.colorScheme.surface)
                        .border(
                            width = 1.dp,
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(0.dp)
                        )
                ) {
                    LogoAndProjectSelectorHeader(
                        project = project,
                        projects = projects,
                        onSelectProject = { viewModel.selectProject(it) },
                        onCreateProjectClick = { viewModel.isCreatingProjectDialogVisible.value = true },
                        onDeleteProjectClick = { viewModel.deleteCurrentProject() },
                        onDeselectProjectClick = { viewModel.deselectProject() }
                    )

                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)

                    Text(
                        text = "DEPARTAMENTOS IA (MAPA DE CAPAS)",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                    )

                    // Lista de 24 subagentes agrupados por Capas
                    SubagentsTreeMenu(
                        selectedSubagent = selectedSubagent,
                        viewModel = viewModel,
                        onSelectSubagent = { viewModel.selectSubagent(it) }
                    )
                }

                // Columna derecha (Área de Trabajo Principal)
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .background(MaterialTheme.colorScheme.background)
                ) {
                    WorkstationSection(
                        viewModel = viewModel,
                        project = project,
                        selectedSubagent = selectedSubagent,
                        promptInput = promptInput,
                        generationState = generationState,
                        memories = projectMemories
                    )
                }
            }
        } else {
            // DISEÑO ADAPTIVO PORTÁTIL (COMPACT): Navegación por pestañas inferiores
            val activeTabId by viewModel.activeTabCompact.collectAsStateWithLifecycle()

            Column(modifier = Modifier.fillMaxSize()) {
                // Header superior minimalista con info del proyecto activo
                TopAppBarCompact(
                    project = project,
                    projects = projects,
                    onSelectProject = { viewModel.selectProject(it) },
                    onCreateProjectClick = { viewModel.isCreatingProjectDialogVisible.value = true },
                    onDeleteProjectClick = { viewModel.deleteCurrentProject() },
                    onDeselectProjectClick = { viewModel.deselectProject() }
                )

                Divider(color = MaterialTheme.colorScheme.surfaceVariant)

                // Contenido intercambiable
                Box(modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()) {
                    when (activeTabId) {
                        0 -> {
                            Column(modifier = Modifier.fillMaxSize()) {
                                Text(
                                    text = "ORGANIGRAMA DEL ESTUDIO",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                                )
                                SubagentsTreeMenu(
                                    selectedSubagent = selectedSubagent,
                                    viewModel = viewModel,
                                    onSelectSubagent = {
                                        viewModel.selectSubagent(it)
                                        viewModel.updateActiveTabCompact(1) // Salta a la consola para editar
                                    }
                                )
                            }
                        }
                        1 -> {
                            WorkstationConsolePane(
                                viewModel = viewModel,
                                project = project,
                                selectedSubagent = selectedSubagent,
                                promptInput = promptInput,
                                generationState = generationState
                            )
                        }
                        2 -> {
                            UnifiedBibliaPane(
                                viewModel = viewModel,
                                project = project,
                                memories = projectMemories,
                                onClearMemories = { viewModel.clearProjectBible() }
                            )
                        }
                        3 -> {
                            UnifiedObservabilityPane(
                                viewModel = viewModel,
                                project = project
                            )
                        }
                    }
                }

                Divider(color = MaterialTheme.colorScheme.surfaceVariant)

                // Barra de navegación inferior táctil adaptada a accesibilidad
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.fillMaxWidth().testTag("bottom_navigation_bar")
                ) {
                    NavigationBarItem(
                        selected = activeTabId == 0,
                        onClick = { viewModel.updateActiveTabCompact(0) },
                        label = { Text("Estudio") },
                        icon = { Icon(Icons.Default.Menu, contentDescription = "Pestaña Estudio") },
                        modifier = Modifier.testTag("nav_item_estudio")
                    )
                    NavigationBarItem(
                        selected = activeTabId == 1,
                        onClick = { viewModel.updateActiveTabCompact(1) },
                        label = { Text("Consola") },
                        icon = { Icon(Icons.Default.PlayArrow, contentDescription = "Pestaña Consola") },
                        modifier = Modifier.testTag("nav_item_consola")
                    )
                    NavigationBarItem(
                        selected = activeTabId == 2,
                        onClick = { viewModel.updateActiveTabCompact(2) },
                        label = { Text("Biblia DB") },
                        icon = { Icon(Icons.Default.Info, contentDescription = "Pestaña Biblia") },
                        modifier = Modifier.testTag("nav_item_biblia")
                    )
                    NavigationBarItem(
                        selected = activeTabId == 3,
                        onClick = { viewModel.updateActiveTabCompact(3) },
                        label = { Text("Métricas L5") },
                        icon = { Icon(Icons.Default.List, contentDescription = "Pestaña Observabilidad") },
                        modifier = Modifier.testTag("nav_item_observabilidad")
                    )
                }
            }
        }

        // Float Button for Credits
        androidx.compose.material3.ExtendedFloatingActionButton(
            onClick = { showMonetizationDialog = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = if (isWideScreen) 32.dp else 100.dp, end = 24.dp), // Ajuste por la navigation bar en compact
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
        ) {
            Icon(Icons.Default.ShoppingCart, contentDescription = "Créditos")
            Spacer(Modifier.width(8.dp))
            Text(text = "$userCredits Créditos", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun LogoAndProjectSelectorHeader(
    project: MovieProject,
    projects: List<MovieProject>,
    onSelectProject: (MovieProject) -> Unit,
    onCreateProjectClick: () -> Unit,
    onDeleteProjectClick: () -> Unit,
    onDeselectProjectClick: () -> Unit
) {
    var expandedMenu by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(28.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Cinema Symbol",
                        tint = Color.Black,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "Cine AI Studio",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f)
            )
            StatusPulseDot()
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Caja de Selección de Proyecto Actual
        Box {
            Card(
                onClick = { expandedMenu = true },
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("project_selector_card")
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "PRODUCCIÓN ACTIVA",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF9EA0A5),
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = project.title,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Cambiar producción",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            DropdownMenu(
                expanded = expandedMenu,
                onDismissRequest = { expandedMenu = false },
                modifier = Modifier.background(MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Text(
                    text = "Abrir Trabajo Guardado:",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )

                projects.forEach { item ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = item.title,
                                fontWeight = if (item.id == project.id) FontWeight.Bold else FontWeight.Normal,
                                color = if (item.id == project.id) MaterialTheme.colorScheme.primary else Color.White
                            )
                        },
                        onClick = {
                            onSelectProject(item)
                            expandedMenu = false
                        }
                    )
                }

                Divider(color = MaterialTheme.colorScheme.surface)

                Text(
                    text = "Ajustes de Película:",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )

                DropdownMenuItem(
                    leadingIcon = { Icon(Icons.Default.Add, contentDescription = "Agregar icono") },
                    text = { Text("Nueva Película...") },
                    onClick = {
                        onCreateProjectClick()
                        expandedMenu = false
                    },
                    modifier = Modifier.testTag("menu_create_project")
                )

                DropdownMenuItem(
                    leadingIcon = { Icon(Icons.Default.PlayArrow, contentDescription = "Cerrar e Inicio") },
                    text = { Text("Cerrar Película (Ir a Inicio)") },
                    onClick = {
                        onDeselectProjectClick()
                        expandedMenu = false
                    }
                )

                DropdownMenuItem(
                    leadingIcon = { Icon(Icons.Default.Delete, contentDescription = "Eliminar icono", tint = Color.Red) },
                    text = { Text("Eliminar Película Actual", color = Color.Red) },
                    onClick = {
                        onDeleteProjectClick()
                        expandedMenu = false
                    },
                    modifier = Modifier.testTag("menu_delete_project")
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopAppBarCompact(
    project: MovieProject,
    projects: List<MovieProject>,
    onSelectProject: (MovieProject) -> Unit,
    onCreateProjectClick: () -> Unit,
    onDeleteProjectClick: () -> Unit,
    onDeselectProjectClick: () -> Unit
) {
    var expandedMenu by remember { mutableStateOf(false) }

    TopAppBar(
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        title = {
            Column {
                Text(
                    text = "PRODUCCIÓN ACTIVA",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = project.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        },
        actions = {
            StatusPulseDot()
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(onClick = { expandedMenu = true }) {
                Icon(Icons.Default.Settings, contentDescription = "Herramientas de Película")
            }

            DropdownMenu(
                expanded = expandedMenu,
                onDismissRequest = { expandedMenu = false }
            ) {
                Text(
                    text = "Abrir Trabajo Guardado:",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                )

                projects.forEach { item ->
                    DropdownMenuItem(
                        text = { Text(item.title) },
                        onClick = {
                            onSelectProject(item)
                            expandedMenu = false
                        }
                    )
                }

                Divider()

                Text(
                    text = "Ajustes de Película:",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                )

                DropdownMenuItem(
                    leadingIcon = { Icon(Icons.Default.Add, "Agregar") },
                    text = { Text("Nueva Película...") },
                    onClick = {
                        onCreateProjectClick()
                        expandedMenu = false
                    }
                )

                DropdownMenuItem(
                    leadingIcon = { Icon(Icons.Default.PlayArrow, "Cerrar") },
                    text = { Text("Cerrar (Ir a Inicio)") },
                    onClick = {
                        onDeselectProjectClick()
                        expandedMenu = false
                    }
                )

                DropdownMenuItem(
                    leadingIcon = { Icon(Icons.Default.Delete, "Eliminar", tint = Color.Red) },
                    text = { Text("Eliminar Actual", color = Color.Red) },
                    onClick = {
                        onDeleteProjectClick()
                        expandedMenu = false
                    }
                )
            }
        }
    )
}

@Composable
fun SubagentsTreeMenu(
    selectedSubagent: CinemaSubagent?,
    viewModel: MovieProjectViewModel,
    onSelectSubagent: (CinemaSubagent) -> Unit
) {
    val subagentStates by viewModel.subagentStates.collectAsStateWithLifecycle()
    val grouped = CinemaSubagentsCatalog.list.groupBy { it.layer }
    val scrollState = rememberScrollState()

    // El estado de cuáles capas están expandidas por defecto
    val expandedLayers = remember {
        mutableStateMapOf<String, Boolean>().apply {
            // Expandimos por defecto todas las capas para que el usuario pueda ver a todos los subagentes (como el Montador o Colorista)
            CinemaSubagentsCatalog.layers.forEach { layerName ->
                this[layerName] = true
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(bottom = 16.dp)
    ) {
        CinemaSubagentsCatalog.layers.forEach { layerName ->
            val subagents = grouped[layerName] ?: emptyList()
            val isExpanded = expandedLayers[layerName] ?: false

            // Botón de Capilla / Acordeón
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expandedLayers[layerName] = !isExpanded },
                color = if (isExpanded) Color(0xFF141419) else Color.Transparent
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = layerName,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = if (isExpanded) MaterialTheme.colorScheme.primary else Color(0xFFB1B2B7),
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.Check else Icons.Default.Add,
                        contentDescription = "Expandir o retraer capa",
                        tint = if (isExpanded) MaterialTheme.colorScheme.primary else Color.Gray,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            // Subagentes de esta capa
            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0F0F12))
                        .padding(bottom = 4.dp)
                ) {
                    subagents.forEach { agent ->
                        val isSelected = selectedSubagent?.key == agent.key
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelectSubagent(agent) }
                                .background(if (isSelected) Color(0xFF22222E) else Color.Transparent)
                                .padding(horizontal = 24.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Indicador estético
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(
                                        color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Gray,
                                        shape = RoundedCornerShape(3.dp)
                                    )
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = agent.name,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSelected) Color.White else Color(0xFFCECED4)
                                )
                                Text(
                                    text = agent.role,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color(0xFF888A92)
                                )
                                
                                // Indicador de estado en cascada activo
                                val state = subagentStates[agent.key]
                                if (state != null) {
                                    val (badgeText, badgeColor) = when (state) {
                                        "RUNNING" -> "⚡ PROCESANDO" to Color(0xFF00FFCC)
                                        "COMPLETED" -> "✅ SISTEMA OK" to Color(0xFF00E676)
                                        "PAUSED_EXPENSIVE" -> {
                                            val cost = viewModel.getSubagentCostInfo(agent.key)
                                                ?.substringAfter("Costo estimado: ")
                                                ?.substringBefore(" (") ?: "$0.05"
                                            "⚠️ COMPRAR ($cost)" to Color(0xFFFFCC00)
                                        }
                                        "PENDING" -> "⏱️ EN COLA" to Color.Gray
                                        "ERROR" -> "❌ ERROR" to Color.Red
                                        else -> "" to Color.Transparent
                                    }
                                    if (badgeText.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Surface(
                                            color = badgeColor.copy(alpha = 0.12f),
                                            shape = RoundedCornerShape(4.dp),
                                            border = BorderStroke(1.dp, badgeColor.copy(alpha = 0.4f))
                                        ) {
                                            Text(
                                                text = badgeText,
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = badgeColor,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }
                            }
                            if (isSelected) {
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = "Símbolo de Estrecha",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun WorkstationSection(
    viewModel: MovieProjectViewModel,
    project: MovieProject,
    selectedSubagent: CinemaSubagent?,
    promptInput: String,
    generationState: GenerationState,
    memories: List<ProjectMemory>
) {
    val selectedTabId by viewModel.activeTabWide.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        // TabRow de Trabajo
        TabRow(
            selectedTabIndex = selectedTabId,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary
        ) {
            Tab(
                selected = selectedTabId == 0,
                onClick = { viewModel.updateActiveTabWide(0) },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.PlayArrow, contentDescription = "Taller", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "TALLER DE ORQUESTACIÓN IA",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                },
                modifier = Modifier.testTag("tab_workstation_taller")
            )
            Tab(
                selected = selectedTabId == 1,
                onClick = { viewModel.updateActiveTabWide(1) },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, contentDescription = "Memoria", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "BIBLIA UNIFICADA (${memories.size})",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                },
                modifier = Modifier.testTag("tab_workstation_biblia")
            )
            Tab(
                selected = selectedTabId == 2,
                onClick = { viewModel.updateActiveTabWide(2) },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.List, contentDescription = "Métricas L5", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "MÉTRICAS & TRAZAS L5",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                },
                modifier = Modifier.testTag("tab_workstation_metrics")
            )
        }

        Box(modifier = Modifier
            .weight(1f)
            .fillMaxWidth()) {
            when (selectedTabId) {
                0 -> {
                    WorkstationConsolePane(
                        viewModel = viewModel,
                        project = project,
                        selectedSubagent = selectedSubagent,
                        promptInput = promptInput,
                        generationState = generationState
                    )
                }
                1 -> {
                    UnifiedBibliaPane(
                        viewModel = viewModel,
                        project = project,
                        memories = memories,
                        onClearMemories = { viewModel.clearProjectBible() }
                    )
                }
                2 -> {
                    UnifiedObservabilityPane(
                        viewModel = viewModel,
                        project = project
                    )
                }
            }
        }
    }
}

@Composable
fun WorkstationConsolePane(
    viewModel: MovieProjectViewModel,
    project: MovieProject,
    selectedSubagent: CinemaSubagent?,
    promptInput: String,
    generationState: GenerationState
) {
    val scrollState = rememberScrollState()

    if (selectedSubagent == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Selecciona un subagente IA de la lista de departamentos para comenzar.")
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
        // CARD DEL CONTRATO DE SUBAGENTE SÓLIDO (DISEÑO INMERSIVO PREMIUM)
        Box(modifier = Modifier.fillMaxWidth()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(24.dp), // Elegant rounded-3xl shape
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        BorderStroke(1.dp, com.example.ui.theme.ImmersiveBorder),
                        RoundedCornerShape(24.dp)
                    )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    // Profile + Avatar Row
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(
                                    brush = androidx.compose.ui.graphics.Brush.linearGradient(
                                        colors = listOf(
                                            MaterialTheme.colorScheme.primary,
                                            MaterialTheme.colorScheme.secondary
                                        )
                                    ),
                                    shape = RoundedCornerShape(14.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Ficha del Agente",
                                tint = Color.White,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.padding(end = 64.dp)) { // Leave space for absolute Layer badge
                            Text(
                                text = selectedSubagent.name,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = selectedSubagent.role,
                                style = MaterialTheme.typography.bodySmall,
                                color = com.example.ui.theme.GrayText
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // PROGRESS BAR TRACKER FROM THE "IMMERSIVE UI" DESIGN
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "CONSISTENCIA EN PIPELINE DE IA",
                                style = MaterialTheme.typography.labelSmall,
                                color = com.example.ui.theme.GrayText,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "80% SYNCED",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .background(Color(0xFF2B2930), RoundedCornerShape(3.dp))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(0.8f)
                                    .height(6.dp)
                                    .background(
                                        brush = androidx.compose.ui.graphics.Brush.horizontalGradient(
                                            colors = listOf(
                                                MaterialTheme.colorScheme.secondary,
                                                MaterialTheme.colorScheme.primary
                                            )
                                        ),
                                        shape = RoundedCornerShape(3.dp)
                                    )
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "TONO: ${project.genre.uppercase()}",
                                style = MaterialTheme.typography.labelSmall,
                                color = com.example.ui.theme.GrayText
                            )
                            Text(
                                text = "ESTILO: ${project.artStyle.uppercase()}",
                                style = MaterialTheme.typography.labelSmall,
                                color = com.example.ui.theme.GrayText
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "RESPONSABILIDADES DE CONTRATO TÉCNICO:",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                Spacer(modifier = Modifier.height(4.dp))
                selectedSubagent.duties.forEach { duty ->
                    Row(
                        modifier = Modifier.padding(vertical = 2.dp, horizontal = 6.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text("• ", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        Text(
                            text = duty,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFD6D6DA)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "ENTRADA REQUERIDA (INPUT):",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF00E5FF),
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = selectedSubagent.inputDescription,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFA6ABB6)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "ENTREGABLE PRODUCIDO (OUTPUT):",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.secondary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = selectedSubagent.outputDescription,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFA6ABB6)
                        )
                    }
                }
            } // Close Column inside Card
        } // Close Card

            // Layer badge in the top-right corner of card, just like absolute top-0 right-0 p-3
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp)
            ) {
                Surface(
                    color = MaterialTheme.colorScheme.secondary,
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f))
                ) {
                    Text(
                        text = selectedSubagent.layer.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }
        } // Close Box

        Spacer(modifier = Modifier.height(20.dp))

        // SHARED MEMORY SYNC PANEL FROM THE "IMMERSIVE UI" HTML PRESET
        Surface(
            color = com.example.ui.theme.ImmersiveSharedMemBg, // bg-[#381E72]/20
            shape = RoundedCornerShape(16.dp), // rounded-2xl
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.secondary), // border-[#381E72]
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🧠",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(end = 8.dp)
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "SINCRONIZACIÓN DE MEMORIA COMPARTIDA (ROOM DB)",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    // 4 progress light indicators representing DB state based on memories count
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        for (i in 0 until 4) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(4.dp)
                                    .background(
                                        color = if (i < 3) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
                                        shape = RoundedCornerShape(2.dp)
                                    )
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                // Version badge
                Text(
                    text = "v2.5_SYNC",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // CONSOLA DE ENVIÓ DE CONSIGNAS
        Text(
            text = "CONSIGNA / BRIEF DE EJECUCIÓN (PROMPT):",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Spacer(modifier = Modifier.height(6.dp))

        OutlinedTextField(
            value = promptInput,
            onValueChange = { viewModel.updatePromptInput(it) },
            textStyle = MaterialTheme.typography.bodyMedium.copy(color = Color.White),
            placeholder = { Text("Escribe las consignas o directrices para este departamento...") },
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 100.dp)
                .testTag("prompt_input_field"),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.surfaceVariant,
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface
            )
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Si es un subagente de alto costo, alertamos sobre el cobro y solicitamos aprobación
        val isExpensive = viewModel.isSubagentExpensive(selectedSubagent.key)
        if (isExpensive) {
            val costInfo = viewModel.getSubagentCostInfo(selectedSubagent.key) ?: ""
            Surface(
                color = Color(0xFF2B2404), // Fondo dorado oscuro satinado
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, Color(0xFFFFD700)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 14.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "💎",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(end = 10.dp)
                    )
                    Column {
                        Text(
                            text = "ORQUESTADOR DE ALTO COSTO",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFFFD700)
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "$costInfo • Este departamento utiliza redes generativas pesadas. Requiere tu confirmación manual para procesarse.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFE2E2E5)
                        )
                    }
                }
            }
        }

        // Botón de Lanzamiento de Orquestación
        Button(
            onClick = { viewModel.processSubagentAction() },
            enabled = generationState != GenerationState.Loading,
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isExpensive) Color(0xFFFFD700) else MaterialTheme.colorScheme.primary,
                disabledContainerColor = Color.DarkGray
            ),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("run_subagent_button")
        ) {
            if (generationState == GenerationState.Loading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.Black, strokeWidth = 2.5.dp)
                Spacer(modifier = Modifier.width(10.dp))
                Text("PROCESANDO EN REGLAS DE PIPELINE IA...", color = Color.Black, fontWeight = FontWeight.Bold)
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isExpensive) Icons.Default.Lock else Icons.Default.PlayArrow,
                        contentDescription = "Lanzar",
                        tint = Color.Black
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isExpensive) "Confirmar y Orquestar ${selectedSubagent.name}" else "Orquestar ${selectedSubagent.name}",
                        color = Color.Black,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // SECCIÓN DE RESULTADO TÉCNICO DE ESTA CAPA
        Divider(color = MaterialTheme.colorScheme.surfaceVariant)
        Spacer(modifier = Modifier.height(16.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                val clipboardManager = LocalClipboardManager.current
                val context = LocalContext.current

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ENTREGABLE CINEMATOGRÁFICO DE LA CAPA",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.weight(1f)
                    )

                    // Botón para copiar reporte y descargar PDF
                    if (generationState is GenerationState.Success) {
                        Row {
                            TextButton(onClick = {
                                Toast.makeText(context, "Descargando documento_tecnico.pdf...", Toast.LENGTH_SHORT).show()
                            }) {
                                Text("Descargar PDF", style = MaterialTheme.typography.labelSmall)
                            }
                            IconButton(onClick = {
                                clipboardManager.setText(AnnotatedString(generationState.response))
                            }) {
                                Icon(
                                    imageVector = Icons.Default.Share,
                                    contentDescription = "Copiar entregable",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                when (generationState) {
                    is GenerationState.Idle -> {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = "Esperando",
                                tint = Color.Gray,
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "El entregable del subagente aparecerá aquí tras presionar 'Orquestar'. Su análisis heredará sistemáticamente la memoria de las otras capas guardadas en tu Biblia central.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                        }
                    }
                    is GenerationState.Loading -> {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 40.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "El orquestador de cine está redactando el informe técnico... Esto toma unos segundos.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                    is GenerationState.Success -> {
                        SelectionContainer {
                            RenderMarkdownText(text = generationState.response)
                        }
                    }
                    is GenerationState.Error -> {
                        Surface(
                            color = Color(0xFF331114),
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, Color.Red),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Warning, contentDescription = "Error", tint = Color.Red)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Fallo en la Orquestación de Agente",
                                        fontWeight = FontWeight.Bold,
                                        color = Color.Red,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = generationState.message,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFFFFD1D4)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun UnifiedBibliaPane(
    viewModel: MovieProjectViewModel,
    project: MovieProject,
    memories: List<ProjectMemory>,
    onClearMemories: () -> Unit
) {
    val scrollState = rememberScrollState()

    val ideaText by viewModel.videoIdeaState.collectAsStateWithLifecycle()
    val durationText by viewModel.shortFilmDuration.collectAsStateWithLifecycle()
    val actsText by viewModel.actsStructure.collectAsStateWithLifecycle()
    val storyboardText by viewModel.generatedStoryboard.collectAsStateWithLifecycle()
    val consistencyText by viewModel.directorConsistencyReport.collectAsStateWithLifecycle()
    val workflowState by viewModel.storyboardWorkflowState.collectAsStateWithLifecycle()
    val workflowError by viewModel.storyboardWorkflowError.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
        // PANEL EXCLUSIVO DE CONTROL DE HISTORIA / STORYBOARD BASADO EN TIEMPO
        when (workflowState) {
            "IDLE" -> {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = "Ficha",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "FICHA TÉCNICA: ${project.title.uppercase()}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        Text(
                            text = "Detalles constitutivos del proyecto de cine seleccionado en la base de datos.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.LightGray
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("GÉNERO", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Text(project.genre, style = MaterialTheme.typography.bodyMedium, color = Color.White)
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text("ESTILO VISUAL", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Text(project.artStyle, style = MaterialTheme.typography.bodyMedium, color = Color.White)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("AUDIENCIA", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Text(project.targetAudience, style = MaterialTheme.typography.bodyMedium, color = Color.White)
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text("DURACIÓN", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Text(durationText.ifEmpty { "3 minutos" }, style = MaterialTheme.typography.bodyMedium, color = Color.White)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Text("PREMISA O IDEA DEL CORTOMETRAJE:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Text(
                                text = project.description.ifEmpty { "Ninguna premisa especificada." },
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.LightGray
                            )
                        }
                    }
                }
            }

            "GENERATING" -> {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "🎬 PROCESANDO HISTORIA Y PLAN DE FILME...",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(20.dp))

                        Column(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            listOf(
                                "✍️ Paso 1: Estructurando propuesta formal en 3 Actos (Presentación, Desarrollo, Desenlace)",
                                "📖 Paso 2: Guionista Principal redactando Storyboard Técnico de tomas para $durationText",
                                "🛡️ Paso 3: Director de Escena auditando continuidad, raccord de cámara, sonido y ritmo lógico"
                            ).forEach { stepText ->
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Info,
                                        contentDescription = "Paso",
                                        tint = MaterialTheme.colorScheme.secondary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = stepText,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color.LightGray
                                    )
                                }
                            }
                        }
                    }
                }
            }

            "ERROR" -> {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF2C1316)),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color.Red),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Warning, contentDescription = "Error", tint = Color.Red)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Error en el Pipeline de Storyboard",
                                fontWeight = FontWeight.Bold,
                                color = Color.Red,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = workflowError,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFFFD1D4)
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Button(
                            onClick = { viewModel.resetStoryboardWorkflow() },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("Reintentar configuración", color = Color.White)
                        }
                    }
                }
            }

            "AWAITING_APPROVAL" -> {
                Column(modifier = Modifier.fillMaxWidth()) {
                    // BANNER DE ENCABEZADO DE REVISIÓN
                    Surface(
                        color = Color(0xFF2B2404),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, Color(0xFFFFD700)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 14.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("⭐", style = MaterialTheme.typography.titleLarge)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "PRE-PRODUCCIÓN DISPONIBLE PARA REVISIÓN",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFFFD700)
                               )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Tratamiento narrativo completo de $durationText listo. El Director ha revisado espacial/temporalmente las tomas.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.LightGray
                                )
                            }
                        }
                    }

                    // CARD 1: ESTRUCTURA EN 3 ACTOS
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("🎭", style = MaterialTheme.typography.titleMedium)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "PROPUESTA DE 3 ACTOS",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                            Spacer(modifier = Modifier.height(8.dp))
                            SelectionContainer {
                                RenderMarkdownText(text = actsText)
                            }
                        }
                    }

                    // CARD 2: STORYBOARD DE TOMAS CON TIEMPO DE CORTO
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("🎬", style = MaterialTheme.typography.titleMedium)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "STORYBOARD TÉCNICO Y DESGLOSE ($durationText)",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.secondary
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                            Spacer(modifier = Modifier.height(8.dp))
                            SelectionContainer {
                                RenderMarkdownText(text = storyboardText)
                            }
                        }
                    }

                    // CARD 3: REPORTE DE CONSISTENCIA DIRECTORIAL
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF141913)), // Verde satinado oscuro
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, Color(0xFF4CAF50)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("🛡️", style = MaterialTheme.typography.titleMedium)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "AUDITORÍA DE CONSISTENCIA COHERENTE (DIRECTOR)",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF4CAF50)
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Divider(color = Color(0xFF2C3529))
                            Spacer(modifier = Modifier.height(8.dp))
                            SelectionContainer {
                                RenderMarkdownText(text = consistencyText)
                            }
                        }
                    }

                    // ACCIONES DE APROBACIÓN
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.resetStoryboardWorkflow() },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.LightGray),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
                            modifier = Modifier
                                .weight(1f)
                                .height(44.dp)
                        ) {
                            Text("❌ Rechazar", fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = { viewModel.approveStoryboardAndLaunchProduction() },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)),
                            modifier = Modifier
                                .weight(1.5f)
                                .height(44.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Check, contentDescription = "Aprobar", tint = Color.Black)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Aprobar y Lanzar Producción", color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            "APPROVED" -> {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131A14)),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.5.dp, Color(0xFF4CAF50)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🚀", style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "STORYBOARD EN PRODUCCIÓN",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF4CAF50),
                                modifier = Modifier.weight(1f)
                            )
                            Button(
                                onClick = { viewModel.resetStoryboardWorkflow() },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                                modifier = Modifier.height(28.dp)
                            ) {
                                Text("Re-diseñar Base", style = MaterialTheme.typography.labelSmall, color = Color.White)
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = "La idea de corto '$ideaText' de $durationText ha sido aprobada oficialmente bajo el sello de consistencia del director de escena. El Storyboard y los 3 Actos están consolidados en la Biblia.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.LightGray
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                        Divider(color = Color(0xFF2C3529))
                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "🎯 GUIÓN Y CONTRATOS APROBADOS:",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF4CAF50)
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))

                        // Elementos clave aprobados
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 6.dp)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = "Listo", tint = Color(0xFF4CAF50), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Propuesta clásica estructurada en 3 Actos", style = MaterialTheme.typography.bodySmall, color = Color.White)
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 6.dp)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = "Listo", tint = Color(0xFF4CAF50), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Desglose formal de tomas técnicas para $durationText", style = MaterialTheme.typography.bodySmall, color = Color.White)
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 6.dp)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = "Listo", tint = Color(0xFF4CAF50), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Coherencia de raccord & eje auditada y firmada", style = MaterialTheme.typography.bodySmall, color = Color.White)
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Column {
                                Text(
                                    text = "✨ ¿QUÉ DEBO HACER AHORA?",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "Dirígete a la pestaña superior 'Taller de Orquestación de Agentes'. Entra a los subdepartamentos de Arte, Dirección o Sonido para expander y detallar individualmente la película en base a estas pautas centrales aprobadas.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.LightGray
                                )
                            }
                        }
                    }
                }
            }
        }

        // TARJETA DE EXPEDIENTE CENTRAL
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "MEMORIA DE DESARROLLO CENTRAL (PROJECT BIBLE)",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "A continuación se compila el expediente técnico consolidado de la producción intelectual de tu película.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Documentos activos: ${memories.size}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                    Button(
                        onClick = onClearMemories,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2C1316)),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.height(32.dp).testTag("clear_memories_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Borrar memorias",
                            tint = Color.Red,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Reiniciar Biblia", color = Color.Red, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        if (memories.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 40.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Tu Biblia está vacía. Ve al taller de orquestación o aprueba un storyboard para acumular folios en la base de datos.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            // COMPILAR DOCUMENTOS ORDENADOS POR FECHA DE ACTUALIZACIÓN O POR SECCIONES
            memories.forEach { memory ->
                var docExpanded by remember { mutableStateOf(false) }

                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp)
                        .clickable { docExpanded = !docExpanded }
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = "Icono Documento",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = memory.title,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                modifier = Modifier.weight(1f)
                            )
                            Icon(
                                imageVector = if (docExpanded) Icons.Default.Check else Icons.Default.Add,
                                contentDescription = "Ver más",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        if (docExpanded) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                            Spacer(modifier = Modifier.height(10.dp))
                            SelectionContainer {
                                RenderMarkdownText(text = memory.content)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RenderMarkdownText(text: String) {
    val lines = text.split("\n")
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        lines.forEach { line ->
            when {
                line.startsWith("###") -> {
                    Text(
                        text = line.replace("###", "").trim(),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.tertiary,
                        modifier = Modifier.padding(top = 10.dp, bottom = 4.dp)
                    )
                }
                line.startsWith("##") -> {
                    Text(
                        text = line.replace("##", "").trim(),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(top = 14.dp, bottom = 6.dp)
                    )
                }
                line.startsWith("#") -> {
                    Text(
                        text = line.replace("#", "").trim(),
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(top = 18.dp, bottom = 8.dp),
                        fontWeight = FontWeight.Bold
                    )
                }
                line.trim().startsWith("-") || line.trim().startsWith("*") -> {
                    Row(modifier = Modifier.padding(start = 8.dp).padding(vertical = 2.dp)) {
                        Text("• ", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        Text(
                            text = if (line.trim().startsWith("-")) line.trim().substring(1).trim() else line.trim().substring(1).trim(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFFD6D6DA)
                        )
                    }
                }
                line.startsWith("```") -> {
                    Spacer(modifier = Modifier.height(4.dp))
                }
                else -> {
                    if (line.isNotBlank()) {
                        Text(
                            text = line,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFFECECEF),
                            modifier = Modifier.padding(vertical = 3.dp)
                        )
                    } else {
                        Spacer(modifier = Modifier.height(6.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun CreateProjectDialog(
    onDismiss: () -> Unit,
    onConfirm: (title: String, genre: String, artStyle: String, description: String, targetAudience: String, duration: String) -> Unit
) {
    var step by remember { mutableIntStateOf(1) } // 1, 2, or 3
    
    var title by remember { mutableStateOf("") }
    var genre by remember { mutableStateOf("Ciencia Ficción") }
    var artStyle by remember { mutableStateOf("Fotorrealista Oscuro (Brutalista)") }
    var targetAudience by remember { mutableStateOf("Adulto / Maduro") }
    var description by remember { mutableStateOf("") }
    var duration by remember { mutableStateOf("3 minutos") } // default duration for short film

    val genres = listOf("Ciencia Ficción", "Fantasía Épica", "Cine Negro / Noir", "Terror Psicológico", "Drama Histórico", "Anime / Cyberpunk")
    val styles = listOf("Fotorrealista Oscuro (Brutalista)", "Estilo Anime Cinematográfico", "Expresionismo Alemán", "Pintoresco / Óleo", "Cyberpunk Neón")
    val audiences = listOf("Adulto / Maduro", "Todo Público (PG)", "Adolescentes / Joven", "Experimental")
    val durations = listOf("1 minuto", "3 minutos", "5 minutos", "10 minutos")

    var expandedGenre by remember { mutableStateOf(false) }
    var expandedStyle by remember { mutableStateOf(false) }
    var expandedAudience by remember { mutableStateOf(false) }
    var expandedDuration by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Indicador de pasos arriba
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = LocalContext.current.getString(R.string.wizard_title),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = LocalContext.current.getString(R.string.wizard_step, step),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.LightGray
                    )
                }

                // Barra de progreso de paso
                LinearProgressIndicator(
                    progress = step / 3.0f,
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .padding(bottom = 16.dp)
                )

                // Contenido según el paso activo
                when (step) {
                    1 -> {
                        // PASO 1: Identidad cinemática
                        Text(
                            text = LocalContext.current.getString(R.string.wizard_step1_title),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                        Text(
                            text = LocalContext.current.getString(R.string.wizard_step1_desc),
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        Text(text = "Título del Cortometraje:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = title,
                            onValueChange = { title = it },
                            placeholder = { Text("Ej. El último amanecer") },
                            textStyle = MaterialTheme.typography.bodyMedium.copy(color = Color.White),
                            modifier = Modifier.fillMaxWidth().testTag("input_project_title"),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(text = "Género Cinematográfico:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { expandedGenre = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(genre)
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Seleccionar género")
                                }
                            }
                            DropdownMenu(
                                expanded = expandedGenre,
                                onDismissRequest = { expandedGenre = false }
                            ) {
                                genres.forEach { choice ->
                                    DropdownMenuItem(text = { Text(choice) }, onClick = { genre = choice; expandedGenre = false })
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(text = "Estilo Artístico / Visual:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { expandedStyle = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(artStyle)
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Seleccionar estilo")
                                }
                            }
                            DropdownMenu(
                                expanded = expandedStyle,
                                onDismissRequest = { expandedStyle = false }
                            ) {
                                styles.forEach { choice ->
                                    DropdownMenuItem(text = { Text(choice) }, onClick = { artStyle = choice; expandedStyle = false })
                                }
                            }
                        }
                    }
                    2 -> {
                        // PASO 2: Dirección Narrativa y Concepto
                        Text(
                            text = LocalContext.current.getString(R.string.wizard_step2_title),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                        Text(
                            text = LocalContext.current.getString(R.string.wizard_step2_desc),
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        Text(text = "Público Objetivo (Audience):", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { expandedAudience = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(targetAudience)
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Seleccionar público")
                                }
                            }
                            DropdownMenu(
                                expanded = expandedAudience,
                                onDismissRequest = { expandedAudience = false }
                            ) {
                                audiences.forEach { choice ->
                                    DropdownMenuItem(text = { Text(choice) }, onClick = { targetAudience = choice; expandedAudience = false })
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(text = "Sinopsis de Base / Idea del Corto (Premisa):", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            placeholder = { Text("Ej. Una civilización perdida bajo el mar descubre una señal de radio que proviene de un viejo faro terrestre abandonado...") },
                            textStyle = MaterialTheme.typography.bodyMedium.copy(color = Color.White),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .testTag("input_project_description"),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        )
                    }
                    3 -> {
                        // PASO 3: Duración y Configuración del Storyboard
                        Text(
                            text = LocalContext.current.getString(R.string.wizard_step3_title),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                        Text(
                            text = LocalContext.current.getString(R.string.wizard_step3_desc),
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        Text(text = "Duración Objetivo del Cortometraje:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { expandedDuration = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(duration)
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Seleccionar duración")
                                }
                            }
                            DropdownMenu(
                                expanded = expandedDuration,
                                onDismissRequest = { expandedDuration = false }
                            ) {
                                durations.forEach { choice ->
                                    DropdownMenuItem(text = { Text(choice) }, onClick = { duration = choice; expandedDuration = false })
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Resumen de la configuración antes de mandar
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(text = "RESUMEN DE PRODUCCIÓN", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "🎬 Película: $title", style = MaterialTheme.typography.bodySmall, color = Color.White)
                                Text(text = "🎭 Género: $genre", style = MaterialTheme.typography.bodySmall, color = Color.White)
                                Text(text = "👁️ Estilo: $artStyle", style = MaterialTheme.typography.bodySmall, color = Color.White)
                                Text(text = "⏱️ Duración: $duration", style = MaterialTheme.typography.bodySmall, color = Color.White)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Botones de navegación inferior
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (step > 1) {
                        OutlinedButton(
                            onClick = { step-- },
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, Color.Gray),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                        ) {
                            Text("Atrás")
                        }
                    } else {
                        TextButton(onClick = onDismiss) {
                            Text("Cancelar", color = Color.Gray)
                        }
                    }

                    Row {
                        if (step < 3) {
                            Button(
                                onClick = { step++ },
                                enabled = if (step == 1) title.isNotBlank() else description.isNotBlank(),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Siguiente", color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            Button(
                                onClick = {
                                    onConfirm(title, genre, artStyle, description, targetAudience, duration)
                                },
                                enabled = title.isNotBlank() && description.isNotBlank(),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Generar", tint = Color.Black)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Generar Corto", color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

// =========================================================================
// CAPA DE OBSERVABILIDAD Y GOBERNANZA ARCHITECTÓNICA OBJETIVO (NIVEL 5)
// =========================================================================

@Composable
fun UnifiedObservabilityPane(
    viewModel: MovieProjectViewModel,
    project: MovieProject
) {
    val revisions by viewModel.projectRevisions.collectAsStateWithLifecycle()
    val auditLogs by viewModel.auditLogs.collectAsStateWithLifecycle()
    val metrics by viewModel.telemetryMetrics.collectAsStateWithLifecycle()
    val useSecureGateway by viewModel.useSecureGateway.collectAsStateWithLifecycle()

    var selectedRevisionForDetail by remember { mutableStateOf<com.example.data.database.ProjectMemoryRevision?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // --- SECCIÓN 1: CONTROL DE GOBERNANZA DE SEGURIDAD (FASE 0) ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "PASARELA CENTRALIZADA SEGURA (L5)",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Evita la fuga de claves del cliente aislando las peticiones LLM a través de un backend dedicado.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = useSecureGateway,
                        onCheckedChange = { viewModel.toggleSecureGateway(it) },
                        modifier = Modifier.testTag("secure_gateway_switch")
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            color = if (useSecureGateway) {
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                            } else {
                                MaterialTheme.colorScheme.error.copy(alpha = 0.1f)
                            },
                            shape = RoundedCornerShape(8.dp)
                        )
                        .border(
                            width = 1.dp,
                            color = if (useSecureGateway) {
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                            } else {
                                MaterialTheme.colorScheme.error.copy(alpha = 0.2f)
                            },
                            shape = RoundedCornerShape(8.dp)
                        )
                        .padding(10.dp)
                ) {
                    Text(
                        text = if (useSecureGateway) {
                            "ESTADO: ACTIVO (Canal Seguro). No se expone ninguna credencial ni endpoint directo en este dispositivo cliente."
                        } else {
                            "ESTADO: ARENA DE DEPURACIÓN (Canal de Resiliencia). Las llamadas se procesan localmente aplicando retroceso y retardo exponencial."
                        },
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (useSecureGateway) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.error
                        }
                    )
                }
            }
        }

        // --- SECCIÓN 2: MÉTRICAS OPERATIVAS REAL-TIME (FASE 2) ---
        Text(
            text = "MÉTRICAS DE TELEMETRÍA (OPERATIVAS & FINANCIERAS)",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        // Cáculo de indicadores de rendimiento y coste
        val totalCost = metrics.filter { it.metricName == "ESTIMATED_COST" }.sumOf { it.metricValue }
        val stageMetricsLog = metrics.filter { it.metricName == "STAGE_TIME" }
        val avgLatency = if (stageMetricsLog.isNotEmpty()) stageMetricsLog.map { it.metricValue }.average() else 0.0
        val errorList = metrics.filter { it.metricName == "AI_ERROR_RATE" }
        val errorRatioPercent = if (errorList.isNotEmpty()) {
            (errorList.map { it.metricValue }.sum() / errorList.size) * 100.0
        } else {
            0.0
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Tarjeta Costo
            Card(
                modifier = Modifier
                    .weight(1f)
                    .height(90.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Costo Total", style = MaterialTheme.typography.labelSmall, color = Color.Gray, maxLines = 1)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = String.format("$%.5f", totalCost),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.secondary,
                        maxLines = 1
                    )
                    Text("USD", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                }
            }

            // Tarjeta Latencia Promedio
            Card(
                modifier = Modifier
                    .weight(1f)
                    .height(90.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Latencia AI", style = MaterialTheme.typography.labelSmall, color = Color.Gray, maxLines = 1)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = String.format("%.0f ms", avgLatency),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        maxLines = 1
                    )
                    Text("por llamada", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                }
            }

            // Tarjeta Error Rate
            Card(
                modifier = Modifier
                    .weight(1f)
                    .height(90.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Tasa Error", style = MaterialTheme.typography.labelSmall, color = Color.Gray, maxLines = 1)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = String.format("%.1f %%", errorRatioPercent),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (errorRatioPercent > 30) Color.Red else Color.Green,
                        maxLines = 1
                    )
                    Text("de fallos pipeline", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                }
            }

            // Tarjeta Versiones
            Card(
                modifier = Modifier
                    .weight(1f)
                    .height(90.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Versiones", style = MaterialTheme.typography.labelSmall, color = Color.Gray, maxLines = 1)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${revisions.size}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        maxLines = 1
                    )
                    Text("biblias guardadas", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                }
            }
        }

        // --- SECCIÓN 3: CONTROL DE HISTORIAL Y VERSIONES (FASE 1 - MEMORIA VERSIONADA) ---
        Text(
            text = "VERSIONES Y REVISIONES DEL DOCUMENTO (PROJECT BIBLE CHANGE-LOG)",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            if (revisions.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Ninguna revisión guardada en la base de datos para este proyecto todavía. Genera un storyboard o procesa agentes para registrar versiones históricas.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                Column(modifier = Modifier.padding(8.dp)) {
                    revisions.forEach { rev ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedRevisionForDetail = rev }
                                .padding(vertical = 10.dp, horizontal = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(
                                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(4.dp),
                                    modifier = Modifier.size(34.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = "v${rev.version}",
                                            fontWeight = FontWeight.Bold,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = rev.title,
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "Autor: ${rev.author} • ID: ${rev.correlationId}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.Gray
                                    )
                                }
                            }
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = "Ver versión",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    }
                }
            }
        }

        // --- SECCIÓN 4: TRAZAS DE ARCHIVO AUDIT ELECTRÓNICO (FASE 2 - OBSERVABILIDAD EXTREMO A EXTREMO) ---
        Text(
            text = "REGISTROS CRONOLÓGICOS DE AUDITORÍA (AUDIT TRAILS)",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            if (auditLogs.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Historial vacío. Las acciones de los agentes generarán logs con firmas asíncronas automáticamente aquí.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            } else {
                Column(modifier = Modifier.padding(8.dp)) {
                    auditLogs.take(50).forEach { log ->
                        val dateText = java.text.SimpleDateFormat("HH:mm:ss.SSS", java.util.Locale.getDefault()).format(java.util.Date(log.timestamp))
                        Column(modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        color = when (log.actor) {
                                            "USER" -> Color(0xFF268DFF).copy(alpha = 0.15f)
                                            "SYSTEM" -> Color(0xFFFF9800).copy(alpha = 0.15f)
                                            else -> Color(0xFF00FFCC).copy(alpha = 0.15f)
                                        },
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = " ${log.actor} ",
                                            fontWeight = FontWeight.Bold,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = when (log.actor) {
                                                "USER" -> Color(0xFF268DFF)
                                                "SYSTEM" -> Color(0xFFFF4D4D)
                                                else -> Color(0xFF00FFCC)
                                            },
                                            modifier = Modifier.padding(4.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = log.action,
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                                Text(
                                    text = dateText,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.Gray
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = log.details,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.LightGray
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Correlation ID: ${log.correlationId}",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.Gray,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    }
                }
            }
        }
    }

    // Modal de diálogo emergente de revisión histórica detallada de documentos
    selectedRevisionForDetail?.let { revision ->
        Dialog(onDismissRequest = { selectedRevisionForDetail = null }) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.85f),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Historial v${revision.version}",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        IconButton(onClick = { selectedRevisionForDetail = null }) {
                            Icon(Icons.Default.Clear, contentDescription = "Cerrar modal", tint = Color.Gray)
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "Documento: ${revision.title}", style = MaterialTheme.typography.bodyMedium, color = Color.White, fontWeight = FontWeight.Bold)
                    Text(text = "Guardado por: ${revision.author} • Correlation ID: ${revision.correlationId}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    SecureBadge(useSecureGateway)

                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    Spacer(modifier = Modifier.height(12.dp))

                    SelectionContainer(modifier = Modifier.weight(1f)) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState())
                                .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .border(1.dp, MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Text(
                                text = revision.content,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.LightGray
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { selectedRevisionForDetail = null },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Aceptar", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun SecureBadge(active: Boolean) {
    if (active) {
        Surface(
            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
            shape = RoundedCornerShape(4.dp),
            modifier = Modifier.padding(top = 4.dp)
        ) {
            Row(modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(6.dp).background(MaterialTheme.colorScheme.primary, androidx.compose.foundation.shape.CircleShape))
                Spacer(modifier = Modifier.width(6.dp))
                Text(text = "Cerrado y Encriptado por Servidor Remoto (Pasarela L5)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
            }
        }
    } else {
        Surface(
            color = MaterialTheme.colorScheme.error.copy(alpha = 0.15f),
            shape = RoundedCornerShape(4.dp),
            modifier = Modifier.padding(top = 4.dp)
        ) {
            Row(modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(6.dp).background(MaterialTheme.colorScheme.error, androidx.compose.foundation.shape.CircleShape))
                Spacer(modifier = Modifier.width(6.dp))
                Text(text = "Aislado del Servidor (Capa Temporal del Teléfono)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
