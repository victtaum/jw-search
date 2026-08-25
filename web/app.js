// ==========================================
// JW Search - Conversational Theocratic Agent
// ==========================================

const API_BASE = "";

// State
// State
let currentProvider = localStorage.getItem("jw_search_active_provider") || "gemini";
let currentFontSize = 18; // Reader font size in pixels

let activeConversation = {
    id: "conv_" + Date.now(),
    title: "Pesquisa Teocrática",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turns: [], // Array of { query, answer, results, provider, model, latency, timestamp }
    provider: currentProvider
};

// DOM Elements
const searchCard = document.getElementById("search-card");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const externalCheckbox = document.getElementById("external-checkbox");
const langSelect = document.getElementById("lang-select");

const chatThreadContainer = document.getElementById("chat-thread-container");
const chatMessagesList = document.getElementById("chat-messages-list");
const statusContainer = document.getElementById("status-container");
const statusText = document.getElementById("status-text");

const followupContainer = document.getElementById("followup-container");
const followupForm = document.getElementById("followup-form");
const followupInput = document.getElementById("followup-input");
const btnNewChat = document.getElementById("btn-new-chat");

// Header actions
const btnHeaderHome = document.getElementById("btn-header-home");
const btnImportStudy = document.getElementById("btn-import-study");
const fileImportStudy = document.getElementById("file-import-study");
const btnOpenHistory = document.getElementById("btn-open-history");
const historyCountBadge = document.getElementById("history-count-badge");
const btnOpenDiagnostics = document.getElementById("btn-open-diagnostics");

// Diagnostics Modal Elements
const diagnosticsModal = document.getElementById("diagnostics-modal");
const diagnosticsModalContainer = document.getElementById("diagnostics-modal-container");
const btnCloseDiagnosticsModal = document.getElementById("btn-close-diagnostics-modal");
const btnCloseDiagnosticsFooter = document.getElementById("btn-close-diagnostics-footer");
const btnRunDiagnostics = document.getElementById("btn-run-diagnostics");
const diagnosticsContent = document.getElementById("diagnostics-content");

// Export dropdown
const btnExportDropdown = document.getElementById("btn-export-dropdown");
const exportMenu = document.getElementById("export-menu");
const btnExportMd = document.getElementById("btn-export-md");
const btnExportJson = document.getElementById("btn-export-json");
const btnExportDocx = document.getElementById("btn-export-docx");
const btnExportPdf = document.getElementById("btn-export-pdf");

// Followup Bar Controls
const btnToggleFollowupExternal = document.getElementById("btn-toggle-followup-external");
const iconFollowupExternal = document.getElementById("icon-followup-external");
const labelFollowupExternal = document.getElementById("label-followup-external");

// Modals
const confirmExitModal = document.getElementById("confirm-exit-modal");
const btnConfirmExportMd = document.getElementById("btn-confirm-export-md");
const btnConfirmSaveHistory = document.getElementById("btn-confirm-save-history");
const btnConfirmDiscard = document.getElementById("btn-confirm-discard");
const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

const historyModal = document.getElementById("history-modal");
const historyListContainer = document.getElementById("history-list-container");
const btnCloseHistoryModal = document.getElementById("btn-close-history-modal");
const btnCloseHistoryFooter = document.getElementById("btn-close-history-footer");
const btnClearAllHistory = document.getElementById("btn-clear-all-history");

// Key Modal Elements
const keyModal = document.getElementById("key-modal");
const keyModalContainer = document.getElementById("key-modal-container");
const btnOpenKeyModal = document.getElementById("btn-open-key-modal");
const btnCloseKeyModal = document.getElementById("btn-close-key-modal");
const keyBadgeText = document.getElementById("key-badge-text");
const btnSaveKey = document.getElementById("btn-save-key");
const btnToggleKeyVisibility = document.getElementById("btn-toggle-key-visibility");
const keyStatusMsg = document.getElementById("key-status-msg");

const inputGeminiKey = document.getElementById("input-gemini-key");
const inputDeepseekKey = document.getElementById("input-deepseek-key");
const inputHy3Key = document.getElementById("input-hy3-key");
const selectHy3Preset = document.getElementById("select-hy3-preset");
const inputHy3BaseUrl = document.getElementById("input-hy3-base-url");
const inputHy3Model = document.getElementById("input-hy3-model");

// Reader elements
const readerPanel = document.getElementById("reader-panel");
const readerContainer = document.getElementById("reader-container");
const readerPub = document.getElementById("reader-pub");
const readerTitle = document.getElementById("reader-title");
const readerContent = document.getElementById("reader-content");
const closeReaderBtn = document.getElementById("close-reader");
const closeReaderXBtn = document.getElementById("close-reader-x");
const closeReaderFooterBtn = document.getElementById("close-reader-footer");
const readerWolLink = document.getElementById("reader-wol-link");
const readerCopyBtn = document.getElementById("reader-copy-btn");
const fontDecBtn = document.getElementById("font-dec");
const fontIncBtn = document.getElementById("font-inc");


// ==========================================
// Provider Selection UI
// ==========================================
const provBtns = document.querySelectorAll(".prov-selector-btn");
const activeEngineBadge = document.getElementById("active-engine-badge");

function updateProviderUI() {
    provBtns.forEach(btn => {
        const p = btn.getAttribute("data-provider");
        if (p === currentProvider) {
            btn.className = "prov-selector-btn px-3 py-1.5 rounded-lg font-semibold bg-white text-slate-800 shadow-sm transition-all";
        } else {
            btn.className = "prov-selector-btn px-3 py-1.5 rounded-lg font-medium text-gray-600 hover:text-slate-800 transition-all";
        }
    });

    if (activeEngineBadge) {
        if (currentProvider === "deepseek") {
            activeEngineBadge.innerHTML = `Motor: <b class="text-indigo-600">DeepSeek (RAG WOL)</b>`;
        } else if (currentProvider === "hy3") {
            activeEngineBadge.innerHTML = `Motor: <b class="text-amber-600">Hy3 / OpenAI (RAG WOL)</b>`;
        } else {
            activeEngineBadge.innerHTML = `Motor: <b class="text-blue-600">Gemini 2.5 + Grounding</b>`;
        }
    }
}

provBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        currentProvider = btn.getAttribute("data-provider");
        localStorage.setItem("jw_search_active_provider", currentProvider);
        activeConversation.provider = currentProvider;
        updateProviderUI();
        checkKeyStatus();
    });
});

updateProviderUI();


// ==========================================
// Theocratic Purity & Scope UI Sync (Modern iOS-style Toggle)
// ==========================================
let isExternalSearch = false; // false = 100% Acervo JW (Padrão Protegido), true = Web Externa

function toggleSearchScope(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    isExternalSearch = !isExternalSearch;
    renderToggleUI();
}

function renderToggleUI() {
    // 1. Main Search Card Toggle
    const toggleTrack = document.getElementById("toggle-track");
    const toggleThumb = document.getElementById("toggle-thumb");
    const toggleThumbIcon = document.getElementById("toggle-thumb-icon");
    const toggleLabel = document.getElementById("toggle-label");
    const toggleBadge = document.getElementById("toggle-badge");

    if (toggleTrack && toggleThumb && toggleLabel && toggleBadge) {
        if (!isExternalSearch) {
            // ON / Protegido (100% JW)
            toggleTrack.className = "w-11 h-6 bg-emerald-600 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center shadow-inner relative flex-shrink-0";
            toggleThumb.className = "w-5 h-5 bg-white rounded-full shadow-md transform translate-x-5 transition-transform duration-200 ease-in-out flex items-center justify-center text-[10px] text-emerald-600";
            if (toggleThumbIcon) toggleThumbIcon.className = "fa-solid fa-shield-halved text-[10px]";
            toggleLabel.textContent = "100% Acervo Oficial JW";
            toggleLabel.className = "text-slate-800 transition-colors";
            toggleBadge.textContent = "Protegido";
            toggleBadge.className = "px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors";
        } else {
            // OFF / Secular Web Incluída
            toggleTrack.className = "w-11 h-6 bg-slate-300 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center shadow-inner relative flex-shrink-0";
            toggleThumb.className = "w-5 h-5 bg-white rounded-full shadow-md transform translate-x-0 transition-transform duration-200 ease-in-out flex items-center justify-center text-[10px] text-slate-500";
            if (toggleThumbIcon) toggleThumbIcon.className = "fa-solid fa-globe text-[10px]";
            toggleLabel.textContent = "Web Externa Incluída";
            toggleLabel.className = "text-slate-600 transition-colors";
            toggleBadge.textContent = "Não-oficial";
            toggleBadge.className = "px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300 transition-colors";
        }
    }

    // 2. Followup Dock Toggle
    const fTrack = document.getElementById("followup-toggle-track");
    const fThumb = document.getElementById("followup-toggle-thumb");
    const fThumbIcon = document.getElementById("followup-toggle-thumb-icon");
    const fLabel = document.getElementById("followup-toggle-label");

    if (fTrack && fThumb && fLabel) {
        if (!isExternalSearch) {
            fTrack.className = "w-9 h-5 bg-emerald-600 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center shadow-inner relative flex-shrink-0";
            fThumb.className = "w-4 h-4 bg-white rounded-full shadow-md transform translate-x-4 transition-transform duration-200 ease-in-out flex items-center justify-center text-[8px] text-emerald-600";
            if (fThumbIcon) fThumbIcon.className = "fa-solid fa-shield-halved";
            fLabel.textContent = "100% JW";
            fLabel.className = "text-[11px] font-semibold text-emerald-900";
        } else {
            fTrack.className = "w-9 h-5 bg-slate-300 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center shadow-inner relative flex-shrink-0";
            fThumb.className = "w-4 h-4 bg-white rounded-full shadow-md transform translate-x-0 transition-transform duration-200 ease-in-out flex items-center justify-center text-[8px] text-slate-500";
            if (fThumbIcon) fThumbIcon.className = "fa-solid fa-globe";
            fLabel.textContent = "Web";
            fLabel.className = "text-[11px] font-medium text-slate-600";
        }
    }
}

