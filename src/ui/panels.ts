import {findProject,mountPortfolio,mountProjectDetail} from '../features/portfolio';
import type {PortfolioHandle} from '../features/portfolio';
import {mountOrderForm} from '../features/orderForm';
import {mountServices} from '../features/servicesView';
import type {OrderDraft} from '../content/commerceTypes';

export type PanelKind='projects'|'services'|'contact'|'portfolio';
export interface PanelOptions{projectId?:string;onLibrary?:()=>void;draft?:OrderDraft;onOrderDraftChange?:(draft:OrderDraft)=>void}
let panel:HTMLDialogElement|null=null;
let sequence=0;
function el<K extends keyof HTMLElementTagNameMap>(tag:K,className?:string,text?:string){const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;}

/** Catalogue, service selection and a local brief stay inside one accessible modal. */
export function openPanel(kind:PanelKind,onClose:()=>void,options:PanelOptions={}):void{
 if(panel?.open)return;
 const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
 const dialog=el('dialog',`factory-dialog panel-${kind}`);dialog.dataset.panel=kind;panel=dialog;
 const titleId=`panel-title-${++sequence}`;dialog.setAttribute('aria-labelledby',titleId);
 const headings={projects:'Библиотека проектов',services:'Услуги для вашего сайта',contact:'Обсудить проект',portfolio:'Altweb Design'};
 const header=el('header','dialog-heading'),title=el('h2','',headings[kind]);title.id=titleId;
 const close=el('button','dialog-close','×');close.type='button';close.setAttribute('aria-label','Закрыть окно');close.title='Закрыть (Esc)';close.autofocus=true;header.append(title,close);
 const body=el('div','dialog-body'),nav=el('nav','portfolio-mode-nav');nav.setAttribute('aria-label','Разделы портфолио');
 const view=el('div','portfolio-mode-view');body.append(nav,view);
 let catalogue:PortfolioHandle|undefined,feature:{destroy():void}|undefined;
 let current:'projects'|'services'|'contact'=kind==='portfolio'?'projects':kind;
 let draft:OrderDraft={...options.draft};let libraryAfterClose=false,catalogueScroll=0,selectedProject:string|undefined,detailOpen=false;
 const catalogueContent=document.createDocumentFragment();
 const buttons=new Map<string,HTMLButtonElement>();
 for(const [section,label]of [['projects','Проекты'],['services','Услуги'],['contact','Заказать сайт']] as const){const b=el('button','',label);b.type='button';b.dataset.panelSection=section;b.addEventListener('click',()=>renderSection(section));nav.append(b);buttons.set(section,b);}
 function updateDraft(value:OrderDraft){draft={...draft,...value};options.onOrderDraftChange?.({...draft});}
 function clearView(){catalogue?.destroy();catalogue=undefined;feature?.destroy();feature=undefined;catalogueContent.replaceChildren();view.replaceChildren();detailOpen=false;}
 function goToLibrary(){if(!options.onLibrary)return;libraryAfterClose=true;dialog.close();}
 function showProject(id:string){
  const project=findProject(id);if(!project||detailOpen)return;
  selectedProject=id;catalogueScroll=dialog.scrollTop;while(view.firstChild)catalogueContent.append(view.firstChild);
  detailOpen=true;title.textContent=project.name;mountProjectDetail(view,project,showCatalogue);dialog.scrollTop=0;view.querySelector<HTMLButtonElement>('[data-action="catalogue-back"]')?.focus({preventScroll:true});
 }
 function showCatalogue(){if(!detailOpen)return;view.replaceChildren(catalogueContent);title.textContent=kind==='portfolio'?'Altweb Design':headings.projects;detailOpen=false;dialog.scrollTop=catalogueScroll;if(selectedProject)catalogue?.focusProject(selectedProject);}
 function renderSection(section:'projects'|'services'|'contact',order?:OrderDraft){
  if(order)updateDraft(order);clearView();current=section;
  dialog.className=`factory-dialog panel-${kind==='portfolio'?'portfolio':section}`;dialog.dataset.panel=kind==='portfolio'?'portfolio':section;
  title.textContent=kind==='portfolio'&&section==='projects'?'Altweb Design':headings[section];
  buttons.forEach((b,key)=>b.setAttribute('aria-pressed',String(key===section)));
  if(section==='projects')catalogue=mountPortfolio(view,{onSelect:showProject,onLibrary:options.onLibrary?goToLibrary:undefined});
  if(section==='services')feature=mountServices(view,{onOrder(value){renderSection('contact',value);view.querySelector<HTMLElement>('input,select,textarea')?.focus({preventScroll:true});}});
  if(section==='contact')feature=mountOrderForm(view,{draft,onChange:updateDraft});
  dialog.scrollTop=0;
 }
 renderSection(current);
 dialog.append(header,body);
 const footer=el('footer','dialog-footer'),back=el('button','console-button','Вернуться на фабрику');back.type='button';footer.append(back,el('span','escape-hint','Esc — закрыть'));dialog.append(footer);document.body.append(dialog);
 let closed=false;
 function cleanup(){if(closed)return;closed=true;clearView();dialog.remove();if(panel===dialog)panel=null;onClose();if(previous?.isConnected)previous.focus({preventScroll:true});if(libraryAfterClose)options.onLibrary?.();}
 dialog.addEventListener('close',cleanup,{once:true});close.addEventListener('click',()=>dialog.close());back.addEventListener('click',()=>dialog.close());
 const outside=(event:MouseEvent|PointerEvent)=>{const rect=dialog.getBoundingClientRect();return event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom);};
 let backdropDown=false;dialog.addEventListener('pointerdown',event=>{backdropDown=outside(event)});dialog.addEventListener('click',event=>{if(backdropDown&&outside(event))dialog.close()});
 dialog.showModal();if(options.projectId&&(kind==='projects'||kind==='portfolio'))showProject(options.projectId);
}
