import "./style.css";
import { Application, Text } from "pixi.js";
import Input from "./input";
import initWorld from "./world";
import initPlayer from "./player";
import initCamera from "./camera";
import State from "./state";

export let state: State;
export let app: Application;
export let input: Input;

async function init() {
  app = new Application();
  state = new State();
  input = new Input();

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
  initPlayer(app, input);
  initCamera(app);

  app.ticker.add((tk) => {
    txt.text = `Immortal
Resolution: ${app.canvas.width}x${app.canvas.height}
FPS: ${app.ticker.FPS.toFixed(0)}`;
  });
}

init();