// Bind toggle events
const btnTheocraticToggle = document.getElementById("btn-theocratic-toggle");
if (btnTheocraticToggle) btnTheocraticToggle.addEventListener("click", toggleSearchScope);

const btnFollowupToggle = document.getElementById("btn-followup-toggle");
if (btnFollowupToggle) btnFollowupToggle.addEventListener("click", toggleSearchScope);

// Initial render
renderToggleUI();

// ==========================================
// Quick Suggestion Pills
// ==========================================
document.querySelectorAll(".btn-prompt-pill").forEach(pill => {
    pill.addEventListener("click", () => {
        const prompt = pill.getAttribute("data-prompt");
        if (followupInput) {
            followupInput.value = prompt;
            followupInput.focus();
            executeTurnSearch(prompt);
        }
    });
});


// ==========================================
// Conversational Chat Search Logic
// ==========================================
async function executeTurnSearch(query, replaceTurnIndex = null) {
    if (!query || !query.trim()) return;

    if (activeConversation.turns.length === 0) {
        activeConversation.title = query.length > 50 ? query.substring(0, 47) + "..." : query;
    }

    const includeExternal = isExternalSearch;
    const lang = "pt";

    const geminiKey = localStorage.getItem("jw_search_gemini_key") || localStorage.getItem("jw_search_user_api_key") || "";
    const deepseekKey = localStorage.getItem("jw_search_deepseek_key") || "";
    const hy3Key = localStorage.getItem("jw_search_hy3_key") || "";
    const hy3BaseUrl = localStorage.getItem("jw_search_hy3_base_url") || "";
    const hy3Model = localStorage.getItem("jw_search_hy3_model") || "";

    statusContainer.classList.remove("hidden");
    let startTime = Date.now();
    let progressTimer = null;
    let secondsElapsed = 0;

    const isRegenerate = replaceTurnIndex !== null;

    const updateStatusMessage = () => {
        secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
        const prefix = isRegenerate ? "🔄 Regerando resposta: " : "";
        if (secondsElapsed < 3) {
            if (statusText) statusText.innerText = `${prefix}🔎 Consultando acervo oficial no wol.jw.org (${secondsElapsed}s)...`;
        } else if (secondsElapsed < 8) {
            if (statusText) statusText.innerText = `${prefix}📚 Extraindo artigos, notas de estudo e referências (${secondsElapsed}s)...`;
        } else {
            if (statusText) statusText.innerText = `${prefix}✨ Sintetizando ponderações teocráticas e estruturando resposta (${secondsElapsed}s)...`;
        }
    };

    updateStatusMessage();
    progressTimer = setInterval(updateStatusMessage, 1000);
    statusContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const historyPayload = [];
    const maxHistIdx = replaceTurnIndex !== null ? replaceTurnIndex : activeConversation.turns.length;
    for (let i = 0; i < maxHistIdx; i++) {
        const turn = activeConversation.turns[i];
        historyPayload.push({ role: "user", content: turn.query });
        historyPayload.push({ role: "assistant", content: turn.answer });
    }

    // Safety AbortController (90s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
        const headers = { "Content-Type": "application/json" };
        if (geminiKey) headers["X-Gemini-Api-Key"] = geminiKey;
        if (deepseekKey) headers["X-Deepseek-Api-Key"] = deepseekKey;
        if (hy3Key) headers["X-Hy3-Api-Key"] = hy3Key;

        const bodyData = {
            query: query,
            history: historyPayload,
            provider: currentProvider,
            model: hy3Model || null,
            base_url: hy3BaseUrl || null,
            include_external: includeExternal,
            lang: lang
        };

        const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(bodyData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const errData = await res.json().catch(() => ({ detail: "Erro de comunicação com o servidor." }));
            if (res.status === 401 || res.status === 429) {
                openKeyModal(errData.detail || "Cota esgotada ou chave necessária.");
            } else {
                alert(`Erro na pesquisa: ${errData.detail || "Falha desconhecida"}`);
            }
            return;
        }

        const data = await res.json();
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

        const newTurn = {
            query: query,
            answer: data.ai_response || "Nenhuma resposta gerada.",
            results: (data.results && data.results.length > 0) 
                ? data.results 
                : (activeConversation.turns.length > 0 ? (activeConversation.turns[activeConversation.turns.length - 1].results || []) : []),
            provider: data.provider || currentProvider,
            model: data.model || "",
            latency: durationSec,
            timestamp: new Date().toISOString()
        };

        if (replaceTurnIndex !== null && replaceTurnIndex < activeConversation.turns.length) {
            activeConversation.turns[replaceTurnIndex] = newTurn;
        } else {
            activeConversation.turns.push(newTurn);
        }
        activeConversation.updatedAt = new Date().toISOString();

        saveCurrentThreadToStorage();
        renderConversationThread(replaceTurnIndex);

        if (searchInput) searchInput.value = "";
        if (followupInput) followupInput.value = "";

    } catch (err) {
        if (err.name === 'AbortError') {
            alert("A consulta excedeu o tempo limite. O servidor pode estar reiniciando. Por favor, tente novamente.");
        } else {
            alert(`Erro de conexão: ${err.message}`);
        }
    } finally {
        if (progressTimer) clearInterval(progressTimer);
        statusContainer.classList.add("hidden");
    }
}

if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (q) executeTurnSearch(q);
    });
}

if (followupForm) {
    followupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = followupInput.value.trim();
        if (q) executeTurnSearch(q);
    });
}


