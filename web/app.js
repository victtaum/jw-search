// Base API URL. In production/local deployment, it points to the same origin
const API_BASE = "";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const externalCheckbox = document.getElementById("external-checkbox");
const langSelect = document.getElementById("lang-select");
const statusContainer = document.getElementById("status-container");
const resultsContainer = document.getElementById("results-container");

// AI elements
const aiResponseCard = document.getElementById("ai-response-card");
const aiResponseContent = document.getElementById("ai-response-content");

// Reader elements
const readerPanel = document.getElementById("reader-panel");
const readerContainer = document.getElementById("reader-container");
const readerPub = document.getElementById("reader-pub");
const readerTitle = document.getElementById("reader-title");
const readerContent = document.getElementById("reader-content");
const closeReaderBtn = document.getElementById("close-reader");
const fontDecBtn = document.getElementById("font-dec");
const fontIncBtn = document.getElementById("font-inc");

let currentFontSize = 18; // default in pixels

// Font size controls
fontDecBtn.addEventListener("click", () => {
    if (currentFontSize > 14) {
        currentFontSize -= 2;
        readerContent.style.fontSize = `${currentFontSize}px`;
    }
});

fontIncBtn.addEventListener("click", () => {
    if (currentFontSize < 28) {
        currentFontSize += 2;
        readerContent.style.fontSize = `${currentFontSize}px`;
    }
});

// Clickable Header Icon / Title (Return to Home)
const btnHeaderHome = document.getElementById("btn-header-home");
if (btnHeaderHome) {
    btnHeaderHome.addEventListener("click", (e) => {
        e.preventDefault();
        searchInput.value = "";
        resultsContainer.innerHTML = "";
        aiResponseCard.classList.add("hidden");
        aiResponseContent.innerHTML = "";
        statusContainer.classList.add("hidden");
        closeReader();
        window.scrollTo({ top: 0, behavior: "smooth" });
        searchInput.focus();
    });
}

// ==========================================
// Provider & Multi-Model Engine Selector
// ==========================================
let currentProvider = localStorage.getItem("jw_search_active_provider") || "hy3";

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

    if (currentProvider === "deepseek") {
        activeEngineBadge.innerHTML = `Motor: <b class="text-indigo-600">DeepSeek (RAG WOL)</b>`;
    } else if (currentProvider === "hy3") {
        activeEngineBadge.innerHTML = `Motor: <b class="text-amber-600">Hy3 / OpenAI (RAG WOL)</b>`;
    } else {
        activeEngineBadge.innerHTML = `Motor: <b class="text-blue-600">Gemini + Grounding</b>`;
    }
}

provBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        currentProvider = btn.getAttribute("data-provider");
        localStorage.setItem("jw_search_active_provider", currentProvider);
        updateProviderUI();
        checkKeyStatus();
    });
});

updateProviderUI();

