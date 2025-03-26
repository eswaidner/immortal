import "./style.css";
import { Application, Text } from "pixi.js";
import Input from "./input";
import initWorld from "./world";
import initPlayer from "./player";
import initCamera from "./camera";
import State, { Database } from "./state";
import { g, initGlobals } from "./globals";

async function init() {
  initGlobals({
    app: new Application(),
    state: new State(),
    input: new Input(),
  });

  g.state.addDatabase(new Database("main"));
  const db = g.state.getDatabase("main");

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
    txt.text = `Immortal
Resolution: ${g.app.canvas.width}x${g.app.canvas.height}
FPS: ${g.app.ticker.FPS.toFixed(0)}`;
  });
}

init();