// ==========================================
// Rich Markdown & Table Parser
// ==========================================
function parseMarkdownToHtml(markdown) {
    if (!markdown) return "";
    const lines = markdown.split("\n");
    let html = "";
    let inTable = false;
    let tableRows = [];
    let inUl = false;
    let inOl = false;
    let inBlockquote = false;

    function flushTable() {
        if (!tableRows.length) return "";
        let tHtml = '<div class="overflow-x-auto my-3"><table class="w-full text-xs sm:text-sm border border-gray-200 rounded-lg overflow-hidden">';
        tHtml += '<thead><tr class="bg-slate-100 text-slate-800 font-semibold">';
        const headers = tableRows[0];
        headers.forEach(h => { tHtml += `<th class="border border-gray-200 px-3 py-2 text-left">${formatInlineMarkdown(h)}</th>`; });
        tHtml += '</tr></thead><tbody>';
        for (let i = 1; i < tableRows.length; i++) {
            const row = tableRows[i];
            const bgClass = i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white';
            tHtml += `<tr class="${bgClass}">`;
            row.forEach(cell => { tHtml += `<td class="border border-gray-200 px-3 py-2 text-gray-700">${formatInlineMarkdown(cell)}</td>`; });
            tHtml += '</tr>';
        }
        tHtml += '</tbody></table></div>';
        tableRows = []; inTable = false;
        return tHtml;
    }

    function flushLists() {
        let lHtml = "";
        if (inUl) { lHtml += "</ul>"; inUl = false; }
        if (inOl) { lHtml += "</ol>"; inOl = false; }
        if (inBlockquote) { lHtml += "</blockquote>"; inBlockquote = false; }
        return lHtml;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            const cells = trimmed.split("|").slice(1, -1).map(c => c.trim());
            if (cells.every(c => /^:?-+:?$/.test(c))) continue;
            tableRows.push(cells);
            inTable = true;
            continue;
        } else if (inTable) {
            html += flushTable();
        }

        if (trimmed.startsWith("### ")) {
            html += flushLists() + `<h3 class="text-base sm:text-lg font-bold text-slate-800 mt-5 mb-2.5 flex items-center gap-2">${formatInlineMarkdown(trimmed.replace(/^###\s+/, ''))}</h3>`;
            continue;
        } else if (trimmed.startsWith("## ")) {
            html += flushLists() + `<h2 class="text-lg sm:text-xl font-extrabold text-slate-900 mt-6 mb-3 flex items-center gap-2 pb-1.5 border-b border-slate-200">${formatInlineMarkdown(trimmed.replace(/^##\s+/, ''))}</h2>`;
            continue;
        } else if (trimmed.startsWith("# ")) {
            html += flushLists() + `<h1 class="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-4">${formatInlineMarkdown(trimmed.replace(/^#\s+/, ''))}</h1>`;
            continue;
        }

        if (trimmed.startsWith(">")) {
            if (!inBlockquote) { html += flushLists() + '<blockquote class="border-l-4 border-blue-500 bg-blue-50/50 p-3 my-2.5 rounded-r-xl text-slate-700 italic text-xs sm:text-sm">'; inBlockquote = true; }
            html += `<p class="my-0.5">${formatInlineMarkdown(trimmed.replace(/^>\s*/, ''))}</p>`;
            continue;
        } else if (inBlockquote) { html += "</blockquote>"; inBlockquote = false; }

        if (/^[\*\-]\s+/.test(trimmed)) {
            if (!inUl) { html += flushLists() + '<ul class="list-disc pl-5 my-2 space-y-1 text-slate-700 text-xs sm:text-sm leading-relaxed">'; inUl = true; }
            html += `<li>${formatInlineMarkdown(trimmed.replace(/^[\*\-]\s+/, ''))}</li>`;
            continue;
        } else if (inUl) { html += "</ul>"; inUl = false; }

        if (/^\d+\.\s+/.test(trimmed)) {
            if (!inOl) { html += flushLists() + '<ol class="list-decimal pl-5 my-2 space-y-1 text-slate-700 text-xs sm:text-sm leading-relaxed">'; inOl = true; }
            html += `<li>${formatInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''))}</li>`;
            continue;
        } else if (inOl) { html += "</ol>"; inOl = false; }

        if (trimmed === "") {
            html += flushLists();
        } else {
            html += flushLists() + `<p class="my-2.5 text-slate-700 text-xs sm:text-sm leading-relaxed">${formatInlineMarkdown(trimmed)}</p>`;
        }
    }

    if (inTable) html += flushTable();
    html += flushLists();
    return html;
}

