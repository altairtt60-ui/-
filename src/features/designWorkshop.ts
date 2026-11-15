import './designWorkshop.css';
import {mountDesignGame} from './designGame';
import {businessOptions,styleOptions,paletteOptions,defaultDesign} from '../content/designOptions';
import type {BusinessKind,DesignStyle,DesignSelection} from '../content/commerceTypes';

type Mode='configurator'|'puzzle';
type PreviewSection='home'|'services'|'about'|'contact';
let sequence=0;

const descriptions:Record<BusinessKind,string>={
 auto:'Услуги, понятная навигация и запись на обслуживание — на одном экране.',
 beauty:'Процедуры, настроение студии и удобный следующий шаг для посетителя.',
 cafe:'Меню, атмосфера и важная информация для гостей.',
 shop:'Подборка товаров, категории и понятный путь к выбору.',
 service:'Предложение компании, направления работы и способ обсудить задачу.',
};
const sectionContent:Record<BusinessKind,readonly string[]>={
 auto:['Диагностика','Обслуживание','Ремонт'],beauty:['Уход','Стрижки','Образ'],cafe:['Кофе','Завтраки','Десерты'],shop:['Коллекция','Новинки','Подборки'],service:['Направления','Подход','Обсуждение задачи'],
};

function element<K extends keyof HTMLElementTagNameMap>(tag:K,className?:string,value?:string){
 const node=document.createElement(tag);if(className)node.className=className;if(value)node.textContent=value;return node;
}

