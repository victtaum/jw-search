/* Study configuration stays local; API validates the same enums independently. */
window.JWStudy = (() => {
    const durations = [3, 5, 10, 15, 30, 45, 60];
    const labels = {comparison: 'Tabela comparativa', family: 'Estudo em família', scriptures: 'Textos bíblicos', outline: 'Esboço estruturado'};
    const profiles = {children_3_5:'Crianças de 3–5 anos', children_6_9:'Crianças de 6–9 anos', children_10_12:'Crianças de 10–12 anos', teens:'Adolescentes', adults:'Adultos', couple:'Casal: marido e mulher', seniors:'Idosos'};
    let mode = localStorage.getItem('jw_search_research_mode') === 'deep' ? 'deep' : 'quick';

    function renderDepth() {
        const deep = mode === 'deep';
        const button = document.getElementById('btn-depth-toggle');
        const track = document.getElementById('depth-toggle-track');
        const thumb = document.getElementById('depth-toggle-thumb');
        const icon = document.getElementById('depth-toggle-thumb-icon');
        const label = document.getElementById('depth-toggle-label');
        const badge = document.getElementById('depth-toggle-badge');
        const compactButton = document.getElementById('btn-followup-depth-toggle');
        const compactTrack = document.getElementById('followup-depth-track');
        const compactThumb = document.getElementById('followup-depth-thumb');
        const compactIcon = document.getElementById('followup-depth-icon');
        const compactLabel = document.getElementById('followup-depth-label');

        if (button && track && thumb && label && badge) {
            button.setAttribute('aria-pressed', String(deep));
            track.className = `w-11 h-6 ${deep ? 'bg-blue-600' : 'bg-slate-300'} rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center shadow-inner relative flex-shrink-0`;
            thumb.className = `w-5 h-5 bg-white rounded-full shadow-md transform ${deep ? 'translate-x-5 text-blue-600' : 'translate-x-0 text-slate-500'} transition-transform duration-200 ease-in-out flex items-center justify-center text-[10px]`;
            if (icon) icon.className = `fa-solid ${deep ? 'fa-layer-group' : 'fa-bolt'}`;
            label.textContent = deep ? 'Pesquisa ampla' : 'Pesquisa sintetizada';
            label.className = deep ? 'text-blue-900 transition-colors' : 'text-slate-700 transition-colors';
            badge.textContent = deep ? 'Aprofundada' : 'Direta';
            badge.className = `px-1.5 py-0.5 text-[9px] font-bold rounded-md border transition-colors ${deep ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`;
        }
        if (compactButton && compactTrack && compactThumb && compactLabel) {
            compactButton.setAttribute('aria-pressed', String(deep));
            compactTrack.className = `w-9 h-5 ${deep ? 'bg-blue-600' : 'bg-slate-300'} rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center shadow-inner relative flex-shrink-0`;
            compactThumb.className = `w-4 h-4 bg-white rounded-full shadow-md transform ${deep ? 'translate-x-4 text-blue-600' : 'translate-x-0 text-slate-500'} transition-transform duration-200 ease-in-out flex items-center justify-center text-[8px]`;
            if (compactIcon) compactIcon.className = `fa-solid ${deep ? 'fa-layer-group' : 'fa-bolt'}`;
            compactLabel.textContent = deep ? 'Ampla' : 'Sintetizada';
            compactLabel.className = deep ? 'text-[11px] font-semibold text-blue-900' : 'text-[11px] font-medium text-slate-600';
        }
    }

    function toggleDepth() {
        mode = mode === 'deep' ? 'quick' : 'deep';
        localStorage.setItem('jw_search_research_mode', mode);
        renderDepth();
    }

    document.getElementById('btn-depth-toggle')?.addEventListener('click', toggleDepth);
    document.getElementById('btn-followup-depth-toggle')?.addEventListener('click', toggleDepth);
    renderDepth();

    const dialog = document.createElement('dialog');
    dialog.className='rounded-2xl p-6 shadow-xl max-w-lg w-full border border-slate-200';
    dialog.setAttribute('aria-labelledby','tool-title');
    dialog.innerHTML=`<form method="dialog" id="tool-config-form" class="space-y-4">
        <h2 id="tool-title" class="font-bold text-xl"></h2>
        <p class="text-sm text-slate-600">O material usa o assunto do estudo atual. As fontes serão consultadas novamente; confira o resultado antes de usar.</p>
        <label id="tool-time-label" class="block text-sm">Tempo disponível
          <select id="tool-time" class="border rounded-lg p-2 ml-2">${durations.map(n=>`<option value="${n}" ${n===30?'selected':''}>${n} minutos</option>`).join('')}</select>
        </label>
        <fieldset id="tool-family" class="space-y-2"><legend class="font-semibold text-sm">Participantes — selecione as adaptações desejadas</legend>
          ${Object.entries(profiles).map(([value,label])=>`<label class="block text-sm"><input type="checkbox" name="profile" value="${value}" ${value==='adults'?'checked':''}> ${label}</label>`).join('')}
        </fieldset>
        <label class="block text-sm">Textos a considerar (opcional, um por linha)
          <textarea id="tool-refs" rows="3" maxlength="2400" class="block border rounded-lg p-2 w-full" placeholder="Provérbios 22:7&#10;Romanos 13:8"></textarea>
        </label>
        <p id="tool-editorial-note" class="text-xs text-slate-500">A distribuição de tempo é uma sugestão editorial. A duração do discurso deve ser conferida no ensaio.</p>
        <div class="flex gap-3 justify-end"><button value="cancel" formnovalidate class="border rounded-lg p-2">Cancelar</button><button value="generate" class="bg-blue-600 text-white rounded-lg p-2">Gerar material</button></div>
    </form>`;
    document.body.append(dialog);
    let pending = null;
    dialog.addEventListener('close',()=>{
        if (!pending) return;
        const {resolve,kind}=pending; pending=null;
        if(dialog.returnValue!=='generate') return resolve(null);
        resolve({kind,duration_minutes:Number(dialog.querySelector('#tool-time').value),
            profiles:[...dialog.querySelectorAll('input[name="profile"]:checked')].map(el=>el.value),
            selected_references:dialog.querySelector('#tool-refs').value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,20)});
    });
    return {getMode:()=>mode, labels, configure:(kind)=>new Promise(resolve=>{
        if (pending) return resolve(null);
        pending={resolve,kind}; dialog.returnValue='cancel';
        dialog.querySelector('#tool-title').textContent=labels[kind];
        const familyOptions = dialog.querySelector('#tool-family');
        const timeOptions = dialog.querySelector('#tool-time-label');
        const editorialNote = dialog.querySelector('#tool-editorial-note');
        familyOptions.hidden=kind!=='family';
        timeOptions.hidden=kind!=='outline';
        editorialNote.hidden=kind!=='outline';
        // Tailwind's display utilities can override the native hidden
        // attribute after its CDN stylesheet loads. Toggle its utility too.
        familyOptions.classList.toggle('hidden',kind!=='family');
        timeOptions.classList.toggle('hidden',kind!=='outline');
        editorialNote.classList.toggle('hidden',kind!=='outline');
        dialog.showModal();
    })};
})();
