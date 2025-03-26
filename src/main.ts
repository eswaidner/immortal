import "./style.css";
import { Application, Container, Text } from "pixi.js";
import Input from "./input";
import initWorld from "./world";
import initPlayer from "./player";
import initCamera from "./camera";
import State, { Database } from "./state";
import { g, initGlobals } from "./globals";
import { Vector } from "./math";

async function init() {
  initGlobals({
    app: new Application(),
    state: new State(),
    input: new Input(),
  });

  g.state.addDatabase(new Database("main"));
  const db = g.state.getDatabase("main");

  db.addAttribute<Vector>("direction");
  db.addAttribute<{}>("face-direction");
  db.addAttribute<[Container, number]>("container");

  const appHolder = document.querySelector("#app")!;

  await g.app.init({
    resizeTo: appHolder as HTMLElement,
    backgroundColor: "#304025",
    antialias: true,
    roundPixels: false,
    autoDensity: true,
    resolution: 1 * window.devicePixelRatio,
  });

  g.app.ticker.maxFPS = 0;

  appHolder.appendChild(g.app.canvas);

  initWorld();
  initPlayer();
  initCamera();

  const txt = new Text({
    text: `Immortal`,
    style: { fill: "#ffffff", fontSize: 18 },
  });

  g.app.stage.addChild(txt);

  g.app.ticker.add((tk) => {
    faceDirection();

    txt.text = `Immortal
Resolution: ${g.app.canvas.width}x${g.app.canvas.height}
FPS: ${g.app.ticker.FPS.toFixed(0)}`;
  });
}

function faceDirection() {
  const db = g.state.getDatabase("main");
  const q = db.query({ include: ["face-direction", "direction", "container"] });

  for (let ent of q.entities) {
    const dir = ent.attributes["direction"] as Vector;
    const [c, scale] = ent.attributes["container"] as [Container, number];

    if (dir.x !== 0) {
      c.scale.x = dir.x > 0 ? scale : -scale;
    }
  }
}

init();
