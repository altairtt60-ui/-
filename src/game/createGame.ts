import Phaser from 'phaser';
import type { GameAPI, GameBridge } from '../contracts';
import { FactoryScene } from './FactoryScene';

export function createGame(parent: HTMLElement, bridge: GameBridge): GameAPI {
  const scene = new FactoryScene(bridge);
  const game = new Phaser.Game({
    // These layered rasterized SVG sprites use Canvas2D; no GPU-only effects.
    // It also avoids costly software WebGL in cloud/low-power environments.
    type: Phaser.CANVAS,
    parent,
    width: Math.max(1, parent.clientWidth),
    height: Math.max(1, parent.clientHeight),
    backgroundColor: '#071c25',
    transparent: false,
    antialias: true,
    roundPixels: false,
    pixelArt: false,
    powerPreference: 'high-performance',
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1700 }, debug: false, fps: 60, fixedStep: true } },
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    // HTML controls own outside events; Phaser must not hit gallery frames through the map.
    input: { keyboard: false, gamepad: false, windowEvents: false },
    fps: { target: 60, forceSetTimeOut: false },
    audio: { noAudio: true },
    scene: [scene],
    callbacks: {
      postBoot: (bootedGame: Phaser.Game) => {
        bootedGame.canvas.tabIndex = 0;
        bootedGame.canvas.setAttribute('role', 'application');
        bootedGame.canvas.setAttribute('aria-label', 'Фабрика Altweb. A и D или стрелки — идти, пробел — прыгать, E — открыть рабочее место.');
      },
    },
  });
  const onCanvasPointerDown = (event: PointerEvent): void => {
    if (event.target === game.canvas) game.canvas.focus({ preventScroll: true });
  };
  parent.addEventListener('pointerdown', onCanvasPointerDown);
  const observer = new ResizeObserver(entries => {
    const rect = entries[0]?.contentRect;
    if (rect && rect.width > 0 && rect.height > 0 && game.isBooted) game.scale.resize(Math.round(rect.width), Math.round(rect.height));
  });
  observer.observe(parent);

  return {
    destroy: () => { observer.disconnect(); parent.removeEventListener('pointerdown', onCanvasPointerDown); game.destroy(true); },
    setInput: (action, pressed) => scene.setInput(action, pressed),
    setPaused: paused => scene.setPaused(paused),
    focusStation: active => scene.focusStation(active),
    focusInteraction: id => scene.focusInteraction(id),
    goToZone: id => scene.goToZone(id),
    completeTask: kind => scene.completeTask(kind),
    focusProject: id => scene.focusProject(id),
    goToLibrary: () => scene.goToLibrary(),
    interact: () => scene.interact(),
    resetPlayer: () => scene.resetPlayer(),
    getState: () => scene.getState(),
  };
}
