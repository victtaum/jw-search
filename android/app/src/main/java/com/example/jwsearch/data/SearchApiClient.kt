package com.example.jwsearch.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLDecoder
import java.net.URLEncoder

object SearchApiClient {
    var apiKey: String = ""
    var useLocalBackend: Boolean = false
    var baseUrl: String = "http://10.0.2.2:8000"

    private suspend fun makeGetRequest(urlPath: String): String = withContext(Dispatchers.IO) {
        val url = URL(urlPath)
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.connectTimeout = 10000
        connection.readTimeout = 15000
        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 10; Mobile)")
        connection.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/json")
        if (apiKey.isNotBlank()) {
            connection.setRequestProperty("X-Gemini-Api-Key", apiKey)
        }

        val responseCode = connection.responseCode
        if (responseCode == HttpURLConnection.HTTP_OK) {
            val reader = BufferedReader(InputStreamReader(connection.inputStream, Charsets.UTF_8))
            val response = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                response.append(line).append("\n")
            }
            reader.close()
            connection.disconnect()
            response.toString()
        } else {
            connection.disconnect()
            throw Exception("HTTP Error: $responseCode")
        }
    }

    private suspend fun makePostJsonRequest(urlPath: String, jsonBody: String): String = withContext(Dispatchers.IO) {
        val url = URL(urlPath)
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.connectTimeout = 15000
        connection.readTimeout = 30000
        connection.setRequestProperty("Content-Type", "application/json; utf-8")
        connection.setRequestProperty("Accept", "application/json")
        connection.doOutput = true

        connection.outputStream.use { os ->
            val input = jsonBody.toByteArray(Charsets.UTF_8)
            os.write(input, 0, input.size)
        }

        val responseCode = connection.responseCode
        val isSuccess = responseCode in 200..299
        val inputStream = if (isSuccess) connection.inputStream else connection.errorStream
        
        val reader = BufferedReader(InputStreamReader(inputStream ?: connection.inputStream, Charsets.UTF_8))
        val response = StringBuilder()
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            response.append(line)
        }
        reader.close()
        connection.disconnect()

        if (!isSuccess) {
            val errorMsg = try {
                val errObj = JSONObject(response.toString()).optJSONObject("error")
                errObj?.optString("message") ?: response.toString()
            } catch (e: Exception) {
                response.toString()
            }
            throw Exception("Erro da API ($responseCode): $errorMsg")
        }

        response.toString()
    }

    private fun resolveRedirect(urlStr: String): String {
        if (!urlStr.contains("grounding-api-redirect")) return urlStr
        return try {
            val url = URL(urlStr)
            val conn = url.openConnection() as HttpURLConnection
            conn.instanceFollowRedirects = true
            conn.requestMethod = "HEAD"
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
            conn.connectTimeout = 4000
            conn.readTimeout = 4000
            conn.connect()
            val finalUrl = conn.url.toString()
            conn.disconnect()
            finalUrl
        } catch (e: Exception) {
            urlStr
        }
    }

    private fun inferPublication(title: String, url: String): String {
        val urlLower = url.lowercase()
        val titleLower = title.lowercase()
        return when {
            "sentinela" in urlLower || "watchtower" in urlLower || Regex("""/w\d{4}""").containsMatchIn(urlLower) -> "A Sentinela"
            "despertai" in urlLower || "awake" in urlLower || Regex("""/g\d{4}""").containsMatchIn(urlLower) -> "Despertai!"
            "it-1" in urlLower || "it-2" in urlLower || "perspicaz" in urlLower || "insight" in urlLower -> "Estudo Perspicaz das Escrituras"
            "nwt" in urlLower || "bi12" in urlLower || "biblia" in urlLower || "bible" in urlLower -> "Bíblia Sagrada (Tradução do Novo Mundo)"
            "perguntas" in urlLower || "ijw" in urlLower -> "Perguntas Bíblicas Respondidas"
            "wol.jw.org" in urlLower -> "WOL - Biblioteca Online"
            "jw.org" in urlLower -> "JW.ORG - Site Oficial"
            else -> try { URL(url).host } catch (e: Exception) { "Fonte da Internet" }
        }
    }

    private fun cleanTitle(title: String, url: String): String {
        if (title.isBlank() || title in listOf("jw.org", "WOL", "WOL - Biblioteca", "Link de Referência", "Artigo de Referência")) {
            return try {
                val path = URL(url).path.trim('/')
                val parts = path.split("/").filter { it.isNotBlank() && it !in listOf("pt", "en", "es", "wol", "d", "r5", "lp-t") }
                if (parts.isNotEmpty()) {
                    val slug = URLDecoder.decode(parts.last(), "UTF-8").replace("-", " ").replace("_", " ")
                    slug.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
                } else "Artigo da Biblioteca"
            } catch (e: Exception) {
                "Artigo da Biblioteca"
            }
        }
        return try { URLDecoder.decode(title.trim(), "UTF-8") } catch (e: Exception) { title.trim() }
    }

    private fun buildPrompt(query: String, includeExternal: Boolean, lang: String): String {
        val targetLang = when (lang) {
            "en" -> "English"
            "es" -> "Español"
            else -> "Português (Brasil)"
        }
        val sourceDirective = if (includeExternal) {
            """Você tem permissão para pesquisar na Internet em geral para contextualizar fatos históricos, arqueológicos ou científicos.
No entanto, PRIORIZE E DESTAQUE SEMPRE o entendimento teocrático oficial publicado em wol.jw.org e jw.org.
SEPARAÇÃO OBRIGATÓRIA: Qualquer informação ou fonte externa que não venha de jw.org/wol.jw.org DEVE ser categorizada exclusivamente no final sob a seção '### 🌐 Fontes Externas (Internet)'."""
        } else {
            """ATENÇÃO: Sua pesquisa DEVE SER RESTRITA EXCLUSIVAMENTE aos sites oficiais das Testemunhas de Jeová: wol.jw.org e jw.org (incluindo todos os subdomínios).
- NÃO utilize nenhuma fonte de terceiros, blogs, enciclopédias seculares ou opiniões não-oficiais.
- Toda explicação doutrinária, moral ou histórica deve estar fundamentada nas publicações oficiais (A Sentinela, Despertai!, Estudo Perspicaz das Escrituras, Livros da Torre de Vigia, etc.).
- Se um determinado aspecto não for abordado nas fontes oficiais, declare isso com humildade e fidelidade ao registro teocrático."""
        }

        return """Você é um assistente de pesquisa teocrática avançado e profundo (no estilo de um motor de busca analítico como Perplexity AI / RAG Especializado), focado no acervo da Biblioteca Online da Torre de Vigia (wol.jw.org) e do site oficial (jw.org).

IDIOMA DA RESPOSTA: Responda obrigatoriamente em $targetLang.

DIRETRIZES DE ESCOPO E FONTES:
$sourceDirective

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (Use formatação Markdown elegante com títulos e tópicos):

### 📌 Resposta Direta & Síntese
(Apresente um resumo claro, objetivo e bíblico que responde diretamente à pergunta do usuário).

### 📖 Análise Teocrática Detalhada
(Desenvolva os pontos fundamentais com profundidade, lógica e consideração respeitosa):
- Explique o contexto e o raciocínio das publicações das Testemunhas de Jeová.
- Crie tópicos bem explicados para cada nuance da pergunta.
- Mencione nominalmente as publicações relevantes quando aplicável (ex: *A Sentinela*, *Despertai!*, *Estudo Perspicaz das Escrituras*, seções *Perguntas dos Leitores*, etc.).
- Inclua links clicáveis em Markdown diretamente no texto sempre que citar um artigo ou publicação (ex: `[Título do Artigo](https://wol.jw.org/pt/...)`).

### 📜 Textos Bíblicos Principais
(Destaque os textos bíblicos mais relevantes para o assunto, explicando em uma frase como cada um se aplica ao tema).

### 📚 Publicações e Fontes Oficiais
(Liste em tópicos os artigos, capítulos ou tópicos do wol.jw.org e jw.org que o leitor pode consultar para se aprofundar, sempre com o link Markdown formatado).

${if (includeExternal) "### 🌐 Fontes Externas (Internet)" else ""}

PERGUNTA DO USUÁRIO: "$query"
"""
    }

    // Direct standalone search executing directly from device to Gemini REST API
    private suspend fun directSearch(query: String, external: Boolean, lang: String): SearchResponse = withContext(Dispatchers.IO) {
        val currentKey = apiKey.trim()
        if (currentKey.isEmpty()) {
            throw Exception("Chave da API do Gemini não configurada. Toque no ícone de engrenagem ⚙️ no topo para inserir sua chave gratuita.")
        }

        val urlPath = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$currentKey"
        val prompt = buildPrompt(query, external, lang)

        val requestJson = JSONObject().apply {
            put("contents", JSONArray().apply {
                put(JSONObject().apply {
                    put("role", "user")
                    put("parts", JSONArray().apply {
                        put(JSONObject().apply {
                            put("text", prompt)
                        })
                    })
                })
            })
            put("tools", JSONArray().apply {
                put(JSONObject().apply {
                    put("googleSearch", JSONObject())
                })
            })
        }

        val jsonString = makePostJsonRequest(urlPath, requestJson.toString())
        val root = JSONObject(jsonString)

        val candidates = root.optJSONArray("candidates")
        if (candidates == null || candidates.length() == 0) {
            val errorObj = root.optJSONObject("error")
            val errorMsg = errorObj?.optString("message", "Nenhuma resposta gerada.") ?: "Nenhuma resposta gerada."
            throw Exception(errorMsg)
        }

        val candidate = candidates.getJSONObject(0)
        val content = candidate.optJSONObject("content")
        val parts = content?.optJSONArray("parts")
        val aiResponse = if (parts != null && parts.length() > 0) {
            parts.getJSONObject(0).optString("text", "")
        } else ""

        val rawChunks = mutableListOf<Pair<String, String>>()
        val metadata = candidate.optJSONObject("groundingMetadata")
        val groundingChunks = metadata?.optJSONArray("groundingChunks")
        if (groundingChunks != null) {
            for (i in 0 until groundingChunks.length()) {
                val chunk = groundingChunks.getJSONObject(i)
                val web = chunk.optJSONObject("web")
                if (web != null) {
                    val uri = web.optString("uri", "")
                    val title = web.optString("title", "")
                    if (uri.isNotBlank() && rawChunks.none { it.first == uri }) {
                        rawChunks.add(Pair(uri, title))
                    }
                }
            }
        }

        val mdLinks = Regex("""\[([^\]]+)\]\((https?://[a-zA-Z0-9\.\-\/\?&\=\#\%\+\:\_]+)\)""").findAll(aiResponse)
        for (m in mdLinks) {
            val title = m.groupValues[1]
            val uri = m.groupValues[2]
            if (uri.isNotBlank() && rawChunks.none { it.first == uri }) {
                rawChunks.add(Pair(uri, title))
            }
        }

        val rawUris = Regex("""(?<!\()(https?://[a-zA-Z0-9\.\-\/\?&\=\#\%\+\:\_]+)""").findAll(aiResponse)
        for (m in rawUris) {
            var uri = m.groupValues[1]
            while (uri.isNotEmpty() && uri.last() in listOf('.', ',', ';', ')', ']')) {
                uri = uri.dropLast(1)
            }
            if (uri.isNotBlank() && rawChunks.none { it.first == uri }) {
                rawChunks.add(Pair(uri, "Artigo de Referência"))
            }
        }

        val results = mutableListOf<SearchResult>()
        val seenUris = mutableSetOf<String>()

        for ((uri, title) in rawChunks) {
            val finalUri = resolveRedirect(uri)
            val cleanUri = finalUri.substringBefore('?').substringBefore('#')
            if (cleanUri in seenUris) continue
            seenUris.add(cleanUri)

            val isExternal = !("jw.org" in finalUri || "wol.jw.org" in finalUri)
            if (!external && isExternal) continue

            val pub = inferPublication(title, finalUri)
            val cleanT = cleanTitle(title, finalUri)

            results.add(
                SearchResult(
                    title = cleanT,
                    snippet = "Publicação citada nas ponderações da pesquisa teocrática. Toque para ler no leitor integrado ou acessar a fonte.",
                    link = finalUri,
                    publication = pub,
                    isExternal = isExternal,
                    sourceSite = try { URL(finalUri).host } catch (e: Exception) { "" }
                )
            )
        }

        SearchResponse(aiResponse, results)
    }

    // Direct standalone reader extracting article directly from wol.jw.org on mobile
    private suspend fun directReadDocument(urlStr: String): String = withContext(Dispatchers.IO) {
        val html = makeGetRequest(urlStr)
        
        var cleanHtml = html
        val articleMatcher = Regex("""<article[^>]*>([\s\S]*?)</article>""").find(html)
        val docMatcher = Regex("""<div class="document"[^>]*>([\s\S]*?)</div>\s*</div>""").find(html)
        if (articleMatcher != null) {
            cleanHtml = articleMatcher.value
        } else if (docMatcher != null) {
            cleanHtml = docMatcher.value
        }

        cleanHtml = cleanHtml
            .replace(Regex("""<script[\s\S]*?</script>"""), "")
            .replace(Regex("""<nav[\s\S]*?</nav>"""), "")
            .replace(Regex("""<button[\s\S]*?</button>"""), "")
            .replace(Regex("""class="[^"]*pageNum[^"]*""""), "style=\"display:none;\"")
            .replace(Regex("""class="[^"]*audioButton[^"]*""""), "style=\"display:none;\"")
            .replace(Regex("""href="/"""), "href=\"https://wol.jw.org/")

        cleanHtml
    }

    // Main search interface: defaults to direct standalone search on the device
    suspend fun search(query: String, external: Boolean, lang: String): SearchResponse {
        if (!useLocalBackend) {
            return directSearch(query, external, lang)
        }
        
        val encodedQuery = URLEncoder.encode(query, "UTF-8")
        val urlPath = "$baseUrl/api/search?q=$encodedQuery&external=$external&lang=$lang"
        val jsonString = makeGetRequest(urlPath)
        val jsonObject = JSONObject(jsonString)
        
        val aiResponse = jsonObject.optString("ai_response", "")
        val jsonArray = jsonObject.getJSONArray("results")
        val results = mutableListOf<SearchResult>()
        
        for (i in 0 until jsonArray.length()) {
            val obj = jsonArray.getJSONObject(i)
            results.add(
                SearchResult(
                    title = obj.optString("title", "Sem título"),
                    snippet = obj.optString("snippet", ""),
                    link = obj.optString("link", ""),
                    publication = obj.optString("publication", ""),
                    isExternal = obj.optBoolean("is_external", false),
                    sourceSite = obj.optString("source_site", "")
                )
            )
        }
        return SearchResponse(aiResponse, results)
    }

    // Main reader interface: defaults to direct standalone reader on the device
    suspend fun readDocument(url: String): String {
        if (!useLocalBackend) {
            return directReadDocument(url)
        }

        val encodedUrl = URLEncoder.encode(url, "UTF-8")
        val urlPath = "$baseUrl/api/read?url=$encodedUrl"
        val jsonString = makeGetRequest(urlPath)
        val jsonObject = JSONObject(jsonString)
        return jsonObject.optString("content", "")
    }

    suspend fun saveApiKey(apiKeyToSave: String): Boolean {
        apiKey = apiKeyToSave
        if (useLocalBackend) {
            val urlPath = "$baseUrl/api/config"
            val body = JSONObject().apply { put("api_key", apiKeyToSave) }.toString()
            makePostJsonRequest(urlPath, body)
        }
        return true
    }

    suspend fun checkApiKeyStatus(): Boolean {
        if (!useLocalBackend) {
            return apiKey.isNotBlank()
        }
        return try {
            val urlPath = "$baseUrl/api/config"
            val jsonString = makeGetRequest(urlPath)
            val jsonObject = JSONObject(jsonString)
            jsonObject.optBoolean("has_key", false)
        } catch (e: Exception) {
            false
        }
    }
}

