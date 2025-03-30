import { Container, Graphics, WebGLRenderer } from "pixi.js";
import { Transform } from "./transforms";
import * as Zen from "./zen";

async function init() {
  Zen.defineAttribute(Renderer);
  Zen.defineAttribute(Origin);
  Zen.defineAttribute(SceneObject);

  Zen.createSystem({ include: [Origin] }, offsetOrigin);
  Zen.createSystem({ include: [Transform, SceneObject] }, syncTransforms);
  Zen.createSystem({ include: [Renderer] }, render);

  const canvas = document.querySelector("#zen-app")! as HTMLCanvasElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  // canvas.style.border = "1px solid red";

  const renderer = new WebGLRenderer();
  await renderer.init({
    antialias: true,
    canvas,
  });

  new ResizeObserver(onResize).observe(canvas, { box: "content-box" });

  const origin = new Container();

  const gfx = new Graphics().rect(0, 0, 50, 50).fill(0xffffff);
  gfx.pivot = 25;
  origin.addChild(gfx);

  Zen.createEntity("renderer").addAttribute(Renderer, new Renderer(renderer));

  Zen.createEntity("origin").addAttribute(Origin, new Origin(origin));
}

class Renderer {
  renderer: WebGLRenderer;

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
  }
}

export class Origin {
  container: Container;

  constructor(container: Container) {
    this.container = container;
  }
}

export class SceneObject {
  container: Container;

  constructor(container: Container) {
    this.container = container;
  }
}

function offsetOrigin(e: Zen.Entity) {
  const o = e.getAttribute<Origin>(Origin)!;

  const vp = Zen.getEntity("viewport")?.getAttribute<Transform>(Transform);
  const r = Zen.getEntity("renderer")?.getAttribute<Renderer>(Renderer);
  if (!vp || !r) return;

  o.container.pivot = {
    x: vp.pos.x,
    y: vp.pos.y,
  };

  o.container.x = -vp.pos.x + r.renderer.screen.width * 0.5;
  o.container.y = -vp.pos.y + r.renderer.screen.height * 0.5;
  o.container.rotation = -vp.rot;
  o.container.scale.x = 1 / vp.scale.x;
  o.container.scale.y = 1 / vp.scale.y;
}

// TODO ignore locally positioned containers
function syncTransforms(e: Zen.Entity) {
  const trs = e.getAttribute<Transform>(Transform)!;
  const so = e.getAttribute<SceneObject>(SceneObject)!;

  so.container.x = trs.pos.x;
  so.container.y = trs.pos.y;
  so.container.rotation = trs.rot;
  so.container.scale.x = trs.scale.x;
  so.container.scale.y = trs.scale.y;
}

function render(e: Zen.Entity) {
  const r = e.getAttribute<Renderer>(Renderer)!;
  const o = Zen.getEntity("origin")?.getAttribute<Origin>(Origin);
  if (o) {
    r.renderer.render(o.container);
  }
}

// adapted from WebGl2Fundementals
// https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
function onResize(entries: ResizeObserverEntry[]) {
  for (const entry of entries) {
    const r = Zen.getEntity("renderer")?.getAttribute<Renderer>(Renderer);
    if (!r || entry.target !== r.renderer.canvas) continue;

    const size = entry.devicePixelContentBoxSize[0];
    const displayWidth = Math.round(size.inlineSize);
    const displayHeight = Math.round(size.blockSize);

    const needResize =
      r.renderer.canvas.width !== displayWidth ||
      r.renderer.canvas.height !== displayHeight;

    if (needResize) {
      r.renderer.resize(displayWidth, displayHeight);

      const o = Zen.getEntity("origin")?.getAttribute<Origin>(Origin);
      if (o) r.renderer.render(o);
    }
  }
}

await init();
