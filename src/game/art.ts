import {buildInfrastructure} from './infrastructure';
import {createGlow} from './lights';
import Phaser from 'phaser';
import { brand } from '../content/brand';
import { assetUrl } from '../content/assetUrl';
import { WORLD_WIDTH, platforms } from '../content/world';
import { buildWorkshops } from './workshopArt';
export { createRobot } from './robots';
export type { RobotRig } from './robots';

const ASSETS=[
  'far-architecture','entry-shell','atelier-shell','industrial-edge','factory-sign',
  'foundation','platform','fan','lamp','design-station','tool-bench','plant',
  'capsule','robot-head','robot-body','robot-leg',
  'robot-arm','designer-beret','factory-depth','design-hall','backend-hall',
  'qa-hall','compiler-core','server-cabinet','diagnostic-chamber','work-console','dispatch-hall',
] as const;
export function preloadArt(scene:Phaser.Scene):void {
  for(const key of ASSETS)scene.load.svg(key,assetUrl(`/assets/${key}.svg`));
  if(brand.markUrl)scene.load.image('altweb-brand-mark',assetUrl(brand.markUrl));
}
function image(scene:Phaser.Scene,key:string,x:number,y:number,depth:number){return scene.add.image(x,y,key).setOrigin(0).setDepth(depth);}
/** An uninterrupted cutaway factory; architecture, working machines and physics stay separate. */
export function buildFactory(scene:Phaser.Scene):{update(time:number,delta:number):void} {
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const glow=(x:number,y:number,size:number,tint:number,depth=-16,alpha=.45)=>createGlow(scene,x,y,size,tint,depth,alpha);
  const farLayers:Phaser.GameObjects.Image[]=[];
  let wasReduced=motion.matches;
  for(let x=-300;x<WORLD_WIDTH;x+=1800)farLayers.push(image(scene,'factory-depth',x,0,-100).setScrollFactor(wasReduced?1:.48,1));
  image(scene,'entry-shell',0,0,-40);
  image(scene,'design-hall',1000,0,-40);
  image(scene,'backend-hall',2500,0,-40);
  image(scene,'qa-hall',5000,0,-40);
  image(scene,'dispatch-hall',10000,0,-40);
  glow(450,360,930,0x4aa59b,-33,.37);glow(1430,370,860,0xc785be,-33,.5);
  glow(3740,400,1100,0x4e9da4,-33,.34);glow(5700,450,780,0x8bb88e,-33,.25);

  const infrastructure=buildInfrastructure(scene);

  // A hanging mast and stepped platforms make the entrance a recognisable place.
  const chains=scene.add.graphics().setDepth(-10);
  chains.lineStyle(6,0x0a202b).lineBetween(303,125,303,232).lineBetween(698,125,698,232);
  chains.lineStyle(2,0x7a827b).lineBetween(300,125,300,232).lineBetween(695,125,695,232);
  glow(495,280,540,0xd47cba,-9,.35);image(scene,'factory-sign',263,201,-8);
  scene.add.text(500,402,'Здесь мы собираем сайты',{
    fontFamily:'Arial, sans-serif',fontSize:'22px',fontStyle:'bold',color:'#c5d2bd',stroke:'#16343e',strokeThickness:5,
  }).setOrigin(.5).setDepth(-6);
  image(scene,'tool-bench',92,575,-3);
  image(scene,'work-console',648,540,-4);
  image(scene,'plant',1108,570.6,12).setScale(.83);
  image(scene,'plant',3220,362,-13).setScale(.6);
  image(scene,'plant',4925,576,12).setScale(.8);
  image(scene,'plant',6855,576,12).setScale(.8);
  image(scene,'plant',10880,576,12).setScale(.8);

  for(const [x,y,scale] of [[98,340,.9],[810,356,.9],[2450,326,.85],[4820,375,.7],[6860,349,.8]] as const){image(scene,'lamp',x,y,-5).setScale(scale);glow(x+58*scale,y+120*scale,240*scale,0xe6b977,-4,.6);}

  // The player sees every real platform exactly where its collision surface lies.
  const rail=scene.add.graphics().setDepth(18);
  for(const p of platforms){
    image(scene,'platform',p.x,p.y,20).setDisplaySize(p.w,58);
    rail.lineStyle(4,0xaaa079).beginPath().moveTo(p.x+12,p.y).lineTo(p.x+12,p.y-40).lineTo(p.x+p.w-12,p.y-40).lineTo(p.x+p.w-12,p.y).strokePath();
    rail.lineStyle(2,0x657a6f);for(let x=p.x+56;x<p.x+p.w-30;x+=68)rail.lineBetween(x,p.y-40,x,p.y);
    rail.lineStyle(11,0x102d37).lineBetween(p.x+20,p.y+37,p.x+47,p.y+66).lineBetween(p.x+p.w-20,p.y+37,p.x+p.w-47,p.y+66);
  }
  // Heavy unequal trusses anchor upper work decks into the shared lower structure.
  const supports=scene.add.graphics().setDepth(-24);
  supports.fillStyle(0x182b38).lineStyle(4,0x5b5967)
    .fillTriangle(1970,486,2145,654,2310,486).strokeTriangle(1970,486,2145,654,2310,486);
  supports.fillStyle(0x19343d).fillTriangle(2020,496,2145,611,2261,496);
  supports.lineStyle(26,0x102a35).beginPath().moveTo(3470,547).lineTo(3640,718).lineTo(3890,547).strokePath();
  supports.lineStyle(14,0x3d5960).beginPath().moveTo(3470,547).lineTo(3640,718).lineTo(3890,547).strokePath();
  supports.lineStyle(3,0x708779).lineBetween(3466,547,3636,714).lineBetween(3645,714,3895,547);
  supports.fillStyle(0x183339).lineStyle(3,0x5b7770).fillRect(6288,552,32,168).strokeRect(6288,552,32,168)
    .fillRect(6725,552,44,168).strokeRect(6725,552,44,168);
  supports.lineStyle(11,0x324e50).lineBetween(6320,706,6510,552);
  for(let x=0;x<WORLD_WIDTH;x+=520)image(scene,'foundation',x,720,20);
  const workshops=buildWorkshops(scene);

  const motes:Phaser.GameObjects.Arc[]=[];
  for(let i=0;i<65;i++)motes.push(scene.add.circle((i*173+71)%WORLD_WIDTH,120+(i*83)%550,i%3===0?1.5:1,i%4===0?0xf4d5a1:0x8ac7bd,.2).setDepth(40));
  return {update(time,delta){
    workshops.update(time,delta);
    infrastructure.update(time,motion.matches);
    if(wasReduced!==motion.matches){wasReduced=motion.matches;for(const layer of farLayers)layer.setScrollFactor(wasReduced?1:.48,1);}
    if(motion.matches)return;
    const view=scene.cameras.main.worldView;
    for(let i=0;i<motes.length;i++){const m=motes[i]!;if(m.x<view.left||m.x>view.right)continue;m.y-=delta*.003*(1+i%3);if(m.y<70)m.y=680;m.alpha=.15+Math.sin(time*.0006+i)*.07;}
  }};
}