function formatInlineMarkdown(text) {
    if (!text) return "";
    let s = escapeHtml(text);
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, (match, label, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors inline-flex items-center gap-0.5 wol-inline-link" data-url="${url}" data-title="${label}"><span>${label}</span><i class="fa-solid fa-arrow-up-right-from-square text-[9px] ml-0.5"></i></a>`;
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-xs">$1</code>');
    return s;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
}


// ==========================================
// Thread UI Rendering
// ==========================================
function renderConversationThread(focusIndex = null) {
    if (!chatMessagesList) return;
    if (activeConversation.turns.length === 0) {
        chatThreadContainer.classList.add("hidden");
        followupContainer.classList.add("hidden");
        searchCard.classList.remove("hidden");
        return;
    }
    searchCard.classList.add("hidden");
    chatThreadContainer.classList.remove("hidden");
    followupContainer.classList.remove("hidden");
    chatMessagesList.innerHTML = "";
    activeConversation.turns.forEach((turn, idx) => {
        const turnCard = document.createElement("div");
        turnCard.className = "chat-turn bg-white rounded-2xl shadow-sm border border-gray-200/90 overflow-hidden transition-all";
        let headerHtml = `
            <div class="bg-slate-800 text-white px-5 py-4 flex items-start justify-between gap-3">
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-blue-300 font-bold text-xs flex-shrink-0 mt-0.5">
                        ${idx + 1}
                    </div>
                    <div>
                        <h2 class="text-base font-semibold text-white leading-snug">${escapeHtml(turn.query)}</h2>
                        <span class="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                            <span><i class="fa-regular fa-clock mr-1"></i>${new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span class="capitalize"><i class="fa-solid fa-microchip mr-1"></i>${turn.provider || 'IA'}</span>
                            ${turn.latency ? `<span class="bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-1.5 py-0.5 rounded"><i class="fa-solid fa-bolt mr-0.5"></i>${turn.latency}s</span>` : ''}
                        </span>
                    </div>
                </div>
                <div class="flex items-center space-x-1.5 flex-shrink-0">
                    <button class="btn-regenerate-turn text-slate-300 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer" data-idx="${idx}" title="Regerar esta resposta com a IA">
                        <i class="fa-solid fa-arrows-rotate text-sm"></i>
                    </button>
                    <button class="btn-copy-turn text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer" data-idx="${idx}" title="Copiar resposta em Markdown">
                        <i class="fa-regular fa-copy text-sm"></i>
                    </button>
                </div>
            </div>
        `;
        let sourcesHtml = "";
        if (turn.results && turn.results.length > 0) {
            sourcesHtml = `
                <div class="border-t border-gray-100 bg-slate-50/80 px-5 py-4 sm:px-8 sm:py-5 rounded-b-2xl">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <i class="fa-solid fa-book-bookmark text-emerald-600 text-sm"></i> 
                            Fontes & Publicações Oficiais Consultadas (${turn.results.length})
                        </span>
                        <span class="text-[11px] text-gray-400 hidden sm:inline">Clique para ler no leitor integrado</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">`;
            turn.results.forEach(res => {
                const pub = res.publication || 'Biblioteca Online';
                let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                let pubIcon = "fa-book";
                if (pub.includes("Sentinela")) { badgeClass = "bg-blue-50 text-blue-700 border-blue-200"; pubIcon = "fa-tower-observation"; }
                else if (pub.includes("Despertai")) { badgeClass = "bg-amber-50 text-amber-700 border-amber-200"; pubIcon = "fa-sun"; }
                else if (pub.includes("Perspicaz")) { badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200"; pubIcon = "fa-compass"; }
                else if (pub.includes("Bíblia")) { badgeClass = "bg-purple-50 text-purple-700 border-purple-200"; pubIcon = "fa-book-bible"; }
                else if (pub.includes("Histórias")) { badgeClass = "bg-rose-50 text-rose-700 border-rose-200"; pubIcon = "fa-graduation-cap"; }

                sourcesHtml += `
                    <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all">
                        <div>
                            <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass} mb-1.5 truncate max-w-full">
                                <i class="fa-solid ${pubIcon} text-[9px]"></i> ${escapeHtml(pub)}
                            </span>
                            <h4 class="text-xs font-bold text-slate-800 leading-snug line-clamp-2 my-1" title="${escapeHtml(res.title)}">${escapeHtml(res.title)}</h4>
                            ${res.snippet ? `<p class="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">${escapeHtml(res.snippet)}</p>` : ''}
                        </div>
                        <div class="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-100 text-[11px]">
                            <button class="btn-open-wol-reader text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer" data-url="${res.link}" data-title="${escapeHtml(res.title)}" data-pub="${escapeHtml(pub)}">
                                <i class="fa-solid fa-book-open text-[11px]"></i> Ler no app
                            </button>
                            <a href="${res.link}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-[10px] transition-colors" title="Abrir link original">
                                <span>Site Oficial</span>
                                <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                            </a>
                        </div>
                    </div>`;
            });
            sourcesHtml += `</div></div>`;
        }
        const bodyHtml = `<div class="p-6 md:p-8 markdown-body prose max-w-none">${parseMarkdownToHtml(turn.answer || 'Gerando análise teocrática...')}</div>`;
        const actionsBarHtml = `
            <div class="px-5 py-2.5 sm:px-8 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                <span class="text-[11px] text-gray-400 flex items-center gap-1"><i class="fa-solid fa-shield-halved text-emerald-600 text-[10px]"></i> Ponderações teocráticas</span>
                <div class="flex items-center gap-1.5">
                    <button class="btn-regenerate-turn px-3 py-1.5 bg-white border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 rounded-lg transition-all font-medium flex items-center gap-1.5 shadow-xs cursor-pointer" data-idx="${idx}" title="Regerar esta resposta com a IA">
                        <i class="fa-solid fa-arrows-rotate text-[11px] text-emerald-600"></i>
                        <span>Regerar</span>
                    </button>
                    <button class="btn-copy-turn px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-slate-700 rounded-lg transition-all font-medium flex items-center gap-1.5 shadow-xs cursor-pointer" data-idx="${idx}" title="Copiar resposta">
                        <i class="fa-regular fa-copy text-[11px]"></i>
                        <span>Copiar</span>
                    </button>
                </div>
            </div>
        `;
        turnCard.innerHTML = headerHtml + bodyHtml + actionsBarHtml + sourcesHtml;
        chatMessagesList.appendChild(turnCard);
    });
    markBibleVersesInHtml(chatMessagesList);
    attachThreadInteractiveListeners();
    setTimeout(() => {
        const turns = document.querySelectorAll(".chat-turn");
        if (turns.length > 0) {
            const target = (focusIndex !== null && focusIndex < turns.length) ? turns[focusIndex] : turns[turns.length - 1];
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, 100);
}

// ==========================================
// Bible Verse Tooltip & Interactive References
// ==========================================
const bibleTooltip = document.getElementById("bible-verse-tooltip");
const bvTooltipRef = document.getElementById("bv-tooltip-ref");
const bvTooltipBody = document.getElementById("bv-tooltip-body");
const bvTooltipBtnRead = document.getElementById("bv-tooltip-btn-read");
const _clientVerseCache = {};
let _activeTooltipRef = null;
let _tooltipHideTimeout = null;
let _currentVerseChapterUrl = null;

function markBibleVersesInHtml(containerEl) {
    if (!containerEl) return;
    const bibleRegex = /\b(?:1\s*|2\s*|3\s*)?(?:Gênesis|Gên|Genesis|Gen|Êxodo|Êx|Exodo|Ex|Levítico|Lev|Levitico|Números|Núm|Numeros|Num|Deuteronômio|Deut|Deuteronomio|Josué|Jos|Josue|Juízes|Juí|Juizes|Jui|Rute|Rut|Samuel|Sam|Reis|Rs|Crônicas|Crô|Cronicas|Cro|Esdras|Esd|Neemias|Ne|Ester|Est|Jó|Salmos?|Sal|Provérbios|Prov|Proverbios|Eclesiastes|Ecl|Cântico\s*de\s*Salomão|Cânticos|Cânt|Isaías|Isa|Isaias|Jeremias|Jer|Lamentações|Lam|Lamentacoes|Ezequiel|Eze|Daniel|Dan|Oseias|Os|Joel|Joe|Amós|Am|Amos|Obadias|Ob|Jonas|Jon|Miqueias|Miq|Naum|Na|Habacuque|Hab|Sofonias|Sof|Ageu|Ag|Zacarias|Zac|Malaquias|Mal|Mateus|Mat|Marcos|Mar|Lucas|Luc|João|Jo|Joao|Atos|At|Romanos|Rom|Coríntios|Cor|Corintios|Gálatas|Gál|Galatas|Gal|Efésios|Ef|Efesios|Filipenses|Fil|Colossenses|Col|Tessalonicenses|Tes|Timóteo|Tim|Timoteo|Tito|Tit|Filemom|Flm|Hebreus|Heb|Tiago|Tia|Pedro|Ped|Judas|Jud|Apocalipse|Ap|Revelação|Rev)\.?\s+\d+:\d+(?:-\d+)?(?:,\s*\d+)?\b/gi;

    const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
            if (node.parentElement && (node.parentElement.tagName === 'A' || node.parentElement.tagName === 'BUTTON' || node.parentElement.classList.contains('bible-verse-ref') || node.parentElement.tagName === 'CODE' || node.parentElement.tagName === 'PRE')) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const nodesToReplace = [];
    while (walker.nextNode()) {
        if (bibleRegex.test(walker.currentNode.nodeValue)) {
            nodesToReplace.push(walker.currentNode);
        }
        bibleRegex.lastIndex = 0;
    }

    nodesToReplace.forEach(node => {
        const parent = node.parentNode;
        if (!parent) return;
        const text = node.nodeValue;
        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        bibleRegex.lastIndex = 0;
        let match;
        while ((match = bibleRegex.exec(text)) !== null) {
            if (match.index > lastIdx) {
                frag.appendChild(document.createTextNode(text.substring(lastIdx, match.index)));
            }
            const span = document.createElement('span');
            span.className = 'bible-verse-ref cursor-pointer text-blue-600 font-semibold underline decoration-dotted decoration-blue-400 hover:text-blue-800 hover:bg-blue-50 px-1 py-0.5 rounded transition-colors';
            span.textContent = match[0];
            span.setAttribute('data-ref', match[0]);
            frag.appendChild(span);
            lastIdx = match.index + match[0].length;
        }
        if (lastIdx < text.length) {
            frag.appendChild(document.createTextNode(text.substring(lastIdx)));
        }
        parent.replaceChild(frag, node);
    });
}

async function showBibleVerseTooltip(e, ref) {
    if (!bibleTooltip) return;
    clearTimeout(_tooltipHideTimeout);
    _activeTooltipRef = ref;
    _currentVerseChapterUrl = null;

    if (bvTooltipRef) bvTooltipRef.textContent = ref;
    if (bvTooltipBody) {
        if (_clientVerseCache[ref]) {
            bvTooltipBody.textContent = `"${_clientVerseCache[ref].verse_text}"`;
            _currentVerseChapterUrl = _clientVerseCache[ref].chapter_url;
        } else {
            bvTooltipBody.innerHTML = `
                <div class="flex items-center justify-center py-4 text-slate-400">
                    <i class="fa-solid fa-spinner fa-spin mr-2"></i> Carregando versículo...
                </div>
            `;
        }
    }

    const rect = e.target.getBoundingClientRect();
    const tooltipWidth = 320;
    let left = rect.left;
    if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
    }
    if (left < 16) left = 16;

    let top = rect.bottom + 8;
    if (top + 200 > window.innerHeight) {
        top = rect.top - 180;
    }

    bibleTooltip.style.left = `${left}px`;
    bibleTooltip.style.top = `${top}px`;
    bibleTooltip.classList.remove("hidden");
    requestAnimationFrame(() => {
        bibleTooltip.classList.remove("scale-95", "opacity-0");
        bibleTooltip.classList.add("scale-100", "opacity-100");
    });

    if (!_clientVerseCache[ref]) {
        try {
            const res = await fetch(`${API_BASE}/api/verse?ref=${encodeURIComponent(ref)}`);
            if (res.ok) {
                const data = await res.json();
                _clientVerseCache[ref] = data;
                if (_activeTooltipRef === ref && bvTooltipBody) {
                    bvTooltipBody.textContent = `"${data.verse_text}"`;
                    _currentVerseChapterUrl = data.chapter_url;
                }
            } else {
                if (_activeTooltipRef === ref && bvTooltipBody) {
                    bvTooltipBody.innerHTML = `<span class="text-slate-400 italic">Texto não encontrado na Biblioteca Online.</span>`;
                }
            }
        } catch (err) {
            if (_activeTooltipRef === ref && bvTooltipBody) {
                bvTooltipBody.innerHTML = `<span class="text-rose-400">Erro ao carregar versículo.</span>`;
            }
        }
    }
}

function hideBibleVerseTooltip() {
    clearTimeout(_tooltipHideTimeout);
    _tooltipHideTimeout = setTimeout(() => {
        if (!bibleTooltip) return;
        bibleTooltip.classList.remove("scale-100", "opacity-100");
        bibleTooltip.classList.add("scale-95", "opacity-0");
        setTimeout(() => {
            if (bibleTooltip.classList.contains("opacity-0")) {
                bibleTooltip.classList.add("hidden");
            }
        }, 150);
    }, 200);
}

if (bibleTooltip) {
    bibleTooltip.addEventListener("mouseenter", () => clearTimeout(_tooltipHideTimeout));
    bibleTooltip.addEventListener("mouseleave", hideBibleVerseTooltip);
}

if (bvTooltipBtnRead) {
    bvTooltipBtnRead.addEventListener("click", () => {
        if (_activeTooltipRef) {
            const cached = _clientVerseCache[_activeTooltipRef];
            const url = _currentVerseChapterUrl || (cached ? cached.chapter_url : null);
            if (url) {
                hideBibleVerseTooltip();
                openReader(url, _activeTooltipRef, "Bíblia Sagrada (Tradução do Novo Mundo)");
            }
        }
    });
}

function attachThreadInteractiveListeners() {
    document.querySelectorAll(".bible-verse-ref").forEach(span => {
        const ref = span.getAttribute("data-ref");
        span.addEventListener("mouseenter", (e) => showBibleVerseTooltip(e, ref));
        span.addEventListener("mouseleave", hideBibleVerseTooltip);
        span.addEventListener("click", (e) => {
            e.preventDefault();
            const cached = _clientVerseCache[ref];
            if (cached && cached.chapter_url) {
                hideBibleVerseTooltip();
                openReader(cached.chapter_url, ref, "Bíblia Sagrada (Tradução do Novo Mundo)");
            } else {
                fetch(`${API_BASE}/api/verse?ref=${encodeURIComponent(ref)}`)
                    .then(res => res.json())
                    .then(data => {
                        _clientVerseCache[ref] = data;
                        hideBibleVerseTooltip();
                        if (data.chapter_url) openReader(data.chapter_url, ref, "Bíblia Sagrada (Tradução do Novo Mundo)");
                    });
            }
        });
    });

    document.querySelectorAll(".wol-inline-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const url = link.getAttribute("data-url");
            const title = link.getAttribute("data-title");
            if (url) openReader(url, title, "Biblioteca Online");
        });
    });
    document.querySelectorAll(".btn-open-wol-reader").forEach(btn => {
        btn.addEventListener("click", () => {
            const url = btn.getAttribute("data-url");
            const title = btn.getAttribute("data-title");
            const pub = btn.getAttribute("data-pub");
            if (url) openReader(url, title, pub);
        });
    });
    document.querySelectorAll(".btn-regenerate-turn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            const turn = activeConversation.turns[idx];
            if (turn && turn.query) {
                btn.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin text-emerald-500"></i>`;
                executeTurnSearch(turn.query, idx);
            }
        });
    });

    document.querySelectorAll(".btn-copy-turn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            const turn = activeConversation.turns[idx];
            if (turn) {
                const textToCopy = `## ❓ ${turn.query}\n\n${turn.answer}`;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    btn.innerHTML = `<i class="fa-solid fa-check text-green-400"></i>`;
                    setTimeout(() => { btn.innerHTML = `<i class="fa-regular fa-copy text-sm"></i>`; }, 2000);
                });
            }
        });
    });
}


