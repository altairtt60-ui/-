import type {BusinessKind,DesignStyle} from './commerceTypes';
export const businessOptions:ReadonlyArray<{id:BusinessKind;label:string;headline:string;action:string}>=[
 {id:'auto',label:'Автосервис',headline:'Вернём машине уверенный ход',action:'Записаться на сервис'},
 {id:'beauty',label:'Салон красоты',headline:'Время для вашего образа',action:'Выбрать процедуру'},
 {id:'cafe',label:'Кафе',headline:'Хороший день начинается здесь',action:'Посмотреть меню'},
 {id:'shop',label:'Интернет-магазин',headline:'Вещи, которые хочется оставить',action:'Открыть каталог'},
 {id:'service',label:'Услуги для бизнеса',headline:'Решаем задачу вашего бизнеса',action:'Обсудить задачу'},
];
export const styleOptions:ReadonlyArray<{id:DesignStyle;label:string}>=[{id:'minimal',label:'Minimal'},{id:'modern',label:'Modern'},{id:'dark-premium',label:'Dark Premium'}];
export const paletteOptions=[
 {id:'minimal-sage',style:'minimal',label:'Шалфей',background:'#f2f1e9',surface:'#d6e1d3',ink:'#263d32',accent:'#446d55',accentInk:'#ffffff'},
 {id:'minimal-ink',style:'minimal',label:'Чернила',background:'#f3f1e9',surface:'#e1dfd7',ink:'#262934',accent:'#3c4a66',accentInk:'#ffffff'},
 {id:'minimal-clay',style:'minimal',label:'Тёплая глина',background:'#f5ede1',surface:'#e6d3bf',ink:'#523e32',accent:'#946345',accentInk:'#ffffff'},
 {id:'modern-berry',style:'modern',label:'Ягодный',background:'#f5e9ef',surface:'#e7bed4',ink:'#432d40',accent:'#9a437b',accentInk:'#ffffff'},
 {id:'modern-ocean',style:'modern',label:'Морской',background:'#e9f3f1',surface:'#b1d8ce',ink:'#244540',accent:'#28786e',accentInk:'#ffffff'},
 {id:'modern-sun',style:'modern',label:'Солнечный',background:'#f6efdc',surface:'#ead38e',ink:'#4d4323',accent:'#8a621a',accentInk:'#ffffff'},
 {id:'dark-copper',style:'dark-premium',label:'Медь',background:'#191f23',surface:'#293336',ink:'#f0e4d1',accent:'#e4aa6b',accentInk:'#252625'},
 {id:'dark-mint',style:'dark-premium',label:'Мята',background:'#122529',surface:'#203c3f',ink:'#e5efe6',accent:'#86d5bc',accentInk:'#153b33'},
 {id:'dark-lilac',style:'dark-premium',label:'Лиловый',background:'#231f2c',surface:'#3b3246',ink:'#f0e7ef',accent:'#d3accd',accentInk:'#3e2d3d'},
] as const;
export const defaultDesign={business:'auto',style:'minimal',palette:'minimal-sage'} as const;
