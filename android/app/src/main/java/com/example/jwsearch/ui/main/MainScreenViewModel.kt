package com.example.jwsearch.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.jwsearch.data.SearchApiClient
import com.example.jwsearch.data.SearchResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

import android.content.Context

class MainScreenViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    init {
        _uiState.update { 
            it.copy(
                serverUrl = SearchApiClient.baseUrl,
                hasApiKey = SearchApiClient.apiKey.isNotBlank()
            ) 
        }
        checkApiKeyStatus()
    }

    fun onQueryChanged(query: String) {
        _uiState.update { it.copy(query = query) }
    }

    fun onExternalChanged(external: Boolean) {
        _uiState.update { it.copy(includeExternal = external) }
    }

    fun onLanguageChanged(lang: String) {
        _uiState.update { it.copy(language = lang) }
    }

    fun onServerUrlChanged(url: String) {
        _uiState.update { it.copy(serverUrl = url) }
        SearchApiClient.baseUrl = url
        checkApiKeyStatus()
    }

    fun onApiKeyInputChanged(key: String) {
        _uiState.update { it.copy(apiKeyInput = key, apiKeyMessage = null) }
    }

    fun checkApiKeyStatus() {
        viewModelScope.launch {
            val hasKey = SearchApiClient.checkApiKeyStatus()
            _uiState.update { it.copy(hasApiKey = hasKey) }
        }
    }

    fun saveApiKey(context: Context? = null) {
        val key = _uiState.value.apiKeyInput.trim()
        if (key.isEmpty()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isSavingKey = true, apiKeyMessage = null) }
            try {
                SearchApiClient.apiKey = key
                context?.let { ctx ->
                    val prefs = ctx.getSharedPreferences("jw_search_prefs", Context.MODE_PRIVATE)
                    prefs.edit().putString("gemini_api_key", key).apply()
                }
                SearchApiClient.saveApiKey(key)
                _uiState.update { 
                    it.copy(
                        isSavingKey = false, 
                        hasApiKey = true, 
                        apiKeyInput = "",
                        apiKeyMessage = "Chave salva e ativada com sucesso!"
                    ) 
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isSavingKey = false, 
                        apiKeyMessage = "Erro ao salvar chave: ${e.message}"
                    ) 
                }
            }
        }
    }

    fun search() {
        val query = _uiState.value.query.trim()
        if (query.isEmpty()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, results = emptyList(), aiResponse = "") }
            try {
                val response = SearchApiClient.search(
                    query = query,
                    external = _uiState.value.includeExternal,
                    lang = _uiState.value.language
                )
                _uiState.update { it.copy(results = response.results, aiResponse = response.aiResponse, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        errorMessage = e.message ?: "Falha ao conectar com o servidor do backend."
                    ) 
                }
            }
        }
    }
}

data class MainUiState(
    val query: String = "",
    val includeExternal: Boolean = false,
    val language: String = "pt",
    val serverUrl: String = "",
    val results: List<SearchResult> = emptyList(),
    val aiResponse: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val hasApiKey: Boolean = false,
    val apiKeyInput: String = "",
    val isSavingKey: Boolean = false,
    val apiKeyMessage: String? = null
)

