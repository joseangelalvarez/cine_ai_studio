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
}