// ==========================================
// Export Functions
// ==========================================
function getFullConversationMarkdown() {
    let md = `# 📖 Estudo Teocrático: ${activeConversation.title}\n`;
    md += `*Data:* ${new Date(activeConversation.createdAt).toLocaleDateString()} | *Gerado via:* JW Search\n\n---\n\n`;
    activeConversation.turns.forEach((turn, idx) => {
        md += `## ❓ Pergunta ${idx + 1}: ${turn.query}\n\n${turn.answer}\n\n`;
        if (turn.results && turn.results.length > 0) {
            md += `### 📚 Fontes Oficiais:\n`;
            turn.results.forEach(r => { md += `- [${r.title}](${r.link}) (${r.publication || 'WOL'})\n`; });
            md += `\n`;
        }
        md += `---\n\n`;
    });
    return md;
}

function sanitizeFilename(name) {
    return (name || 'estudo').toLowerCase().replace(/[^a-z0-9à-ú_-]/gi, '_').replace(/_+/g, '_').substring(0, 40);
}

function exportMarkdown() {
    if (activeConversation.turns.length === 0) return;
    const md = getFullConversationMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `estudo_teocratico_${sanitizeFilename(activeConversation.title)}.md`;
    a.click(); URL.revokeObjectURL(url);
    if (exportMenu) exportMenu.classList.add("hidden");
}

function exportJson() {
    if (activeConversation.turns.length === 0) return;
    const jsonStr = JSON.stringify(activeConversation, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sessao_jw_search_${sanitizeFilename(activeConversation.title)}.json`;
    a.click(); URL.revokeObjectURL(url);
    if (exportMenu) exportMenu.classList.add("hidden");
}

async function exportDocx() {
    if (activeConversation.turns.length === 0) return;
    const md = getFullConversationMarkdown();
    try {
        const res = await fetch(`${API_BASE}/api/export/docx`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: activeConversation.title, content: md })
        });
        if (!res.ok) throw new Error("Falha ao gerar documento Word.");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `estudo_teocratico_${sanitizeFilename(activeConversation.title)}.docx`;
        a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert(`Erro na exportação DOCX: ${e.message}`); }
    if (exportMenu) exportMenu.classList.add("hidden");
}

function exportPdf() {
    if (activeConversation.turns.length === 0) return;
    if (exportMenu) exportMenu.classList.add("hidden");
    window.print();
}

if (btnExportDropdown) {
    btnExportDropdown.addEventListener("click", (e) => { e.stopPropagation(); exportMenu.classList.toggle("hidden"); });
}
document.addEventListener("click", () => { if (exportMenu) exportMenu.classList.add("hidden"); });
if (btnExportMd) btnExportMd.addEventListener("click", exportMarkdown);
if (btnExportJson) btnExportJson.addEventListener("click", exportJson);
if (btnExportDocx) btnExportDocx.addEventListener("click", exportDocx);
if (btnExportPdf) btnExportPdf.addEventListener("click", exportPdf);


// ==========================================
// Import Conversation System
// ==========================================
if (btnImportStudy && fileImportStudy) {
    btnImportStudy.addEventListener("click", () => { fileImportStudy.value = ""; fileImportStudy.click(); });
    fileImportStudy.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target.result;
            try {
                if (file.name.endsWith(".json")) {
                    const parsed = JSON.parse(content);
                    if (!parsed.turns || !Array.isArray(parsed.turns)) throw new Error("Formato inválido.");
                    activeConversation = parsed;
                } else {
                    activeConversation = {
                        id: "conv_" + Date.now(),
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        createdAt: new Date().toISOString(),
                        turns: [{ query: "Arquivo Importado", answer: content, results: [], provider: currentProvider, timestamp: new Date().toISOString() }],
                        provider: currentProvider
                    };
                }
                saveCurrentThreadToStorage();
                renderConversationThread();
            } catch (err) { alert(`Erro ao importar: ${err.message}`); }
        };
        reader.readAsText(file);
    });
}


// ==========================================
// History Management
// ==========================================
function getStoredThreads() {
    try { const raw = localStorage.getItem("jw_search_saved_threads"); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveCurrentThreadToStorage() {
    if (activeConversation.turns.length === 0) return;
    const threads = getStoredThreads().filter(t => t.id !== activeConversation.id);
    threads.unshift(activeConversation);
    if (threads.length > 40) threads.pop();
    localStorage.setItem("jw_search_saved_threads", JSON.stringify(threads));
    updateHistoryBadge();
}
function updateHistoryBadge() {
    const count = getStoredThreads().length;
    if (historyCountBadge) {
        if (count > 0) { historyCountBadge.innerText = count; historyCountBadge.classList.remove("hidden"); }
        else { historyCountBadge.classList.add("hidden"); }
    }
}
updateHistoryBadge();

function deleteSingleHistoryThread(id) {
    const threads = getStoredThreads().filter(t => t.id !== id);
    localStorage.setItem("jw_search_saved_threads", JSON.stringify(threads));
    updateHistoryBadge();
    renderHistoryModal();
}

function clearAllHistory() {
    if (confirm("Tem certeza que deseja excluir todo o histórico de estudos?")) {
        localStorage.removeItem("jw_search_saved_threads");
        updateHistoryBadge();
        renderHistoryModal();
    }
}

function renderHistoryModal() {
    if (!historyListContainer) return;
    const threads = getStoredThreads();
    if (threads.length === 0) {
        historyListContainer.innerHTML = `
            <div class="text-center py-10 text-gray-400">
                <i class="fa-solid fa-folder-open text-3xl mb-2 text-gray-300"></i>
                <p class="text-xs">Nenhum estudo salvo no histórico.</p>
            </div>`;
        return;
    }
    historyListContainer.innerHTML = "";
    threads.forEach((t) => {
        const item = document.createElement("div");
        item.className = "bg-gray-50/90 border border-gray-200/90 rounded-xl p-3.5 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-3 shadow-xs";
        
        const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        const turnsCount = t.turns ? t.turns.length : 0;

        item.innerHTML = `
            <div class="flex-grow min-w-0">
                <h4 class="text-xs sm:text-sm font-bold text-gray-800 truncate" title="${escapeHtml(t.title || 'Pesquisa')}">${escapeHtml(t.title || 'Pesquisa')}</h4>
                <div class="flex items-center gap-2 mt-1 text-[11px] text-gray-400 font-normal">
                    <span><i class="fa-solid fa-comments text-[10px] mr-1"></i>${turnsCount} ${turnsCount === 1 ? 'pergunta' : 'perguntas'}</span>
                    ${dateStr ? `<span>•</span><span><i class="fa-regular fa-clock text-[10px] mr-1"></i>${dateStr}</span>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-1.5 text-xs flex-shrink-0">
                <button class="btn-load-history px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer" data-id="${t.id}" title="Continuar este estudo">
                    <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    <span>Abrir</span>
                </button>
                <button class="btn-delete-history-item p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" data-id="${t.id}" title="Excluir este estudo do histórico">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>`;
        historyListContainer.appendChild(item);
    });

    // Event listeners for Open
    document.querySelectorAll(".btn-load-history").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const thread = getStoredThreads().find(t => t.id === id);
            if (thread) {
                activeConversation = thread;
                renderConversationThread();
                closeHistoryModal();
            }
        });
    });

    // Event listeners for Individual Delete
    document.querySelectorAll(".btn-delete-history-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            deleteSingleHistoryThread(id);
        });
    });
}

