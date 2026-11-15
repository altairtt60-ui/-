import Phaser from 'phaser';
import {taskProgress} from '../content/taskProgress';
import type { GameBridge, GameState, InputAction } from '../contracts';
import { buildFactory, preloadArt } from './art';
import { createRobot } from './robots';
import { createNpcSystem } from './npcSystem';
import { buildLibrary, preloadLibraryArt } from './libraryArt';
import { projects } from '../content/projects';
import { LIBRARY_ENTRY, LIBRARY_START, librarySlots } from '../content/libraryLayout';
import type { LibrarySlot } from '../content/libraryLayout';
import { GROUND, WORLD_HEIGHT, WORLD_WIDTH, platforms, lifts, stations, zones, contactDesk } from '../content/world';
import type { ZoneId, TaskKind } from '../content/world';
import { assetUrl } from '../content/assetUrl';
import {robotDialogues} from '../content/robotDialogues';
import type {WorkerId} from './workCycle';

const KEY_ACTIONS: Readonly<Record<string, InputAction>> = {
  KeyA:'left', ArrowLeft:'left', KeyD:'right', ArrowRight:'right', Space:'jump', ArrowUp:'jump',
};
const interactiveStations=[...stations,contactDesk];

type Lift = { layout:typeof lifts[number]; object:Phaser.GameObjects.Rectangle; art:Phaser.GameObjects.Container; y:number };
type Interaction={kind:'station'|'project'|'npc';id:string;label:string;distance:number};

/** The same persistent scene carries every workshop and the physical project gallery. */
export class FactoryScene extends Phaser.Scene {
  private bridge:GameBridge;
  private player?:Phaser.GameObjects.Rectangle;
  private playerBody?:Phaser.Physics.Arcade.Body;
  private playerRig?:ReturnType<typeof createRobot>;
  private workers?:ReturnType<typeof createNpcSystem>;
  private factory?:ReturnType<typeof buildFactory>;
  private library?:ReturnType<typeof buildLibrary>;
  private liftBodies:Lift[]=[];
  private heldCodes=new Set<string>();
  private externalInput:Record<InputAction,boolean>={left:false,right:false,jump:false};
  private ready=false;
  private pausedWorld=false;
  private focusedStationId:string|null=null;
  private focusedNpcId:string|null=null;
  private npcHint?:Phaser.GameObjects.Text;
  private focusedProjectId:string|null=null;
  private pendingZone:ZoneId|null=null;
  private galleryAssetsRequested=false;
  private thumbProjects=new Map<string,string>();
  private simTime=0;
  private lastGrounded=-1000;
  private jumpQueuedAt=-1000;
  private previousJumpHeld=false;
  private previouslyGrounded=true;
  private facing=1;
  private cameraCenter={x:600,y:450};
  private stateSentAt=-1000;
  private reducedMotionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  private reducedMotion=this.reducedMotionQuery.matches;

  constructor(bridge:GameBridge) { super({key:'factory'}); this.bridge=bridge; }
  preload():void { preloadArt(this); preloadLibraryArt(this); }

