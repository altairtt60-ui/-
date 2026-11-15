import './orderForm.css';
import type {OrderDraft,SiteKind,BusinessKind} from '../content/commerceTypes';
import {businessOptions,styleOptions,paletteOptions} from '../content/designOptions';
import {commerce,serviceOffers,projectFeatures,normalizeDraft,buildOrderMessage,whatsappLink} from '../content/commerce';

export interface OrderFormOptions {draft?:OrderDraft;onChange?(draft:OrderDraft):void}
export interface OrderFormHandle {destroy():void}
function el<K extends keyof HTMLElementTagNameMap>(tag:K,className?:string,text?:string){const n=document.createElement(tag);if(className)n.className=className;if(text)n.textContent=text;return n;}
let formNumber=0;
/** Prepares a local message. Navigation/copy is explicit; no order is submitted or persisted. */
export function mountOrderForm(host:HTMLElement,options:OrderFormOptions={}):OrderFormHandle{
 const abort=new AbortController(),{signal}=abort,number=++formNumber;
 let draft=normalizeDraft(options.draft),destroyed=false,prepared=false;
 const root=el('section','order-workbench');root.dataset.orderForm='';
 root.append(el('p','panel-lead','Расскажите о задаче — подготовим текст для обсуждения.'));
 const form=el('form','order-form');form.setAttribute('aria-label','Подготовка заявки на сайт');
 const fields=el('div','order-form__fields');
 function field(label:string,node:HTMLElement,id:string){const wrap=el('div','order-form__field'),title=el('label','',label);node.id=`order-${number}-${id}`;title.htmlFor=node.id;wrap.append(title,node);fields.append(wrap);return wrap;}
 const site=el('select');site.name='siteType';site.required=true;site.append(new Option('Выберите тип сайта',''));for(const item of serviceOffers)site.append(new Option(item.title,item.id));site.value=draft.siteType??'';field('Какой сайт нужен',site,'site');
 const name=el('input');name.name='businessName';name.type='text';name.required=true;name.minLength=2;name.maxLength=120;name.autocomplete='organization';name.placeholder='Например, название вашей мастерской';name.value=draft.businessName??'';field('Название бизнеса',name,'name');
 const business=el('select');business.name='business';business.append(new Option('Можно не выбирать',''));for(const item of businessOptions)business.append(new Option(item.label,item.id));business.value=draft.business??'';field('Сфера бизнеса',business,'business');
 const designSummary=el('p','order-form__design');designSummary.dataset.orderDesign='';
 const style=styleOptions.find(item=>item.id===draft.style),palette=paletteOptions.find(item=>item.id===draft.palette);
 designSummary.textContent=style?`Из ателье: ${style.label}${palette?`, палитра «${palette.label}»`:''}.`:'Стиль и цвета можно обсудить или выбрать в дизайн-ателье.';fields.append(designSummary);
 const features=el('fieldset','order-form__features');features.append(el('legend','','Что добавить'));
 for(const item of projectFeatures){const label=el('label','order-form__check'),input=el('input');input.type='checkbox';input.name='features';input.value=item.id;input.checked=draft.features?.includes(item.id)??false;label.append(input,el('span','',item.label));features.append(label);}fields.append(features);
 const notes=el('textarea');notes.name='notes';notes.rows=4;notes.maxLength=2000;notes.placeholder='Что должен делать сайт, какие есть пожелания?';notes.value=draft.notes??'';field('Коротко о задаче',notes,'notes');
 const contact=el('select');contact.name='contactMethod';contact.append(new Option('Instagram','instagram'));const wa=whatsappLink('');if(wa)contact.append(new Option('WhatsApp','whatsapp'));contact.value=draft.contactMethod==='whatsapp'&&wa?'whatsapp':'instagram';field('Где обсудить задачу',contact,'contact');
 if(!wa)fields.append(el('p','order-form__note','WhatsApp студии пока не указан. Можно скопировать заявку и отправить её в Instagram.'));
 const prepare=el('button','console-button order-form__prepare','Подготовить заявку');prepare.type='submit';prepare.dataset.action='prepare-order';fields.append(prepare);
 const preview=el('section','order-form__preview');preview.setAttribute('aria-label','Текст заявки');preview.append(el('h3','','Текст для обсуждения'));
 const message=el('textarea','order-form__message');message.readOnly=true;message.rows=11;message.setAttribute('aria-label','Подготовленный текст заявки');message.dataset.orderMessage='';
 const actions=el('div','order-form__actions');actions.hidden=true;
 const copy=el('button','console-button','Скопировать текст');copy.type='button';copy.dataset.action='copy-order';
 const instagram=el('a','console-button','Открыть Instagram');instagram.href=commerce.instagram;instagram.target='_blank';instagram.rel='noopener noreferrer';instagram.dataset.action='open-instagram';
 const whatsapp=el('a','console-button','Открыть WhatsApp');whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';whatsapp.dataset.action='open-whatsapp';whatsapp.hidden=true;
 const status=el('p','order-form__status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 const explanation=el('p','order-form__note','Это черновик сообщения. Ничего не отправлено: откройте выбранный канал и отправьте текст самостоятельно.');
 actions.append(copy,instagram,whatsapp);preview.append(message,actions,status,explanation);form.append(fields,preview);root.append(form);host.append(root);
 function collect():OrderDraft{return normalizeDraft({...draft,siteType:site.value as SiteKind,businessName:name.value,business:business.value as BusinessKind,notes:notes.value,features:[...features.querySelectorAll<HTMLInputElement>('input:checked')].map(i=>i.value),contactMethod:contact.value as 'instagram'|'whatsapp'});}
 function update(){if(destroyed)return;draft=collect();name.setCustomValidity('');message.value=buildOrderMessage(draft);options.onChange?.({...draft,features:[...(draft.features??[])]});if(prepared){prepared=false;actions.hidden=true;status.textContent='Параметры изменились. Подготовьте обновлённую заявку.';}}
 form.addEventListener('input',update,{signal});form.addEventListener('change',update,{signal});
 form.addEventListener('submit',event=>{
  event.preventDefault();name.setCustomValidity(name.value.trim().length<2?'Введите название бизнеса, минимум два символа.':'');if(!form.reportValidity())return;
  draft=collect();message.value=buildOrderMessage(draft);options.onChange?.({...draft});prepared=true;actions.hidden=false;
  const url=whatsappLink(message.value);whatsapp.hidden=!(url&&contact.value==='whatsapp');if(url)whatsapp.href=url;else whatsapp.removeAttribute('href');instagram.hidden=contact.value==='whatsapp'&&!!url;
  document.dispatchEvent(new CustomEvent('altweb:engagement',{detail:{name:'brief_prepared'}}));
  status.textContent='Текст подготовлен. Скопируйте его и откройте выбранный канал.';message.focus();
 },{signal});
 copy.addEventListener('click',async()=>{
  if(!prepared)return;
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(message.value);if(destroyed)return;status.textContent='Текст скопирован. Отправьте его студии в выбранном канале.';}
  catch{if(destroyed)return;message.focus();message.select();status.textContent='Браузер не разрешил копирование. Текст выделен: скопируйте его вручную.';}
 },{signal});
 message.value=buildOrderMessage(draft);
 return{destroy(){if(destroyed)return;destroyed=true;abort.abort();root.remove();}};
}
