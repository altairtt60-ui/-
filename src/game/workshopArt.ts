import {createGlow,glowTexture} from './lights';
import Phaser from 'phaser';
import {lifts} from '../content/world';
import {workCycle,type WorkerId} from './workCycle';

const FONT='Arial, sans-serif';
type Cycle=ReturnType<typeof workCycle>;
interface Loop{x:number;update(time:number):void}

/** Equipment and its operator use the same task clock, including offscreen resume. */
export function buildWorkshops(scene:Phaser.Scene):{update(time:number,delta:number):void}{
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const loops:Loop[]=[];
 const g=scene.add.graphics().setDepth(-13);
 const text=(x:number,y:number,value:string,size=14,color='#b3d8d0')=>scene.add.text(x,y,value,{fontFamily:FONT,fontSize:`${size}px`,color}).setDepth(-2);
 const img=(key:string,x:number,y:number,depth=-12)=>scene.add.image(x,y,key).setOrigin(0).setDepth(depth);
 const bind=(id:WorkerId,x:number,render:(c:Cycle,p:number)=>void)=>loops.push({x,update(time){const c=workCycle(id,time);render(c,motion.matches?1:Phaser.Math.Easing.Cubic.InOut(c.stageProgress));}});
 const label=(x:number,y:number,value:string,color:string)=>{
  g.fillStyle(0x102c35).lineStyle(3,0x688178).fillRoundedRect(x-13,y-10,value.length*12+28,42,6).strokeRoundedRect(x-13,y-10,value.length*12+28,42,6);text(x,y,value,21,color);
 };
 const screen=(x:number,y:number,w:number,h:number,title:string)=>{
  g.fillStyle(0x102935).lineStyle(6,0x4d7073).fillRoundedRect(x,y,w,h,12).strokeRoundedRect(x,y,w,h,12);
  g.fillStyle(0x081e2b).fillRoundedRect(x+11,y+10,w-22,h-22,5).lineStyle(1,0x36565d).lineBetween(x+16,y+43,x+w-16,y+43);
  return text(x+17,y+16,title,12,'#8eaaa6');
 };
 const console=(x:number,y:number)=>img('work-console',x,y,-7);
 const cursor=()=>{const c=scene.add.graphics().setDepth(1);c.fillStyle(0xf3dfbc).lineStyle(1.5,0x243e46).beginPath().moveTo(0,0).lineTo(2,16).lineTo(7,12).lineTo(11,19).lineTo(15,17).lineTo(11,10).lineTo(17,9).closePath().fillPath().strokePath();return c;};
 const cable=(points:number[])=>{for(const [width,color]of [[7,0x102530],[3,0x678780]]){g.lineStyle(width!,color!).beginPath().moveTo(points[0]!,points[1]!);for(let i=2;i<points.length;i+=2)g.lineTo(points[i]!,points[i+1]!);g.strokePath();}};

 // Entry: a physical valve, pressure gauge and motor answer the mechanic's wrench.
 const valve=scene.add.graphics().setDepth(-2).setPosition(668,655);
 valve.lineStyle(3,0xd4b478).strokeCircle(0,0,15).lineBetween(-14,0,14,0).lineBetween(0,-14,0,14).fillStyle(0x667b71).fillCircle(0,0,4);
 cable([668,655,686,655,686,615,705,615]);
 const drive=scene.add.graphics().setDepth(-2);
 const driveState=text(706,585,'Настройка привода',10,'#c5d2ad');
 bind('mechanic',710,(c,p)=>{
  const pressure=c.stage===0?.24:c.stage===1?.24+p*.58:.82;
  valve.rotation=motion.matches?0:c.stage===1?p*Math.PI*1.8:0;
  drive.clear().fillStyle(0x132d35).fillRect(704,601,130,33).lineStyle(2,0x577b75).strokeRect(709,607,83,10).fillStyle(c.stage>=2?0x8fc99d:0xd3ad70).fillRect(711,609,79*pressure,6);
  for(let i=0;i<4;i++)drive.fillStyle(c.stage>=2?0x8fc99d:0x50675f).fillRect(801+i*7,608,4,8);
  driveState.setText(['Проверка привода','Настройка давления','Давление в норме','Конвейер включён'][c.stage]!);
 });

 // The designer moves actual text on a page, with a matching pen cursor on the tablet.
 label(1250,287,'Дизайн-ателье','#ebbad8');
 screen(1508,327,286,207,'Макет главного экрана');console(1408,540);
 cable([1640,534,1640,560,1570,560,1570,584]);
 const page=scene.add.graphics().setDepth(-3);
 page.fillStyle(0xe5dfcf).fillRoundedRect(1525,382,251,136,4).fillStyle(0x69516c).fillRect(1535,392,231,15)
  .fillStyle(0xd1bacd).fillRoundedRect(1535,418,231,60,3).fillStyle(0x77978c).fillTriangle(1665,478,1700,435,1766,478)
  .fillStyle(0xc8a162).fillCircle(1745,431,11).fillStyle(0xa05c88).fillRoundedRect(1535,489,231,19,3);
 text(1542,492,'Обсудить идею',10,'#fff0df');
 const headline=text(1544,427,'Сайты с характером',14,'#453349').setWordWrapWidth(133);
 const headlineBox=scene.add.rectangle(1540,424,151,37).setOrigin(0).setFillStyle(0,0).setStrokeStyle(1,0x9a578d).setDepth(0);
 const penCursor=cursor();const tablet=scene.add.graphics().setDepth(-3);
 tablet.fillStyle(0xc8b9c9).fillRoundedRect(1464,584,130,52,3).fillStyle(0xe3dccc).fillRect(1470,590,118,40).fillStyle(0xb18dad).fillRect(1474,595,110,10).fillStyle(0x758f83).fillRect(1535,611,49,14);
 const tabletText=scene.add.rectangle(1477,611,42,5,0x77516f).setOrigin(0).setDepth(-2);
 bind('designer',1510,(c,p)=>{
  const progress=c.stage===0?0:c.stage===1?p:1;
  headline.setPosition(1544+progress*31,427+progress*10);
  headlineBox.setPosition(headline.x-4,headline.y-3).setVisible(c.stage===1||c.stage===2);
  tabletText.x=1477+progress*12;penCursor.setPosition(headline.x+60,headline.y+12).setVisible(!motion.matches&&c.stage===1);
 });

 // The upper workstation edits typography, not a painted purple placeholder.
 screen(2010,230,310,190,'Редактор / текстовый блок');
 const layout=scene.add.graphics().setDepth(-3);
 layout.fillStyle(0xe4ddcf).fillRoundedRect(2025,282,280,124,3).fillStyle(0x815d83).fillRect(2037,292,66,4)
  .fillStyle(0xbeadc3).fillRoundedRect(2037,350,255,42,3).fillStyle(0x7c9c91).fillTriangle(2190,392,2251,359,2292,392);
 const title=text(2035,305,'Первый экран\nвашего сайта',13,'#4d3a55');
 const selection=scene.add.rectangle(2030,301,134,39).setOrigin(0).setFillStyle(0,0).setStrokeStyle(1.5,0x9b5485).setDepth(0);
 const layoutCursor=cursor();const layoutStatus=text(2028,398,'Выбор заголовка',11,'#cdb9cf');
 bind('layout',2130,(c,p)=>{
  const progress=c.stage===0?0:c.stage===1?p:1;
  title.setPosition(2035+progress*113,305-progress*7);selection.setPosition(title.x-4,title.y-3).setVisible(c.stage!==3);
  layoutCursor.setPosition(title.x+65,title.y+12).setVisible(!motion.matches&&c.stage===1);
  layoutStatus.setText(['Выбор заголовка','Перенос текста','Выравнивание по сетке','Положение сохранено'][c.stage]!);
 });

 // Palette: the selected swatch changes the actual site's background, hero and CTA.
 screen(2275,526,280,144,'Палитра сайта');
 g.fillStyle(0x34434a).lineStyle(3,0x718078).fillRoundedRect(2260,674,310,13,3).strokeRoundedRect(2260,674,310,13,3);
 g.lineStyle(8,0x2b4347).lineBetween(2280,688,2280,720).lineBetween(2540,688,2540,720);
 const themes=[{bg:0xf0e2d4,hero:0xd5b6d0,accent:0x9b4e80,ink:'#49314b'},{bg:0xe2eee2,hero:0x9dbfb0,accent:0x407966,ink:'#264f44'},{bg:0xe7e5dc,hero:0xc8af80,accent:0x9a683d,ink:'#57462e'}];
 const paletteSite=scene.add.graphics().setDepth(-3);const swatches=scene.add.graphics().setDepth(-2);
 const paletteTitle=text(2301,588,'Сайт вашей студии',12,'#49314b');
 const paletteCta=text(2447,631,'Обсудить',9,'#fff4dd');const paletteCursor=cursor();
 let previousTheme=-1;
 bind('palette',2350,(c,p)=>{
  const selected=c.cycle%themes.length,old=(selected+themes.length-1)%themes.length;
  const applied=c.stage>=2||c.stage===1&&c.stageProgress>.45;
  const index=applied?selected:old,t=themes[index]!;
  if(index!==previousTheme){previousTheme=index;paletteSite.clear().fillStyle(t.bg).fillRect(2290,574,250,80)
   .fillStyle(t.accent).fillRect(2298,581,22,3).fillRect(2470,581,59,3).fillStyle(t.hero).fillRoundedRect(2298,594,234,32,3)
   .fillStyle(t.accent).fillRoundedRect(2438,630,94,16,3).fillStyle(t.hero).fillRect(2301,635,98,3).fillRect(2301,642,74,3);paletteTitle.setColor(t.ink);}
  swatches.clear();for(let i=0;i<themes.length;i++){swatches.fillStyle(themes[i]!.accent).fillRoundedRect(2292+i*80,679,66,15,3);if(i===selected)swatches.lineStyle(2,c.stage>=2?0xa5d3b3:0xe2ca98).strokeRoundedRect(2289+i*80,676,72,21,4);}
  paletteCursor.setPosition(c.stage===0?2320+selected*80:Phaser.Math.Linear(2320+selected*80,2500,p),c.stage===0?682:Phaser.Math.Linear(682,635,p)).setVisible(!motion.matches&&c.stage<2);
  paletteCta.setText(c.stage===3?'Готово':'Обсудить');
 });
 createGlow(scene,2415,590,370,0xda92bf,-18,.25);

 // Development: keystrokes produce valid source; the neighbouring robot reviews files.
 label(2860,188,'Цех разработки','#aadfd8');img('compiler-core',3705,40,-23);
 for(const [x,y,s]of [[2645,290,.9],[2780,290,.9],[4250,293,.95],[4430,292,.95],[4620,275,1]] as const)img('server-cabinet',x,y,-18).setScale(s);
 console(2985,540);console(3235,540);console(3690,345);
 const filename=screen(2825,260,340,205,'routes/projects.ts');
 const source=scene.add.text(2844,315,'',{fontFamily:'monospace',fontSize:'13px',lineSpacing:6,color:'#a4d8bf'}).setDepth(-3);
 const codeStatus=text(2844,444,'Файл открыт',10,'#a0b7a7');
 const caret=scene.add.rectangle(2844,315,6,14,0xa9dcc5).setOrigin(0).setDepth(-2);
 const sources=[['type Project = { id: string };','export async function GET() {','  const items = await list();','  return Response.json(items);','}'].join('\n'),['type Card = { title: string };','export function label(c: Card) {','  return c.title.trim();','}'].join('\n')];
 const keyboard=text(3042,587,'',10,'#9dccb8');
 bind('coder',2970,(c)=>{
  const all=sources[c.cycle%2]!,count=c.stage===0?0:c.stage===1?Math.floor(all.length*(motion.matches?1:c.stageProgress)):all.length;
  filename.setText(c.cycle%2?'components/card.ts':'routes/projects.ts');source.setText(all.slice(0,count));
  const lines=all.slice(0,count).split('\n');caret.setPosition(2844+(lines.at(-1)?.length??0)*7.8,315+(lines.length-1)*21).setVisible(!motion.matches&&c.stage===1);
  codeStatus.setText(['Файл открыт','Редактирование…','TypeScript: OK','Модуль собран'][c.stage]!);keyboard.setText(['Выбор файла','Печать кода…','Сборка модуля','Передача сборки'][c.stage]!);
 });
 const responseTitle=screen(3340,269,358,197,'response.json');
 const response=text(3359,324,'',13,'#a4d8bf').setFontFamily('monospace').setLineSpacing(6);
 const rowFocus=scene.add.rectangle(3355,321,324,20,0x76b7a0,.13).setOrigin(0).setDepth(-2);
 const reviewerStatus=text(3359,444,'',10,'#a9cbb3');
 bind('reviewer',3540,(c,p)=>{
  responseTitle.setText(c.stage===0?'Выбор файла':c.stage===1?'response.json':'schema.ts');
  response.setText(c.stage<2?'{\n  "status": 200,\n  "projects": [\n    { "id": "altweb" }\n  ]\n}':'type Response = {\n  status: number;\n  projects: Project[];\n};');
  rowFocus.y=321+(c.stage===1?p*4:c.stage===2?p*2:0)*21;rowFocus.setVisible(c.stage===1||c.stage===2);
  reviewerStatus.setText(['Открываю ответ API','Сверяю поля ответа','Проверка типов: OK','Данные подтверждены'][c.stage]!);
 });
 const coreRows=text(3755,277,'',14,'#a1d8ca');text(3794,202,'{ }',55,'#94e4d7');
 const coreFill=scene.add.rectangle(3812,361,126,8,0x70cbbf).setDepth(-14);
 bind('coder',3812,(c,p)=>{coreFill.setScale(c.stage<2?.15+p*.65:1,1);coreRows.setText(c.stage>=2?'build: ready\napi: connected\nresponse: 200':'build: compiling\ntypes: checking\nresponse: waiting');});
 text(3747,392,'GET /api/projects',10,'#9dccb8');
 screen(3252,577,214,65,'');text(3269,595,'Запрос → ответ',16,'#8ed4c8');
 const network=scene.add.graphics().setDepth(-3);let lastCable=-1;
 bind('cable',4140,(c,p)=>{
  const bucket=c.stage===1?Math.floor(p*12):c.stage*20;if(bucket===lastCable)return;lastCable=bucket;
  const endY=c.stage===0?612:c.stage===1?Phaser.Math.Linear(612,558,p):558;
  network.clear().lineStyle(7,0x102530).beginPath().moveTo(4110,654).lineTo(4150,680).lineTo(4210,655).lineTo(4253,endY).strokePath()
   .lineStyle(3,c.stage>=2?0x7ed7bc:0x9a739e).beginPath().moveTo(4110,654).lineTo(4150,680).lineTo(4210,655).lineTo(4253,endY).strokePath()
   .fillStyle(c.stage>=2?0x8cdec0:0xbf9163).fillCircle(4260,555,6).fillStyle(0xc4c9ad).fillRoundedRect(4246,endY-5,15,10,2);
 });
 const receiver=scene.add.graphics().setDepth(-3);text(4683,570,'Приёмка модуля',11,'#a9cbb3');
 g.lineStyle(7,0x3c5559).lineBetween(4700,697,4700,720).lineBetween(4780,697,4780,720).fillStyle(0x294a52).fillRoundedRect(4685,688,115,11,3);
 bind('courier',4730,(c)=>{receiver.clear().lineStyle(2,0x6c9189).strokeRoundedRect(4702,635,58,49,5);if(c.stage===2&&c.stageProgress>.5||c.stage===3)receiver.fillStyle(0x976b9e).fillRoundedRect(4706,640,50,40,3).lineStyle(2,0xe3c0d6).strokeRoundedRect(4717,649,27,21,2);});
 createGlow(scene,3820,300,600,0x4fc6c7,-25,.25);

 // QA operators now own separate scan, repair and re-test stations.
 label(5250,246,'Лаборатория QA','#badfb0');img('diagnostic-chamber',5510,247,-16);
 console(5385,540);console(5878,540);console(6535,345);
 const qaPage=(graphics:Phaser.GameObjects.Graphics,x:number,y:number,w:number,h:number,fixed:boolean)=>{
  graphics.fillStyle(0xe0e4d1).fillRoundedRect(x,y,w,h,3).fillStyle(0x668e86).fillRect(x+8,y+7,w-16,8)
   .fillStyle(0xa4bca5).fillRect(x+8,y+23,w*.43,h-33).fillStyle(fixed?0x62967e:0xbe7771).fillRect(x+w*.55,y+23,w*.4,h-33);
 };
 screen(5245,388,220,143,'Сканер интерфейса');
 const scanSite=scene.add.graphics().setDepth(-3);const scanBeam=scene.add.rectangle(5262,442,186,2,0x98d6ba).setOrigin(0).setDepth(-1);
 const scanResult=text(5262,510,'',10,'#c9d7b5');
 bind('inspector',5350,(c,p)=>{scanSite.clear();qaPage(scanSite,5262,443,186,55,c.stage<2);scanBeam.y=443+p*54;scanBeam.setVisible(c.stage===1&&!motion.matches);scanResult.setText(['Экран принят','Сканирование…','Ошибка обнаружена','Замечание передано'][c.stage]!);});
 screen(5778,395,236,170,'Исправление интерфейса');
 const testPage=scene.add.graphics().setDepth(-3);const fixCursor=cursor();
 const qaState=text(5799,535,'',12,'#d8d2ac');
 const statusGlow=createGlow(scene,5795,470,620,0x94cda0,-7,.6);
 const strips=scene.add.graphics().setDepth(-14);
 bind('finder',5896,(c,p)=>{
  const fixed=c.stage>=2||c.stage===1&&c.stageProgress>.55,signal=fixed?0x8bce97:0xd08378;
  statusGlow.setTexture(glowTexture(scene,signal));strips.clear().lineStyle(5,signal,.85).lineBetween(5540,405,5540,590).lineBetween(6030,405,6030,590);
  testPage.clear();qaPage(testPage,5796,449,199,69,fixed);
  const buttonX=5916+(fixed?0:12*(1-p));testPage.fillStyle(fixed?0x4e856f:0xbb7c77).fillRoundedRect(buttonX,495,67,13,2);
  fixCursor.setPosition(buttonX+25,500).setVisible(!motion.matches&&c.stage===1);
  qaState.setText(['Замечание выбрано','Исправляю кнопку','Выравниваю макет','На повторный тест'][c.stage]!);
 });
 screen(6290,326,258,125,'Повторная проверка');
 const retestProgress=scene.add.graphics().setDepth(-3),report=text(6308,381,'',13,'#aed4b4');
 bind('retest',6430,(c,p)=>{
  report.setText(['Загружаю исправление','360 / 768 / 1280 px','Проверка ответа API','Все тесты пройдены'][c.stage]!);
  retestProgress.clear();for(let i=0;i<3;i++)retestProgress.fillStyle(c.stage>=2||c.stage===1&&p>i/3?0x86bc95:0x3e5b54).fillRoundedRect(6308+i*70,421,59,7,2);
  if(c.stage===3)retestProgress.lineStyle(3,0xa7ddb0).beginPath().moveTo(6499,398).lineTo(6505,404).lineTo(6518,388).strokePath();
 });
 createGlow(scene,5710,560,450,0xa2cf8b,-25,.2);

 const guides=scene.add.graphics().setDepth(-15);
 for(const lift of lifts){
  for(const x of [lift.x-9,lift.x+lift.w+9]){guides.lineStyle(12,0x102b35).lineBetween(x,lift.top-80,x,lift.bottom+4).lineStyle(3,0x54716f).lineBetween(x-3,lift.top-80,x-3,lift.bottom+4);for(let y=lift.top-60;y<lift.bottom;y+=37)guides.lineStyle(2,0x294952).lineBetween(x-6,y,x+6,y);}
  guides.fillStyle(0x243e47).lineStyle(3,0x5c7771).fillRoundedRect(lift.x-22,lift.top-92,lift.w+44,24,5).strokeRoundedRect(lift.x-22,lift.top-92,lift.w+44,24,5);
 }

 // The bureau's robot prepares an explicitly local sample brief, never a fake sent message.
 label(10335,301,'Бюро связи','#e2c18e');console(10440,540);
 screen(10368,365,284,155,'Демонстрационный бриф');
 const brief=text(10390,424,'',14,'#dccba8');
 const briefCard=scene.add.graphics().setDepth(-3);
 bind('dispatcher',10510,(c,p)=>{
  const lines=['Проект: новый сайт','Структура: 3 раздела','Связь: Instagram'];
  brief.setText(lines.slice(0,c.stage===0?1:c.stage===1?1+Math.floor(p*3):3).join('\n'));
  briefCard.clear();if(c.stage>=2)briefCard.fillStyle(0xd8cbad).fillRoundedRect(10510,590,85,35,3).lineStyle(1,0x6f7e6d).lineBetween(10520,600,10583,600).lineBetween(10520,610,10568,610);
 });
 text(10390,492,'E — связаться со студией',12,'#b1c4b4');createGlow(scene,10510,500,450,0xf3c481,-25,.3);

 for(const loop of loops)loop.update(0);
 return{update(time,_delta){const view=scene.cameras.main.worldView;for(const loop of loops)if(loop.x>view.left-600&&loop.x<view.right+600)loop.update(time);}};
}