// Search Submission
searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    const includeExternal = externalCheckbox.checked;
    const lang = langSelect.value;
    
    const geminiKey = localStorage.getItem("jw_search_gemini_key") || localStorage.getItem("jw_search_user_api_key") || "";
    const deepseekKey = localStorage.getItem("jw_search_deepseek_key") || "";
    const hy3Key = localStorage.getItem("jw_search_hy3_key") || "";
    const hy3BaseUrl = localStorage.getItem("jw_search_hy3_base_url") || "";
    const hy3Model = localStorage.getItem("jw_search_hy3_model") || "";
    
    // Check if key is available for selected provider (either client local key OR server env key)
    const serverHasKeyForCurrent = window.serverConfig ? (
        (currentProvider === "gemini" && window.serverConfig.has_gemini) ||
        (currentProvider === "deepseek" && window.serverConfig.has_deepseek) ||
        (currentProvider === "hy3" && window.serverConfig.has_hy3)
    ) : (window.serverHasKey === true && currentProvider === "gemini");

    if (currentProvider === "gemini" && !geminiKey && !serverHasKeyForCurrent) {
        openKeyModal("Para realizar pesquisas com o Google Gemini, adicione sua chave gratuita.");
        switchModalTab("gemini");
        return;
    } else if (currentProvider === "deepseek" && !deepseekKey && !serverHasKeyForCurrent) {
        openKeyModal("Para pesquisar com o DeepSeek (RAG WOL), adicione sua chave do DeepSeek.");
        switchModalTab("deepseek");
        return;
    } else if (currentProvider === "hy3" && !hy3Key && !serverHasKeyForCurrent) {
        openKeyModal("Para pesquisar com o Hy3 / OpenAI, adicione sua chave ou token.");
        switchModalTab("hy3");
        return;
    }
    
    // UI Loading state
    statusContainer.classList.remove("hidden");
    resultsContainer.innerHTML = "";
    aiResponseCard.classList.add("hidden");
    aiResponseContent.innerHTML = "";
    
    try {
        const params = new URLSearchParams({
            q: query,
            external: includeExternal,
            lang: lang,
            provider: currentProvider
        });
        if (currentProvider === "hy3" && hy3BaseUrl) params.append("base_url", hy3BaseUrl);
        if (currentProvider === "hy3" && hy3Model) params.append("model", hy3Model);
        
        const headers = { "Accept": "application/json" };
        if (geminiKey) headers["X-Gemini-Api-Key"] = geminiKey;
        if (deepseekKey) headers["X-Deepseek-Api-Key"] = deepseekKey;
        if (hy3Key) headers["X-Hy3-Api-Key"] = hy3Key;
        
        const response = await fetch(`${API_BASE}/api/search?${params}`, { headers });
        const data = await response.json();
        
        if (!response.ok) {
            const errorDetail = data.detail || `Erro (${response.status}): ${response.statusText}`;
            if (response.status === 401) {
                openKeyModal(typeof errorDetail === "string" ? errorDetail : "Chave de API necessária para este provedor.");
                switchModalTab(currentProvider);
                throw new Error("Chave de API necessária.");
            } else if (response.status === 429) {
                openKeyModal("Cota do Gemini excedida no momento. Dica: você pode alternar para o DeepSeek na aba ao lado!");
                switchModalTab("deepseek");
                throw new Error("Cota de requisições excedida.");
            }
            throw new Error(errorDetail);
        }
        
        // Render AI Synthesized response
        if (data.ai_response) {
            aiResponseContent.innerHTML = marked.parse(data.ai_response);
            aiResponseContent.querySelectorAll("a").forEach(a => {
                a.setAttribute("target", "_blank");
                a.setAttribute("rel", "noopener noreferrer");
                a.classList.add("text-blue-600", "hover:underline", "font-medium");
            });
            aiResponseCard.classList.remove("hidden");
        }
        
        // Render sources results
        renderResults(data.results, query);
    } catch (error) {
        console.error(error);
        resultsContainer.innerHTML = `
            <div class="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center space-x-3">
                <i class="fa-solid fa-circle-exclamation text-xl flex-shrink-0"></i>
                <div>
                    <p class="font-semibold">Erro na busca</p>
                    <p class="text-sm">${escapeHtml(error.message || "Não foi possível completar a consulta.")}</p>
                </div>
            </div>
        `;
    } finally {
        statusContainer.classList.add("hidden");
    }
});

