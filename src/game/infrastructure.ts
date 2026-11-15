import type Phaser from 'phaser';
import {WORLD_WIDTH} from '../content/world';

type Point={x:number;y:number};
// One transfer line carries the same modules through every production department.
export const transportWaypoints:ReadonlyArray<readonly[number,number]>=[
 [-80,135],[625,135],[705,55],[855,55],[945,220],[1070,220],[1150,150],
 [1480,150],[1560,255],[1825,255],[1940,100],[2700,100],[2790,55],
 [3510,55],[3625,110],[4400,110],[4510,150],[4930,150],[5120,90],
 [5440,90],[5540,38],[9600,38],[9770,135],[10180,135],[10320,70],[11280,70],
];

function rounded(points:ReadonlyArray<readonly[number,number]>):Point[]{
 const result:Point[]=[{x:points[0]![0],y:points[0]![1]}];
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1]!,b=points[i]!,c=points[i+1]!;
  const before=Math.hypot(b[0]-a[0],b[1]-a[1]),after=Math.hypot(c[0]-b[0],c[1]-b[1]);
  const radius=Math.min(32,before*.3,after*.3);
  const p={x:b[0]+(a[0]-b[0])*radius/before,y:b[1]+(a[1]-b[1])*radius/before};
  const q={x:b[0]+(c[0]-b[0])*radius/after,y:b[1]+(c[1]-b[1])*radius/after};
  result.push(p);
  for(let k=1;k<=8;k++){const t=k/8,u=1-t;result.push({x:u*u*p.x+2*u*t*b[0]+t*t*q.x,y:u*u*p.y+2*u*t*b[1]+t*t*q.y});}
 }
 const last=points.at(-1)!;result.push({x:last[0],y:last[1]});return result;
}
const route=rounded(transportWaypoints);
const cumulative=[0];
for(let i=1;i<route.length;i++)cumulative.push(cumulative[i-1]!+Math.hypot(route[i]!.x-route[i-1]!.x,route[i]!.y-route[i-1]!.y));
export const transportLength=cumulative.at(-1)!;
export function transportPoint(distance:number):Point&{angle:number}{
 const d=((distance%transportLength)+transportLength)%transportLength;
 let i=1;while(i<cumulative.length-1&&cumulative[i]!<d)i++;
 const a=route[i-1]!,b=route[i]!,t=(d-cumulative[i-1]!)/(cumulative[i]!-cumulative[i-1]!);
 return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)};
}

function pipe(g:Phaser.GameObjects.Graphics,points:Point[],width:number,metal=0x49656d):void{
 g.lineStyle(width+9,0x081e28).strokePoints(points,false);
 g.lineStyle(width,metal).strokePoints(points,false);
 g.lineStyle(width-10,0x173744).strokePoints(points,false);
 g.lineStyle(2,0x829b97,.5).strokePoints(points.map(p=>({x:p.x,y:p.y-width*.29})),false);
}

