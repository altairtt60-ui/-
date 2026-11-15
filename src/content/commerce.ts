import type {OrderDraft,SiteKind} from './commerceTypes';
import {businessOptions,paletteOptions,styleOptions} from './designOptions';

export interface ServiceOffer {id:SiteKind;title:string;audience:string;problem:string;includes:readonly string[];price:number|null;leadTime:string|null}
export interface ProjectFeature {id:string;label:string;price:number|null}
/** Set only owner-approved amounts/timelines and the studio's real international WhatsApp number here. */
export const commerce={currency:'KZT',whatsappNumber:'',instagram:'https://www.instagram.com/altweb.design/',instagramLabel:'@altweb.design'};
export const serviceOffers:readonly ServiceOffer[]=[
 {id:'landing',title:'Лендинг',audience:'Для одной услуги, продукта или кампании',problem:'Помогает объяснить предложение и привести посетителя к обращению.',includes:['Структура одной страницы','Адаптивный дизайн','Понятный контактный сценарий'],price:null,leadTime:null},
 {id:'business-card',title:'Сайт-визитка',audience:'Для специалиста или небольшого бизнеса',problem:'Собирает услуги, примеры и контакты в одном месте.',includes:['Основная информация о бизнесе','Услуги и примеры работ','Контакты и мобильная версия'],price:null,leadTime:null},
 {id:'corporate',title:'Корпоративный сайт',audience:'Для компании с несколькими направлениями',problem:'Помогает рассказать о компании и разложить предложения по разделам.',includes:['Многостраничная структура','Страницы направлений','Адаптивная навигация'],price:null,leadTime:null},
 {id:'catalogue',title:'Каталог товаров',audience:'Для бизнеса с ассортиментом',problem:'Помогает показать товары и подготовить посетителя к запросу.',includes:['Структура категорий','Карточки товаров','Сценарий запроса по товару'],price:null,leadTime:null},
 {id:'design',title:'Веб-дизайн',audience:'Для нового сайта или обновления интерфейса',problem:'Превращает задачу бизнеса в понятный визуальный макет.',includes:['Структура экранов','Палитра и типографика','Макеты для телефона и компьютера'],price:null,leadTime:null},
 {id:'improve',title:'Доработка существующего сайта',audience:'Для сайта, которому нужны изменения',problem:'Помогает улучшить отдельные страницы, адаптацию или сценарий обращения.',includes:['Разбор текущей задачи','Согласованный список изменений','Проверка изменённых сценариев'],price:null,leadTime:null},
];
export const projectFeatures:readonly ProjectFeature[]=[
 {id:'service-catalogue',label:'Каталог услуг или товаров',price:null},
 {id:'booking',label:'Сценарий записи или заявки',price:null},
 {id:'languages',label:'Дополнительный язык',price:null},
 {id:'analytics',label:'Подключение аналитики',price:null},
 {id:'whatsapp-button',label:'Кнопка WhatsApp на сайте',price:null},
];
const approved=(value:number|null|undefined):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
export function calculateQuote(siteType:SiteKind|undefined,featureIds:readonly string[],offers:readonly ServiceOffer[]=serviceOffers,features:readonly ProjectFeature[]=projectFeatures):number|null{
 const service=offers.find(item=>item.id===siteType);if(!service||!approved(service.price))return null;
 let total=Math.round(service.price*100);
 for(const id of new Set(featureIds)){const feature=features.find(item=>item.id===id);if(!feature||!approved(feature.price))return null;total+=Math.round(feature.price*100);}
 return Number.isSafeInteger(total)?total/100:null;
}
export function formatMoney(value:number):string{return new Intl.NumberFormat('ru-RU',{style:'currency',currency:commerce.currency,minimumFractionDigits:0,maximumFractionDigits:2}).format(value);}
const clean=(value:unknown,max:number,multiline=false)=>typeof value==='string'?value.replace(multiline?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g:/[\u0000-\u001f\u007f]/g,' ').slice(0,max).trim():'';
export function normalizeDraft(input:OrderDraft={}):OrderDraft{
 const draft:OrderDraft={};
 if(serviceOffers.some(item=>item.id===input.siteType))draft.siteType=input.siteType;
 if(businessOptions.some(item=>item.id===input.business))draft.business=input.business;
 if(styleOptions.some(item=>item.id===input.style))draft.style=input.style;
 const palette=paletteOptions.find(item=>item.id===input.palette);
 if(palette&&(!draft.style||palette.style===draft.style)){draft.palette=palette.id;draft.style=palette.style;}
 draft.businessName=clean(input.businessName,120);draft.notes=clean(input.notes,2000,true);
 draft.features=Array.isArray(input.features)?[...new Set(input.features.filter(id=>projectFeatures.some(item=>item.id===id)))]:[];
 draft.contactMethod=input.contactMethod==='whatsapp'?'whatsapp':'instagram';
 return draft;
}
export function buildOrderMessage(input:OrderDraft):string{
 const draft=normalizeDraft(input),service=serviceOffers.find(item=>item.id===draft.siteType),business=businessOptions.find(item=>item.id===draft.business),style=styleOptions.find(item=>item.id===draft.style),palette=paletteOptions.find(item=>item.id===draft.palette);
 const lines=['Здравствуйте! Хочу обсудить создание сайта.'];
 if(draft.businessName)lines.push(`Бизнес: ${draft.businessName}.`);
 if(service)lines.push(`Тип сайта: ${service.title}.`);
 if(business)lines.push(`Сфера: ${business.label}.`);
 if(style)lines.push(`Стиль: ${style.label}.`);
 if(palette)lines.push(`Палитра: ${palette.label}.`);
 const features=(draft.features??[]).map(id=>projectFeatures.find(item=>item.id===id)!.label);
 if(features.length)lines.push(`Дополнительные возможности: ${features.join(', ')}.`);
 if(draft.notes)lines.push(`Пожелания: ${draft.notes}`);
 lines.push('','Хотелось бы обсудить стоимость и сроки.');return lines.join('\n');
}
export function whatsappLink(message:string,number=commerce.whatsappNumber):string|undefined{
 if(!/^\+?[\d ()-]+$/.test(number))return undefined;
 const digits=number.replace(/\D/g,'');if(!/^[1-9]\d{7,14}$/.test(digits))return undefined;
 return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
