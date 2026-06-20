package com.example.data.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface MovieProjectDao {
    @Query("SELECT * FROM movie_projects ORDER BY createdAt DESC")
    fun getAllMovieProjects(): Flow<List<MovieProject>>

    @Query("SELECT * FROM movie_projects WHERE id = :id LIMIT 1")
    fun getMovieProjectById(id: Int): Flow<MovieProject?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovieProject(project: MovieProject): Long

    @Delete
    suspend fun deleteMovieProject(project: MovieProject)

    @Query("SELECT * FROM project_memories WHERE projectId = :projectId ORDER BY updatedAt DESC")
    fun getMemoriesForProject(projectId: Int): Flow<List<ProjectMemory>>

    @Query("SELECT * FROM project_memories WHERE projectId = :projectId AND `key` = :key LIMIT 1")
    suspend fun getProjectMemoryByKey(projectId: Int, key: String): ProjectMemory?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjectMemory(memory: ProjectMemory)

    @Query("DELETE FROM project_memories WHERE projectId = :projectId")
    suspend fun clearMemoriesForProject(projectId: Int)

    // --- WORKFLOW EXECUTIONS DAO ---
    @Query("SELECT * FROM workflow_executions WHERE projectId = :projectId ORDER BY updatedAt DESC LIMIT 1")
    suspend fun getLatestWorkflowExecution(projectId: Int): WorkflowExecution?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorkflowExecution(execution: WorkflowExecution): Long

    // --- WORKFLOW STEP EXECUTIONS DAO ---
    @Query("SELECT * FROM workflow_step_executions WHERE executionId = :executionId ORDER BY id ASC")
    suspend fun getStepExecutionsForWorkflow(executionId: Int): List<WorkflowStepExecution>

    @Query("SELECT * FROM workflow_step_executions WHERE executionId = :executionId AND stepName = :stepName LIMIT 1")
    suspend fun getStepExecutionByName(executionId: Int, stepName: String): WorkflowStepExecution?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorkflowStepExecution(stepExecution: WorkflowStepExecution): Long

    // --- PROJECT MEMORY REVISIONS SYSTEM ---
    @Query("SELECT * FROM project_memory_revisions WHERE projectId = :projectId ORDER BY createdAt DESC")
    fun getRevisionsForProject(projectId: Int): Flow<List<ProjectMemoryRevision>>

    @Query("SELECT * FROM project_memory_revisions WHERE projectId = :projectId AND `key` = :key ORDER BY version DESC")
    suspend fun getRevisionsForKey(projectId: Int, key: String): List<ProjectMemoryRevision>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjectMemoryRevision(revision: ProjectMemoryRevision): Long

    // --- AUDIT SYSTEM DAO ---
    @Query("SELECT * FROM audit_logs WHERE projectId = :projectId ORDER BY timestamp DESC")
    fun getAuditLogsForProject(projectId: Int): Flow<List<AuditLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAuditLog(log: AuditLog): Long

    // --- TELEMETRY AND METRICS DAO ---
    @Query("SELECT * FROM telemetry_metrics WHERE projectId = :projectId ORDER BY timestamp DESC")
    fun getTelemetryMetricsForProject(projectId: Int): Flow<List<TelemetryMetric>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTelemetryMetric(metric: TelemetryMetric): Long
}
