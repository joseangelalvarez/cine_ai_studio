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
}
