import Phaser from 'phaser';
import { brand } from '../content/brand';
import { assetUrl } from '../content/assetUrl';
import type {WorkerId} from './workCycle';

export type RobotKind='player'|'designer'|'archivist'|'mechanic'|'palette'|'coder'|'engineer'|'courier'|'qa';
export interface RobotRig {
  container:Phaser.GameObjects.Container;
  animate(time:number,moving:boolean,airborne:boolean,facing:number):void;
  react(kind:'interact'|'joy'|'land'):void;
  setWork(progress:number,stage:number,id?:WorkerId,stageProgress?:number):void;
}
const eyeColours:Record<RobotKind,number>={player:0x69ffe0,designer:0xfab2e1,palette:0xffd47e,coder:0x7de4ff,engineer:0xffd37e,courier:0x9cf0d9,qa:0xb9ff9e,archivist:0xf6dfa4,mechanic:0x88eddd};

export function preloadRobots(scene:Phaser.Scene):void {
  for(const key of ['robot-head','robot-body','robot-leg','robot-arm','designer-beret']) {
    if(!scene.textures.exists(key)&&!scene.load.list.entries.some(file=>file.key===key)) scene.load.svg(key,assetUrl(`/assets/${key}.svg`));
  }
  if(brand.markUrl&&!scene.textures.exists('altweb-brand-mark')&&!scene.load.list.entries.some(file=>file.key==='altweb-brand-mark')) scene.load.image('altweb-brand-mark',assetUrl(brand.markUrl));
}

