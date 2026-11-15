export const WORLD_WIDTH=11200, WORLD_HEIGHT=900, GROUND=720;
export const zones=[
 {id:'entry',name:'Входной цех',start:0,end:1000,entry:320},
 {id:'design',name:'Дизайн-ателье',start:1000,end:2500,entry:1450},
 {id:'backend',name:'Цех разработки',start:2500,end:5000,entry:3350},
 {id:'qa',name:'Лаборатория QA',start:5000,end:7000,entry:5630},
 {id:'library',name:'Библиотека проектов',start:7000,end:10000,entry:7310},
 {id:'dispatch',name:'Бюро связи',start:10000,end:11200,entry:10500},
] as const;
export type ZoneId=typeof zones[number]['id'];
export const stations=[
 {id:'design-station',kind:'design',x:1450,y:720,radius:170,label:'Собрать интерфейс'},
 {id:'backend-station',kind:'backend',x:3350,y:720,radius:170,label:'Подключить сервер'},
 {id:'qa-station',kind:'qa',x:5630,y:720,radius:170,label:'Найти ошибки'},
] as const;
export type TaskKind=typeof stations[number]['kind'];
export const platforms=[
 {x:390,y:598,w:200},{x:650,y:478,w:220},
 {x:1700,y:585,w:220},{x:1940,y:460,w:400},
 {x:2760,y:595,w:250},{x:3050,y:470,w:270},{x:3410,y:525,w:530},
 {x:4170,y:590,w:170},{x:4400,y:455,w:380},
 {x:5160,y:590,w:210},{x:5430,y:460,w:340},{x:6260,y:525,w:520},
 {x:9430,y:590,w:220},{x:9670,y:460,w:220},{x:9270,y:271,w:620},
];
export const lifts=[
 {id:'dev-lift',x:3970,w:125,bottom:720,top:525,period:10500},
 {id:'qa-lift',x:6100,w:125,bottom:720,top:525,period:12000},
 {id:'library-lift',x:9650,w:125,bottom:720,top:271,period:14000},
];
export const npcWorkers=[
 {id:'mechanic',role:'mechanic',x:620,y:720,task:'настраивает привод',line:'Конвейер запущен!',phase:0},
 {id:'designer',role:'designer',x:1310,y:720,task:'рисует интерфейс',line:'Начнём с главного блока.',phase:700},
 {id:'layout',role:'designer',x:2120,y:460,task:'собирает компоненты',line:'Сетка на месте.',phase:2300},
 {id:'palette',role:'palette',x:2220,y:720,task:'подбирает цвета',line:'Тёплый акцент — сюда.',phase:4100},
 {id:'coder',role:'coder',x:2960,y:720,task:'пишет TypeScript',line:'API подключён!',phase:900},
 {id:'reviewer',role:'coder',x:3650,y:525,task:'проверяет код',line:'Проверяю ответ сервера…',phase:3200},
 {id:'cable',role:'engineer',x:4070,y:720,task:'подключает кабель',line:'Сигнал есть.',phase:5100},
 {id:'courier',role:'courier',x:4650,y:720,task:'переносит модуль',line:'Сборка готова.',phase:1700},
 {id:'inspector',role:'qa',x:5350,y:720,task:'запускает сканер',line:'Проверка началась.',phase:2800},
 {id:'finder',role:'qa',x:5880,y:720,task:'исправляет ошибку',line:'Нашёл. Исправляю!',phase:4500},
 {id:'retest',role:'qa',x:6500,y:525,task:'проверяет повторно',line:'Повторный тест пройден.',phase:6500},
 {id:'archive-courier',role:'courier',x:7480,y:720,task:'несёт проект',line:'Новый экран в коллекции.',phase:3300},
 {id:'curator',role:'archivist',x:8040,y:720,task:'сравнивает сайты',line:'Здесь можно открыть каждый сайт.',phase:5300},
 {id:'sorter',role:'archivist',x:8650,y:720,task:'раскладывает проекты',line:'Концепты подписаны честно.',phase:1100},
 {id:'lift-operator',role:'engineer',x:9370,y:271,task:'отправляет экран на полку',line:'Бережно, это портфолио.',phase:7200},
 {id:'dispatcher',role:'archivist',x:10380,y:720,task:'собирает бриф',line:'Идея записана. Обсудим детали?',phase:5900},
 {id:'guide',role:'archivist',x:925,y:720,task:'помогает гостям',line:'Привет! Показать работы или маршрут?',phase:2700},
] as const;

export const contactDesk={id:'contact-desk',x:10500,y:720,radius:190,label:'Связаться со студией'} as const;
