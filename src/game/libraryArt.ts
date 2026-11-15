import {buildLibraryWork} from './libraryWork';
import {createGlow} from './lights';
import Phaser from 'phaser';
import { LIBRARY_START, librarySlots, type LibrarySlot } from '../content/libraryLayout';
import type { PortfolioProject, ShowcaseStatus } from '../content/projectTypes';
import { assetUrl } from '../content/assetUrl';

/** Real website screenshots arrive independently through setProjectTexture. */
export interface LibraryArtHandle {
  update(time:number,delta:number):void;
  setProjectTexture(id:string,textureKey:string):void;
  setSelected(id:string|null):void;
}

const LIBRARY_ASSETS = [
  'library-arches','library-conveyor','library-shelf','library-frame',
  'library-lift','library-cart','library-sign',
] as const;

const STATUS_LABELS:Record<ShowcaseStatus,string> = {
  studio:'Проект студии', collection:'Подборка демо', prototype:'Прототип',
  demo:'Демонстрация', concept:'Концепт', owner_review_needed:'Статус уточняется',
  education:'Учебный проект',
};

export function preloadLibraryArt(scene:Phaser.Scene):void {
  for(const key of LIBRARY_ASSETS) scene.load.svg(key,assetUrl(`/assets/${key}.svg`));
}

interface FrameRecord {
  slot:LibrarySlot;
  placeholder:Phaser.GameObjects.Text;
  thumbnail?:Phaser.GameObjects.Image;
  textureKey:string;
}

function image(scene:Phaser.Scene,key:string,x:number,y:number,depth:number) {
  return scene.add.image(x,y,key).setOrigin(0).setDepth(depth);
}

