package com.example.jwsearch.ui.main

import android.os.Build
import android.text.Html
import android.text.method.LinkMovementMethod
import android.widget.TextView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.jwsearch.data.SearchApiClient
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReaderScreen(
    url: String,
    title: String,
    publication: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var htmlContent by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var fontSize by remember { mutableStateOf(18) } // default text size in sp
    
    val scope = rememberCoroutineScope()
    
    // Fetch article on load
    LaunchedEffect(url) {
        scope.launch {
            try {
                isLoading = true
                val content = SearchApiClient.readDocument(url)
                htmlContent = content
                isLoading = false
            } catch (e: Exception) {
                errorMessage = e.message ?: "Erro desconhecido ao carregar documento"
                isLoading = false
            }
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = title,
                            maxLines = 1,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = publication,
                            maxLines = 1,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Voltar")
                    }
                },
                actions = {
                    // Font Size Adjusters
                    Row(
                        modifier = Modifier.padding(end = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(
                            onClick = { if (fontSize > 14) fontSize -= 2 },
                            contentPadding = PaddingValues(horizontal = 8.dp)
                        ) {
                            Text("A-", fontSize = 14.sp)
                        }
                        TextButton(
                            onClick = { if (fontSize < 30) fontSize += 2 },
                            contentPadding = PaddingValues(horizontal = 8.dp)
                        ) {
                            Text("A+", fontSize = 14.sp)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
        },
        modifier = modifier
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFFCFBF9)) // Creamy paper-like background color
        ) {
            if (isLoading) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator()
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Carregando texto limpo...", fontSize = 14.sp, color = Color.Gray)
                }
            } else if (errorMessage != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Erro ao carregar o artigo",
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 18.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = errorMessage ?: "",
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        fontSize = 14.sp
                    )
                }
            } else if (htmlContent != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 24.dp)
                ) {
                    Text(
                        text = title,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold,
                        lineHeight = 32.sp,
                        color = Color(0xFF1A1A1A),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    Text(
                        text = publication,
                        fontSize = 13.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(bottom = 20.dp)
                    )
                    
                    Divider(color = Color.LightGray.copy(alpha = 0.5f), modifier = Modifier.padding(bottom = 20.dp))
                    
                    AndroidView(
                        factory = { context ->
                            TextView(context).apply {
                                movementMethod = LinkMovementMethod.getInstance()
                                // Configure text layout
                                setTextColor(android.graphics.Color.parseColor("#222222"))
                                setLinkTextColor(android.graphics.Color.parseColor("#1A73E8"))
                                setLineSpacing(0f, 1.3f)
                            }
                        },
                        update = { textView ->
                            textView.textSize = fontSize.toFloat()
                            textView.text = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                                Html.fromHtml(htmlContent ?: "", Html.FROM_HTML_MODE_LEGACY)
                            } else {
                                Html.fromHtml(htmlContent ?: "")
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}
