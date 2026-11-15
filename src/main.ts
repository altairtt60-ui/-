import './style.css';
import {taskProgress,saveTask,clearTasks} from './content/taskProgress';
import { mountUI } from './ui/shell';
import { openPanel } from './ui/panels';
import { mountDesignWorkshop } from './features/designWorkshop';
import {mountIntro,shouldShowIntro} from './ui/intro';
import {robotDialogues} from './content/robotDialogues';
import type {OrderDraft,DesignSelection} from './content/commerceTypes';
import { mountBackendGame } from './features/backendGame';
import { mountQaGame } from './features/qaGame';
import { stations } from './content/world';
import type { TaskKind } from './content/world';
import type { GameAPI, GameState } from './contracts';
import { projects } from './content/projects';

const gameRoot = document.querySelector<HTMLElement>('#game-root')!;
const uiRoot = document.querySelector<HTMLElement>('#ui-root')!;
let game: GameAPI | undefined;
let panelOpen = false;
let soundEnabled = false;
let audioContext: AudioContext | undefined;
let gain: GainNode | undefined;
let lastState: GameState | undefined;
let orderDraft:OrderDraft={};
let factoryVisible=true;
let bootStarted=false;
let bootPromise:Promise<void>|undefined;

function releaseInput() {
  for (const action of ['left', 'right', 'jump'] as const) game?.setInput(action, false);
}

function resumeGame() {
  panelOpen = false;
  releaseInput();
  game?.focusStation(false);
  game?.focusInteraction(null);
  game?.focusProject(null);
  game?.setPaused(!factoryVisible);
  if(!bootStarted)void ensureGame();
}

function pauseGame(station = false) {
  panelOpen = true;
  releaseInput();
  game?.setPaused(true);
  game?.focusStation(station);
}

function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  if (soundEnabled && !audioContext) {
    audioContext = new AudioContext();
    gain = audioContext.createGain();
    gain.gain.value = 0;
    gain.connect(audioContext.destination);
    // Original quiet machine hum, synthesized locally. No external music/assets.
    for (const frequency of [55, 82.41, 110.1]) {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start();
    }
  }
  if (audioContext && gain) {
    if (soundEnabled) void audioContext.resume();
    gain.gain.setTargetAtTime(soundEnabled ? 0.008 : 0, audioContext.currentTime, 0.1);
  }
  ui.setSound(soundEnabled);
  return soundEnabled;
}

const ui = mountUI(uiRoot, {
  navigate(kind) {
    if (panelOpen) return;
    showPanel(kind);
  },
  sound: toggleSound,
  input(action, pressed) { if (!panelOpen || !pressed) game?.setInput(action, pressed); },
  interact() { if (lastState?.canInteract && !panelOpen) game?.interact(); },
  restart() { if (!panelOpen) game?.resetPlayer(); },
  goToZone(id) {
    if (panelOpen) return;
    releaseInput();
    if(game)game.goToZone(id);else void ensureGame().then(()=>game?.goToZone(id));
    requestAnimationFrame(() => gameRoot.querySelector('canvas')?.focus({preventScroll:true}));
  },
});

function showPanel(kind:'projects'|'services'|'contact'|'portfolio',projectId?:string) {
  if(panelOpen)return;
  pauseGame();
  openPanel(kind,resumeGame,{projectId,onLibrary:visitLibrary,draft:orderDraft,onOrderDraftChange(draft){orderDraft={...draft};}});
}

function showOrder(selection:OrderDraft={}) {
  orderDraft={...orderDraft,...selection};
  showPanel('contact');
}

function showIntroduction() {
  if(panelOpen)return;
  pauseGame();
  mountIntro(document.body,{
    onExplore(){resumeGame();},
    onProjects(){panelOpen=false;showPanel('projects');},
    onOrder(){panelOpen=false;showOrder();},
  });
}

function visitLibrary() {
  if(game)game.goToLibrary();else void ensureGame().then(()=>game?.goToLibrary());
  requestAnimationFrame(() => gameRoot.querySelector('canvas')?.focus({preventScroll:true}));
}

function showProject(id:string) {
  if (panelOpen || !projects.some(project=>project.id===id)) return;
  showPanel('projects',id);
  game?.focusProject(id);
}

