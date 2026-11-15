import {readFileSync} from 'node:fs';
// Existing project previews are WebP; read their declared dimensions without another dependency.
export function imageSize(path){
 const b=readFileSync(path);if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')throw Error('Expected WebP: '+path);
 const type=b.toString('ascii',12,16);
 if(type==='VP8X')return {width:1+b.readUIntLE(24,3),height:1+b.readUIntLE(27,3)};
 if(type==='VP8 ')return {width:b.readUInt16LE(26)&16383,height:b.readUInt16LE(28)&16383};
 if(type==='VP8L'){const n=b.readUInt32LE(21);return {width:(n&16383)+1,height:((n>>>14)&16383)+1};}
 throw Error('Unsupported WebP: '+path);
}
