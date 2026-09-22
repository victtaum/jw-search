/* Study configuration stays local; API validates the same enums independently. */
window.JWStudy = (() => {
    const durations = [3, 5, 10, 15, 30, 45, 60];
    const labels = {comparison: 'Tabela comparativa', family: 'Estudo em família', scriptures: 'Textos bíblicos', outline: 'Esboço estruturado'};
    const profiles = {children_3_5:'Crianças de 3–5 anos', children_6_9:'Crianças de 6–9 anos', children_10_12:'Crianças de 10–12 anos', teens:'Adolescentes', adults:'Adultos', couple:'Casal: marido e mulher', seniors:'Idosos'};
    let mode = 'quick';
    const accessLabel=document.createElement('label');
    accessLabel.className='block text-xs text-slate-500 my-2 no-print';
    accessLabel.textContent='Código de acesso ao servidor (se exigido)';
    const accessInput=document.createElement('input'); accessInput.type='password';
    accessInput.autocomplete='off'; accessInput.className='border rounded-lg p-2 ml-2';
    accessInput.setAttribute('aria-label','Código de acesso ao servidor');
    accessInput.value=sessionStorage.getItem('jw_access_token') || '';
    accessInput.addEventListener('change',()=>sessionStorage.setItem('jw_access_token',accessInput.value.trim()));
    accessLabel.append(accessInput);document.getElementById('search-form')?.append(accessLabel);
    function installMode(parent) {
        if (!parent) return;
        const label = document.createElement('label');
        label.className = 'text-xs font-semibold text-slate-600 flex items-center gap-2 my-2 no-print';
        label.append('Profundidade da pesquisa');
        const select = document.createElement('select');
        select.className = 'jw-research-mode border rounded-lg p-2 bg-white';
        [['quick','Sintetizada'],['deep','Ampla']].forEach(([value,text]) => select.add(new Option(text,value)));
        select.addEventListener('change', () => { mode=select.value; document.querySelectorAll('.jw-research-mode').forEach(el=>el.value=mode); });
        label.append(select); parent.prepend(label);
    }
    installMode(document.getElementById('search-form'));
    installMode(document.getElementById('followup-form')?.parentElement);

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
        <p class="text-xs text-slate-500">Aplicações e distribuição de tempo são sugestões editoriais. A duração de um discurso deve ser conferida no ensaio.</p>
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
        dialog.querySelector('#tool-family').hidden=kind!=='family';
        dialog.querySelector('#tool-time-label').hidden=!['family','outline'].includes(kind);
        dialog.showModal();
    })};
})();
