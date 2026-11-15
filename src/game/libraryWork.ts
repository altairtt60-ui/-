import Phaser from 'phaser';
import {workCycle} from './workCycle';

/** Working copies use the real portfolio textures; the sixteen catalogue frames stay intact. */
export function buildLibraryWork(scene:Phaser.Scene):{update(time:number):void}{
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const g=scene.add.graphics().setDepth(-6);
 const label=(x:number,y:number,value:string)=>scene.add.text(x,y,value,{fontFamily:'Arial, sans-serif',fontSize:'10px',color:'#c9c3a5'}).setDepth(4);
 const preview=(id:string,width:number,height:number)=>{
  const holder=scene.add.container(0,0).setDepth(24).setVisible(false);
  const rim=scene.add.graphics().fillStyle(0x173139).lineStyle(2,0xb1a17a).fillRoundedRect(-width/2-4,-height/2-4,width+8,height+8,4).strokeRoundedRect(-width/2-4,-height/2-4,width+8,height+8,4);
  const image=scene.add.image(0,0,'__WHITE').setDisplaySize(width,height);
  holder.add([rim,image]);let loaded=false;
  return{holder,show(x:number,y:number,visible=true){const key=`project-thumb-${id}`;if(!loaded&&scene.textures.exists(key)){image.setTexture(key).setDisplaySize(width,height);loaded=true;}holder.setPosition(x,y).setVisible(loaded&&visible);}};
 };
 // A carrier hands the same PITLANE working copy to a receiving shelf.
 g.fillStyle(0x4e6258).fillRoundedRect(7546,694,117,7,2).lineStyle(2,0xa99d77).strokeRoundedRect(7562,635,82,56,4);
 const received=preview('pitlane-auto',70,44);
 const delivery=label(7608,624,'Приёмка экрана');
 // The curator opens and inspects a real KN Detailing preview on a low reader.
 g.fillStyle(0x324d4f).fillRoundedRect(8120,694,121,8,3).lineStyle(5,0x53685d).lineBetween(8140,702,8140,720).lineBetween(8220,702,8220,720);
 const reader=preview('kn-detailing',96,60);
 const inspection=scene.add.graphics().setDepth(25);
 const curatorStatus=label(8120,608,'Просмотр проекта');
 // A sorter slides an actual site screen into a numbered fixture, then confirms its status.
 g.fillStyle(0x30494a).fillRect(8585,696,215,5).lineStyle(2,0x9a9873).strokeRoundedRect(8708,647,77,46,3);
 const sorted=preview('avtozabota-detailing',61,38);
 const sorterStatus=label(8728,624,'Сортировка');
 // The archive's equipment hoist is separate from the neighbouring passenger lift.
 g.lineStyle(11,0x122e36).lineBetween(9482,139,9482,691).lineBetween(9560,139,9560,691)
  .lineStyle(3,0x819181).lineBetween(9480,142,9480,690).lineBetween(9558,142,9558,690)
  .fillStyle(0x304b50).lineStyle(2,0xaa9c77).fillRoundedRect(9464,112,114,30,6).strokeRoundedRect(9464,112,114,30,6)
  .lineStyle(5,0x6e8076).lineBetween(9400,242,9440,242).lineBetween(9440,242,9440,271);
 const lifted=preview('altweb-portfolio',82,51);
 const liftCable=scene.add.graphics().setDepth(-3);
 const liftShelf=scene.add.rectangle(9521,679,104,8,0x78866e).setDepth(21);
 const operatorStatus=label(9410,166,'Загрузка на полку');
 return{update(time){
  const view=scene.cameras.main.worldView;
  if(view.right<7100||view.left>10000)return;
  const carrier=workCycle('archive-courier',time);
  const delivered=carrier.stage===2&&carrier.stageProgress>=.5||carrier.stage===3;
  received.show(7603,663,delivered);delivery.setText(delivered?'Экран принят':'Ожидаю экран');
  const curator=workCycle('curator',time),cp=motion.matches?1:curator.stageProgress;
  reader.show(8180,658,curator.stage!==0);inspection.clear();
  if(curator.stage===1||curator.stage===2){const x=8144+(curator.stage===1?cp:1-cp)*62;inspection.lineStyle(2,0xe4c58a).strokeCircle(x,650,12).lineBetween(x+8,659,x+18,670);}
  curatorStatus.setText(['Выбор проекта','Просмотр экрана','Сверка версии','Карточка проверена'][curator.stage]!);
  const sorter=workCycle('sorter',time),sp=motion.matches?1:Phaser.Math.Easing.Cubic.InOut(sorter.stageProgress);
  const x=sorter.stage===0?8615:sorter.stage===1?Phaser.Math.Linear(8615,8745,sp):sorter.stage===2?8745:Phaser.Math.Linear(8745,8615,sp);
  sorted.show(x,670,sorter.stage!==3||sp<.5);sorterStatus.setText(sorter.stage>=2?'Демонстрация: в ячейку':'Проверка статуса');
  const operator=workCycle('lift-operator',time),lp=motion.matches?1:Phaser.Math.Easing.Cubic.InOut(operator.stageProgress);
  const y=operator.stage===0?646:operator.stage===1?Phaser.Math.Linear(646,231,lp):operator.stage===2?231:Phaser.Math.Linear(231,646,lp);
  lifted.show(9521,y);liftShelf.y=y+34;liftCable.clear().lineStyle(2,0x8e9c83).lineBetween(9521,142,9521,y-31);
  operatorStatus.setText(['Принимаю экран','Поднимаю экран','Ставлю на полку','Возврат каретки'][operator.stage]!);
 }};
}