/** Transport, ventilation and lower service trunk are fitted to the actual building. */
export function buildInfrastructure(scene:Phaser.Scene):{update(time:number,reduced:boolean):void}{
 const transport=scene.add.graphics().setDepth(-19);
 pipe(transport,route,58,0x527e80);
 transport.lineStyle(2,0x8bb8ac,.65).strokePoints(route,false);
 const brackets=scene.add.graphics().setDepth(-18);
 for(let distance=190;distance<transportLength-100;distance+=300){
  const p=transportPoint(distance);
  if(Math.abs(p.angle)>.2||p.y<52)continue;
  brackets.lineStyle(5,0x102a33).lineBetween(p.x,0,p.x,p.y-31);
  brackets.lineStyle(1,0x5d7b77).lineBetween(p.x-2,0,p.x-2,p.y-31);
  brackets.fillStyle(0xa18f64).lineStyle(2,0x203c43).fillRoundedRect(p.x-9,p.y-34,18,68,3).strokeRoundedRect(p.x-9,p.y-34,18,68,3);
  brackets.fillStyle(0xd7c799).fillCircle(p.x,p.y-25,2.5).fillCircle(p.x,p.y+25,2.5);
 }
 const capsules=Array.from({length:13},(_,index)=>({image:scene.add.image(0,0,'capsule').setScale(.56).setDepth(-18.5),offset:index*transportLength/13}));
 const ducts=scene.add.graphics().setDepth(-29);
 const housings=scene.add.graphics().setDepth(-16),grilles=scene.add.graphics().setDepth(-14);
 pipe(ducts,rounded([[993,175],[1015,175],[1015,137]]),31,0x55676a);
 ducts.fillStyle(0x73857a).lineStyle(2,0x102c34).fillRoundedRect(982,151,18,48,3).strokeRoundedRect(982,151,18,48,3);
 const units=[
  {x:560,y:464,size:82,roofX:725,machineY:566,speed:.00021},
  {x:1015,y:80,size:88,roofX:1015,machineY:0,speed:-.00012},
  {x:2730,y:220,size:86,roofX:2730,machineY:297,speed:.00016},
  {x:4730,y:390,size:76,roofX:4730,machineY:0,speed:-.00013},
  {x:6700,y:215,size:88,roofX:6700,machineY:345,speed:.00015},
 ];
 const fans:Phaser.GameObjects.Image[]=[];
 for(const unit of units){
  const {x,y,size,roofX,machineY}=unit,r=size/2;
  const riser=rounded([[x,y-r-13],[x,y-r-45],[roofX,y-r-45],[roofX,-35]].filter((p,i,a)=>i===0||p[0]!==a[i-1]![0]||p[1]!==a[i-1]![1]) as Array<[number,number]>);
  pipe(ducts,riser,31,0x55676a);
  if(machineY>0){pipe(ducts,[{x,y:y+r+13},{x,y:machineY}],27,0x55676a);ducts.fillStyle(0x6b7d75).lineStyle(2,0x102c34).fillRoundedRect(x-23,machineY-6,46,13,3).strokeRoundedRect(x-23,machineY-6,46,13,3);}
  housings.fillStyle(0x0a2029).lineStyle(3,0x627c79).fillRoundedRect(x-r-17,y-r-17,size+34,size+34,12).strokeRoundedRect(x-r-17,y-r-17,size+34,size+34,12);
  housings.fillStyle(0x071b24).fillCircle(x,y,r+3).lineStyle(5,0x78938a).strokeCircle(x,y,r+4);
  for(const dx of [-r-7,r+7])for(const dy of [-r-7,r+7])housings.fillStyle(0xa0ab96).fillCircle(x+dx,y+dy,2.5);
  fans.push(scene.add.image(x,y,'fan').setDisplaySize(size,size).setDepth(-15));
  grilles.lineStyle(2,0x304e56,.9);
  for(const dy of [-.55,-.25,.05,.35,.65]){
   const chord=Math.sqrt(Math.max(0,r*r-(r*dy)*(r*dy)))*.92;
   grilles.lineBetween(x-chord,y+r*dy,x+chord,y+r*dy);
  }
  grilles.lineStyle(2,0x88a49c,.65).strokeCircle(x,y,r+4);
 }
 // A fitted junction joins unequal hall beam heights rather than leaving exposed cuts.
 const junctions=scene.add.graphics().setDepth(-25);
 for(const [x,y,w,h]of [[1035,275,80,105],[2500,180,62,75],[5000,244,64,62],[6990,222,54,65],[9995,260,58,62]] as const){
  junctions.fillStyle(0x243e47).lineStyle(3,0x5e7775).fillRoundedRect(x-w/2,y-h/2,w,h,7).strokeRoundedRect(x-w/2,y-h/2,w,h,7);
  for(const dx of [-w/2+9,w/2-9])for(const dy of [-h/2+10,h/2-10])junctions.fillStyle(0x859c8d).fillCircle(x+dx,y+dy,2.5);
 }
 pipe(junctions,[{x:9600,y:220},{x:9700,y:220},{x:9750,y:260},{x:10005,y:260}],24,0x5d6659);
 const service=scene.add.graphics().setDepth(60);
 const lower=rounded([[-70,858],[900,858],[1030,879],[2420,879],[2550,850],[4880,850],[5040,878],[6930,878],[7090,853],[9800,853],[9970,875],[WORLD_WIDTH+70,875]]);
 pipe(service,lower,41,0x415964);
 for(let x=180;x<WORLD_WIDTH;x+=390){service.fillStyle(0x72837a).lineStyle(2,0x112b35).fillRoundedRect(x,833,16,55,3).strokeRoundedRect(x,833,16,55,3);}
 return{update(time,reduced){
  const view=scene.cameras.main.worldView;
  for(let i=0;i<capsules.length;i++){
   const packet=capsules[i]!,p=transportPoint(packet.offset+(reduced?0:time*.037));
   packet.image.setPosition(p.x,p.y).setRotation(p.angle).setVisible(p.x>view.left-100&&p.x<view.right+100);
  }
  for(let i=0;i<fans.length;i++)if(!reduced&&fans[i]!.x>view.left-100&&fans[i]!.x<view.right+100)fans[i]!.rotation=time*units[i]!.speed;
 }};
}
