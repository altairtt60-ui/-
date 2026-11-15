export { WORLD_WIDTH } from './world';
export const LIBRARY_START = 7000;
export const LIBRARY_ENTRY = 7310;
export const SHOWCASE_ORDER = ['pitlane-auto','kn-detailing','avtozabota-detailing','gaziza','nogti-mania','dans-le-garage','chb-barbershop','kroshka','fresh-cleaning','clinic-demo','ielts-embassy','classlab','altweb-portfolio','altweb-atelier','altweb-design','altweb-playground'];
export interface LibrarySlot { projectId:string; x:number; y:number; width:number; height:number; row:number; col:number; }
export const librarySlots:LibrarySlot[] = SHOWCASE_ORDER.map((projectId,index)=>{
  const row=Math.floor(index/6), col=index%6;
  return {projectId,x:7135+365*col,y:[514,300,86][row]!,width:280,height:184,row,col};
});
