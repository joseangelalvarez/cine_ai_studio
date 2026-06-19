package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
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
    val projects by viewModel.allProjects.collectAsStateWithLifecycle()
    val selectedProject by viewModel.selectedProject.collectAsStateWithLifecycle()
    val isCreatingProjectDialogVisible by viewModel.isCreatingProjectDialogVisible.collectAsStateWithLifecycle()

    Box(modifier = Modifier.fillMaxSize()) {
        if (projects.isEmpty()) {
            EmptyStudioScreen(onCreateProjectClick = {
                viewModel.isCreatingProjectDialogVisible.value = true
            })
        } else {
            selectedProject?.let { project ->
                CineStudioMainContent(viewModel = viewModel, project = project)
            } ?: Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
        }

        // Diálogo para nuevo proyecto de cine
        if (isCreatingProjectDialogVisible) {
            CreateProjectDialog(
                onDismiss = { viewModel.isCreatingProjectDialogVisible.value = false },
                onConfirm = { title, genre, artStyle, description, targetAudience ->
                    viewModel.createNewProject(title, genre, artStyle, description, targetAudience)
                    viewModel.isCreatingProjectDialogVisible.value = false
                }
            )
        }
    }
}

@Composable
fun EmptyStudioScreen(onCreateProjectClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Icono estético de Claqueta / Cámara
        Surface(
            modifier = Modifier.size(90.dp),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Default.PlayArrow,
                    contentDescription = "Cine AI Studio Icon",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(45.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "CINE AI STUDIO",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            letterSpacing = androidx.compose.ui.unit.TextUnit.Unspecified,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Orquestador de Cine con Subagentes de IA Especializados",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Organiza tu producción por capas cinematográficas, desde el Guion y la Fotografía hasta el Diseño de Sonido. Cada departamento tiene un subagente dedicado con contrato claro y memoria unificada integrada por Room DB.",
            style = MaterialTheme.typography.bodyMedium,
            color = Color(0xFF9EA0A5),
            textAlign = TextAlign.Center,
            modifier = Modifier.widthIn(max = 480.dp)
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onCreateProjectClick,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .height(52.dp)
                .widthIn(min = 240.dp)
                .testTag("create_first_project_button")
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = "Símbolo de Agregar",
                tint = Color.Black
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Iniciar Producción",
                fontWeight = FontWeight.Bold,
                color = Color.Black,
                style = MaterialTheme.typography.bodyLarge
            )
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
                        onDeleteProjectClick = { viewModel.deleteCurrentProject() }
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
            var activeTabId by remember { mutableIntStateOf(0) } // 0: Estudio/Agentes, 1: Consola, 2: Biblia Central

            Column(modifier = Modifier.fillMaxSize()) {
                // Header superior minimalista con info del proyecto activo
                TopAppBarCompact(
                    project = project,
                    projects = projects,
                    onSelectProject = { viewModel.selectProject(it) },
                    onCreateProjectClick = { viewModel.isCreatingProjectDialogVisible.value = true },
                    onDeleteProjectClick = { viewModel.deleteCurrentProject() }
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
                                    onSelectSubagent = {
                                        viewModel.selectSubagent(it)
                                        activeTabId = 1 // Salta a la consola para editar
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
                                project = project,
                                memories = projectMemories,
                                onClearMemories = { viewModel.clearProjectBible() }
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
                        onClick = { activeTabId = 0 },
                        label = { Text("Estudio") },
                        icon = { Icon(Icons.Default.Menu, contentDescription = "Pestaña Estudio") },
                        modifier = Modifier.testTag("nav_item_estudio")
                    )
                    NavigationBarItem(
                        selected = activeTabId == 1,
                        onClick = { activeTabId = 1 },
                        label = { Text("Consola") },
                        icon = { Icon(Icons.Default.PlayArrow, contentDescription = "Pestaña Consola") },
                        modifier = Modifier.testTag("nav_item_consola")
                    )
                    NavigationBarItem(
                        selected = activeTabId == 2,
                        onClick = { activeTabId = 2 },
                        label = { Text("Biblia DB") },
                        icon = { Icon(Icons.Default.Info, contentDescription = "Pestaña Biblia") },
                        modifier = Modifier.testTag("nav_item_biblia")
                    )
                }
            }
        }
    }
}

