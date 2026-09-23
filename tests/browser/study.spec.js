const {test,expect}=require('@playwright/test');

test.beforeEach(async ({page})=>{
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.host!=='127.0.0.1:8766') return route.abort();
    if(url.pathname==='/api/config') return route.fulfill({json:{has_key:false}});
    return route.continue();
  });
  await page.goto('/');
});

test('modes and all seven outline durations are configurable',async ({page})=>{
  await expect(page.getByRole('button',{name:/Pesquisa sintetizada/})).toBeVisible();
  await page.getByRole('button',{name:/Pesquisa sintetizada/}).click();
  expect(await page.evaluate(()=>JWStudy.getMode())).toBe('deep');
  await expect(page.getByRole('button',{name:/Pesquisa ampla/})).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>localStorage.getItem('jw_search_research_mode'))).toBe('deep');
  await page.evaluate(()=>{window.toolResult=null;JWStudy.configure('outline').then(result=>window.toolResult=result);});
  const options=await page.locator('#tool-time option').allTextContents();
  expect(options).toEqual(['3 minutos','5 minutos','10 minutos','15 minutos','30 minutos','45 minutos','60 minutos']);
  await page.locator('#tool-time').selectOption('45');
  await page.getByRole('button',{name:'Gerar material'}).click();
  await expect.poll(()=>page.evaluate(()=>window.toolResult?.duration_minutes)).toBe(45);
});

test('only the outline asks for a duration',async ({page})=>{
  for (const kind of ['comparison','family','scriptures']) {
    await page.evaluate(kind=>{window.toolPromise=JWStudy.configure(kind);},kind);
    await expect(page.getByText('Tempo disponível')).toBeHidden();
    await expect(page.locator('#tool-editorial-note')).toBeHidden();
    await page.locator('#tool-config-form').getByRole('button',{name:'Cancelar'}).click();
    await page.evaluate(()=>window.toolPromise);
  }
  await page.evaluate(()=>{window.toolPromise=JWStudy.configure('outline');});
  await expect(page.getByText('Tempo disponível')).toBeVisible();
  await expect(page.locator('#tool-editorial-note')).toBeVisible();
  await page.locator('#tool-config-form').getByRole('button',{name:'Cancelar'}).click();
});

test('depth control stays beside source scope and private access is absent',async ({page})=>{
  const scope=await page.locator('#btn-theocratic-toggle').boundingBox();
  const depth=await page.locator('#btn-depth-toggle').boundingBox();
  expect(scope).not.toBeNull();expect(depth).not.toBeNull();
  expect(Math.abs(scope.y-depth.y)).toBeLessThan(8);
  expect(await page.getByLabel('Código de acesso ao servidor').count()).toBe(0);
  expect(await page.getByText('Código de acesso ao servidor').count()).toBe(0);
});

test('OpenRouter is the public default and provider tabs select personal keys',async ({page})=>{
  expect(await page.evaluate(()=>currentProvider)).toBe('hy3');
  expect(await page.evaluate(()=>localStorage.getItem('jw_search_active_provider'))).toBe('hy3');
  await page.locator('#btn-open-key-modal').click();
  await page.locator('#modal-tab-gemini').click();
  expect(await page.evaluate(()=>currentProvider)).toBe('gemini');
  await page.locator('#modal-tab-hy3').click();
  expect(await page.evaluate(()=>currentProvider)).toBe('hy3');
});

