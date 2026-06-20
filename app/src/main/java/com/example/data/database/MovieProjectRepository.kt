package com.example.data.database

import kotlinx.coroutines.flow.Flow

class MovieProjectRepository(private val dao: MovieProjectDao) {
    val allProjects: Flow<List<MovieProject>> = dao.getAllMovieProjects()

    fun getProject(id: Int): Flow<MovieProject?> = dao.getMovieProjectById(id)

    fun getMemories(projectId: Int): Flow<List<ProjectMemory>> = dao.getMemoriesForProject(projectId)

    suspend fun insertProject(project: MovieProject): Long {
        return dao.insertMovieProject(project)
    }

    suspend fun deleteProject(project: MovieProject) {
        dao.deleteMovieProject(project)
    }

    suspend fun getMemoryByKey(projectId: Int, key: String): ProjectMemory? {
        return dao.getProjectMemoryByKey(projectId, key)
    }

    suspend fun insertMemory(memory: ProjectMemory) {
        dao.insertProjectMemory(memory)
    }

    suspend fun clearMemories(projectId: Int) {
        dao.clearMemoriesForProject(projectId)
    }

    // --- WORKFLOW EXECUTIONS ENGINE REDIRECTIONS ---
    suspend fun getLatestWorkflowExecution(projectId: Int): WorkflowExecution? {
        return dao.getLatestWorkflowExecution(projectId)
    }

    suspend fun insertWorkflowExecution(execution: WorkflowExecution): Long {
        return dao.insertWorkflowExecution(execution)
    }

    // --- WORKFLOW STEP EXECUTIONS REDIRECTIONS ---
    suspend fun getStepExecutionsForWorkflow(executionId: Int): List<WorkflowStepExecution> {
        return dao.getStepExecutionsForWorkflow(executionId)
    }

    suspend fun getStepExecutionByName(executionId: Int, stepName: String): WorkflowStepExecution? {
        return dao.getStepExecutionByName(executionId, stepName)
    }

    suspend fun insertWorkflowStepExecution(stepExecution: WorkflowStepExecution): Long {
        return dao.insertWorkflowStepExecution(stepExecution)
    }

    // --- MEMORY REVISION REPOSITORY ---
    fun getRevisionsForProject(projectId: Int): Flow<List<ProjectMemoryRevision>> {
        return dao.getRevisionsForProject(projectId)
    }

    suspend fun getRevisionsForKey(projectId: Int, key: String): List<ProjectMemoryRevision> {
        return dao.getRevisionsForKey(projectId, key)
    }

    suspend fun insertProjectMemoryRevision(revision: ProjectMemoryRevision): Long {
        return dao.insertProjectMemoryRevision(revision)
    }

    // --- AUDIT SYSTEM LOGGING ---
    fun getAuditLogsForProject(projectId: Int): Flow<List<AuditLog>> {
        return dao.getAuditLogsForProject(projectId)
    }

    suspend fun insertAuditLog(log: AuditLog): Long {
        return dao.insertAuditLog(log)
    }

    // --- TELEMETRY AND METRIC REPORTING ---
    fun getTelemetryMetricsForProject(projectId: Int): Flow<List<TelemetryMetric>> {
        return dao.getTelemetryMetricsForProject(projectId)
    }

    suspend fun insertTelemetryMetric(metric: TelemetryMetric): Long {
        return dao.insertTelemetryMetric(metric)
    }
}