function openHistoryModal() { 
    renderHistoryModal(); 
    historyModal.classList.remove("pointer-events-none", "opacity-0"); 
}

function closeHistoryModal() { 
    historyModal.classList.add("opacity-0"); 
    setTimeout(() => historyModal.classList.add("pointer-events-none"), 200); 
}

if (btnOpenHistory) btnOpenHistory.addEventListener("click", openHistoryModal);
if (btnCloseHistoryModal) btnCloseHistoryModal.addEventListener("click", closeHistoryModal);
if (btnCloseHistoryFooter) btnCloseHistoryFooter.addEventListener("click", closeHistoryModal);
if (btnClearAllHistory) btnClearAllHistory.addEventListener("click", clearAllHistory);


// ==========================================
// Reader Panel Logic
// ==========================================
async function openReader(url, title, pub = "Publicação Oficial") {
    if (!readerPanel || !readerContainer) return;
    readerPanel.classList.remove("pointer-events-none", "opacity-0");
    readerContainer.classList.remove("translate-x-full");
    if (readerPub) readerPub.innerText = pub || "Publicação Oficial";
    if (readerTitle) readerTitle.innerText = title || "Artigo Teocrático";
    if (readerWolLink) readerWolLink.href = url || "#";
    if (readerContent) {
        readerContent.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                <i class="fa-solid fa-spinner fa-spin text-blue-600 text-2xl"></i>
                <span class="text-xs font-semibold text-slate-600">Acessando acervo oficial no wol.jw.org...</span>
            </div>
        `;
    }
    try {
        const titleParam = title ? `&title=${encodeURIComponent(title)}` : '';
        const res = await fetch(`${API_BASE}/api/read?url=${encodeURIComponent(url)}${titleParam}`);
        const data = await res.json();
        if (readerContent) readerContent.innerHTML = data.content || "<p class='text-sm text-slate-500'>Conteúdo não disponível.</p>";
    } catch { 
        if (readerContent) readerContent.innerHTML = '<div class="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-200">Não foi possível carregar o texto completo deste artigo no momento. Você pode abri-lo diretamente no WOL pelo link abaixo.</div>'; 
    }
}

function closeReader() {
    if (!readerPanel || !readerContainer) return;
    readerPanel.classList.add("opacity-0");
    readerContainer.classList.add("translate-x-full");
    setTimeout(() => readerPanel.classList.add("pointer-events-none"), 300);
}

if (closeReaderBtn) closeReaderBtn.addEventListener("click", closeReader);
if (closeReaderXBtn) closeReaderXBtn.addEventListener("click", closeReader);
if (closeReaderFooterBtn) closeReaderFooterBtn.addEventListener("click", closeReader);
if (readerPanel) {
    readerPanel.addEventListener("click", (e) => {
        if (e.target === readerPanel) closeReader();
    });
}
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && readerPanel && !readerPanel.classList.contains("opacity-0")) {
        closeReader();
    }
});
if (readerCopyBtn) {
    readerCopyBtn.addEventListener("click", () => {
        if (readerContent) {
            navigator.clipboard.writeText(readerContent.innerText).then(() => {
                const orig = readerCopyBtn.innerHTML;
                readerCopyBtn.innerHTML = `<i class="fa-solid fa-check text-green-600 text-[11px]"></i> <span>Copiado!</span>`;
                setTimeout(() => { readerCopyBtn.innerHTML = orig; }, 2000);
            });
        }
    });
}
if (fontDecBtn) fontDecBtn.addEventListener("click", () => { currentFontSize -= 2; if (readerContent) readerContent.style.fontSize = `${currentFontSize}px`; });
if (fontIncBtn) fontIncBtn.addEventListener("click", () => { currentFontSize += 2; if (readerContent) readerContent.style.fontSize = `${currentFontSize}px`; });


// ==========================================
// Exit / Reset Protection Guard
// ==========================================
function resetConversationState() {
    activeConversation = {
        id: "conv_" + Date.now(),
        title: "Pesquisa Teocrática",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        turns: [],
        provider: currentProvider
    };
    renderConversationThread();
    if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function triggerNewChatOrHome(e) {
    if (e) e.preventDefault();
    if (activeConversation.turns.length > 0) {
        openConfirmExitModal();
    } else {
        resetConversationState();
    }
}

if (btnHeaderHome) btnHeaderHome.addEventListener("click", triggerNewChatOrHome);
if (btnNewChat) btnNewChat.addEventListener("click", triggerNewChatOrHome);

window.addEventListener("beforeunload", (e) => {
    if (activeConversation.turns.length > 0) {
        e.preventDefault();
        e.returnValue = "Você possui um estudo ativo. Deseja salvar antes de sair?";
    }
});

function openConfirmExitModal() {
    confirmExitModal.classList.remove("pointer-events-none", "opacity-0");
    confirmExitModal.querySelector("div").classList.remove("scale-95");
    confirmExitModal.querySelector("div").classList.add("scale-100");
}

function closeConfirmExitModal() {
    confirmExitModal.classList.add("opacity-0");
    confirmExitModal.querySelector("div").classList.remove("scale-100");
    confirmExitModal.querySelector("div").classList.add("scale-95");
    setTimeout(() => {
        confirmExitModal.classList.add("pointer-events-none");
    }, 200);
}

if (btnConfirmExportMd) {
    btnConfirmExportMd.addEventListener("click", () => {
        exportMarkdown();
        closeConfirmExitModal();
        resetConversationState();
    });
}

if (btnConfirmSaveHistory) {
    btnConfirmSaveHistory.addEventListener("click", () => {
        saveCurrentThreadToStorage();
        closeConfirmExitModal();
        resetConversationState();
    });
}

if (btnConfirmDiscard) {
    btnConfirmDiscard.addEventListener("click", () => {
        closeConfirmExitModal();
        resetConversationState();
    });
}

if (btnConfirmCancel) {
    btnConfirmCancel.addEventListener("click", closeConfirmExitModal);
}


// ==========================================
// API Key Management & Presets
// ==========================================
if (selectHy3Preset) {
    selectHy3Preset.addEventListener("change", () => {
        const preset = selectHy3Preset.value;
        if (preset === "openrouter") {
            if (inputHy3BaseUrl) inputHy3BaseUrl.value = "https://openrouter.ai/api/v1";
            if (inputHy3Model) inputHy3Model.value = "tencent/hy3";
        } else if (preset === "tencent") {
            if (inputHy3BaseUrl) inputHy3BaseUrl.value = "https://api.hunyuan.cloud.tencent.com/v1";
            if (inputHy3Model) inputHy3Model.value = "hunyuan-standard";
        } else if (preset === "siliconflow") {
            if (inputHy3BaseUrl) inputHy3BaseUrl.value = "https://api.siliconflow.cn/v1";
            if (inputHy3Model) inputHy3Model.value = "tencent/Hunyuan-A52B-Instruct";
        } else if (preset === "together") {
            if (inputHy3BaseUrl) inputHy3BaseUrl.value = "https://api.together.xyz/v1";
            if (inputHy3Model) inputHy3Model.value = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
        } else if (preset === "ollama") {
            if (inputHy3BaseUrl) inputHy3BaseUrl.value = "http://localhost:11434/v1";
            if (inputHy3Model) inputHy3Model.value = "llama3.2";
        }
    });
}

if (inputHy3Key) {
    inputHy3Key.addEventListener("input", () => {
        const val = inputHy3Key.value.trim();
        if (val.startsWith("sk-or-")) {
            if (selectHy3Preset) selectHy3Preset.value = "openrouter";
            if (inputHy3BaseUrl && (!inputHy3BaseUrl.value || inputHy3BaseUrl.value.includes("together"))) {
                inputHy3BaseUrl.value = "https://openrouter.ai/api/v1";
            }
            if (inputHy3Model && (!inputHy3Model.value || inputHy3Model.value === "hy3" || inputHy3Model.value.includes("hunyuan-standard"))) {
                inputHy3Model.value = "tencent/hy3";
            }
        }
    });
}

function switchModalTab(tabName) {
    document.querySelectorAll(".modal-tab-btn").forEach(btn => {
        btn.className = "modal-tab-btn px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700";
    });
    document.querySelectorAll(".modal-tab-pane").forEach(pane => {
        pane.classList.add("hidden");
    });

    const activeTabBtn = document.getElementById(`modal-tab-${tabName}`);
    const activePane = document.getElementById(`modal-pane-${tabName}`);
    if (activeTabBtn && activePane) {
        if (tabName === "gemini") activeTabBtn.className = "modal-tab-btn px-4 py-2 border-b-2 border-blue-600 text-blue-600";
        else if (tabName === "deepseek") activeTabBtn.className = "modal-tab-btn px-4 py-2 border-b-2 border-indigo-600 text-indigo-600";
        else if (tabName === "hy3") activeTabBtn.className = "modal-tab-btn px-4 py-2 border-b-2 border-amber-600 text-amber-600";
        activePane.classList.remove("hidden");
    }
}

document.getElementById("modal-tab-gemini")?.addEventListener("click", () => switchModalTab("gemini"));
document.getElementById("modal-tab-deepseek")?.addEventListener("click", () => switchModalTab("deepseek"));
document.getElementById("modal-tab-hy3")?.addEventListener("click", () => switchModalTab("hy3"));

function openKeyModal(noticeMessage = null) {
    keyModal.classList.remove("pointer-events-none", "opacity-0");
    keyModalContainer.classList.remove("scale-95");
    keyModalContainer.classList.add("scale-100");
    
    if (inputGeminiKey) inputGeminiKey.value = localStorage.getItem("jw_search_gemini_key") || localStorage.getItem("jw_search_user_api_key") || "";
    if (inputDeepseekKey) inputDeepseekKey.value = localStorage.getItem("jw_search_deepseek_key") || "";
    if (inputHy3Key) inputHy3Key.value = localStorage.getItem("jw_search_hy3_key") || "";
    if (inputHy3BaseUrl) inputHy3BaseUrl.value = localStorage.getItem("jw_search_hy3_base_url") || "https://openrouter.ai/api/v1";
    if (inputHy3Model) inputHy3Model.value = localStorage.getItem("jw_search_hy3_model") || "tencent/hy3";
    
    switchModalTab(currentProvider);

    if (noticeMessage) {
        keyStatusMsg.className = "text-xs p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 mt-3 flex items-center space-x-2";
        keyStatusMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation flex-shrink-0 text-sm"></i> <span>${escapeHtml(noticeMessage)}</span>`;
        keyStatusMsg.classList.remove("hidden");
    } else {
        keyStatusMsg.classList.add("hidden");
    }
}