/** Separate limbs retain the mascot's silhouette while each trade has its own tools. */
export function createRobot(scene:Phaser.Scene,x:number,y:number,scale:number,kind:RobotKind='player'):RobotRig {
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const container=scene.add.container(x,y).setScale(scale).setDepth(kind==='player'?32:29);
  const shadow=scene.add.ellipse(0,-1,61,12,0x03171b,.35);
  const pose=scene.add.container(0,0);
  const rearLeg=scene.add.image(-13,-32,'robot-leg').setOrigin(.5,0).setScale(.84).setTint(0xa9b5a7);
  const frontLeg=scene.add.image(13,-32,'robot-leg').setOrigin(.5,0).setScale(.84);
  const rearArm=scene.add.container(-28,-67);
  rearArm.add(scene.add.image(0,0,'robot-arm').setOrigin(.5,.17).setScale(.85).setTint(0xa3b9ad));
  const torso=scene.add.image(0,-69,'robot-body').setOrigin(.5,0);
  const frontArm=scene.add.container(28,-67);
  frontArm.add(scene.add.image(0,0,'robot-arm').setOrigin(.5,.17).setScale(.85));
  const headGroup=scene.add.container(0,-130);
  const head=scene.add.image(0,0,'robot-head').setOrigin(.5,0).setScale(.96);
  const eyes=scene.add.graphics();
  const headAccessory=scene.add.graphics();
  headGroup.add([head,eyes,headAccessory]);
  pose.add([rearArm,rearLeg,frontLeg,torso,frontArm,headGroup]);
  container.add([shadow,pose]);
  if(kind==='coder') {
    const stool=scene.add.graphics();
    stool.lineStyle(5,0x3c5b60).lineBetween(-7,-23,-11,0).lineBetween(13,-23,18,0);
    stool.fillStyle(0x243f49).lineStyle(2,0x8c9d8a).fillRoundedRect(-19,-31,38,9,4).strokeRoundedRect(-19,-31,38,9,4);
    stool.fillStyle(0x637e7a).fillRoundedRect(-20,-58,8,26,3);
    container.addAt(stool,1);
  }
  const accent=eyeColours[kind];
  const handTool=scene.add.graphics();
  pose.add(handTool);
  handTool.setPosition(28,-67);
  const chest=scene.add.graphics();
  chest.lineStyle(1,0x8e9a88,.7).strokeRoundedRect(-11,-58,22,16,3);
  pose.add(chest);
  if(scene.textures.exists('altweb-brand-mark')) {
    const source=scene.textures.get('altweb-brand-mark').getSourceImage() as {width:number;height:number};
    const aura=scene.add.ellipse(0,-50,27,19,0x64dfff,.13);
    const decal=scene.add.image(0,-50,'altweb-brand-mark');
    decal.setScale(Math.min(22/source.width,17/source.height));
    pose.add([aura,decal]);
  }
  const carried=scene.add.container(17,-47);
  const cargo=scene.add.graphics();
  carried.add(cargo);pose.add(carried);

  if(kind==='designer') {
    headGroup.add(scene.add.image(0,29,'designer-beret').setOrigin(.5,1).setScale(.8));
    handTool.lineStyle(4,0x765571).lineBetween(0,22,9,-3).lineStyle(2,0xffdfb5).lineBetween(9,-3,11,-11);
    cargo.fillStyle(0x36424e).lineStyle(2,0xb792ac).fillRoundedRect(-22,-2,35,23,3).strokeRoundedRect(-22,-2,35,23,3);
    cargo.fillStyle(0x836e92).fillRoundedRect(-18,2,27,15,2).fillStyle(0xf2c2d7).fillRect(-15,4,12,2).fillRect(-15,9,19,2);
  } else if(kind==='palette') {
    headAccessory.fillStyle(0xa95186).lineStyle(2,0x483f50).fillRoundedRect(-30,20,55,8,3).strokeRoundedRect(-30,20,55,8,3);
    cargo.fillStyle(0xe2c49d).lineStyle(2,0x846b67).fillEllipse(-3,9,39,28).strokeEllipse(-3,9,39,28);
    for(const [px,py,c] of [[-16,6,0xc96f94],[-6,0,0xe7c481],[6,4,0x67b8a5],[7,14,0x8493c1]] as const) cargo.fillStyle(c).fillCircle(px,py,4);
    handTool.lineStyle(4,0xa68b6b).lineBetween(0,23,6,0).lineStyle(4,0xb96c9b).lineBetween(6,0,8,-8);
  } else if(kind==='coder') {
    headAccessory.lineStyle(4,0x4c6e75).beginPath().moveTo(-32,45).lineTo(-34,19).lineTo(31,19).lineTo(34,45).strokePath();
    headAccessory.fillStyle(0x5f989d).fillRoundedRect(-41,40,10,18,4).fillRoundedRect(30,40,10,18,4);
    cargo.fillStyle(0x263943).lineStyle(2,0x70a4ad).fillRoundedRect(-25,2,46,21,3).strokeRoundedRect(-25,2,46,21,3);
    for(let row=0;row<3;row++)for(let col=0;col<7;col++)cargo.fillStyle((row+col)%3?0x7e7da6:0x8fbbbd).fillRoundedRect(-20+col*5,6+row*4,3,2,1);
  } else if(kind==='mechanic'||kind==='engineer') {
    headAccessory.fillStyle(kind==='mechanic'?0xdba44e:0x8e9e9d).lineStyle(2,0x3f4f4e)
      .fillRoundedRect(-31,14,59,15,{tl:12,tr:12,bl:2,br:2}).strokeRoundedRect(-31,14,59,15,{tl:12,tr:12,bl:2,br:2});
    headAccessory.fillStyle(0xf0c875).fillRoundedRect(-7,11,14,14,2);
    if(kind==='mechanic') {
      handTool.lineStyle(7,0x96b8b1).lineBetween(0,25,8,1).lineStyle(4,0xd2d7bd).beginPath().moveTo(6,3).lineTo(0,-3).lineTo(4,-13).moveTo(8,4).lineTo(16,1).lineTo(19,-8).strokePath();
    } else {
      handTool.lineStyle(6,0xa570ad).beginPath().moveTo(1,28).lineTo(15,18).lineTo(19,-6).strokePath();
      handTool.fillStyle(0xd2d4b7).lineStyle(2,0x4b6b70).fillRoundedRect(12,-15,14,12,3).strokeRoundedRect(12,-15,14,12,3);
      const coil=scene.add.graphics();coil.lineStyle(3,0xa078a4).strokeEllipse(-30,-53,15,33).strokeEllipse(-34,-53,15,33);pose.addAt(coil,0);
    }
  } else if(kind==='qa') {
    headAccessory.fillStyle(0x4c6764).lineStyle(2.5,0xbda47e).fillRoundedRect(-29,17,24,18,7).strokeRoundedRect(-29,17,24,18,7).fillRoundedRect(2,17,24,18,7).strokeRoundedRect(2,17,24,18,7).lineBetween(-5,25,2,25);
    headAccessory.fillStyle(0x75b4ad,.5).fillCircle(-17,26,7).fillCircle(14,26,7);
    handTool.lineStyle(5,0xc9a56b).lineBetween(0,26,8,9).lineStyle(3,0x67c7bd).strokeCircle(13,0,12).fillStyle(0x8de5d1,.2).fillCircle(13,0,10);
    cargo.fillStyle(0xb5baa0).lineStyle(2,0x4b6c62).fillRoundedRect(-20,-2,24,31,3).strokeRoundedRect(-20,-2,24,31,3);
    cargo.lineStyle(2,0x599d7b).beginPath().moveTo(-15,8).lineTo(-11,12).lineTo(-5,4).strokePath().lineBetween(-15,18,-2,18).lineBetween(-15,23,-5,23);
  } else if(kind==='archivist') {
    headAccessory.lineStyle(2.2,0xcbb88d).strokeRoundedRect(-23,54,21,23,5).strokeRoundedRect(4,54,21,23,5).lineBetween(-2,62,4,62);
    cargo.fillStyle(0x376774).lineStyle(2,0xc6b78c).fillRoundedRect(-17,-3,33,28,3).strokeRoundedRect(-17,-3,33,28,3);
    cargo.fillStyle(0x8dbbaa).fillRect(-12,2,23,17).fillStyle(0xc7d9b1).fillRect(-9,5,15,2).fillStyle(0x7e989f).fillRect(-9,10,18,6);
  } else if(kind==='courier') {
    headAccessory.fillStyle(0x7d9a88).lineStyle(2,0x3f5753).fillRoundedRect(-29,20,54,10,4).strokeRoundedRect(-29,20,54,10,4).fillRoundedRect(9,27,26,5,2);
    cargo.fillStyle(0x3d5c6a).lineStyle(2.5,0x9ba1ad).fillRoundedRect(-24,-8,45,36,5).strokeRoundedRect(-24,-8,45,36,5);
    cargo.fillStyle(0x9e6fa9).fillRoundedRect(-18,-2,33,24,3).lineStyle(2,0xe2bce1).strokeRoundedRect(-10,3,17,13,2);
    cargo.lineStyle(1,0xffdca1).lineBetween(-5,5,-5,14).lineBetween(0,5,0,14);
  }
  const sitePreview=(kind==='courier'||kind==='archivist')?scene.add.image(-1,10,'__WHITE').setVisible(false):undefined;
  if(sitePreview)carried.add(sitePreview);
  let previewKey='';
  let workId:WorkerId|undefined,segmentProgress=0;
  let workProgress=0,workStage=0,lastTime=0,reactionUntil=0,reaction:'interact'|'joy'|'land'='interact';
  let lastEyeFrame='';
  function drawEyes(expression:string,blink:boolean):void {
    const frame=`${expression}:${blink}`;
    if(frame===lastEyeFrame) return;
    lastEyeFrame=frame;
    eyes.clear().lineStyle(3.5,accent).fillStyle(accent);
    if(blink) eyes.fillRoundedRect(-19,65,12,3,2).fillRoundedRect(8,65,12,3,2);
    else if(expression==='happy') {
      for(const ex of [-13,14])eyes.beginPath().moveTo(ex-6,68).lineTo(ex-4,62).lineTo(ex,60).lineTo(ex+4,62).lineTo(ex+6,68).strokePath();
    } else if(expression==='focus') {
      eyes.fillRoundedRect(-19,58,11,18,4).fillRoundedRect(8,59,11,17,4);
      eyes.lineStyle(4,0x0c2831).lineBetween(-22,56,-5,62).lineBetween(5,63,23,56);
    } else if(expression==='look') {
      eyes.fillRoundedRect(-17,58,10,19,4).fillRoundedRect(10,61,11,13,4);
    } else {
      eyes.fillRoundedRect(-19,57,11,21,5).fillRoundedRect(8,57,11,21,5);
      eyes.fillStyle(0xe5ffed,.7).fillRoundedRect(-17,59,3,9,2).fillRoundedRect(10,59,3,9,2);
    }
  }
  drawEyes('normal',false);
  return {
    container,
    setWork(progress,stage,id,stageProgress){
      if(workId!==id) {
        if(id==='guide') {
          headAccessory.clear().lineStyle(2,0xbac9a4).fillStyle(0x436e68).fillRoundedRect(-25,20,48,10,3).strokeRoundedRect(-25,20,48,10,3)
            .fillStyle(0xe5c482).fillCircle(0,19,8).lineStyle(2,0x416363).lineBetween(0,13,0,25).lineBetween(-6,19,6,19);
          cargo.clear().fillStyle(0xe2d4ad).lineStyle(2,0x4e6a5b).fillRoundedRect(-22,-8,42,34,3).strokeRoundedRect(-22,-8,42,34,3);
          cargo.lineStyle(1,0xa8b491).lineBetween(-8,-6,-8,24).lineBetween(6,-6,6,24);
          cargo.lineStyle(2,0x5b8c72).beginPath().moveTo(-16,17).lineTo(-11,7).lineTo(-2,11).lineTo(11,0).strokePath();
          cargo.fillStyle(0xaa6c78).fillCircle(11,0,3);
          handTool.clear().lineStyle(3,0x8ab39b).lineBetween(0,20,7,-5).fillStyle(0xe4c985).fillCircle(7,-7,3);
        } else if(id==='dispatcher') {
          cargo.clear().fillStyle(0xdbc9a4).lineStyle(2,0x6f7460).fillRoundedRect(-18,-7,34,36,3).strokeRoundedRect(-18,-7,34,36,3);
          cargo.fillStyle(0x758e7d).fillRoundedRect(-8,-10,15,6,2);
          cargo.lineStyle(2,0x687c6f).lineBetween(-11,2,9,2).lineBetween(-11,9,6,9).lineBetween(-11,16,9,16).lineBetween(-11,23,0,23);
          handTool.clear().lineStyle(3,0x657e7d).lineBetween(-2,18,7,-8).lineStyle(2,0xead6ac).lineBetween(7,-8,8,-12);
        } else if(id==='finder') {
          handTool.clear().lineStyle(4,0x638e8c).lineBetween(-2,20,5,-5).lineStyle(2,0xc9e7c0).lineBetween(5,-5,6,-11);
          handTool.fillStyle(0xb2d7bb).fillCircle(6,-11,2);
        } else if(id==='retest') {
          handTool.clear().fillStyle(0x507e68).lineStyle(2,0xb5c69d).fillRoundedRect(-9,3,21,12,3).strokeRoundedRect(-9,3,21,12,3);
          handTool.fillStyle(0x9caf89).fillRoundedRect(-3,-7,9,12,3).fillStyle(0xd8d1ac).fillRect(-8,15,19,3);
        } else if(id==='lift-operator') {
          handTool.clear().lineStyle(5,0x769e90).lineBetween(0,23,7,0).fillStyle(0xd0ad72).lineStyle(2,0x4c6c66).fillCircle(7,-3,7).strokeCircle(7,-3,7);
        }
      }
      workProgress=progress;workStage=stage;workId=id;segmentProgress=stageProgress??progress*4-stage;
    },
    react(next){reaction=next;reactionUntil=lastTime+(next==='joy'?1100:next==='land'?200:650);},
    animate(time,moving,airborne,facing){
      lastTime=time;
      const reduced=motion.matches;
      const activeReaction=time<reactionUntil;
      const gait=moving?Math.sin(time*.016):0;
      const pulse=Math.sin(time*.012);
      const busy=!moving&&!airborne&&kind!=='player';
      container.setScale(scale*(facing<0?-1:1),scale);
      rearLeg.rotation=airborne?-.42:-gait*.55;
      frontLeg.rotation=airborne?.55:gait*.55;
      rearArm.rotation=airborne?.7:gait*.46;
      frontArm.rotation=airborne?-.78:-gait*.46;
      const p=reduced?1:segmentProgress;
      const sweep=p*p*(3-2*p);
      const delivery=kind==='courier'||workId==='sorter';
      const hasCargo=!delivery||(workStage===0?segmentProgress>.35:workStage<2||workStage===2&&segmentProgress<.5);
      carried.setVisible(hasCargo&&(kind==='courier'||kind==='coder'||kind==='qa'||kind==='archivist'||kind==='designer'||kind==='palette'));
      carried.rotation=0;carried.x=17;carried.y=-47;
      frontArm.setPosition(28,-67);rearArm.setPosition(-28,-67);
      if(busy) {
        const tap=reduced?0:pulse;
        if(workId==='guide') {
          carried.setPosition(20,-49);rearArm.rotation=-.4;
          frontArm.rotation=workStage===0?-.45:workStage===1?-.5-sweep*.9:workStage===2?-.55:-1.55+(reduced?0:Math.sin(time*.007)*.12);
          carried.rotation=workStage===2?-.15:0;
        } else if(workId==='layout') {
          carried.setPosition(20,-49);carried.rotation=-.1;
          frontArm.rotation=workStage===1?-.35-sweep*.95:workStage===2?-1.3:-.35;
          frontArm.x+=workStage===1?sweep*12:workStage===2?12:0;rearArm.rotation=-.45;
        } else if(kind==='designer') {
          carried.setPosition(33,-48);carried.rotation=-.15;
          frontArm.rotation=workStage===1?-.2-sweep*.45:workStage===2?-.65+tap*.07:-.3;
          rearArm.rotation=-.35;
        } else if(kind==='palette') {
          frontArm.rotation=workStage===0?-.25+tap*.05:workStage===1?-1.15-sweep*.4:workStage===2?-1.55:-.4;
          frontArm.x+=workStage===1||workStage===2?12:0;rearArm.rotation=-.35;
        } else if(kind==='coder') {
          carried.setPosition(0,-44);rearArm.rotation=-.4;
          if(workId==='reviewer') {
            frontArm.rotation=workStage===0?-1.3:workStage===1?.35+tap*.04:workStage===2?-1.05:-1.65;
            rearArm.rotation=workStage===1?-.5-tap*.04:-.4;
          } else {
            frontArm.rotation=workStage===1?.55+tap*.2:workStage===2?.6:-.15;
            rearArm.rotation=workStage===1?-.5-tap*.16:-.35;
          }
        } else if(kind==='qa') {
          rearArm.rotation=-.3;
          if(workId==='inspector')frontArm.rotation=workStage===1?-.35-sweep*.85:workStage===2?-1.2:-.45;
          else if(workId==='finder')frontArm.rotation=workStage===1?-.45+tap*.14:workStage===2?-.5-sweep*.75:-.35;
          else frontArm.rotation=workStage===1?-.45-sweep*.7:workStage===2?-1.1:workStage===3?-1.7:-.4;
        } else if(kind==='engineer') {
          rearArm.rotation=-.2;
          frontArm.rotation=workId==='lift-operator'?(workStage===1?-1.2+sweep*.5:workStage===2?-.7:-.3):
            workStage===0?-.35:workStage===1?-.35-sweep*1.05:workStage===2?-1.4:-1.4+sweep*1.05;
        } else if(kind==='mechanic') {
          frontArm.rotation=workStage===1?-1.05+tap*.36:workStage===2?-1.1:workStage===3?-1.65:-.3;
          rearArm.rotation=.25;
        } else if(kind==='archivist') {
          rearArm.rotation=-.4;
          frontArm.rotation=workId==='dispatcher'?(workStage===0?-.45:workStage===1?-.45+tap*.16:workStage===2?-.8:-1.25+sweep*.35):workId==='curator'?(workStage===0?-.35:workStage===1?-.35-sweep*.85:workStage===2?-1.2:-.45):workStage===2?-1.25:-.65;
          carried.y=-47-(workStage===2?sweep*13:0);
        } else if(kind==='courier') {frontArm.rotation=-.65;rearArm.rotation=-.55;}
      }
      if(moving&&(kind==='courier'||kind==='archivist')&&hasCargo) {
        frontArm.rotation=-.65;rearArm.rotation=-.55;carried.y=-47-(reduced?0:Math.abs(gait)*1.8);
      }
      if(delivery&&workStage===2) {
        const drop=reduced?1:Math.min(1,segmentProgress*2);
        carried.x=17+drop*17;carried.y=-47+drop*26;carried.rotation=drop*.08;
        frontArm.rotation=-.65+drop*.55;
      }
      if(sitePreview) {
        const project=workId==='archive-courier'?'pitlane-auto':workId==='curator'?'kn-detailing':workId==='sorter'?'avtozabota-detailing':null;
        const key=project?`project-thumb-${project}`:'';
        if(key&&scene.textures.exists(key)) {
          if(key!==previewKey) {
            const source=scene.textures.get(key).getSourceImage() as {width:number;height:number};
            const width=kind==='courier'?33:23;
            sitePreview.setTexture(key).setScale(Math.min(width/source.width,(kind==='courier'?21:17)/source.height));previewKey=key;
          }
          sitePreview.setVisible(true);
        }else sitePreview.setVisible(false);
      }
      if(activeReaction&&reaction!=='land') frontArm.rotation=reaction==='joy'?-2.3:-1.65+(reduced?0:Math.sin(time*.016)*.12);
      handTool.setPosition(frontArm.x-Math.sin(frontArm.rotation)*31,frontArm.y+Math.cos(frontArm.rotation)*31);
      handTool.rotation=frontArm.rotation;
      const joy=activeReaction&&reaction==='joy';
      const land=activeReaction&&reaction==='land'&&!reduced?Math.sin((reactionUntil-time)/200*Math.PI):0;
      pose.setScale(1+land*.13,1-land*.11);
      pose.y=airborne?-2:moving?(reduced?0:-Math.abs(gait)*3):reduced?0:Math.sin(time*.0025)*1.25;
      if(busy&&kind==='coder') {pose.y+=14;rearLeg.y=-39;frontLeg.y=-39;rearLeg.rotation=-.65;frontLeg.rotation=-.45;}
      if(joy&&!reduced) pose.y-=Math.max(0,Math.sin((reactionUntil-time)/1100*Math.PI*2))*9;
      headGroup.rotation=airborne?-.06:busy&&!reduced?Math.sin(time*.0017)*.035:0;
      torso.rotation=moving?gait*.014:0;
      shadow.setScale(airborne?.7:1,airborne?.65:1);
      drawEyes(joy?'happy':activeReaction?'look':busy&&workStage===1?'focus':busy&&workStage===3?'happy':'normal',!reduced&&time%5100>4950);
    },
  };
}
