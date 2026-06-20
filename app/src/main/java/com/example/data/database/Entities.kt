package com.example.data.database

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "movie_projects")
data class MovieProject(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val genre: String,
    val artStyle: String,
    val description: String,
    val targetAudience: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "project_memories",
    foreignKeys = [
        ForeignKey(
            entity = MovieProject::class,
            parentColumns = ["id"],
            childColumns = ["projectId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["projectId"])]
)
data class ProjectMemory(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val projectId: Int,
    val key: String, // Identificador único de agente/rol o sección de biblia
    val title: String,
    val content: String,
    val updatedAt: Long = System.currentTimeMillis()
)

// --- LEVEL 5 PERSISTENCE DESIGN MODELS ---

/**
 * Representa la ejecución persistente del pipeline / motor de workflow de preproducción.
 */
@Entity(
    tableName = "workflow_executions",
    foreignKeys = [
        ForeignKey(
            entity = MovieProject::class,
            parentColumns = ["id"],
            childColumns = ["projectId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["projectId"])]
)
data class WorkflowExecution(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val projectId: Int,
    val state: String, // IDLE, GENERATING, AWAITING_APPROVAL, APPROVED, ERROR
    val correlationId: String,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

/**
 * Representa las etapas individuales de ejecución del motor de workflow (idempotencia y checkpoints).
 */
@Entity(
    tableName = "workflow_step_executions",
    foreignKeys = [
        ForeignKey(
            entity = WorkflowExecution::class,
            parentColumns = ["id"],
            childColumns = ["executionId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["executionId"])]
)
data class WorkflowStepExecution(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val executionId: Int,
    val stepName: String, // ACTS, STORYBOARD, CONSISTENCY, etc.
    val status: String, // PENDING, RUNNING, COMPLETED, FAILED
    val payload: String = "", // Guarda checkpoint intermedio de generación
    val retryCount: Int = 0,
    val lastError: String = "",
    val updatedAt: Long = System.currentTimeMillis()
)

/**
 * Tabla de control para almacenamiento versionado e histórico de cambios creativos (Biblia de proyecto).
 */
@Entity(
    tableName = "project_memory_revisions",
    foreignKeys = [
        ForeignKey(
            entity = MovieProject::class,
            parentColumns = ["id"],
            childColumns = ["projectId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["projectId"])]
)
data class ProjectMemoryRevision(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val projectId: Int,
    val key: String, // ID del subagente / showrunner / guionista
    val title: String,
    val content: String,
    val version: Int,
    val author: String, // "USER" o el "KEY" del subagente que generó el cambio
    val correlationId: String,
    val createdAt: Long = System.currentTimeMillis()
)

/**
 * Auditoria de seguridad de accesos y trazas de auditoria cruzadas por correlation ID.
 */
@Entity(
    tableName = "audit_logs",
    foreignKeys = [
        ForeignKey(
            entity = MovieProject::class,
            parentColumns = ["id"],
            childColumns = ["projectId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["projectId"])]
)
data class AuditLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val projectId: Int,
    val correlationId: String,
    val actor: String, // "SYSTEM", "USER", "SUBAGENT_NAME"
    val action: String, // ej: "VALIDATE_CONSISTENCY", "AUTH", "API_REQUEST"
    val details: String,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * Métricas operativas observadas y consolidadas por ejecución de orquestación.
 */
@Entity(
    tableName = "telemetry_metrics",
    foreignKeys = [
        ForeignKey(
            entity = MovieProject::class,
            parentColumns = ["id"],
            childColumns = ["projectId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["projectId"])]
)
data class TelemetryMetric(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val projectId: Int,
    val correlationId: String,
    val metricName: String, // "STAGE_TIME", "AI_ERROR_RATE", "STAGE_REWORK", "ESTIMATED_COST"
    val keyIdentifier: String, // ej del subagente o paso
    val metricValue: Double,
    val timestamp: Long = System.currentTimeMillis()
)