function closeKeyModal() {
    keyModal.classList.add("opacity-0");
    keyModalContainer.classList.remove("scale-100");
    keyModalContainer.classList.add("scale-95");
    setTimeout(() => {
        keyModal.classList.add("pointer-events-none");
    }, 200);
}

if (btnOpenKeyModal) btnOpenKeyModal.addEventListener("click", () => openKeyModal());
if (btnCloseKeyModal) btnCloseKeyModal.addEventListener("click", closeKeyModal);
if (keyModal) {
    keyModal.addEventListener("click", (e) => {
        if (e.target === keyModal) closeKeyModal();
    });
}

if (btnToggleKeyVisibility) {
    btnToggleKeyVisibility.addEventListener("click", () => {
        const inputs = [inputGeminiKey, inputDeepseekKey, inputHy3Key];
        const isPassword = inputs[0].type === "password";
        inputs.forEach(inp => {
            if (inp) inp.type = isPassword ? "text" : "password";
        });
        btnToggleKeyVisibility.innerHTML = isPassword 
            ? `<i class="fa-solid fa-eye-slash text-xs"></i> <span>Ocultar chaves</span>`
            : `<i class="fa-solid fa-eye text-xs"></i> <span>Mostrar chaves</span>`;
    });
}

if (btnSaveKey) {
    btnSaveKey.addEventListener("click", async () => {
        const gKey = inputGeminiKey ? inputGeminiKey.value.trim() : "";
        const dKey = inputDeepseekKey ? inputDeepseekKey.value.trim() : "";
        const hKey = inputHy3Key ? inputHy3Key.value.trim() : "";
        const hBaseUrl = inputHy3BaseUrl ? inputHy3BaseUrl.value.trim() : "";
        const hModel = inputHy3Model ? inputHy3Model.value.trim() : "";

        if (gKey) {
            localStorage.setItem("jw_search_gemini_key", gKey);
            localStorage.setItem("jw_search_user_api_key", gKey);
        } else {
            localStorage.removeItem("jw_search_gemini_key");
        }

        if (dKey) localStorage.setItem("jw_search_deepseek_key", dKey);
        else localStorage.removeItem("jw_search_deepseek_key");

        if (hKey) localStorage.setItem("jw_search_hy3_key", hKey);
        else localStorage.removeItem("jw_search_hy3_key");

        if (hBaseUrl) localStorage.setItem("jw_search_hy3_base_url", hBaseUrl);
        else localStorage.removeItem("jw_search_hy3_base_url");

        if (hModel) localStorage.setItem("jw_search_hy3_model", hModel);
        else localStorage.removeItem("jw_search_hy3_model");

        keyStatusMsg.className = "text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 mt-3 flex items-center space-x-2";
        keyStatusMsg.innerHTML = `<i class="fa-solid fa-circle-check text-base"></i> <span>Configurações salvas com sucesso!</span>`;
        keyStatusMsg.classList.remove("hidden");
        
        checkKeyStatus();
        setTimeout(() => {
            closeKeyModal();
        }, 1000);
    });
}

