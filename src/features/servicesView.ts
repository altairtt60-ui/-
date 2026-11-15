import './servicesView.css';
import type {OrderDraft,SiteKind} from '../content/commerceTypes';
import {serviceOffers,projectFeatures,calculateQuote,formatMoney} from '../content/commerce';

export interface ServicesOptions {onOrder(draft:OrderDraft):void}
export interface ServicesHandle {destroy():void}
function el<K extends keyof HTMLElementTagNameMap>(tag:K,className?:string,text?:string){const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;}
let number=0;
export function mountServices(host:HTMLElement,options:ServicesOptions):ServicesHandle{
 const abort=new AbortController(),{signal}=abort,id=++number;
 const root=el('section','services-workbench');root.dataset.services='';root.append(el('p','panel-lead','Выберите задачу. Стоимость и сроки согласуем после обсуждения деталей.'));
 const list=el('div','services-grid');
 for(const offer of serviceOffers){
  const article=el('article','service-offer');article.dataset.service=offer.id;
  const heading=el('h3','',offer.title),audience=el('p','service-offer__audience',offer.audience),problem=el('p','service-offer__problem',offer.problem),items=el('ul','service-offer__includes');for(const line of offer.includes)items.append(el('li','',line));
  const basePrice=calculateQuote(offer.id,[]);
  const terms=el('dl','service-offer__terms'),priceRow=el('div'),timeRow=el('div');priceRow.append(el('dt','','Стоимость'),el('dd','',basePrice===null?'По запросу':formatMoney(basePrice)));timeRow.append(el('dt','','Сроки'),el('dd','',offer.leadTime?.trim()||'После обсуждения задачи'));terms.append(priceRow,timeRow);
  const order=el('button','console-button','Обсудить этот сайт');order.type='button';order.dataset.serviceOrder=offer.id;order.addEventListener('click',()=>options.onOrder({siteType:offer.id}),{signal});
  article.append(heading,audience,problem,items,terms,order);list.append(article);
 }
 root.append(list);
 const calculator=el('section','quote-workbench');calculator.dataset.quoteCalculator='';const title=el('h3','','Соберите состав проекта');title.id=`quote-title-${id}`;calculator.setAttribute('aria-labelledby',title.id);
 calculator.append(title,el('p','quote-workbench__note','Выберите тип сайта и дополнительные возможности. Числовой расчёт появится только для согласованных в конфигурации цен.'));
 const label=el('label','quote-workbench__label','Тип сайта'),select=el('select');select.id=`quote-site-${id}`;label.htmlFor=select.id;select.name='quote-site';for(const offer of serviceOffers)select.append(new Option(offer.title,offer.id));
 const extras=el('fieldset','quote-workbench__features');extras.append(el('legend','','Дополнительные возможности'));
 for(const feature of projectFeatures){const row=el('label','quote-workbench__check'),input=el('input');input.type='checkbox';input.name='quote-features';input.value=feature.id;row.append(input,el('span','',feature.label));extras.append(row);}
 const result=el('p','quote-workbench__result');result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.dataset.quoteResult='';const summary=el('p','quote-workbench__summary');summary.dataset.quoteSummary='';
 const order=el('button','console-button','Обсудить этот состав');order.type='button';order.dataset.action='order-quote';
 function draft():OrderDraft{return{siteType:select.value as SiteKind,features:[...extras.querySelectorAll<HTMLInputElement>('input:checked')].map(input=>input.value)};}
 function update(){const d=draft(),total=calculateQuote(d.siteType,d.features??[]);result.textContent=total===null?'Индивидуальный расчёт':`Ориентировочная стоимость: ${formatMoney(total)}`;summary.textContent=total===null?'Цены ещё не согласованы. Передадим выбранный состав в заявку, чтобы обсудить стоимость и сроки.':'Это расчёт по согласованным базовым ценам. Финальный объём подтвердим после обсуждения.';}
 select.addEventListener('change',update,{signal});extras.addEventListener('change',update,{signal});order.addEventListener('click',()=>options.onOrder(draft()),{signal});calculator.append(label,select,extras,result,summary,order);root.append(calculator);host.append(root);update();
 return{destroy(){abort.abort();root.remove();}};
}