  create():void {
    this.physics.world.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);
    this.physics.world.gravity.set(0,1700);
    this.factory=buildFactory(this);
    this.library=buildLibrary(this,projects,id=>this.selectProject(id));
    this.load.on(Phaser.Loader.Events.FILE_COMPLETE,this.onThumbComplete,this);
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR,this.onThumbError,this);
    this.load.on(Phaser.Loader.Events.COMPLETE,this.onGalleryLoadComplete,this);

    const ground=this.add.rectangle(WORLD_WIDTH/2,GROUND+45,WORLD_WIDTH,90,0,0);
    this.physics.add.existing(ground,true);
    this.player=this.add.rectangle(320,GROUND-50,48,100,0,0);
    this.physics.add.existing(this.player);
    this.playerBody=this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true).setMaxVelocity(320,1100).setDragX(2600).setBounce(0,0);
    this.physics.add.collider(this.player,ground);

    for(const layout of platforms) this.createSurface(layout.x,layout.y,layout.w);
    for(const layout of lifts) {
      const object=this.createSurface(layout.x,layout.bottom,layout.w);
      // The platform itself is drawn here so its light, body and motion always agree.
      const art=this.add.container(layout.x,layout.bottom).setDepth(23);
      const shape=this.add.graphics();
      shape.fillStyle(0x152f38).fillRoundedRect(0,0,layout.w,20,4);
      shape.lineStyle(2,0xc6aa75).strokeRoundedRect(0,0,layout.w,20,4);
      shape.fillStyle(0x8ee3d8).fillRect(5,0,layout.w-10,3);
      for(let x=9;x<layout.w-10;x+=18) {
        shape.fillStyle(0xc5a064).fillTriangle(x,7,x+9,7,x+4,16);
      }
      shape.lineStyle(3,0x6d8a87).lineBetween(5,0,5,-30).lineBetween(layout.w-5,0,layout.w-5,-30);
      art.add(shape);
      this.liftBodies.push({layout,object,art,y:layout.bottom});
    }
    this.playerRig=createRobot(this,320,GROUND,1,'player');
    this.playerRig.container.setDepth(30);
    this.workers=createNpcSystem(this);
    this.buildGuideBoard();
    this.npcHint=this.add.text(0,0,'E',{
      fontFamily:'Arial, sans-serif',fontSize:'17px',fontStyle:'bold',color:'#f2dcad',
      backgroundColor:'#15343b',padding:{x:9,y:5},
    }).setOrigin(.5).setDepth(46).setVisible(false);
    this.add.zone(10368,365,284,355).setOrigin(0).setDepth(9).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!this.pausedWorld&&!document.querySelector('dialog[open]')&&this.nearestStation()?.id===contactDesk.id){this.clearInput();this.bridge.onInteract(contactDesk.id);}});
    this.cameras.main.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT).setBackgroundColor('#071c25');
    this.resizeCamera(true);
    this.scale.on(Phaser.Scale.Events.RESIZE,this.onResize,this);
    window.addEventListener('keydown',this.onKeyDown);
    window.addEventListener('keyup',this.onKeyUp);
    window.addEventListener('blur',this.onBlur);
    document.addEventListener('visibilitychange',this.onVisibilityChange);
    this.reducedMotionQuery.addEventListener('change',this.onMotionChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,this.cleanup,this);
    this.ready=true;
    if(this.pausedWorld) this.physics.world.pause();
    if(this.pendingZone) this.goToZone(this.pendingZone);
    else if(this.focusedProjectId) this.loadGalleryThumbnails();
    this.bridge.onState(this.getState());
  }

  private buildGuideBoard():void {
    const x=924,y=414,w=244,h=132;
    const frame=this.add.graphics().setDepth(-3);
    frame.lineStyle(7,0x334e51).lineBetween(x+22,y+h,x+22,GROUND).lineBetween(x+w-22,y+h,x+w-22,GROUND);
    frame.fillStyle(0x102d36).lineStyle(3,0x849b83).fillRoundedRect(x,y,w,h,9).strokeRoundedRect(x,y,w,h,9);
    frame.lineStyle(1,0x37595d).lineBetween(x+14,y+39,x+w-14,y+39);
    for(const dx of [9,w-9])for(const dy of [9,h-9])frame.fillStyle(0xacc0a2).fillCircle(x+dx,y+dy,2);
    this.add.text(x+15,y+14,'Маршрут по фабрике',{fontFamily:'Arial, sans-serif',fontSize:'17px',color:'#e3d6b5'}).setDepth(-2);
    this.add.text(x+16,y+52,'Работы    Дизайн\nУслуги    Ваш проект',{
      fontFamily:'Arial, sans-serif',fontSize:'15px',lineSpacing:8,color:'#b6d3c1',
    }).setDepth(-2);
    this.add.text(x+16,y+108,'E — поговорить с гидом',{fontFamily:'Arial, sans-serif',fontSize:'12px',color:'#cdbd94'}).setDepth(-2);
    this.add.zone(x,y,w,h).setOrigin(0).setDepth(10).setInteractive({useHandCursor:true}).on('pointerdown',()=>{
      if(!this.ready||this.pausedWorld||document.querySelector('dialog[open]'))return;
      if(this.playerBody&&this.workers?.nearest(this.playerBody.center.x,this.playerBody.bottom)?.id==='guide')this.openNpc('guide');
    });
  }

  private createSurface(x:number,y:number,width:number):Phaser.GameObjects.Rectangle {
    const surface=this.add.rectangle(x+width/2,y+9,width,18,0,0);
    this.physics.add.existing(surface,true);
    const body=surface.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down=false; body.checkCollision.left=false; body.checkCollision.right=false;
    if(this.player) this.physics.add.collider(this.player,surface,undefined,()=>{
      const player=this.playerBody;
      return !!player && player.velocity.y>=0 && player.prev.y+player.height<=body.top+12;
    });
    return surface;
  }

  private onMotionChange=(event:MediaQueryListEvent):void=>{this.reducedMotion=event.matches;};
  private onResize():void {this.resizeCamera(true);}
  private baseZoom():number {
    const camera=this.cameras.main;
    // Short landscape screens crop the ceiling, rather than shrinking the robot to a speck.
    const visibleHeight=camera.width<900?Math.min(900,Math.max(500,camera.height*1.45)):WORLD_HEIGHT;
    return Math.max(camera.height/visibleHeight,camera.width/WORLD_WIDTH);
  }
  private resizeCamera(immediate=false):void {
    const camera=this.cameras.main;
    if(immediate) camera.setZoom(this.baseZoom()*(this.focusedProjectId?1.32:(this.focusedStationId||this.focusedNpcId)?1.18:1));
    const halfW=camera.width/(2*camera.zoom),halfH=camera.height/(2*camera.zoom);
    this.cameraCenter.x=Phaser.Math.Clamp(this.cameraCenter.x,halfW,WORLD_WIDTH-halfW);
    this.cameraCenter.y=Phaser.Math.Clamp(this.cameraCenter.y,halfH,WORLD_HEIGHT-halfH);
    camera.centerOn(this.cameraCenter.x,this.cameraCenter.y);
  }
  private controlsAllowed(event:KeyboardEvent):boolean {
    if(this.pausedWorld || document.querySelector('dialog[open]')) return false;
    return !(event.target instanceof HTMLElement && event.target.closest('button,input,textarea,select,a,[contenteditable="true"],dialog'));
  }
  private interactionKeys=new Set<string>();
  private onKeyDown=(event:KeyboardEvent):void=>{
    if(!this.controlsAllowed(event)) return;
    const action=KEY_ACTIONS[event.code];
    if(action) {
      event.preventDefault();
      if(!this.heldCodes.has(event.code)&&action==='jump'&&!this.actionHeld('jump')) this.jumpQueuedAt=this.simTime;
      this.heldCodes.add(event.code);
    } else if((event.code==='KeyE'||event.code==='Enter')&&!event.repeat&&!this.interactionKeys.has(event.code)) {this.interactionKeys.add(event.code);event.preventDefault();this.interact();}
  };
  private onKeyUp=(event:KeyboardEvent):void=>{this.heldCodes.delete(event.code);this.interactionKeys.delete(event.code);};
  private onBlur=():void=>{this.clearInput();this.interactionKeys.clear();};
  private onVisibilityChange=():void=>{if(document.hidden)this.clearInput();};
  private cleanup():void {
    this.ready=false;
    window.removeEventListener('keydown',this.onKeyDown);window.removeEventListener('keyup',this.onKeyUp);window.removeEventListener('blur',this.onBlur);
    document.removeEventListener('visibilitychange',this.onVisibilityChange);
    this.reducedMotionQuery.removeEventListener('change',this.onMotionChange);
    this.scale.off(Phaser.Scale.Events.RESIZE,this.onResize,this);
    this.load.off(Phaser.Loader.Events.FILE_COMPLETE,this.onThumbComplete,this);
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR,this.onThumbError,this);
    this.load.off(Phaser.Loader.Events.COMPLETE,this.onGalleryLoadComplete,this);
    this.workers?.destroy();
  }
  private actionHeld(action:InputAction):boolean {
    return this.externalInput[action]||[...this.heldCodes].some(code=>KEY_ACTIONS[code]===action);
  }
  private clearInput():void {
    this.heldCodes.clear();this.externalInput={left:false,right:false,jump:false};
    this.jumpQueuedAt=-1000;this.previousJumpHeld=false;
    this.playerBody?.setAccelerationX(0).setVelocityX(0);
  }
  setInput(action:InputAction,pressed:boolean):void {
    if(pressed&&this.pausedWorld)return;
    if(action==='jump'&&pressed&&!this.actionHeld('jump'))this.jumpQueuedAt=this.simTime;
    this.externalInput[action]=pressed;
  }
  setPaused(paused:boolean):void {
    this.pausedWorld=paused;this.clearInput();
    if(paused)this.npcHint?.setVisible(false);
    if(!this.ready)return;
    if(paused)this.physics.world.pause();else this.physics.world.resume();
    this.bridge.onState(this.getState());
  }
  focusStation(active:boolean):void {this.focusInteraction(active?'design-station':null);}
  focusInteraction(id:string|null):void {
    const npcId=id?.startsWith('npc:')?id.slice(4):null;
    this.focusedNpcId=npcId&&Object.hasOwn(robotDialogues,npcId)?npcId:null;
    this.focusedStationId=interactiveStations.some(station=>station.id===id)?id:null;
    if(this.focusedStationId||this.focusedNpcId)this.focusProject(null);
  }
  focusProject(id:string|null):void {
    this.focusedProjectId=id&&librarySlots.some(slot=>slot.projectId===id)?id:null;
    if(this.focusedProjectId){this.focusedStationId=null;this.focusedNpcId=null;}
    this.library?.setSelected(this.focusedProjectId);
    if(this.focusedProjectId)this.loadGalleryThumbnails();
  }
  completeTask(kind:TaskKind):void {
    if(!stations.some(station=>station.kind===kind))return;
    this.playerRig?.react?.('joy');
    this.bridge.onState(this.getState());
  }
  /** A visible map offers shortcuts; the complete walking route always stays open. */
  goToZone(id:ZoneId):void {
    const zone=zones.find(item=>item.id===id);if(!zone)return;
    this.pendingZone=this.ready?null:id;if(!this.ready)return;
    this.clearInput();this.focusedStationId=null;this.focusedNpcId=null;this.focusProject(null);
    this.playerBody?.reset(zone.entry,GROUND-50);this.playerBody?.setVelocity(0,0);
    this.playerRig?.container.setPosition(zone.entry,GROUND);
    this.lastGrounded=-1000;this.previouslyGrounded=true;this.facing=1;
    if(id==='library')this.loadGalleryThumbnails();
    this.bridge.onState(this.getState());
  }
  goToLibrary():void {this.goToZone('library');}
  private nearestStation() {const body=this.playerBody;return body?interactiveStations.filter(station=>Phaser.Math.Distance.Between(body.center.x,body.bottom,station.x,station.y)<=station.radius).sort((a,b)=>Phaser.Math.Distance.Between(body.center.x,body.bottom,a.x,a.y)-Phaser.Math.Distance.Between(body.center.x,body.bottom,b.x,b.y))[0]:undefined;}
  private nearestInteraction():Interaction|null {
    const body=this.playerBody;if(!body)return null;
    const choices:Interaction[]=[];
    const station=this.nearestStation();
    if(station)choices.push({kind:'station',id:station.id,label:station.label,distance:Phaser.Math.Distance.Between(body.center.x,body.bottom,station.x,station.y)});
    const project=this.nearestProject();
    if(project)choices.push({kind:'project',id:project.projectId,label:`Посмотреть ${projects.find(item=>item.id===project.projectId)?.name??'проект'}`,distance:Math.abs(body.center.x-project.x-project.width/2)});
    const npc=this.workers?.nearest(body.center.x,body.bottom);
    if(npc)choices.push({kind:'npc',id:npc.id,label:`Поговорить: ${robotDialogues[npc.id as WorkerId].title}`,distance:npc.distance});
    return choices.sort((a,b)=>a.distance-b.distance)[0]??null;
  }
  private openNpc(id:string):void {
    if(!Object.hasOwn(robotDialogues,id))return;
    this.clearInput();this.playerRig?.react('interact');this.workers?.react(id);this.bridge.onInteract(`npc:${id}`);
  }
  interact():void {
    if(!this.ready||this.pausedWorld||document.querySelector('dialog[open]'))return;
    const target=this.nearestInteraction();if(!target)return;
    if(target.kind==='npc'){this.openNpc(target.id);return;}
    if(target.kind==='project'){this.selectProject(target.id);return;}
    this.clearInput();this.playerRig?.react('interact');this.bridge.onInteract(target.id);
  }
  private selectProject(id:string):void {
    if(!this.ready||this.pausedWorld||document.querySelector('dialog[open]')||!projects.some(project=>project.id===id)||this.nearestProject()?.projectId!==id)return;
    this.clearInput();this.playerRig?.react?.('interact');this.bridge.onInteract(`project:${id}`);
  }
  private nearestProject():LibrarySlot|null {
    const body=this.playerBody;if(!body)return null;
    let nearest:LibrarySlot|null=null,distance=180;
    for(const slot of librarySlots){
      const feet=slot.row===0?GROUND:slot.y+slot.height+40;
      if(Math.abs(body.bottom-feet)>135)continue;
      const candidate=Math.abs(body.center.x-(slot.x+slot.width/2));
      if(candidate<distance){nearest=slot;distance=candidate;}
    }
    return nearest;
  }
  private loadGalleryThumbnails():void {
    if(!this.ready||this.galleryAssetsRequested)return;
    this.galleryAssetsRequested=true;let queued=false;
    for(const project of projects){
      if(!project.verified||!project.thumbnail)continue;
      const key=`project-thumb-${project.id}`;this.thumbProjects.set(key,project.id);
      if(this.textures.exists(key))this.library?.setProjectTexture(project.id,key);
      else{this.load.image(key,assetUrl(project.thumbnail));queued=true;}
    }
    if(queued&&!this.load.isLoading())this.load.start();
  }
  private onThumbComplete(key:string,type:string):void {const id=this.thumbProjects.get(key);if(id&&type==='image')this.library?.setProjectTexture(id,key);}
  private onThumbError(file:Phaser.Loader.File):void {const id=this.thumbProjects.get(file.key);if(id)this.library?.setProjectTexture(id,'');}
  private onGalleryLoadComplete():void {for(const[key,id]of this.thumbProjects)if(!this.textures.exists(key))this.library?.setProjectTexture(id,'');}
  resetPlayer():void {
    this.goToZone('entry');
    if(this.ready)this.resizeCamera(true);
  }
  getState():GameState {
    const body=this.playerBody,camera=this.ready?this.cameras.main:undefined;
    const nearProject=this.nearestProject(),station=this.nearestStation(),interaction=this.nearestInteraction();
    const workerState=this.workers?.getState();
    return {
      ready:this.ready,player:{x:body?.center.x??320,y:body?.bottom??GROUND,vx:body?.velocity.x??0,vy:body?.velocity.y??0,grounded:!!body&&(body.blocked.down||body.touching.down||this.onLift())},
      camera:{x:camera?.scrollX??0,y:camera?.scrollY??0,zoom:camera?.zoom??1},
      nearStation:!!station,stationId:station?.id??null,nearProjectId:nearProject?.projectId??null,
      nearNpcId:interaction?.kind==='npc'?interaction.id:null,
      activeInteractionId:interaction?(interaction.kind==='station'?interaction.id:`${interaction.kind}:${interaction.id}`):null,
      canInteract:!!interaction,
      interactionLabel:interaction?.label??'Подойди к роботу, рабочему месту или проекту',
      worldWidth:WORLD_WIDTH,paused:this.pausedWorld,
      zone:zones.find(zone=>(body?.center.x??320)>=zone.start&&(body?.center.x??320)<zone.end)?.name??'Бюро связи',
      fps:this.ready?Math.round(this.game.loop.actualFps):0,npcState:workerState?.summary??'работает',npcCount:workerState?.count??0,completedTasks:stations.filter(s=>taskProgress(s.kind).status==='completed').map(s=>s.kind),
      simTime:this.simTime,npcDetails:workerState?.workers??[],
      lifts:this.liftBodies.map(lift=>({id:lift.layout.id,x:lift.layout.x,y:lift.y,width:lift.layout.w,top:lift.layout.top,bottom:lift.layout.bottom})),
    };
  }
  private onLift():boolean {
    const body=this.playerBody;if(!body||body.velocity.y<0)return false;
    return this.liftBodies.some(lift=>Math.abs(body.bottom-lift.y)<5&&body.right>lift.layout.x+4&&body.left<lift.layout.x+lift.layout.w-4);
  }
  private updateLifts():void {
    const body=this.playerBody;
    for(const lift of this.liftBodies){
      const p=(this.simTime%lift.layout.period)/lift.layout.period;
      const t=p<.25?0:p<.5?(p-.25)*4:p<.75?1:1-(p-.75)*4;
      const smooth=t*t*(3-2*t);
      const next=Phaser.Math.Linear(lift.layout.bottom,lift.layout.top,smooth),dy=next-lift.y;
      const standing=body&&body.velocity.y>=0&&Math.abs(body.bottom-lift.y)<6&&body.right>lift.layout.x+4&&body.left<lift.layout.x+lift.layout.w-4;
      if(standing&&this.player){
        // Exclude the carried distance from Arcade's later delta, including frames without a physics step.
        body.y+=dy;body.prev.y+=dy;body.prevFrame.y+=dy;this.player.y+=dy;body.updateCenter();body.setVelocityY(0);
      }
      lift.y=next;lift.object.y=next+9;
      (lift.object.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      lift.art.y=next;
    }
  }
  update(_time:number,delta:number):void {
    if(!this.ready||!this.playerBody||!this.player||!this.playerRig)return;
    const step=Math.min(delta,50),seconds=step/1000,body=this.playerBody;
    if(!this.pausedWorld){
      this.simTime+=step;this.updateLifts();
      const grounded=body.blocked.down||body.touching.down||this.onLift();
      if(grounded){this.lastGrounded=this.simTime;if(!this.previouslyGrounded)this.playerRig.react?.('land');}
      this.previouslyGrounded=grounded;
      const direction=Number(this.actionHeld('right'))-Number(this.actionHeld('left'));
      body.setAccelerationX(direction*2500);if(direction)this.facing=direction;
      if(this.simTime-this.jumpQueuedAt<=130&&this.simTime-this.lastGrounded<=115){body.setVelocityY(-700);this.jumpQueuedAt=-1000;this.lastGrounded=-1000;}
      const jumpHeld=this.actionHeld('jump');
      if(this.previousJumpHeld&&!jumpHeld&&body.velocity.y<-250)body.setVelocityY(body.velocity.y*.52);
      this.previousJumpHeld=jumpHeld;
      if(body.bottom>GROUND+80)this.resetPlayer();
      this.playerRig.container.setPosition(body.center.x,body.bottom);
      this.playerRig.animate(this.simTime,Math.abs(body.velocity.x)>12,!grounded,this.facing);
      this.factory?.update(this.simTime,step);this.library?.update(this.simTime,step);
      this.workers?.update(this.simTime,step,body.center.x,body.bottom);
      const interaction=this.nearestInteraction();
      const npc=interaction?.kind==='npc'?this.workers?.position(interaction.id):undefined;
      this.npcHint?.setVisible(!!npc);
      if(npc)this.npcHint?.setPosition(npc.x+57,npc.y-126);
      if(body.center.x>LIBRARY_START-700)this.loadGalleryThumbnails();
      const nearest=this.nearestProject();

      if(!this.focusedProjectId)this.library?.setSelected(nearest?.projectId??null);
    }
    const camera=this.cameras.main,easing=this.reducedMotion?1:1-Math.exp(-seconds*8);
    camera.setZoom(Phaser.Math.Linear(camera.zoom,this.baseZoom()*(this.focusedProjectId?1.32:(this.focusedStationId||this.focusedNpcId)?1.18:1),easing));
    const halfW=camera.width/(2*camera.zoom),halfH=camera.height/(2*camera.zoom);
    const project=this.focusedProjectId?librarySlots.find(slot=>slot.projectId===this.focusedProjectId):undefined;
    const station=this.focusedStationId?interactiveStations.find(item=>item.id===this.focusedStationId):undefined;
    const npc=this.focusedNpcId?this.workers?.position(this.focusedNpcId):undefined;
    const focusX=project?project.x+project.width/2:npc?npc.x:station?station.x:body.center.x+this.facing*90;
    const focusY=project?project.y+project.height/2:npc?npc.y-100:station?station.y-210:body.bottom-210;
    this.cameraCenter.x=Phaser.Math.Linear(this.cameraCenter.x,Phaser.Math.Clamp(focusX,halfW,WORLD_WIDTH-halfW),easing);
    this.cameraCenter.y=Phaser.Math.Linear(this.cameraCenter.y,Phaser.Math.Clamp(focusY,halfH,WORLD_HEIGHT-halfH),easing);
    camera.centerOn(this.cameraCenter.x,this.cameraCenter.y);
    if(this.game.loop.time-this.stateSentAt>90){this.stateSentAt=this.game.loop.time;this.bridge.onState(this.getState());}
  }
}
