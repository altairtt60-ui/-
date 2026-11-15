import Phaser from 'phaser';

/** Canvas2D does not apply Image tint; bake each light colour into a cached texture. */
export function glowTexture(scene:Phaser.Scene,color:number):string {
  const key=`factory-glow-${color.toString(16)}`;
  if(scene.textures.exists(key))return key;
  const texture=scene.textures.createCanvas(key,256,256);
  if(!texture)return '__WHITE';
  const r=(color>>16)&255,g=(color>>8)&255,b=color&255;
  const gradient=texture.context.createRadialGradient(128,128,0,128,128,128);
  for(const [position,alpha]of [[0,.43],[.24,.19],[.62,.05],[1,0]])gradient.addColorStop(position!,`rgba(${r},${g},${b},${alpha})`);
  texture.context.fillStyle=gradient;texture.context.fillRect(0,0,256,256);texture.refresh();
  return key;
}

export function createGlow(scene:Phaser.Scene,x:number,y:number,size:number,color:number,depth=-16,alpha=.45):Phaser.GameObjects.Image {
  return scene.add.image(x,y,glowTexture(scene,color)).setDisplaySize(size,size).setBlendMode(Phaser.BlendModes.ADD).setAlpha(alpha).setDepth(depth);
}