// Render Results Card List
function renderResults(results, query) {
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-500">
                <i class="fa-solid fa-folder-open text-4xl mb-3 text-gray-300"></i>
                <p class="font-medium">Nenhum resultado encontrado nas fontes</p>
                <p class="text-xs mt-1">Experimente mudar o termo ou marcar 'Pesquisar também na Internet'.</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = "";
    
    results.forEach(item => {
        const card = document.createElement("div");
        
        let highlightedSnippet = item.snippet;
        if (query) {
            const words = query.split(/\s+/).filter(w => w.length > 2);
            words.forEach(w => {
                const regex = new RegExp(`(${w})`, "gi");
                highlightedSnippet = highlightedSnippet.replace(regex, `<mark class="bg-amber-100 text-amber-900 rounded px-1 font-medium">$1</mark>`);
            });
        }
        
        const isExt = item.is_external;
        const borderClass = isExt ? "border-amber-200 bg-amber-50/20" : "border-gray-100 bg-white";
        const badgeClass = isExt 
            ? "bg-amber-100 text-amber-800 border-amber-300" 
            : "bg-blue-50 text-blue-700 border-blue-200";
        const badgeLabel = isExt ? "FONTE EXTERNA" : "FONTE OFICIAL";

        card.className = `${borderClass} rounded-xl p-5 shadow-sm border hover:shadow-md transition-all duration-200 mb-4`;
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-grow pr-4">
                    <div class="flex flex-wrap items-center gap-2 mb-1.5">
                        <span class="text-xs px-2 py-0.5 rounded-md font-semibold border ${badgeClass}">
                            ${escapeHtml(item.publication || (isExt ? "Internet" : "WOL"))}
                        </span>
                        <span class="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${isExt ? 'bg-amber-200 text-amber-900' : 'bg-blue-100 text-blue-800'}">
                            ${badgeLabel}
                        </span>
                    </div>
                    
                    <h3 class="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors">
                        <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(item.title)}
                        </a>
                    </h3>
                    
                    <p class="text-gray-600 text-sm mt-2 line-clamp-3 leading-relaxed">
                        ${highlightedSnippet}
                    </p>
                    
                    <div class="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs">
                        <a 
                            href="${escapeHtml(item.link)}" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                        >
                            <span>Acessar Publicação</span>
                            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                        </a>
                        
                        ${!isExt && item.link.includes("wol.jw.org") ? `
                            <button 
                                class="btn-read-drawer text-slate-700 hover:text-slate-900 font-semibold flex items-center space-x-1"
                                data-url="${escapeHtml(item.link)}"
                                data-title="${escapeHtml(item.title)}"
                            >
                                <i class="fa-solid fa-book-open"></i>
                                <span>Ler no App</span>
                            </button>
                        ` : ""}
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(card);
    });

    document.querySelectorAll(".btn-read-drawer").forEach(button => {
        button.addEventListener("click", (e) => {
            const url = button.getAttribute("data-url");
            const title = button.getAttribute("data-title");
            openReader(url, title);
        });
    });
}

// Drawer Reader Implementation
async function openReader(url, title) {
    readerTitle.textContent = title || "Carregando...";
    readerContent.innerHTML = `
        <div class="text-center py-20">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
            <p class="text-gray-500 text-sm">Buscando e limpando conteúdo do documento oficial...</p>
        </div>
    `;
    
    readerPanel.classList.remove("pointer-events-none");
    readerPanel.classList.add("opacity-100");
    readerContainer.classList.remove("translate-x-full");
    
    try {
        const response = await fetch(`${API_BASE}/api/read?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error("Não foi possível carregar o documento.");
        
        const data = await response.json();
        if (data.content) {
            readerContent.innerHTML = data.content;
            
            readerContent.querySelectorAll("a").forEach(a => {
                const href = a.getAttribute("href");
                if (href && href.startsWith("/")) {
                    a.setAttribute("href", `https://wol.jw.org${href}`);
                }
                a.setAttribute("target", "_blank");
                a.setAttribute("rel", "noopener noreferrer");
                a.classList.add("text-blue-600", "hover:underline");
            });
        } else {
            readerContent.innerHTML = `<p class="text-red-500">Conteúdo indisponível para este artigo.</p>`;
        }
    } catch (err) {
        console.error(err);
        readerContent.innerHTML = `
            <div class="p-4 bg-red-50 text-red-700 rounded-xl">
                <p class="font-bold">Erro ao carregar artigo</p>
                <p class="text-sm mt-1">${escapeHtml(err.message)}</p>
            </div>
        `;
    }
}

function closeReader() {
    readerContainer.classList.add("translate-x-full");
    readerPanel.classList.remove("opacity-100");
    setTimeout(() => {
        readerPanel.classList.add("pointer-events-none");
    }, 300);
}

closeReaderBtn.addEventListener("click", closeReader);
readerPanel.addEventListener("click", (e) => {
    if (e.target === readerPanel) closeReader();
});

// Helper to escape HTML tags to prevent XSS
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// Embedded API Key Management & Wizard Flow
// ==========================================
const btnOpenKeyModal = document.getElementById("btn-open-key-modal");
const btnCloseKeyModal = document.getElementById("btn-close-key-modal");
const keyModal = document.getElementById("key-modal");
const keyModalContainer = document.getElementById("key-modal-container");
const btnToggleKeyVisibility = document.getElementById("btn-toggle-key-visibility");
const btnSaveKey = document.getElementById("btn-save-key");
const keyStatusMsg = document.getElementById("key-status-msg");
const keyBadgeText = document.getElementById("key-badge-text");

