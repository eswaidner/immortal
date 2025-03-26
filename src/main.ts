import "./style.css";
import { Application, Assets, Sprite, Text } from "pixi.js";
import Input from "./input";
import { Vector } from "./math";
import initWorld from "./world";

async function init() {
  const app = new Application();
  const input = new Input();

  const appHolder = document.querySelector("#app")!;

  await app.init({
    resizeTo: appHolder as HTMLElement,
    backgroundColor: "#304025",
    antialias: true,
    roundPixels: false,
    autoDensity: true,
    resolution: 1 * window.devicePixelRatio,
  });

  app.ticker.maxFPS = 0;

  appHolder.appendChild(app.canvas);

  const txt = new Text({
    text: `Immortal`,
    style: { fill: "#ffffff", fontSize: 18 },
  });

  app.stage.addChild(txt);

  initWorld(app);

  const scale = 0.45;

  const dudeTex = await Assets.load("/dude_1.png");
  const dude = new Sprite(dudeTex);
  dude.anchor = 0.5;
  dude.scale = scale;
  dude.position = { x: app.screen.width * 0.5, y: app.screen.height * 0.5 };
  app.stage.addChild(dude);

  const speed = 10;

  app.ticker.add((tk) => {
    let dx = 0;
    if (input.isKeyDown("d")) dx += 1;
    if (input.isKeyDown("a")) dx -= 1;

    let dy = 0;
    if (input.isKeyDown("s")) dy += 1;
    if (input.isKeyDown("w")) dy -= 1;

    const dir = new Vector(dx, dy).normalize();

    if (dir.x !== 0) {
      dude.scale.x = dir.x > 0 ? scale : -scale;
    }

    dude.x += dir.x * speed * tk.deltaTime;
    dude.y += dir.y * speed * tk.deltaTime;

    txt.text = `Immortal
Resolution: ${app.canvas.width}x${app.canvas.height}
FPS: ${app.ticker.FPS.toFixed(0)}`;
  });
}

init();
