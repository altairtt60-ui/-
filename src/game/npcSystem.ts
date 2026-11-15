import Phaser from 'phaser';
import { npcWorkers } from '../content/world';
import { createRobot } from './robots';
import {workCycle} from './workCycle';

export interface NpcState { count:number; summary:string; workers:Array<{id:string;role:string;task:string;stage:string;progress:number;x:number;y:number}>; }

/** Work is clocked by simulation time: pauses freeze it and every worker has an offset. */
export function createNpcSystem(scene:Phaser.Scene):{
 update(time:number,delta:number,playerX:number,playerY:number):void;
 getState():NpcState;
 nearest(x:number,y:number,radius?:number):{id:string;x:number;y:number;distance:number}|null;
 position(id:string):{x:number;y:number}|undefined;
 react(id:string):void;
 destroy():void;
} {
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const workers=npcWorkers.map((definition,index)=>({
    definition,
    rig:createRobot(scene,definition.x,definition.y,.86+(index%3)*.035,definition.role),
    stage:0,progress:0,action:workCycle(definition.id,0).action,x:definition.x as number,y:definition.y as number,
    nextGreeting:0,wasNear:false,facing:1,
  }));
  const bubbleBox=scene.add.graphics().setDepth(47).setVisible(false);
  const bubble=scene.add.text(0,0,'',{
    fontFamily:'Arial, sans-serif',fontSize:'17px',color:'#f6e7cf',align:'center',
    padding:{x:13,y:10},wordWrap:{width:218},
  }).setOrigin(.5,1).setDepth(48).setVisible(false);
  let bubbleUntil=0,nextBubble=0,bubbleWorker=-1,nearest=0,lastTime=0;
  function showBubble(index:number,text:string,time:number):void {
    const worker=workers[index]!;
    bubbleWorker=index;bubbleUntil=time+2900;nextBubble=time+5800;
    bubble.setText(text).setPosition(worker.x,worker.y-145).setVisible(true);
    const w=bubble.width,h=bubble.height;
    bubbleBox.clear().fillStyle(0x183b40,.97).lineStyle(1.5,0x8aa99b,.75)
      .fillRoundedRect(worker.x-w/2,worker.y-145-h,w,h,8).strokeRoundedRect(worker.x-w/2,worker.y-145-h,w,h,8)
      .fillStyle(0x183b40,.97).fillTriangle(worker.x-8,worker.y-146,worker.x+8,worker.y-146,worker.x+3,worker.y-136).setVisible(true);
  }
  return {
    update(time,_delta,playerX,playerY){
      lastTime=time;
      const view=scene.cameras.main.worldView;
      let nearestDistance=Infinity;
      for(let index=0;index<workers.length;index++) {
        const worker=workers[index]!,d=worker.definition;
        const cycle=workCycle(d.id,time),{phase,stage,stageProgress}=cycle;
        worker.progress=phase;worker.stage=stage;worker.action=cycle.action;
        let moving=false,facing=1,offset=0;
        if(d.role==='courier') {
          const delivery=d.id==='archive-courier'?105:70;
          const journey=stage===0?0:stage===1?stageProgress:stage===2?1:1-stageProgress;
          offset=-105+journey*(105+delivery);moving=stage===1||stage===3;facing=stage===3?-1:1;
        } else if(d.id==='sorter') {
          offset=stage===0?0:stage===1?stageProgress*52:stage===2?52:(1-stageProgress)*52;
          moving=stage===1||stage===3;facing=stage===3?-1:1;
        } else if(d.id==='cable') {
          offset=stage===0?stageProgress*22:stage<3?22:(1-stageProgress)*22;moving=stage===0||stage===3;
        }
        if(motion.matches) {offset=0;moving=false;}
        worker.x=d.x+offset;worker.y=d.y;
        if(d.id==='guide'&&stage===3&&Math.abs(playerX-worker.x)<245)facing=playerX<worker.x?-1:1;
        worker.facing=facing;
        const visible=worker.x>view.x-240&&worker.x<view.right+240&&worker.y>view.y-80&&worker.y<view.bottom+180;
        worker.rig.container.setVisible(visible).setPosition(worker.x,worker.y);
        const distance=Math.hypot(worker.x-playerX,(worker.y-playerY)*1.3);
        if(distance<nearestDistance) {nearestDistance=distance;nearest=index;}
        const near=distance<245;
        if(near&&!worker.wasNear&&time>worker.nextGreeting&&time>nextBubble&&visible) {
          worker.nextGreeting=time+18000;
          if(stage===3)worker.rig.react('interact');
          showBubble(index,d.line,time);
        }
        worker.wasNear=near;
        if(!visible) continue;
        worker.rig.setWork(phase,stage,d.id,stageProgress);
        worker.rig.animate(time+d.phase,moving,false,facing);
        // Work announcements occasionally accompany completion even without player input.
        if(!motion.matches&&worker.stage===3&&phase<.77&&time>nextBubble&&visible&&distance<650) showBubble(index,d.line,time);
      }
      if(time>=bubbleUntil||bubbleWorker<0||!workers[bubbleWorker]?.rig.container.visible) {
        bubble.setVisible(false);bubbleBox.setVisible(false);
      }
    },
    getState(){return {count:workers.length,summary:`${workers[nearest]!.definition.task}: ${workers[nearest]!.action}`,workers:workers.map(worker=>({
      id:worker.definition.id,role:worker.definition.role,task:worker.definition.task,
      stage:worker.action,progress:Math.round(worker.progress*100)/100,x:worker.x,y:worker.y,
    }))};},
    nearest(x,y,radius=90){
      let result:{id:string;x:number;y:number;distance:number}|null=null;
      for(const worker of workers){
        if(Math.abs(worker.y-y)>110)continue;
        const distance=Math.hypot(worker.x-x,worker.y-y);
        if(distance<=radius&&(!result||distance<result.distance))result={id:worker.definition.id,x:worker.x,y:worker.y,distance};
      }
      return result;
    },
    position(id){const worker=workers.find(item=>item.definition.id===id);return worker?{x:worker.x,y:worker.y}:undefined;},
    react(id){
      const worker=workers.find(item=>item.definition.id===id);if(!worker)return;
      worker.rig.react('interact');worker.rig.animate(lastTime+worker.definition.phase,false,false,worker.facing);
    },
    destroy(){workers.forEach(worker=>worker.rig.container.destroy());bubble.destroy();bubbleBox.destroy();},
  };
}
