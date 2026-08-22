package com.example.jwsearch.ui.main

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.text.Html
import android.text.method.LinkMovementMethod
import android.widget.TextView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavKey
import com.example.jwsearch.Reader
import com.example.jwsearch.data.SearchResult

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MainScreenViewModel = viewModel { MainScreenViewModel() }
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val keyboardController = LocalSoftwareKeyboardController.current
    var showSettings by remember { mutableStateOf(false) }


    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("JW Search", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                    }
                },
                actions = {
                    IconButton(onClick = { showSettings = !showSettings }) {
                        Icon(imageVector = Icons.Default.Settings, contentDescription = "Configurações")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        modifier = modifier
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
        ) {
            // Settings Panel for Server URL
            AnimatedVisibility(visible = showSettings) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Configurações do Servidor",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        OutlinedTextField(
                            value = state.serverUrl,
                            onValueChange = { viewModel.onServerUrlChanged(it) },
                            label = { Text("Endereço IP do Backend") },
                            placeholder = { Text("ex: http://10.0.2.2:8000") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Text(
                            "Nota: Use http://10.0.2.2:8000 para emulador Android ou o IP do seu computador na mesma rede (ex: http://192.168.1.15:8000) se estiver testando em um celular real.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 14.sp,
                            modifier = Modifier.padding(top = 4.dp)
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                        HorizontalDivider()
                        Spacer(modifier = Modifier.height(12.dp))

                        // Embedded Gemini Key Setup Wizard
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                "Chave de IA (Google Gemini)",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            val statusBadge = if (state.hasApiKey) "Ativa ✅" else "Não configurada ⚠️"
                            val badgeColor = if (state.hasApiKey) Color(0xFF1B873F) else Color(0xFFC07000)
                            Text(
                                text = statusBadge,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = badgeColor
                            )
                        }

                        Text(
                            "Passo 1: Obtenha sua chave gratuita com sua conta Google.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = 6.dp, bottom = 4.dp)
                        )

                        OutlinedButton(
                            onClick = {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://aistudio.google.com/app/apikey"))
                                context.startActivity(intent)
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Abrir Google AI Studio (Criar Chave)", fontSize = 12.sp)
                        }

                        Text(
                            "Passo 2: Cole sua chave abaixo e clique em Salvar:",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = state.apiKeyInput,
                                onValueChange = { viewModel.onApiKeyInputChanged(it) },
                                placeholder = { Text("AIzaSy...") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = { viewModel.saveApiKey(context) },
                                enabled = state.apiKeyInput.trim().isNotEmpty() && !state.isSavingKey
                            ) {
                                Text(if (state.isSavingKey) "..." else "Salvar", fontSize = 12.sp)
                            }
                        }

                        if (state.apiKeyMessage != null) {
                            Text(
                                text = state.apiKeyMessage ?: "",
                                fontSize = 12.sp,
                                color = if (state.hasApiKey) Color(0xFF1B873F) else MaterialTheme.colorScheme.error,
                                modifier = Modifier.padding(top = 6.dp)
                            )
                        }
                    }
                }
            }

            // Prominent Onboarding Card for First-Time Setup
            if (!state.hasApiKey && !showSettings) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                        .border(1.dp, Color(0xFFE5A93C), RoundedCornerShape(12.dp)),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFDF8))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "🔑 Configuração da Chave de IA",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = Color(0xFFB57000)
                        )
                        Text(
                            "Este aplicativo roda 100% autônomo no seu celular sem precisar de computador! Para ativar a pesquisa com IA, adicione sua chave gratuita do Google Gemini:",
                            fontSize = 12.sp,
                            color = Color(0xFF444444),
                            lineHeight = 16.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)
                        )
                        OutlinedButton(
                            onClick = {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://aistudio.google.com/app/apikey"))
                                context.startActivity(intent)
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("1. Abrir Google AI Studio (Criar Chave Gratuita)", fontSize = 12.sp)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = state.apiKeyInput,
                                onValueChange = { viewModel.onApiKeyInputChanged(it) },
                                placeholder = { Text("Cole sua chave AIzaSy...") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = { viewModel.saveApiKey(context) },
                                enabled = state.apiKeyInput.trim().isNotEmpty() && !state.isSavingKey
                            ) {
                                Text(if (state.isSavingKey) "..." else "Ativar", fontSize = 12.sp)
                            }
                        }
                        if (state.apiKeyMessage != null) {
                            Text(
                                text = state.apiKeyMessage ?: "",
                                fontSize = 12.sp,
                                color = if (state.hasApiKey) Color(0xFF1B873F) else MaterialTheme.colorScheme.error,
                                modifier = Modifier.padding(top = 6.dp)
                            )
                        }
                    }
                }
            }

            // Search Bar Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    OutlinedTextField(
                        value = state.query,
                        onValueChange = { viewModel.onQueryChanged(it) },
                        placeholder = { Text("Digite o assuntou ou dúvida") },
                        leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = "Pesquisar") },
                        trailingIcon = {
                            if (state.query.isNotEmpty()) {
                                IconButton(onClick = { viewModel.onQueryChanged("") }) {
                                    Icon(imageVector = Icons.Default.Clear, contentDescription = "Limpar")
                                }
                            }
                        },
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = KeyboardActions(
                            onSearch = {
                                if (state.query.trim().isNotEmpty() && !state.isLoading) {
                                    keyboardController?.hide()
                                    viewModel.search()
                                }
                            }
                        ),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Language Selector
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Idioma: ", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            var expanded by remember { mutableStateOf(false) }
                            val languages = mapOf("pt" to "Português", "en" to "English", "es" to "Español")
                            
                            Box {
                                Text(
                                    text = languages[state.language] ?: "Português",
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier
                                        .clickable { expanded = true }
                                        .padding(vertical = 4.dp, horizontal = 8.dp)
                                )
                                DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                                    languages.forEach { (code, name) ->
                                        DropdownMenuItem(
                                            text = { Text(name) },
                                            onClick = {
                                                viewModel.onLanguageChanged(code)
                                                expanded = false
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        // Search Button
                        Button(
                            onClick = {
                                keyboardController?.hide()
                                viewModel.search()
                            },
                            enabled = state.query.trim().isNotEmpty() && !state.isLoading,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Buscar")
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // External Search Toggle Switch
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Switch(
                            checked = state.includeExternal,
                            onCheckedChange = { viewModel.onExternalChanged(it) }
                        )
                        Text(
                            text = "Pesquisar também na Internet (outras fontes)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(start = 12.dp)
                        )
                    }
                }
            }

            // Loading state
            if (state.isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            // Error Card
            if (state.errorMessage != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "Erro",
                            tint = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                "Erro na Conexão",
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                fontSize = 14.sp
                            )
                            Text(
                                state.errorMessage ?: "",
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                fontSize = 12.sp,
                                lineHeight = 16.sp
                            )
                        }
                    }
                }
            }

            // Results List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // AI Response Card
                if (state.aiResponse.isNotEmpty()) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, Color(0xFFC0D2F3), RoundedCornerShape(12.dp)),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFF4F7FC))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(bottom = 10.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Info,
                                        contentDescription = "IA",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Ponderações da Inteligência Artificial",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                AndroidView(
                                    factory = { ctx ->
                                        TextView(ctx).apply {
                                            movementMethod = LinkMovementMethod.getInstance()
                                            setTextColor(android.graphics.Color.parseColor("#222222"))
                                            setLinkTextColor(android.graphics.Color.parseColor("#1A73E8"))
                                            textSize = 14f
                                            setLineSpacing(0f, 1.25f)
                                        }
                                    },
                                    update = { textView ->
                                        val formattedHtml = markdownToHtml(state.aiResponse)
                                        textView.text = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                                            Html.fromHtml(formattedHtml, Html.FROM_HTML_MODE_LEGACY)
                                        } else {
                                            Html.fromHtml(formattedHtml)
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }

                if (state.results.isEmpty() && !state.isLoading && state.errorMessage == null) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 40.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "Digite um termo e clique em Buscar",
                                fontSize = 14.sp,
                                color = Color.Gray
                            )
                        }
                    }
                } else {
                    items(state.results) { result ->
                        ResultCard(
                            result = result,
                            onOpenWeb = { url ->
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                context.startActivity(intent)
                            },
                            onReadInApp = { url, title, pub ->
                                onItemClick(Reader(url, title, pub))
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ResultCard(
    result: SearchResult,
    onOpenWeb: (String) -> Unit,
    onReadInApp: (String, String, String) -> Unit
) {
    // Styling variables depending on whether it is external or official
    val borderStroke = if (result.isExternal) {
        Modifier.border(1.dp, Color(0xFFE5A93C), RoundedCornerShape(12.dp))
    } else {
        Modifier.border(1.dp, Color(0xFFC0D2F3), RoundedCornerShape(12.dp))
    }
    
    val cardBgColor = if (result.isExternal) Color(0xFFFFFDF8) else Color.White
    
    val badgeText = if (result.isExternal) "FONTE EXTERNA" else "FONTE OFICIAL"
    val badgeBgColor = if (result.isExternal) Color(0xFFFFF1D6) else Color(0xFFE8F0FE)
    val badgeTextColor = if (result.isExternal) Color(0xFFB57000) else Color(0xFF1967D2)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(borderStroke)
            .clip(RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = cardBgColor)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row: Source Badge and Publication Text
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = result.publication,
                    fontSize = 11.sp,
                    fontStyle = FontStyle.Italic,
                    color = Color.Gray,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                
                Box(
                    modifier = Modifier
                        .background(badgeBgColor, RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = badgeText,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeTextColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Title
            Text(
                text = result.title,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.primary,
                lineHeight = 20.sp,
                modifier = Modifier
                    .clickable { onOpenWeb(result.link) }
                    .padding(bottom = 6.dp)
            )

            // Snippet
            Text(
                text = result.snippet,
                fontSize = 13.sp,
                lineHeight = 18.sp,
                color = Color(0xFF333333),
                maxLines = 4,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            Divider(color = Color.LightGray.copy(alpha = 0.4f))

            Spacer(modifier = Modifier.height(8.dp))

            // Action row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // If it is official and from wol.jw.org, show Read In App
                if (!result.isExternal && result.link.contains("wol.jw.org")) {
                    TextButton(
                        onClick = { onReadInApp(result.link, result.title, result.publication) },
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text("Ler no App", fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                }

                OutlinedButton(
                    onClick = { onOpenWeb(result.link) },
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text("Acessar Fonte", fontSize = 12.sp)
                }
            }
        }
    }
}

fun markdownToHtml(markdown: String): String {
    return markdown
        .replace(Regex("""(?m)^### (.*?)$"""), "<br/><font color=\"#155799\"><b>$1</b></font><br/>")
        .replace(Regex("""(?m)^## (.*?)$"""), "<br/><font color=\"#155799\"><b>$1</b></font><br/>")
        .replace(Regex("""(?m)^# (.*?)$"""), "<br/><font color=\"#155799\"><b>$1</b></font><br/>")
        .replace(Regex("""\*\*(.*?)\*\*"""), "<b>$1</b>")
        .replace(Regex("""\*(.*?)\*"""), "<i>$1</i>")
        .replace(Regex("""\[(.*?)\]\((https?://.*?)\)"""), "<a href=\"$2\">$1</a>")
        .replace(Regex("""(?m)^\* (.*?)$"""), "• $1<br/>")
        .replace(Regex("""(?m)^- (.*?)$"""), "• $1<br/>")
        .replace("\n", "<br/>")
}

