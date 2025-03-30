import { Assets, Container, Sprite, WebGLRenderer } from "pixi.js";
import { Transform } from "./transforms";
import * as Zen from "./zen";

async function init() {
  Zen.defineAttribute(Renderer);
  Zen.defineAttribute(Origin);
  Zen.defineAttribute(SceneObject);

  Zen.createSystem({ include: [Transform, SceneObject] }, syncTransforms);
  Zen.createSystem({ include: [Renderer] }, render);

  const renderer = new WebGLRenderer();
  await renderer.init({
    backgroundColor: "#304025",
    antialias: true,
  });

  const appHolder = document.querySelector("#zen-app")!;
  appHolder.appendChild(renderer.canvas);
  renderer.canvas.style.width = "100%";
  renderer.canvas.style.height = "100%";
  // renderer.canvas.style.border = "1px solid red";

  const origin = new Container();

  const gfx = Sprite.from(await Assets.load("./dude_1.png"));
  origin.addChild(gfx);

  new ResizeObserver(onResize).observe(appHolder, { box: "content-box" });

  Zen.createEntity("renderer").setAttribute(
    Renderer,
    new Renderer(renderer, appHolder),
  );

  Zen.createEntity("origin").setAttribute(Origin, new Origin(origin));
}

class Renderer {
  renderer: WebGLRenderer;
  canvasHolder: Element;

  constructor(renderer: WebGLRenderer, canvasHolder: Element) {
    this.renderer = renderer;
    this.canvasHolder = canvasHolder;
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
  if (o) r.renderer.render(o.container);
}

// adapted from WebGl2Fundementals
// https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
function onResize(entries: ResizeObserverEntry[], _: ResizeObserver) {
  for (const entry of entries) {
    const r = Zen.getEntity("renderer")?.getAttribute<Renderer>(Renderer);
    if (!r || entry.target !== r.canvasHolder) continue;

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
