import './intro.css';

const SEEN_KEY='altweb-factory-intro-seen';
let seenThisVisit=false;
export function shouldShowIntro():boolean{try{return !seenThisVisit&&localStorage.getItem(SEEN_KEY)!=='yes';}catch{return !seenThisVisit;}}
export function markIntroSeen():void{seenThisVisit=true;try{localStorage.setItem(SEEN_KEY,'yes');}catch{/* The visitor can still skip within this visit. */}}
export interface IntroHandlers{onExplore():void;onProjects():void;onOrder():void}

/** The caller pauses the game; every route cleans up before opening another modal. */
export function mountIntro(host:HTMLElement,handlers:IntroHandlers):{destroy():void}{
 const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
 const dialog=document.createElement('dialog');dialog.className='factory-dialog factory-intro';dialog.dataset.panel='intro';dialog.setAttribute('aria-labelledby','factory-intro-title');
 dialog.innerHTML=`<div class="intro-heading"><span class="intro-studio">Altweb Design — веб-студия</span><button type="button" class="dialog-close" data-intro="close" aria-label="Пропустить знакомство">×</button></div>
 <div class="intro-content"><h2 id="factory-intro-title">ALTWEB <span>FACTORY</span></h2><p class="intro-message">Здесь создают сайты, которые работают на ваш бизнес.</p><p class="intro-description">Дизайн, разработка и проверка сайта — в одной живой фабрике.</p>
 <div class="intro-actions"><button type="button" class="intro-explore" data-intro="explore">Исследовать фабрику</button><button type="button" class="intro-projects" data-intro="projects">Посмотреть проекты</button></div>
 <div class="intro-order-line"><span>Уже есть задача для студии?</span><button type="button" data-intro="order">Заказать сайт</button></div><p class="intro-mobile-note">На телефоне удобно начать с портфолио. Прогулка всегда доступна.</p></div>`;
 host.append(dialog);let closed=false;
 function destroy(){if(closed)return;closed=true;dialog.close();dialog.remove();if(previous?.isConnected)previous.focus({preventScroll:true});}
 function choose(action:keyof IntroHandlers){markIntroSeen();destroy();handlers[action]();}
 dialog.querySelector('[data-intro="explore"]')!.addEventListener('click',()=>choose('onExplore'));
 dialog.querySelector('[data-intro="projects"]')!.addEventListener('click',()=>choose('onProjects'));
 dialog.querySelector('[data-intro="order"]')!.addEventListener('click',()=>choose('onOrder'));
 dialog.querySelector('[data-intro="close"]')!.addEventListener('click',()=>choose('onExplore'));
 dialog.addEventListener('cancel',event=>{event.preventDefault();choose('onExplore')});
 dialog.showModal();dialog.querySelector<HTMLButtonElement>(window.matchMedia('(max-width: 600px)').matches?'[data-intro="projects"]':'[data-intro="explore"]')!.focus();
 return{destroy};
}