test('depth selection is synchronized in the follow-up controls',async ({page})=>{
  await page.getByRole('button',{name:/Pesquisa sintetizada/}).click();
  await expect(page.locator('#btn-followup-depth-toggle')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#followup-depth-label')).toHaveText('Ampla');
  await page.locator('#btn-followup-depth-toggle').click();
  await expect(page.locator('#depth-toggle-label')).toHaveText('Pesquisa sintetizada');
});

test('family options survive dialog submission',async ({page})=>{
  await page.evaluate(()=>{JWStudy.configure('family').then(result=>window.toolResult=result);});
  await page.getByLabel('Crianças de 3–5 anos').check();
  await page.getByLabel('Adolescentes',{exact:true}).check();
  await page.getByLabel('Casal: marido e mulher').check();
  await page.getByRole('button',{name:'Gerar material'}).click();
  await expect.poll(()=>page.evaluate(()=>window.toolResult?.profiles)).toEqual(['children_3_5','teens','adults','couple']);
});

test('markdown and malicious source cards cannot inject event handlers',async ({page})=>{
  await page.evaluate(()=>{
    window.pwned=false;
    activeConversation.turns=[{query:'Teste',answer:'[Título" onclick="window.pwned=true](https://wol.jw.org/a)\n<img src=x onerror="window.pwned=true">',results:[{title:'<img onerror="window.pwned=true">',link:'javascript:window.pwned=true',publication:'Fonte'}]}];
    renderConversationThread();
  });
  expect(await page.locator('#chat-messages-list [onclick], #chat-messages-list [onerror], #chat-messages-list a[href^="javascript:"]').count()).toBe(0);
  expect(await page.evaluate(()=>window.pwned)).toBe(false);
});

test('citations and related official links stay in the integrated reader',async ({page})=>{
  const opened=[];
  await page.route('**/api/read**',async route=>{
    const requestUrl=new URL(route.request().url());
    const sourceUrl=requestUrl.searchParams.get('url');
    opened.push(sourceUrl);
    await route.fulfill({json:{content:sourceUrl.includes('/related')
      ? '<article><h1>Documento relacionado</h1><p>Conteúdo relacionado.</p></article>'
      : '<article><h1>Moisés</h1><p>Conteúdo principal.</p><a href="https://wol.jw.org/pt/wol/d/related">Referência relacionada</a></article>'}});
  });
  await page.evaluate(()=>{
    const url='https://wol.jw.org/pt/wol/d/source';
    activeConversation.turns=[{query:'Moisés',answer:`[Moisés](${url})`,results:[{title:'Moisés',link:url,publication:'Estudo Perspicaz das Escrituras'}]}];
    renderConversationThread();
  });
  await page.locator('.wol-inline-link').click();
  await expect(page.locator('#reader-pub')).toHaveText('Estudo Perspicaz das Escrituras');
  await expect(page.locator('#reader-content')).toContainText('Conteúdo principal');
  await page.locator('#reader-content a').click();
  await expect(page.locator('#reader-content')).toContainText('Conteúdo relacionado');
  expect(opened).toEqual(['https://wol.jw.org/pt/wol/d/source','https://wol.jw.org/pt/wol/d/related']);
});

test('DeepSeek request does not inherit Hy3 settings or old sources',async ({page})=>{
  let request;
  await page.route('**/api/chat',async route=>{
    request=route.request().postDataJSON();
    await route.fulfill({json:{ai_response:'Nenhuma fonte recuperada.',results:[],provider:'deepseek'}});
  });
  await page.evaluate(()=>{
    localStorage.setItem('jw_search_hy3_model','wrong-model');
    localStorage.setItem('jw_search_hy3_base_url','https://wrong.example');
    currentProvider='deepseek';
    activeConversation.turns=[{query:'Dívida',answer:'Texto antigo',results:[{title:'Antiga',link:'https://wol.jw.org/old'}]}];
    executeTurnSearch('Aprofunde');
  });
  await expect.poll(()=>request?.provider).toBe('deepseek');
  expect(request.model).toBe(null);expect(request.base_url).toBe(null);
  await expect.poll(()=>page.evaluate(()=>activeConversation.turns.length)).toBe(2);
  expect(await page.evaluate(()=>activeConversation.turns[1].results)).toEqual([]);
});

test('late response cannot enter another conversation',async ({page})=>{
  let release;
  await page.route('**/api/chat',async route=>{
    await new Promise(resolve=>release=resolve);
    await route.fulfill({json:{ai_response:'Resultado antigo',results:[]}});
  });
  await page.evaluate(()=>{executeTurnSearch('Dívida');});
  await expect.poll(()=>Boolean(release)).toBe(true);
  await page.evaluate(()=>{activeConversation={id:'other',title:'Outro',turns:[]};});
  release();
  await expect.poll(()=>page.evaluate(()=>pendingSearch)).toBe(null);
  expect(await page.evaluate(()=>activeConversation.turns)).toEqual([]);
});

test('footer shows version and contact form sends through the backend',async ({page})=>{
  let message;
  await page.route('**/api/contact',async route=>{
    message=route.request().postDataJSON();
    await route.fulfill({json:{status:'sent'}});
  });
  await expect(page.locator('#app-version')).toContainText('Versão');
  await page.getByRole('button',{name:'Reportar Bug / Contatar'}).first().click();
  await page.locator('#contact-subject').fill('Erro ao pesquisar');
  await page.locator('#contact-message').fill('A pesquisa não terminou como esperado.');
  await page.getByRole('button',{name:/Enviar mensagem/}).click();
  await expect.poll(()=>message?.kind).toBe('bug');
  expect(message).not.toHaveProperty('recipient');
  await expect(page.locator('#contact-status')).toContainText('Mensagem enviada');
});

test('follow-up suggestions wrap without a horizontal scrollbar and keep support visible',async ({page})=>{
  await page.setViewportSize({width:900,height:700});
  await page.evaluate(()=>{
    activeConversation.turns=[{query:'Moisés',answer:'Resposta',results:[],timestamp:new Date().toISOString()}];
    renderConversationThread();
  });
  const dimensions=await page.locator('#followup-suggestions').evaluate(element=>({
    clientWidth:element.clientWidth,
    scrollWidth:element.scrollWidth,
    overflowX:getComputedStyle(element).overflowX
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth+1);
  expect(dimensions.overflowX).not.toBe('auto');
  await expect(page.locator('#followup-suggestions')).toHaveClass(/grid-cols-2/);
  for (const button of await page.locator('#followup-suggestions .btn-prompt-pill').all()) {
    await expect(button).toHaveClass(/w-full/);
    await expect(button).toHaveClass(/min-w-0/);
  }
  await expect(page.locator('#followup-secondary-controls')).toHaveClass(/md:flex-col/);
  await expect(page.locator('#followup-support')).toHaveClass(/md:justify-end/);
  await expect(page.locator('#dock-app-version')).toContainText(/^v\d+\.\d+\.\d+$/);
  await expect(page.getByRole('button',{name:'Reportar Bug / Contatar'}).last()).toBeVisible();
});
