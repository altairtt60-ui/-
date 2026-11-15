import './backendGame.css';

type NodeId = 'frontend' | 'api' | 'server' | 'response';
const chain: readonly NodeId[] = ['frontend', 'api', 'server', 'response'];
const nodes: ReadonlyArray<{id:NodeId; name:string; detail:string; code:string}> = [
  {id:'frontend',name:'Frontend',detail:'Интерфейс отправляет запрос',code:'fetch("/api/project")'},
  {id:'api',name:'API',detail:'Маршрут принимает запрос',code:'GET /api/project'},
  {id:'server',name:'Server',detail:'Сервер собирает данные',code:'return project;'},
  {id:'response',name:'Response',detail:'Ответ возвращается в интерфейс',code:'{ "status": "ok" }'},
];

/** A local signal-routing model; it does not send network requests. */
export function mountBackendGame(host:HTMLElement,onComplete:()=>void,onDone?:()=>void,initial:Record<string,unknown>={}):{destroy():void;reset():void;snapshot():Record<string,unknown>} {
  const abort=new AbortController(), {signal}=abort;
  const connected=new Set<NodeId>();
  let selected:NodeId|null=null, destroyed=false, completed=false, suppressClick=false;
  let phase:'connect'|'ready'|'building'|'built'|'verified'='connect';
  let buildTimer:number|undefined;
  let clickTimer:number|undefined;
  let drag:{id:number;source:NodeId;x:number;y:number;active:boolean}|null=null;
  const root=document.createElement('section');
  root.className='backend-game';
  root.setAttribute('aria-label','Мини-игра: подключи сервер');
  root.innerHTML=`
    <div class="backend-game__intro"><h3>Собери и проверь сайт</h3><p>Соедини блоки, запусти сборку и проверь результат.</p><p class="backend-game__demo-note">Виртуальная демонстрация: код работает только в этой игре. Внешний сервер и публикация не запускаются.</p></div>
    <div class="backend-game__board" role="group" aria-label="Блоки сети">
      <svg class="backend-game__wires" aria-hidden="true"><g></g><path class="backend-game__pending" hidden></path></svg>
    </div>
    <div class="backend-game__terminal" aria-label="Демонстрационный ответ"><p>Локальная проверка соединений</p><pre><code>Ожидаю запрос из интерфейса…</code></pre></div>
    <div class="backend-game__build-panel">
      <p class="backend-game__build-state" role="status" aria-live="polite">Сборка ожидает соединений.</p>
      <progress class="backend-game__progress" value="0" max="3" aria-label="Локальная сборка сайта"></progress>
      <div class="backend-game__build-actions"><button class="backend-game__build" type="button" disabled>Собрать сайт</button><button class="backend-game__check" type="button" hidden>Проверить результат</button></div>
    </div>
    <section class="backend-game__preview" aria-label="Демонстрационный результат" hidden>
      <p class="backend-game__preview-label">Локальный preview — учебный макет</p>
      <div class="backend-game__sample"><p class="backend-game__sample-brand">Мастерская</p><h4>Идея обрела форму</h4><p>Страница собрана из компонентов. Теперь проверим, что интерфейс отвечает на действие.</p><button class="backend-game__preview-action" type="button" aria-expanded="false">Показать контакты</button><p class="backend-game__preview-contact" hidden>В рабочем сайте здесь будут контакты студии. Это учебный пример, ничего не отправлено.</p></div>
    </section>
    <div class="backend-game__footer"><p class="backend-game__feedback" role="status" aria-live="polite" aria-atomic="true">Соединений: 0 из 3.</p><button class="backend-game__reset" type="button">Повторить задание</button><button class="backend-game__done" type="button" disabled>Готово</button></div>`;
  host.append(root);
  const board=root.querySelector<HTMLElement>('.backend-game__board')!;
  const wires=root.querySelector<SVGElement>('.backend-game__wires g')!;
  const pending=root.querySelector<SVGPathElement>('.backend-game__pending')!;
  const feedback=root.querySelector<HTMLElement>('.backend-game__feedback')!;
  const code=root.querySelector<HTMLElement>('code')!;
  const done=root.querySelector<HTMLButtonElement>('.backend-game__done')!;
  const buildButton=root.querySelector<HTMLButtonElement>('.backend-game__build')!;
  const checkButton=root.querySelector<HTMLButtonElement>('.backend-game__check')!;
  const progress=root.querySelector<HTMLProgressElement>('.backend-game__progress')!;
  const buildState=root.querySelector<HTMLElement>('.backend-game__build-state')!;
  const preview=root.querySelector<HTMLElement>('.backend-game__preview')!;
  const previewAction=root.querySelector<HTMLButtonElement>('.backend-game__preview-action')!;
  const previewContact=root.querySelector<HTMLElement>('.backend-game__preview-contact')!;
  const buttons=new Map<NodeId,HTMLButtonElement>();
  for(const node of nodes){
    const button=document.createElement('button');
    button.type='button';button.className=`backend-game__node backend-game__node--${node.id}`;
    button.dataset.node=node.id;button.setAttribute('aria-pressed','false');
    button.setAttribute('aria-label',`${node.name}: ${node.detail}`);
    button.innerHTML=`<span class="backend-game__port" aria-hidden="true"></span><strong>${node.name}</strong><span class="backend-game__node-detail">${node.detail}</span><code></code><span class="backend-game__node-state">Не подключён</span>`;
    button.querySelector('code')!.textContent=node.code;
    board.append(button);buttons.set(node.id,button);
    button.addEventListener('click',()=>{
      if(suppressClick){suppressClick=false;return;}
      if(selected) connect(selected,node.id); else choose(node.id);
    },{signal});
    button.addEventListener('pointerdown',(event:PointerEvent)=>{
      if(event.button!==0||phase!=='connect'||node.id==='response'||connected.has(node.id))return;
      drag={id:event.pointerId,source:node.id,x:event.clientX,y:event.clientY,active:false};
      button.setPointerCapture(event.pointerId);
    },{signal});
  }
  function choose(id:NodeId):void {
    if(destroyed||phase!=='connect')return;
    if(id==='response'){feedback.textContent='У этого блока нет выхода. Выбери другой блок.';return;}
    if(connected.has(id)){feedback.textContent='Этот кабель уже подключён. Выбери следующий выход.';return;}
    selected=id;
    for(const [key,button] of buttons)button.setAttribute('aria-pressed',String(key===id));
    feedback.textContent=`Выход ${nodes.find(node=>node.id===id)!.name} выбран. Теперь нажми на следующий блок.`;
  }
  function connect(from:NodeId,to:NodeId):void {
    if(destroyed||phase!=='connect')return;
    if(from===to){selected=null;for(const button of buttons.values())button.setAttribute('aria-pressed','false');feedback.textContent='Выбор снят. Выбери выход, затем другой блок.';return;}
    if(connected.has(from))return;
    const index=chain.indexOf(from), expected=chain[index+1];
    if(to!==expected){feedback.textContent='Сигнал пока не проходит. Попробуй другой блок.';return;}
    // A downstream cable can be prepared, but the response only appears for a complete chain.
    connected.add(from);selected=null;
    for(const [id,button]of buttons){
      button.setAttribute('aria-pressed','false');
      const active=connected.has(id)||(id==='response'&&connected.has('server'));
      button.classList.toggle('is-connected',active);
      button.querySelector('.backend-game__node-state')!.textContent=active?'Соединение готово':'Не подключён';
    }
    drawWires();
    feedback.textContent=`Кабель подключён. Соединений: ${connected.size} из 3.`;
    code.textContent=`connections: ${connected.size}/3\nbuild: waiting`;
    if(connected.size===3){
      phase='ready';buildButton.disabled=false;buildState.textContent='Компоненты соединены. Можно собрать учебную страницу.';
      feedback.textContent='Соединения готовы. Запусти сборку, затем проверь результат.';
      for(const button of buttons.values()){button.disabled=true;button.setAttribute('aria-disabled','true');}
      buildButton.focus({preventScroll:true});
    }
  }
  function point(id:NodeId):{x:number;y:number}{
    const bounds=board.getBoundingClientRect(),rect=buttons.get(id)!.getBoundingClientRect();
    return{x:rect.left-bounds.left+rect.width/2,y:rect.top-bounds.top+rect.height/2};
  }
  function path(a:{x:number;y:number},b:{x:number;y:number}):string {
    const bend=Math.max(24,Math.abs(b.x-a.x)*.35);
    return`M ${a.x} ${a.y} C ${a.x+bend} ${a.y}, ${b.x-bend} ${b.y}, ${b.x} ${b.y}`;
  }
  function drawWires():void {
    wires.replaceChildren();
    for(const from of connected){
      const to=chain[chain.indexOf(from)+1]!;
      const wire=document.createElementNS('http://www.w3.org/2000/svg','path');
      wire.setAttribute('d',path(point(from),point(to)));wires.append(wire);
    }
  }
  function clearDrag():void {drag=null;pending.setAttribute('hidden','');root.classList.remove('is-dragging');}
  document.addEventListener('pointermove',(event:PointerEvent)=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(!drag.active&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>7){drag.active=true;choose(drag.source);root.classList.add('is-dragging');}
    if(!drag.active)return;
    event.preventDefault();
    const rect=board.getBoundingClientRect();
    pending.removeAttribute('hidden');pending.setAttribute('d',path(point(drag.source),{x:event.clientX-rect.left,y:event.clientY-rect.top}));
  },{signal,passive:false});
  document.addEventListener('pointerup',(event:PointerEvent)=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(drag.active){
      suppressClick=true;
      clickTimer=window.setTimeout(()=>{suppressClick=false;clickTimer=undefined;},0);
      const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-node]');
      if(target&&root.contains(target))connect(drag.source,target.dataset.node as NodeId);
      else feedback.textContent='Кабель можно подключить двумя нажатиями: выход, затем следующий блок.';
    }
    clearDrag();
  },{signal});
  document.addEventListener('pointercancel',clearDrag,{signal});
  const observer=new ResizeObserver(()=>drawWires());observer.observe(board);
  function reset():void {
    if(destroyed)return;
    if(buildTimer!==undefined)window.clearTimeout(buildTimer);buildTimer=undefined;
    if(clickTimer!==undefined)window.clearTimeout(clickTimer);clickTimer=undefined;
    clearDrag();connected.clear();selected=null;completed=false;suppressClick=false;phase='connect';
    buildButton.disabled=true;checkButton.hidden=true;progress.value=0;preview.hidden=true;
    buildState.textContent='Сборка ожидает соединений.';previewContact.hidden=true;previewAction.setAttribute('aria-expanded','false');
    root.classList.remove('is-complete');done.disabled=true;drawWires();
    feedback.textContent='Соединений: 0 из 3.';code.textContent='Ожидаю запрос из интерфейса…';
    for(const button of buttons.values()){button.classList.remove('is-connected');button.setAttribute('aria-pressed','false');button.removeAttribute('aria-disabled');button.disabled=false;button.querySelector('.backend-game__node-state')!.textContent='Не подключён';}
  }
  buildButton.addEventListener('click',()=>{
    if(destroyed||phase!=='ready')return;
    phase='building';buildButton.disabled=true;selected=null;clearDrag();progress.value=0;
    feedback.textContent='Идёт локальная сборка учебного макета.';
    const steps=['Проверяем компоненты…','Собираем страницу…','Готовим предварительный просмотр…'];
    let step=0;
    const tick=()=>{
      buildTimer=undefined;if(destroyed||phase!=='building')return;
      progress.value=++step;buildState.textContent=steps[step-1]!;
      code.textContent=`build: ${step}/3\nmode: local demonstration`;
      if(step<steps.length){buildTimer=window.setTimeout(tick,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:280);return;}
      phase='built';preview.hidden=false;checkButton.hidden=false;
      buildState.textContent='Учебная страница собрана. Проверь результат.';
      feedback.textContent='Preview готов. Проверь работу кнопки в макете и запусти проверку.';
      checkButton.focus({preventScroll:true});
    };
    buildTimer=window.setTimeout(tick,0);
  },{signal});
  checkButton.addEventListener('click',()=>{
    if(destroyed||phase!=='built')return;
    phase='verified';completed=true;root.classList.add('is-complete');done.disabled=false;checkButton.hidden=true;
    buildState.textContent='Сайт успешно собран!';feedback.textContent='Сайт успешно собран! Учебный preview готов к просмотру.';
    code.textContent='LOCAL CHECK\n200 OK — демонстрационный ответ\ncomponents: connected\npreview: ready';
    onComplete();done.focus({preventScroll:true});
  },{signal});
  previewAction.addEventListener('click',()=>{previewContact.hidden=!previewContact.hidden;previewAction.setAttribute('aria-expanded',String(!previewContact.hidden));},{signal});
  root.querySelector('.backend-game__reset')!.addEventListener('click',()=>{reset();buttons.get('frontend')!.focus({preventScroll:true});},{signal});
  done.addEventListener('click',()=>{if(completed)onDone?.();},{signal});
  if(Array.isArray(initial.connected))for(const from of chain.slice(0,-1))if(initial.connected.includes(from))connect(from,chain[chain.indexOf(from)+1]!);
  if(connected.size===3 && ['building','built','verified'].includes(String(initial.phase))){
    if(initial.phase==='building')buildButton.click();
    else {phase='built';preview.hidden=false;checkButton.hidden=false;progress.value=3;buildState.textContent='Учебная страница собрана. Проверь результат.';if(initial.phase==='verified')checkButton.click();}
  }
  return{reset,snapshot:()=>({connected:[...connected],phase}),destroy(){if(destroyed)return;destroyed=true;if(buildTimer!==undefined)window.clearTimeout(buildTimer);if(clickTimer!==undefined)window.clearTimeout(clickTimer);abort.abort();observer.disconnect();clearDrag();root.remove();}};
}
