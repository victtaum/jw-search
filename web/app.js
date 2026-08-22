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

// Search Submission
searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    const includeExternal = externalCheckbox.checked;
    const lang = langSelect.value;
    
    // UI Loading state
    statusContainer.classList.remove("hidden");
    resultsContainer.innerHTML = "";
    aiResponseCard.classList.add("hidden");
    aiResponseContent.innerHTML = "";
    
    try {
        const params = new URLSearchParams({
            q: query,
            external: includeExternal,
            lang: lang
        });
        
        const response = await fetch(`${API_BASE}/api/search?${params}`);
        if (!response.ok) {
            throw new Error(`Erro na busca: ${response.statusText}`);
        }
        
        const data = await response.json();
        
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
                <i class="fa-solid fa-circle-exclamation text-xl"></i>
                <div>
                    <p class="font-semibold">Erro ao buscar informações</p>
                    <p class="text-sm">Não foi possível conectar ao servidor ou a busca falhou. Certifique-se de que o backend está rodando na porta 8000.</p>
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
        
        // Highlight terms in snippet
        let highlightedSnippet = item.snippet;
        try {
            // Escape special regex characters in query
            const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            // Split query words for multi-word highlighting
            const words = escapedQuery.split(/\s+/).filter(w => w.length > 2);
            words.push(escapQuery); // also push full query
            
            // Highlight terms
            words.forEach(word => {
                const regex = new RegExp(`(${word})`, 'gi');
                highlightedSnippet = highlightedSnippet.replace(regex, `<mark class="bg-yellow-100 text-gray-900 font-medium px-0.5 rounded">$1</mark>`);
            });
        } catch (e) {
            console.error("Regex highlight error:", e);
        }
        
        // Determine style if external or official
        let borderClass = "border-l-4 border-slate-500 hover:border-slate-600";
        let badge = `
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <i class="fa-solid fa-circle-check mr-1 text-[10px]"></i> FONTE OFICIAL
            </span>
        `;
        let cardBgClass = "bg-white";
        let cardBorderClass = "border-gray-200/80";
        let isOfficial = !item.is_external;
        
        if (item.is_external) {
            borderClass = "border-l-4 border-amber-500 hover:border-amber-600";
            badge = `
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <i class="fa-solid fa-globe mr-1 text-[10px]"></i> FONTE EXTERNA
                </span>
            `;
            cardBgClass = "bg-amber-50/20";
            cardBorderClass = "border-amber-200";
        }
        
        // Render reading button only for official WOL links
        const canReadInApp = isOfficial && item.link.includes("wol.jw.org");
        const readButton = canReadInApp 
            ? `<button onclick="openReader('${escapeHtml(item.title)}', '${escapeHtml(item.publication)}', '${escapeHtml(item.link)}')" class="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors">
                <i class="fa-solid fa-book-open"></i>
                <span>Ler no App</span>
               </button>`
            : "";
            
        card.className = `${cardBgClass} rounded-xl shadow-sm border ${cardBorderClass} p-5 ${borderClass} transition-all hover:shadow-md`;
        card.innerHTML = `
            <div class="flex flex-col space-y-2">
                <div class="flex justify-between items-start space-x-2">
                    <h3 class="font-semibold text-gray-900 text-base hover:text-blue-700 transition-colors leading-snug">
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                    </h3>
                    <div class="flex-shrink-0">
                        ${badge}
                    </div>
                </div>
                
                <p class="text-xs font-medium text-slate-500 flex items-center space-x-1">
                    <i class="fa-solid fa-bookmark text-[10px] text-slate-400"></i>
                    <span>${item.publication}</span>
                </p>
                
                <p class="text-sm text-gray-600 leading-relaxed font-light py-1">
                    ${highlightedSnippet}
                </p>
                
                <div class="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-400">
                    <span class="truncate max-w-[250px]">${item.source_site}</span>
                    <div class="flex items-center space-x-2">
                        ${readButton}
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1 px-3 py-1 text-slate-500 hover:text-slate-800 transition-colors">
                            <span>Acessar Fonte</span>
                            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(card);
    });
}

// Open Reader Drawer
async function openReader(title, publication, url) {
    // Show drawer structure
    readerPanel.classList.remove("pointer-events-none");
    readerPanel.classList.add("opacity-100");
    readerContainer.classList.remove("translate-x-full");
    
    // Set temp loading state
    readerTitle.innerText = title;
    readerPub.innerText = publication;
    readerContent.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
            <div class="animate-spin rounded-full h-8 w-8 border-4 border-slate-400 border-t-transparent"></div>
            <p class="text-sm font-medium">Extraindo texto limpo do artigo...</p>
        </div>
    `;
    
    try {
        const params = new URLSearchParams({ url: url });
        const response = await fetch(`${API_BASE}/api/read?${params}`);
        if (!response.ok) {
            throw new Error(`Erro ao ler documento: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Inject clean content
        readerContent.innerHTML = data.content;
        readerContent.style.fontSize = `${currentFontSize}px`;
    } catch (error) {
        console.error(error);
        readerContent.innerHTML = `
            <div class="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center space-x-2 text-sm mt-4">
                <i class="fa-solid fa-circle-exclamation text-lg"></i>
                <p>Não foi possível obter o conteúdo do artigo. <a href="${url}" target="_blank" class="underline font-semibold">Clique aqui</a> para acessar diretamente a página oficial.</p>
            </div>
        `;
    }
}

// Close Reader Drawer
function closeReader() {
    readerContainer.classList.add("translate-x-full");
    readerPanel.classList.remove("opacity-100");
    setTimeout(() => {
        readerPanel.classList.add("pointer-events-none");
    }, 300);
}

closeReaderBtn.addEventListener("click", closeReader);
readerPanel.addEventListener("click", (e) => {
    // If clicking outside the container, close it
    if (e.target === readerPanel) {
        closeReader();
    }
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
const inputApiKey = document.getElementById("input-api-key");
const btnToggleKeyVisibility = document.getElementById("btn-toggle-key-visibility");
const btnSaveKey = document.getElementById("btn-save-key");
const keyStatusMsg = document.getElementById("key-status-msg");
const keyBadgeText = document.getElementById("key-badge-text");

function openKeyModal() {
    keyModal.classList.remove("pointer-events-none");
    keyModal.classList.remove("opacity-0");
    keyModalContainer.classList.remove("scale-95");
    keyModalContainer.classList.add("scale-100");
    keyStatusMsg.classList.add("hidden");
}

function closeKeyModal() {
    keyModal.classList.add("opacity-0");
    keyModalContainer.classList.remove("scale-100");
    keyModalContainer.classList.add("scale-95");
    setTimeout(() => {
        keyModal.classList.add("pointer-events-none");
    }, 200);
}

btnOpenKeyModal.addEventListener("click", openKeyModal);
btnCloseKeyModal.addEventListener("click", closeKeyModal);
keyModal.addEventListener("click", (e) => {
    if (e.target === keyModal) closeKeyModal();
});

btnToggleKeyVisibility.addEventListener("click", () => {
    if (inputApiKey.type === "password") {
        inputApiKey.type = "text";
        btnToggleKeyVisibility.innerHTML = `<i class="fa-solid fa-eye-slash text-xs"></i> <span>Ocultar chave</span>`;
    } else {
        inputApiKey.type = "password";
        btnToggleKeyVisibility.innerHTML = `<i class="fa-solid fa-eye text-xs"></i> <span>Mostrar chave</span>`;
    }
});

btnSaveKey.addEventListener("click", async () => {
    const key = inputApiKey.value.trim();
    if (!key) {
        keyStatusMsg.className = "text-xs p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 mt-2 flex items-center space-x-2";
        keyStatusMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Por favor, cole sua chave do Gemini antes de salvar.</span>`;
        keyStatusMsg.classList.remove("hidden");
        return;
    }

    btnSaveKey.disabled = true;
    btnSaveKey.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>Salvando...</span>`;

    try {
        const response = await fetch(`${API_BASE}/api/config`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: key })
        });

        const data = await response.json();
        if (response.ok) {
            keyStatusMsg.className = "text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 mt-2 flex items-center space-x-2";
            keyStatusMsg.innerHTML = `<i class="fa-solid fa-circle-check text-base"></i> <span>Chave validada e salva com sucesso!</span>`;
            keyStatusMsg.classList.remove("hidden");
            
            checkKeyStatus();
            setTimeout(() => {
                closeKeyModal();
                inputApiKey.value = "";
            }, 1200);
        } else {
            throw new Error(data.detail || "Falha ao salvar chave.");
        }
    } catch (err) {
        keyStatusMsg.className = "text-xs p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 mt-2 flex items-center space-x-2";
        keyStatusMsg.innerHTML = `<i class="fa-solid fa-circle-xmark text-base"></i> <span>${escapeHtml(err.message)}</span>`;
        keyStatusMsg.classList.remove("hidden");
    } finally {
        btnSaveKey.disabled = false;
        btnSaveKey.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Salvar Chave</span>`;
    }
});

// Check API key presence on startup
async function checkKeyStatus() {
    try {
        const res = await fetch(`${API_BASE}/api/config`);
        if (res.ok) {
            const data = await res.json();
            if (data.has_key) {
                keyBadgeText.innerHTML = `<span class="text-green-300">●</span> Chave Ativa`;
                btnOpenKeyModal.title = `Chave configurada (${data.key_preview || ''}). Clique para alterar.`;
            } else {
                keyBadgeText.innerHTML = `<span class="text-amber-300">●</span> Inserir Chave`;
                btnOpenKeyModal.title = "Nenhuma chave configurada. Clique para obter sua chave gratuita.";
            }
        }
    } catch (e) {
        console.warn("Não foi possível verificar status da chave:", e);
    }
}

// Initial status check
checkKeyStatus();