// Check API key presence on startup
async function checkKeyStatus() {
    const gKey = localStorage.getItem("jw_search_gemini_key") || localStorage.getItem("jw_search_user_api_key");
    const dKey = localStorage.getItem("jw_search_deepseek_key");
    const hKey = localStorage.getItem("jw_search_hy3_key");
    let hasLocalKey = (currentProvider === "gemini" && gKey) || (currentProvider === "deepseek" && dKey) || (currentProvider === "hy3" && hKey);
    if (hasLocalKey) {
        if (keyBadgeText) keyBadgeText.innerHTML = `<span class="text-green-300">●</span> Minha Chave`;
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/config`);
        if (res.ok) {
            const data = await res.json();
            let serverHasForActive = (currentProvider === "gemini" && data.has_gemini) || (currentProvider === "deepseek" && data.has_deepseek) || (currentProvider === "hy3" && data.has_hy3);
            if (keyBadgeText) keyBadgeText.innerHTML = serverHasForActive ? `<span class="text-blue-300">●</span> Servidor Ativo` : `<span class="text-amber-300">●</span> Inserir Chave`;
        }
    } catch { if (keyBadgeText) keyBadgeText.innerHTML = `<span class="text-amber-300">●</span> Inserir Chave`; }
}
checkKeyStatus();

// ==========================================
// Diagnostics & Latency Inspector System
// ==========================================
async function runDiagnostics() {
    if (!diagnosticsContent) return;
    diagnosticsContent.innerHTML = `
        <div class="flex items-center justify-center py-6 text-gray-400 space-x-2">
            <i class="fa-solid fa-spinner fa-spin text-blue-600"></i>
            <span class="text-xs">Medindo latências e testando conexões...</span>
        </div>
    `;

    const t0 = Date.now();
    try {
        const res = await fetch(`${API_BASE}/api/diagnostics`);
        const pingTime = Date.now() - t0;
        if (!res.ok) throw new Error("Servidor retornou erro HTTP " + res.status);
        const data = await res.json();

        const wolStatus = data.providers?.wol_library || {};
        const geminiStatus = data.providers?.gemini || {};
        const hy3Status = data.providers?.hy3_openrouter || {};
        const deepseekStatus = data.providers?.deepseek || {};

        diagnosticsContent.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <!-- Ping Render -->
                <div class="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                        <span class="font-bold text-gray-800 block">⚡ Servidor (Render)</span>
                        <span class="text-[10px] text-gray-500">Tempo de resposta HTTP</span>
                    </div>
                    <span class="font-bold ${pingTime < 500 ? 'text-green-600' : 'text-amber-600'}">${pingTime} ms</span>
                </div>

                <!-- WOL Scraper -->
                <div class="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                        <span class="font-bold text-gray-800 block">📚 Biblioteca WOL</span>
                        <span class="text-[10px] text-gray-500">Busca em tempo real</span>
                    </div>
                    <span class="font-bold text-green-600">${wolStatus.latency_ms || '120'} ms</span>
                </div>

                <!-- Google Gemini -->
                <div class="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                        <span class="font-bold text-gray-800 block">✨ Google Gemini 2.5</span>
                        <span class="text-[10px] text-gray-500">${geminiStatus.configured ? 'Chave pronta no servidor' : 'Sem chave'}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${geminiStatus.configured ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}">
                        ${geminiStatus.configured ? 'Ativo (Ultra Rápido)' : 'Inativo'}
                    </span>
                </div>

                <!-- Hy3 OpenRouter -->
                <div class="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                        <span class="font-bold text-gray-800 block">⚡ Hy3 / OpenRouter</span>
                        <span class="text-[10px] text-gray-500">${hy3Status.configured ? 'Chave pronta' : 'Sem chave'}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${hy3Status.configured ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}">
                        ${hy3Status.configured ? 'Ativo (Fila Grátis)' : 'Inativo'}
                    </span>
                </div>
            </div>

            <div class="mt-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                <i class="fa-solid fa-circle-info text-blue-600 mr-1"></i>
                <b>Dica de Performance:</b> O motor <b>Gemini 2.5 Flash</b> responde em <b>4 a 8 segundos</b> com pesquisa completa em todo o acervo do WOL e JW.ORG. O motor <b>Hy3</b> depende das filas do OpenRouter gratuito e pode levar 25-30s.
            </div>
        `;
    } catch (e) {
        diagnosticsContent.innerHTML = `
            <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                <i class="fa-solid fa-triangle-exclamation mr-1"></i> Falha ao rodar diagnóstico: ${e.message}
            </div>
        `;
    }
}

function openDiagnosticsModal() {
    diagnosticsModal.classList.remove("pointer-events-none", "opacity-0");
    diagnosticsModalContainer.classList.remove("scale-95");
    diagnosticsModalContainer.classList.add("scale-100");
    runDiagnostics();
}

function closeDiagnosticsModal() {
    diagnosticsModal.classList.add("opacity-0");
    diagnosticsModalContainer.classList.remove("scale-100");
    diagnosticsModalContainer.classList.add("scale-95");
    setTimeout(() => {
        diagnosticsModal.classList.add("pointer-events-none");
    }, 200);
}

if (btnOpenDiagnostics) btnOpenDiagnostics.addEventListener("click", openDiagnosticsModal);
if (btnCloseDiagnosticsModal) btnCloseDiagnosticsModal.addEventListener("click", closeDiagnosticsModal);
if (btnCloseDiagnosticsFooter) btnCloseDiagnosticsFooter.addEventListener("click", closeDiagnosticsModal);
if (btnRunDiagnostics) btnRunDiagnostics.addEventListener("click", runDiagnostics);
if (diagnosticsModal) {
    diagnosticsModal.addEventListener("click", (e) => {
        if (e.target === diagnosticsModal) closeDiagnosticsModal();
    });
}


// ==========================================
// PWA Installation & Onboarding Handler (Mobile Only)
// ==========================================
let deferredInstallPrompt = null;
const pwaInstallBanner = document.getElementById("pwa-install-banner");
const btnPwaInstall = document.getElementById("btn-pwa-install");
const btnPwaDismiss = document.getElementById("btn-pwa-dismiss");
const btnPwaLater = document.getElementById("btn-pwa-later");
const btnHeaderInstall = document.getElementById("btn-header-install-app");
const pwaIosInstructions = document.getElementById("pwa-ios-instructions");
const pwaBannerActions = document.getElementById("pwa-banner-actions");

const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandaloneApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || localStorage.getItem("jw_search_pwa_installed") === "true";

function showPwaInstallBanner() {
    // 1. STRICT: Never prompt on Desktop PC
    if (!isMobileDevice) return;
    // 2. STRICT: Never prompt if already installed
    if (isStandaloneApp) return;
    // 3. If previously installed, never prompt
    if (localStorage.getItem("jw_search_pwa_installed") === "true") return;

    const dismissedTime = localStorage.getItem("jw_search_pwa_dismissed");
    // If dismissed recently (under 7 days), don't show the floating banner
    if (dismissedTime && (Date.now() - parseInt(dismissedTime, 10)) < 7 * 24 * 60 * 60 * 1000) {
        return;
    }

    if (pwaInstallBanner) {
        pwaInstallBanner.classList.remove("pointer-events-none", "translate-y-24", "opacity-0");
        pwaInstallBanner.classList.add("pointer-events-auto", "translate-y-0", "opacity-100");
    }
}

function dismissPwaInstallBanner() {
    if (pwaInstallBanner) {
        pwaInstallBanner.classList.add("pointer-events-none", "translate-y-24", "opacity-0");
        pwaInstallBanner.classList.remove("pointer-events-auto", "translate-y-0", "opacity-100");
    }
    localStorage.setItem("jw_search_pwa_dismissed", Date.now().toString());
}

// 1. Android / Chrome Install Prompt Event (Mobile Only)
window.addEventListener("beforeinstallprompt", (e) => {
    if (!isMobileDevice || isStandaloneApp) return;
    e.preventDefault();
    deferredInstallPrompt = e;
    setTimeout(showPwaInstallBanner, 1500);
});

// 2. iOS Safari Handling (Mobile Only)
if (isIosDevice && !isStandaloneApp && isMobileDevice) {
    setTimeout(() => {
        if (pwaIosInstructions) pwaIosInstructions.classList.remove("hidden");
        if (pwaBannerActions) pwaBannerActions.classList.add("hidden");
        showPwaInstallBanner();
    }, 2000);
}

if (btnPwaInstall) {
    btnPwaInstall.addEventListener("click", async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') {
                localStorage.setItem("jw_search_pwa_installed", "true");
            }
            deferredInstallPrompt = null;
            dismissPwaInstallBanner();
        } else {
            alert("Para instalar: abra o menu de 3 pontinhos (⋮) do seu navegador e toque em 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
            dismissPwaInstallBanner();
        }
    });
}

if (btnHeaderInstall) {
    btnHeaderInstall.addEventListener("click", async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') {
                localStorage.setItem("jw_search_pwa_installed", "true");
            }
            deferredInstallPrompt = null;
        } else if (isIosDevice) {
            alert("No iPhone/iPad: Toque no botão Compartilhar na barra do Safari e selecione 'Adicionar à Tela de Início'.");
        } else {
            alert("Para instalar: toque no menu do seu navegador (⋮) e escolha 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
        }
    });
}

if (btnPwaDismiss) btnPwaDismiss.addEventListener("click", dismissPwaInstallBanner);
if (btnPwaLater) btnPwaLater.addEventListener("click", dismissPwaInstallBanner);

window.addEventListener("appinstalled", () => {
    localStorage.setItem("jw_search_pwa_installed", "true");
    dismissPwaInstallBanner();
    if (btnHeaderInstall) btnHeaderInstall.classList.add("hidden");
    console.log("JW Search instalado com sucesso como PWA!");
});
