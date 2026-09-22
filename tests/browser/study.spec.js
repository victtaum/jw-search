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

test('depth control stays beside source scope and private access is absent',async ({page})=>{
  const scope=await page.locator('#btn-theocratic-toggle').boundingBox();
  const depth=await page.locator('#btn-depth-toggle').boundingBox();
  expect(scope).not.toBeNull();expect(depth).not.toBeNull();
  expect(Math.abs(scope.y-depth.y)).toBeLessThan(8);
  expect(await page.getByLabel('Código de acesso ao servidor').count()).toBe(0);
  expect(await page.getByText('Código de acesso ao servidor').count()).toBe(0);
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