/** The host owns its modal. The configurator and the original puzzle remain one workshop. */
export function mountDesignWorkshop(host:HTMLElement,onComplete:()=>void,onDone?:()=>void,onOrder?:(selection:DesignSelection)=>void,initial:Record<string,unknown>={}):{destroy():void;reset():void;snapshot():Record<string,unknown>}{
 const abort=new AbortController(),{signal}=abort;
 const id=`design-workshop-${++sequence}`;
 let selection:DesignSelection={...defaultDesign},mode:Mode='configurator',previewSection:PreviewSection='home';
 let completed=false,destroyed=false,puzzle:ReturnType<typeof mountDesignGame>|undefined;
 const root=element('section','design-workshop');root.dataset.designWorkshop='';root.setAttribute('aria-label','Дизайн-ателье: настройка сайта и сборка экрана');
 const tablist=element('div','design-workshop__tabs');tablist.setAttribute('role','tablist');tablist.setAttribute('aria-label','Занятие в дизайн-ателье');
 const tabs=new Map<Mode,HTMLButtonElement>();
 for(const[key,label]of [['configurator','Настроить сайт'],['puzzle','Собрать экран']] as const){
  const button=element('button','design-workshop__tab',label);button.type='button';button.dataset.designMode=key;button.id=`${id}-tab-${key}`;button.setAttribute('role','tab');button.setAttribute('aria-controls',`${id}-${key}`);button.setAttribute('aria-selected',String(key===mode));button.tabIndex=key===mode?0:-1;tabs.set(key,button);tablist.append(button);
 }
 const configuration=element('div','design-workshop__configuration');configuration.id=`${id}-configurator`;configuration.setAttribute('role','tabpanel');configuration.setAttribute('aria-labelledby',`${id}-tab-configurator`);
 const puzzleHost=element('div','design-workshop__puzzle');puzzleHost.id=`${id}-puzzle`;puzzleHost.setAttribute('role','tabpanel');puzzleHost.setAttribute('aria-labelledby',`${id}-tab-puzzle`);puzzleHost.hidden=true;
 const intro=element('div','design-workshop__intro');intro.append(element('h3','','Настрой свой макет'),element('p','','Выбери направление, стиль и палитру. Результат меняется сразу.'));
 const bench=element('div','design-workshop__bench');
 const controls=element('div','design-workshop__controls');controls.setAttribute('aria-label','Параметры макета');
 const businessField=element('div','design-workshop__business');
 const businessLabel=element('label','','Сфера бизнеса');businessLabel.htmlFor=`${id}-business`;
 const business=element('select');business.id=`${id}-business`;business.dataset.designBusiness='';business.name=`${id}-business`;
 for(const option of businessOptions){const node=element('option','',option.label);node.value=option.id;business.append(node);}business.value=selection.business;
 businessField.append(businessLabel,business);
 const styleField=element('fieldset','design-workshop__field');styleField.append(element('legend','','Стиль'));
 const styleChoices=element('div','design-workshop__choices');styleField.append(styleChoices);
 for(const option of styleOptions){
  const label=element('label','design-workshop__choice');const radio=element('input');radio.type='radio';radio.name=`${id}-style`;radio.value=option.id;radio.dataset.designStyle=option.id;radio.checked=option.id===selection.style;label.append(radio,element('span','',option.label));styleChoices.append(label);
 }
 const paletteField=element('fieldset','design-workshop__field');paletteField.append(element('legend','','Палитра'));
 const paletteChoices=element('div','design-workshop__choices design-workshop__choices--palettes');paletteField.append(paletteChoices);
 const choiceNote=element('p','design-workshop__choice-note','Цвета сочетаются с выбранным стилем.');
 controls.append(businessField,styleField,paletteField,choiceNote);
 const drawing=element('div','design-workshop__drawing');drawing.append(element('p','design-workshop__caption','Демонстрационный макет'));
 const preview=element('article','design-workshop__preview');preview.dataset.designPreview='';preview.setAttribute('aria-label','Предпросмотр сайта');drawing.append(preview);
 const previewNote=element('p','design-workshop__preview-note','Это интерактивный пример, а не опубликованный сайт.');drawing.append(previewNote);
 bench.append(controls,drawing);
 const footer=element('div','design-workshop__footer');
 const feedback=element('p','design-workshop__feedback','Можно менять любой параметр и сравнивать варианты.');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.setAttribute('aria-atomic','true');
 const actions=element('div','design-workshop__actions');
 const order=element('button','design-workshop__order','Хочу похожий сайт');order.type='button';order.dataset.action='design-order';order.hidden=!onOrder;
 const finish=element('button','design-workshop__finish','Макет готов');finish.type='button';finish.dataset.action='design-finish';
 const resetButton=element('button','design-workshop__reset','Сбросить выбор');resetButton.type='button';resetButton.dataset.action='design-reset';
 const done=element('button','design-workshop__done','Готово');done.type='button';done.dataset.action='design-done';done.disabled=true;
 actions.append(order,finish,resetButton,done);footer.append(feedback,actions);
 configuration.append(intro,bench,footer);root.append(tablist,configuration,puzzleHost);host.append(root);

 function markComplete(){
  if(destroyed||completed)return;completed=true;done.disabled=false;finish.disabled=true;feedback.textContent='Макет готов. Выбор можно передать в заявку или вернуться на фабрику.';onComplete();
 }
 function renderPalettes(){
  paletteChoices.replaceChildren();
  for(const option of paletteOptions.filter(item=>item.style===selection.style)){
   const label=element('label','design-workshop__choice design-workshop__palette');
   const radio=element('input');radio.type='radio';radio.name=`${id}-palette`;radio.value=option.id;radio.dataset.designPalette=option.id;radio.checked=option.id===selection.palette;
   const content=element('span');const colors=element('i','design-workshop__swatches');colors.setAttribute('aria-hidden','true');
   for(const color of [option.background,option.surface,option.accent]){const swatch=element('i');swatch.style.backgroundColor=color;colors.append(swatch);}
   content.append(colors,element('b','',option.label));label.append(radio,content);paletteChoices.append(label);
  }
 }
 function art(kind:BusinessKind){
  const shape=element('div',`design-workshop__illustration design-workshop__illustration--${kind}`);shape.setAttribute('aria-hidden','true');
  // These are deliberately drawn sample-site illustrations, never portfolio or stock work.
  const graphics:Record<BusinessKind,string>={
   auto:'<svg viewBox="0 0 220 145" fill="none"><path d="M18 102h184l-10-32-45-7-30-29H73L49 69l-26 9-5 24Z" fill="var(--preview-accent)"/><path d="m75 43-19 28h72l-18-28H75Z" fill="var(--preview-background)"/><path d="m132 70 47 7M28 86h27" stroke="var(--preview-accent-ink)" stroke-width="4"/><circle cx="60" cy="105" r="21" fill="var(--preview-ink)"/><circle cx="60" cy="105" r="10" fill="var(--preview-background)"/><circle cx="166" cy="105" r="21" fill="var(--preview-ink)"/><circle cx="166" cy="105" r="10" fill="var(--preview-background)"/></svg>',
   beauty:'<svg viewBox="0 0 220 145" fill="none"><path d="M58 126V58a52 52 0 0 1 104 0v68H58Z" fill="var(--preview-accent)"/><path d="M71 115V59a39 39 0 0 1 78 0v56H71Z" fill="var(--preview-background)"/><path d="m94 95 36-48M89 79c-25-3-36-17-32-34 23-3 37 12 32 34Zm26-6c1-20 12-33 33-32 1 20-12 34-33 32Z" fill="var(--preview-surface)" stroke="var(--preview-accent)" stroke-width="3"/></svg>',
   cafe:'<svg viewBox="0 0 220 145" fill="none"><ellipse cx="108" cy="126" rx="85" ry="8" fill="var(--preview-accent)"/><path d="M54 50h101v37a50 50 0 0 1-101 0V50Z" fill="var(--preview-accent)"/><path d="M155 61h13a22 22 0 0 1 0 44h-17" stroke="var(--preview-accent)" stroke-width="12"/><ellipse cx="104" cy="51" rx="46" ry="9" fill="var(--preview-background)"/><path d="M88 35c-11-14 10-17 0-29m30 29c-11-14 10-17 0-29" stroke="var(--preview-ink)" stroke-width="3" stroke-linecap="round"/></svg>',
   shop:'<svg viewBox="0 0 220 145" fill="none"><path d="M50 46h120l12 87H38l12-87Z" fill="var(--preview-accent)"/><path d="M82 47V34a28 28 0 0 1 56 0v13" stroke="var(--preview-ink)" stroke-width="6"/><path d="M90 83h40m-40 12h28" stroke="var(--preview-accent-ink)" stroke-width="5"/><path d="m150 47 24-17 25 36-25 16" fill="var(--preview-surface)" stroke="var(--preview-ink)" stroke-width="2"/></svg>',
   service:'<svg viewBox="0 0 220 145" fill="none"><path d="M54 34h112v91H54V34Z" fill="var(--preview-background)" stroke="var(--preview-accent)" stroke-width="5"/><path d="M86 34v-9h48v9" stroke="var(--preview-ink)" stroke-width="5"/><path d="m74 62 8 8 15-18m-23 40 8 8 15-18" stroke="var(--preview-accent)" stroke-width="5"/><path d="M112 63h34m-34 29h34" stroke="var(--preview-ink)" stroke-width="4"/></svg>',
  };
  shape.innerHTML=graphics[kind];return shape;
 }
 function renderPreview(){
  const option=businessOptions.find(item=>item.id===selection.business)!;
  const palette=paletteOptions.find(item=>item.id===selection.palette&&item.style===selection.style)!;
  preview.dataset.style=selection.style;preview.dataset.business=selection.business;preview.dataset.palette=selection.palette;
  for(const[key,value]of Object.entries({background:palette.background,surface:palette.surface,ink:palette.ink,accent:palette.accent,'accent-ink':palette.accentInk}))preview.style.setProperty(`--preview-${key}`,value);
  preview.replaceChildren();
  const nav=element('header','design-workshop__sample-header');nav.append(element('strong','design-workshop__sample-name',option.label));
  const menu=element('nav','design-workshop__sample-nav');menu.setAttribute('aria-label','Разделы демонстрационного макета');
  for(const[key,label]of [['services','Услуги'],['about','О нас'],['contact','Контакты']] as const){const button=element('button','',label);button.type='button';button.dataset.previewSection=key;button.setAttribute('aria-pressed',String(previewSection===key));menu.append(button);}nav.append(menu);
  const hero=element('div','design-workshop__sample-hero');
  const copy=element('div','design-workshop__sample-copy');copy.append(element('h4','',option.headline),element('p','',descriptions[selection.business]));
  const sampleCta=element('button','design-workshop__sample-cta',option.action);sampleCta.type='button';sampleCta.dataset.previewSection='contact';copy.append(sampleCta);hero.append(copy,art(selection.business));
  const details=element('section','design-workshop__sample-details');details.dataset.previewContent='';
  if(previewSection==='home'||previewSection==='services'){
   details.append(element('h5','',previewSection==='home'?'На сайте можно показать':'Направления'));
   const items=element('div','design-workshop__sample-items');for(const value of sectionContent[selection.business])items.append(element('span','',value));details.append(items);
  }else if(previewSection==='about')details.append(element('h5','','О компании'),element('p','','Здесь можно рассказать о вашем подходе и команде.'));
  else details.append(element('h5','',option.action),element('p','','Пример следующего шага. Этот макет не отправляет заявки.'));
  preview.append(nav,hero,details);
 }
 function activateMode(next:Mode){
  if(destroyed)return;mode=next;configuration.hidden=next!=='configurator';puzzleHost.hidden=next!=='puzzle';
  for(const[key,button]of tabs){button.setAttribute('aria-selected',String(key===next));button.tabIndex=key===next?0:-1;}
  if(next==='puzzle'&&!puzzle)puzzle=mountDesignGame(puzzleHost,markComplete,onDone,initial.pieces);
 }
 for(const[key,button]of tabs){
  button.addEventListener('click',()=>activateMode(key),{signal});
  button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next:Mode=event.key==='Home'?'configurator':event.key==='End'?'puzzle':key==='configurator'?'puzzle':'configurator';activateMode(next);tabs.get(next)!.focus();},{signal});
 }
 controls.addEventListener('change',event=>{
  const target=event.target;if(destroyed||!(target instanceof HTMLInputElement||target instanceof HTMLSelectElement))return;
  if(target.matches('[data-design-business]')&&businessOptions.some(item=>item.id===target.value))selection.business=target.value as BusinessKind;
  else if(target.matches('[data-design-style]')&&styleOptions.some(item=>item.id===target.value)){
   selection.style=target.value as DesignStyle;selection.palette=paletteOptions.find(item=>item.style===selection.style)!.id;renderPalettes();
  }else if(target.matches('[data-design-palette]')&&paletteOptions.some(item=>item.id===target.value&&item.style===selection.style))selection.palette=target.value;
  else return;
  previewSection='home';renderPreview();feedback.textContent='Макет обновлён. Можно сравнить другой вариант или передать этот выбор в заявку.';
 },{signal});
 preview.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target.closest<HTMLElement>('[data-preview-section]'):null;if(!target)return;
  const next=target.dataset.previewSection;if(next!=='services'&&next!=='about'&&next!=='contact')return;
  previewSection=next;renderPreview();const button=preview.querySelector<HTMLButtonElement>(`[data-preview-section="${next}"]`);button?.focus({preventScroll:true});
 },{signal});
 finish.addEventListener('click',()=>{markComplete();done.focus({preventScroll:true});},{signal});
 done.addEventListener('click',()=>{if(completed)onDone?.();},{signal});
 order.addEventListener('click',()=>{markComplete();onOrder?.({...selection});},{signal});
 resetButton.addEventListener('click',()=>{reset();business.focus({preventScroll:true});},{signal});
 function reset(){
  if(destroyed)return;selection={...defaultDesign};previewSection='home';completed=false;done.disabled=true;finish.disabled=false;business.value=selection.business;
  for(const input of styleChoices.querySelectorAll<HTMLInputElement>('input'))input.checked=input.value===selection.style;
  renderPalettes();renderPreview();puzzle?.reset();feedback.textContent='Выбор сброшен. Собери другой вариант.';
 }
 if(businessOptions.some(v=>v.id===initial.business))selection.business=initial.business as BusinessKind;
 if(styleOptions.some(v=>v.id===initial.style))selection.style=initial.style as DesignStyle;
 selection.palette=paletteOptions.find(v=>v.id===initial.palette&&v.style===selection.style)?.id??paletteOptions.find(v=>v.style===selection.style)!.id;
 business.value=selection.business;for(const input of styleChoices.querySelectorAll<HTMLInputElement>('input'))input.checked=input.value===selection.style;
 renderPalettes();renderPreview();if(initial.mode==='puzzle')activateMode('puzzle');if(initial.completed===true)markComplete();
 return{reset,snapshot:()=>({...selection,mode,completed,pieces:puzzle?.snapshot()??[]}),destroy(){if(destroyed)return;destroyed=true;abort.abort();puzzle?.destroy();root.remove();}};
}