const workstationContent = {
  design: {caption:'Дизайн-ателье',title:'За столом дизайнера',intro:'Выбери бизнес, стиль и цвета: макет изменится сразу. Можно также собрать экран из деталей.',mount:mountDesignWorkshop},
  backend: {caption:'Цех разработки',title:'От интерфейса к серверу',intro:'Соедини компоненты, запусти локальную сборку и проверь результат. Это виртуальная демонстрация: внешние серверы и production deployment не запускаются.',mount:mountBackendGame},
  qa: {caption:'Лаборатория QA',title:'Проверяем перед выпуском',intro:'Проверка помогает заметить то, что мешает пользоваться сайтом. Перед тобой учебный экран с тремя ошибками.',mount:mountQaGame},
};

function showWorkstation(kind:TaskKind,view:'play'|'result'='play') {
  if (panelOpen) return;
  const content = workstationContent[kind];
  const station = stations.find(item=>item.kind===kind)!;
  const previousFocus = document.activeElement as HTMLElement | null;
  pauseGame();
  game?.focusInteraction(station.id);
  const dialog = document.createElement('dialog');
  dialog.className = 'factory-dialog workstation-dialog';
  dialog.setAttribute('aria-labelledby', 'workstation-title');
  dialog.setAttribute('data-panel', station.id);
  dialog.innerHTML = `
    <div class="dialog-heading">
      <div><p class="station-caption">${content.caption}</p><h2 id="workstation-title">${content.title}</h2></div>
      <button class="dialog-close" type="button" aria-label="Закрыть рабочее место">×</button>
    </div>
    <div class="dialog-body">
      <p class="station-intro">${content.intro}</p>
      <div id="${kind}-game-host"></div>
    </div>`;
  document.body.append(dialog);
  const host=dialog.querySelector<HTMLElement>(`#${kind}-game-host`)!;
  const saved=taskProgress(kind);
  let observer:MutationObserver|undefined;
  let miniGame:{destroy():void;snapshot?():Record<string,unknown>};
  const persist=()=>{if(miniGame?.snapshot)saveTask(kind,taskProgress(kind).status,miniGame.snapshot());};
  const complete=()=>{saveTask(kind,'completed',taskProgress(kind).data);game?.completeTask(kind);};
  if(saved.status==='completed'&&view==='play'){
    const title=document.createElement('h3');title.textContent='Задание уже выполнено';host.append(title);
    for(const [action,label] of [['result','Посмотреть результат'],['repeat','Повторить задание'],['close','Вернуться на фабрику']] as const){const button=document.createElement('button');button.type='button';button.className='console-button';button.dataset.taskAction=action;button.textContent=label;host.append(button);button.addEventListener('click',()=>{close();if(action==='repeat'){saveTask(kind,'not_started',{});showWorkstation(kind);}else if(action==='result')showWorkstation(kind,'result');});}
    miniGame={destroy(){}};
  }else{
    if(saved.status!=='completed')saveTask(kind,'in_progress',saved.data);
    miniGame=kind==='design'?mountDesignWorkshop(host,complete,close,(selection:DesignSelection)=>{close();showOrder(selection);},saved.data):kind==='backend'?mountBackendGame(host,complete,close,saved.data):mountQaGame(host,complete,close,saved.data);
    if(view==='result')host.querySelectorAll<HTMLElement>('.backend-game__reset,.qa-game__reset,[data-action="design-reset"],.design-game__reset').forEach(el=>el.hidden=true);
    observer=new MutationObserver(persist);observer.observe(host,{subtree:true,childList:true,attributes:true,characterData:true});host.addEventListener('change',persist);host.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('.backend-game__reset,.qa-game__reset,.design-game__reset,[data-action="design-reset"]'))saveTask(kind,'in_progress',{});queueMicrotask(persist);});
    persist();
  }
  window.addEventListener('pagehide',persist);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    persist();observer?.disconnect();window.removeEventListener('pagehide',persist);miniGame.destroy();
    dialog.close();
    dialog.remove();
    resumeGame();
    if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus({ preventScroll: true });
    else gameRoot.querySelector('canvas')?.focus({ preventScroll: true });
  }
  dialog.querySelector('button')!.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
  let backdropDown=false;
  dialog.addEventListener('pointerdown',event=>{const r=dialog.getBoundingClientRect();backdropDown=event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom);});
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog||!backdropDown) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  dialog.showModal();
  dialog.querySelector<HTMLButtonElement>('button')!.focus();
}