const inputGeminiKey = document.getElementById("input-gemini-key");
const inputDeepseekKey = document.getElementById("input-deepseek-key");
const inputHy3Key = document.getElementById("input-hy3-key");
const inputHy3BaseUrl = document.getElementById("input-hy3-base-url");
const inputHy3Model = document.getElementById("input-hy3-model");

const selectHy3Preset = document.getElementById("select-hy3-preset");

const hy3Presets = {
    "openrouter": { baseUrl: "https://openrouter.ai/api/v1", model: "tencent/hy3" },
    "tencent": { baseUrl: "https://api.hunyuan.tencent.com/v1", model: "hy3" },
    "siliconflow": { baseUrl: "https://api.siliconflow.cn/v1", model: "tencent/Hunyuan-A52B-Instruct" },
    "together": { baseUrl: "https://api.together.xyz/v1", model: "togethercomputer/hy3" },
    "ollama": { baseUrl: "http://localhost:11434/v1", model: "hy3" },
    "custom": { baseUrl: "", model: "" }
};

if (selectHy3Preset) {
    selectHy3Preset.addEventListener("change", () => {
        const val = selectHy3Preset.value;
        const preset = hy3Presets[val];
        if (preset && val !== "custom") {
            if (inputHy3BaseUrl) inputHy3BaseUrl.value = preset.baseUrl;
            if (inputHy3Model) inputHy3Model.value = preset.model;
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

// Modal Tab Switcher
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
    keyModal.classList.remove("pointer-events-none");
    keyModal.classList.remove("opacity-0");
    keyModalContainer.classList.remove("scale-95");
    keyModalContainer.classList.add("scale-100");
    
    // Preload inputs
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

btnOpenKeyModal.addEventListener("click", () => openKeyModal());
btnCloseKeyModal.addEventListener("click", closeKeyModal);
keyModal.addEventListener("click", (e) => {
    if (e.target === keyModal) closeKeyModal();
});

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
    keyStatusMsg.innerHTML = `<i class="fa-solid fa-circle-check text-base"></i> <span>Configurações salvas e ativadas com sucesso!</span>`;
    keyStatusMsg.classList.remove("hidden");
    
    checkKeyStatus();
    setTimeout(() => {
        closeKeyModal();
    }, 1200);
});

// Check API key presence on startup
async function checkKeyStatus() {
    const gKey = localStorage.getItem("jw_search_gemini_key") || localStorage.getItem("jw_search_user_api_key");
    const dKey = localStorage.getItem("jw_search_deepseek_key");
    const hKey = localStorage.getItem("jw_search_hy3_key");

    let hasLocalKey = false;
    if (currentProvider === "gemini" && gKey) hasLocalKey = true;
    else if (currentProvider === "deepseek" && dKey) hasLocalKey = true;
    else if (currentProvider === "hy3" && hKey) hasLocalKey = true;

    if (hasLocalKey) {
        keyBadgeText.innerHTML = `<span class="text-green-300">●</span> Minha Chave`;
        btnOpenKeyModal.title = `Sua chave pessoal está ativa no navegador para ${currentProvider}. Clique para alterar.`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/config`);
        if (res.ok) {
            const data = await res.json();
            window.serverConfig = data;
            window.serverHasKey = data.has_key;
            
            let serverHasForActive = false;
            if (currentProvider === "gemini" && data.has_gemini) serverHasForActive = true;
            else if (currentProvider === "deepseek" && data.has_deepseek) serverHasForActive = true;
            else if (currentProvider === "hy3" && data.has_hy3) serverHasForActive = true;

            if (serverHasForActive) {
                keyBadgeText.innerHTML = `<span class="text-blue-300">●</span> Servidor Ativo`;
                btnOpenKeyModal.title = `Chave padrão do servidor ativa para ${currentProvider}. Você também pode inserir sua própria chave se preferir.`;
            } else {
                keyBadgeText.innerHTML = `<span class="text-amber-300">●</span> Inserir Chave`;
                btnOpenKeyModal.title = `Nenhuma chave configurada para ${currentProvider}. Clique para configurar sua chave gratuita.`;
            }
        }
    } catch (e) {
        window.serverHasKey = false;
        keyBadgeText.innerHTML = `<span class="text-amber-300">●</span> Inserir Chave`;
    }
}

// Initial status check
checkKeyStatus();
