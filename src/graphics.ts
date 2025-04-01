import { Vector } from "./math";
import { Transform } from "./transforms";
import * as Zen from "./zen";

async function init() {
  Zen.createResource(Renderer, new Renderer());
  Zen.createResource(Viewport, new Viewport());

  const canvas = document.querySelector("#zen-app")! as HTMLCanvasElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  // new ResizeObserver(onResize).observe(canvas, { box: "content-box" });

  Zen.createSystem({ with: [], resources: [] }, { foreach: render });
}

export class Renderer {}

export class Viewport {
  screen: Vector = new Vector();
  source?: Zen.Entity;

  constructor(source?: Zen.Entity) {
    this.source = source;
  }

  transform(): Transform | undefined {
    return this.source?.getAttribute<Transform>(Transform);
  }

  //TODO screen space utilities
}

function render() {}

// adapted from WebGl2Fundementals
// https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
// function onResize(entries: ResizeObserverEntry[]) {
//   for (const entry of entries) {
//     const r = Zen.getResource<Renderer>(Renderer);
//     const vp = Zen.getResource<Viewport>(Viewport);
//     if (!r || !vp || entry.target !== r.renderer.canvas) continue;

//     const size = entry.devicePixelContentBoxSize[0];
//     const displayWidth = Math.round(size.inlineSize);
//     const displayHeight = Math.round(size.blockSize);

//     vp.screen.x = displayWidth;
//     vp.screen.y = displayHeight;

//     const needResize =
//       r.renderer.canvas.width !== displayWidth ||
//       r.renderer.canvas.height !== displayHeight;

//     if (needResize) {
//       r.renderer.resize(displayWidth, displayHeight);

//       const o = Zen.getResource<WorldOrigin>(WorldOrigin);
//       if (o) r.renderer.render(o);
//     }
//   }
// }

init();