function showRobotDialogue(id:string) {
  if(panelOpen)return;
  const entry=Object.hasOwn(robotDialogues,id)?robotDialogues[id as keyof typeof robotDialogues]:undefined;if(!entry)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  pauseGame();game?.focusInteraction(`npc:${id}`);
  const dialog=document.createElement('dialog');dialog.className='factory-dialog robot-dialog';dialog.dataset.npcId=id;dialog.setAttribute('aria-labelledby','robot-dialog-title');
  const heading=document.createElement('header');heading.className='dialog-heading';
  const title=document.createElement('h2');title.id='robot-dialog-title';title.textContent=entry.title;
  const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='dialog-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','Закрыть диалог');heading.append(title,closeButton);
  const body=document.createElement('div');body.className='dialog-body';const words=document.createElement('p');words.className='panel-lead';words.textContent=entry.body;body.append(words);
  const choices=document.createElement('div');choices.className='robot-dialog-actions';
  let closed=false;
  function close(){if(closed)return;closed=true;dialog.close();dialog.remove();resumeGame();if(previous?.isConnected&&previous!==document.body)previous.focus({preventScroll:true});else gameRoot.querySelector('canvas')?.focus({preventScroll:true});}
  for(const action of entry.actions){const button=document.createElement('button');button.type='button';button.className='console-button';button.dataset.robotAction=action.id;button.textContent=action.label;button.addEventListener('click',()=>{
    close();
    if(action.id==='projects'||action.id==='services')showPanel(action.id);
    else if(action.id==='order')showOrder();
    else if(action.id==='library')visitLibrary();
    else if(action.id==='design'||action.id==='backend'||action.id==='qa'){game?.goToZone(action.id);if(id!=='guide')showWorkstation(action.id);}
  });choices.append(button);}
  body.append(choices);dialog.append(heading,body);document.body.append(dialog);
  closeButton.addEventListener('click',close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.showModal();choices.querySelector<HTMLButtonElement>('button')?.focus();
}

window.addEventListener('blur', releaseInput);
document.addEventListener('visibilitychange', () => {
  releaseInput();
  if (document.hidden) void audioContext?.suspend();
  else if (soundEnabled) void audioContext?.resume();
});

declare global {
  interface Window {
    __ALTWEB__: { getState(): GameState | undefined; restart(): void };
  }
}
window.__ALTWEB__ = { getState: () => game?.getState(), restart: () => game?.resetPlayer() };

function ensureGame():Promise<void> {return bootPromise??=(async()=>{bootStarted=true;await boot();})();}

async function boot() {
  try {
    const { createGame } = await import('./game/createGame');
    game = createGame(gameRoot, {
      onInteract(id) {
        const station = stations.find(item=>item.id===id);
        if(id.startsWith('npc:'))showRobotDialogue(id.slice(4));
        else if (id==='contact-desk'&&!panelOpen) {showOrder();game?.focusInteraction(id);}
        else if (station) showWorkstation(station.kind);
        else if (id.startsWith('project:')) showProject(id.slice('project:'.length));
      },
      onState(state) { lastState = state; ui.setStatus(state); },
    });
    game.setPaused(panelOpen || !factoryVisible);
  } catch (error) {
    console.error('Не удалось запустить игровую сцену', error);
    const message = document.createElement('p');
    message.className = 'game-error';
    message.textContent = 'Не удалось открыть фабрику. Услуги, портфолио и контакты доступны в меню сверху.';
    gameRoot.append(message);
  }
}
const clearProgressButton=document.createElement('button');clearProgressButton.type='button';clearProgressButton.className='console-button';clearProgressButton.textContent='Сбросить прогресс заданий';clearProgressButton.dataset.action='clear-task-progress';
clearProgressButton.addEventListener('click',()=>{if(window.confirm('Сбросить прогресс всех трёх заданий?')){clearTasks();window.location.reload();}});
uiRoot.querySelector('.workshop-map')?.append(clearProgressButton);
const factoryObserver=new IntersectionObserver(([entry])=>{
  if(!entry)return;
  factoryVisible=entry.isIntersecting;
  if(!factoryVisible)releaseInput();
  game?.setPaused(panelOpen || !factoryVisible);
}, {threshold:0});
factoryObserver.observe(document.querySelector('#app')!);

const requestedRoom=new URLSearchParams(window.location.search).get('room');
if(window.location.hash==='#order')showOrder();
else if(requestedRoom && ['entry','design','backend','qa','library','dispatch'].includes(requestedRoom)){
  void ensureGame().then(()=>game?.goToZone(requestedRoom as import('./content/world').ZoneId));
}else if(shouldShowIntro())showIntroduction();
else void ensureGame();