/** One uninterrupted tall archive. The tiered shelves are background, not jump gates. */
export function buildLibrary(
  scene:Phaser.Scene,
  projects:PortfolioProject[],
  onSelect:(id:string)=>void,
):LibraryArtHandle {
  const byId=new Map(projects.map(project=>[project.id,project]));
  const frames=new Map<string,FrameRecord>();
  let selectedId:string|null=null;
  let hoverId:string|null=null;

  // The new warm hall starts at the actual junction; no preview of it at spawn.
  image(scene,'library-arches',LIBRARY_START,0,-41);
  const rearMechanics=scene.add.graphics().setDepth(-35);
  rearMechanics.fillStyle(0x193335).fillRect(9600,200,400,520);
  rearMechanics.lineStyle(2,0x8c9676,.25);
  rearMechanics.strokeCircle(7430,381,254).strokeCircle(8320,337,291);
  rearMechanics.lineStyle(1,0x7c856b,.25);
  rearMechanics.lineBetween(7050,709,9550,709);

  // Different shelf spans on each tier, with inset brackets and warm edge strips.
  const shelfSpans:Array<[number,number,number]> = [
    [7100,699,710],[7835,699,1070],[8930,699,340],
    [7100,485,1070],[8200,485,1070],
    [7100,271,1070],[8200,271,340],
  ];
  for(const [x,y,width] of shelfSpans) {
    image(scene,'library-shelf',x,y,-8).setDisplaySize(width,33);
  }

  image(scene,'library-sign',8695,80,-5);
  image(scene,'plant',8539,133,-4).setScale(.75);
  image(scene,'plant',7034,576,12).setScale(.8);
  image(scene,'plant',9268,579.6,12).setScale(.78).setFlipX(true);
  image(scene,'library-cart',9430,631,24).setScale(.86);

  // Quiet directional work lights sit above shelves. Screens render above all light art,
  // so the captured pixels are never tinted or obscured by a generated illustration.
  const lights:Array<[number,number,number]> = [
    [7255,462,.42],[7990,462,.42],[9070,462,.42],
    [7640,248,.42],[8710,248,.42],[9070,248,.42],
    [7270,34,.42],[8360,34,.42],
  ];
  for(const [x,y,scale] of lights) image(scene,'lamp',x,y,-6).setScale(scale);
  for(const [x,y,size] of [[7330,358,680],[8190,350,800],[9045,394,690]])createGlow(scene,x!,y!,size!,0xd2ad70,-21,.45);

  // Exact shared slots: six lower, six middle, four upper; screenshots are individual
  // lazy textures and may be replaced independently without repainting the environment.
  for(const slot of librarySlots) {
    const project=byId.get(slot.projectId);
    scene.add.rectangle(slot.x+slot.width/2+4,slot.y+slot.height/2+7,slot.width+6,slot.height+5,0x061e25,.45)
      .setDepth(-4);
    image(scene,'library-frame',slot.x,slot.y,-3);
    const placeholder=scene.add.text(slot.x+slot.width/2,slot.y+86,
      project?.verified&&project.thumbnail?'Превью загружается':'Превью недоступно',{
        fontFamily:'Arial, sans-serif',fontSize:'13px',color:'#96aaa0',align:'center',
      }).setOrigin(.5).setDepth(-1);
    const name=project?.name??'Материалы ожидаются';
    scene.add.text(slot.x+9,slot.y+187,name,{
      fontFamily:'Arial, sans-serif',fontSize:'13px',fontStyle:'bold',color:'#d5d3b8',
    }).setFixedSize(264,18).setDepth(3);
    if(project) {
      scene.add.text(slot.x+slot.width/2,slot.y+172,STATUS_LABELS[project.status],{
        fontFamily:'Arial, sans-serif',fontSize:'9px',color:'#aebda9',
      }).setOrigin(.5,0).setDepth(2);
      const hit=scene.add.zone(slot.x,slot.y,slot.width,slot.height).setOrigin(0).setDepth(8)
        .setInteractive({useHandCursor:true});
      hit.on('pointerdown',()=>onSelect(project.id));
      hit.on('pointerover',()=>{hoverId=project.id;drawSelection();});
      hit.on('pointerout',()=>{hoverId=null;drawSelection();});
    }
    frames.set(slot.projectId,{slot,placeholder,textureKey:''});
  }

  const selection=scene.add.graphics().setDepth(7);
  function drawSelection():void {
    selection.clear();
    for(const [id,color] of [[selectedId,0x83d2be],[hoverId,0xe3bc7c]] as const) {
      if(!id) continue;
      const record=frames.get(id); if(!record)continue;
      const {x,y,width,height}=record.slot;
      selection.lineStyle(3,color,.95).strokeRoundedRect(x-3,y-3,width+6,height+6,10);
      selection.lineStyle(4,color,.95).lineBetween(x+8,y-7,x+39,y-7)
        .lineBetween(x+width-8,y+height+7,x+width-39,y+height+7);
    }
  }

  const work=buildLibraryWork(scene);
  return {
    update(time:number,_delta:number):void {work.update(time);},
    setProjectTexture(id:string,textureKey:string):void {
      const record=frames.get(id);if(!record)return;
      if(record.textureKey===textureKey&&record.thumbnail)return;
      if(!textureKey||!scene.textures.exists(textureKey)) {
        record.thumbnail?.setVisible(false);
        record.placeholder.setText('Превью недоступно').setVisible(true);
        record.textureKey='';return;
      }
      const {slot}=record;
      const tex=scene.textures.get(textureKey).getSourceImage() as {width:number;height:number};
      const scale=Math.min(256/tex.width,160/tex.height);
      if(record.thumbnail)record.thumbnail.setTexture(textureKey).setVisible(true);
      else record.thumbnail=scene.add.image(slot.x+140,slot.y+90,textureKey).setDepth(0);
      record.thumbnail.setScale(scale);
      record.placeholder.setVisible(false);
      record.textureKey=textureKey;
    },
    setSelected(id:string|null):void {
      if(id===selectedId)return;
      selectedId=id;drawSelection();
    },
  };
}