@Composable
fun LogoAndProjectSelectorHeader(
    project: MovieProject,
    projects: List<MovieProject>,
    onSelectProject: (MovieProject) -> Unit,
    onCreateProjectClick: () -> Unit,
    onDeleteProjectClick: () -> Unit
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
                    text = "Seleccionar Proyecto:",
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
    onDeleteProjectClick: () -> Unit
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
                    text = "Proyectos del Estudio:",
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

                DropdownMenuItem(
                    leadingIcon = { Icon(Icons.Default.Add, "Agregar") },
                    text = { Text("Crear Película") },
                    onClick = {
                        onCreateProjectClick()
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
    onSelectSubagent: (CinemaSubagent) -> Unit
) {
    val grouped = CinemaSubagentsCatalog.list.groupBy { it.layer }
    val scrollState = rememberScrollState()

    // El estado de cuáles capas están expandidas por defecto
    val expandedLayers = remember {
        mutableStateMapOf<String, Boolean>().apply {
            // Expandimos por defecto las capas 0 y 1 para guiar al usuario
            CinemaSubagentsCatalog.layers.forEach { layerName ->
                this[layerName] = layerName.contains("Capa 0") || layerName.contains("Capa 1")
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
    var selectedTabId by remember { mutableIntStateOf(0) } // 0: Editor/Taller, 1: Memoria Central del Proyecto

    Column(modifier = Modifier.fillMaxSize()) {
        // TabRow de Trabajo
        TabRow(
            selectedTabIndex = selectedTabId,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary
        ) {
            Tab(
                selected = selectedTabId == 0,
                onClick = { selectedTabId = 0 },
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
                onClick = { selectedTabId = 1 },
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
                        project = project,
                        memories = memories,
                        onClearMemories = { viewModel.clearProjectBible() }
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

        // Botón de Lanzamiento de Orquestación
        Button(
            onClick = { viewModel.processSubagentAction() },
            enabled = generationState != GenerationState.Loading,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
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
                    Icon(Icons.Default.PlayArrow, contentDescription = "Lanzar", tint = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Orquestar ${selectedSubagent.name}",
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

                    // Botón para copiar reporte
                    if (generationState is GenerationState.Success) {
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
    project: MovieProject,
    memories: List<ProjectMemory>,
    onClearMemories: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
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
                    text = "Tu Biblia está vacía. Ve al taller de orquestación, selecciona un subagente y presiona 'Orquestar' para guardar folios en la base de datos.",
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
    onConfirm: (title: String, genre: String, artStyle: String, description: String, targetAudience: String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var genre by remember { mutableStateOf("Ciencia Ficción") }
    var artStyle by remember { mutableStateOf("Fotorrealista Oscuro (Brutalista)") }
    var targetAudience by remember { mutableStateOf("Adulto / Maduro") }
    var description by remember { mutableStateOf("") }

    val genres = listOf("Ciencia Ficción", "Fantasía Épica", "Cine Negro / Noir", "Terror Psicológico", "Drama Histórico", "Anime / Cyberpunk")
    val styles = listOf("Fotorrealista Oscuro (Brutalista)", "Estilo Anime Cinematográfico", "Expresionismo Alemán", "Pintoresco / Óleo", "Cyberpunk Neón")
    val audiences = listOf("Adulto / Maduro", "Todo Público (PG)", "Adolescentes / Joves", "Experimental")

    var expandedGenre by remember { mutableStateOf(false) }
    var expandedStyle by remember { mutableStateOf(false) }
    var expandedAudience by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = "NUEVA PRODUCCIÓN DE CINE",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Configura los metadatos globales que heredarán sistemáticamente todos los subagentes del estudio.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Campo: Título de la obra
                Text(text = "Título de la Película:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    placeholder = { Text("Ej. Proyecto Hesperia") },
                    textStyle = MaterialTheme.typography.bodyMedium.copy(color = Color.White),
                    modifier = Modifier.fillMaxWidth().testTag("input_project_title"),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Campo: Género desplegable
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
                            Icon(Icons.Default.Settings, contentDescription = "Arrow")
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

                // Campo: Estilo visual desplegable
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
                            Icon(Icons.Default.Settings, contentDescription = "Arrow")
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

                Spacer(modifier = Modifier.height(12.dp))

                // Campo: Target desplegable
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
                            Icon(Icons.Default.Settings, contentDescription = "Arrow")
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

                // Campo: Sinopsis
                Text(text = "Sinopsis de Base (Brief de la Película):", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    placeholder = { Text("Añade una breve descripción con la idea central de la película...") },
                    textStyle = MaterialTheme.typography.bodyMedium.copy(color = Color.White),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(80.dp)
                        .testTag("input_project_description"),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Botones de acción
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancelar", color = Color.Gray)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (title.isNotBlank() && description.isNotBlank()) {
                                onConfirm(title, genre, artStyle, description, targetAudience)
                            }
                        },
                        enabled = title.isNotBlank() && description.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Iniciar", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
