import "./style.css";
import { Application, Graphics, Text } from "pixi.js";
import Input from "./input";
import { Vector } from "./math";

async function init() {
  const app = new Application();
  const input = new Input();

  const appHolder = document.querySelector("#app")!;

  await app.init({
    resizeTo: appHolder as HTMLElement,
    backgroundColor: "#101010",
    antialias: true,
  });

  appHolder.appendChild(app.canvas);

  const rect = new Graphics();
  rect.rect(0, 0, 50, 50).fill({ color: "#ffffff" });
  rect.pivot = 25;
  rect.position = { x: 100, y: 100 };

  app.stage.addChild(rect);

  const txt = new Text({
    text: "Immortal",
    style: { fill: "#ffffff", fontSize: 18 },
    resolution: 2,
  });

  app.stage.addChild(txt);

  const speed = 10;

  app.ticker.add((tk) => {
    rect.rotation += 0.05 * tk.deltaTime;

    let dx = 0;
    if (input.isKeyDown("d")) dx += 1;
    if (input.isKeyDown("a")) dx -= 1;

    let dy = 0;
    if (input.isKeyDown("s")) dy += 1;
    if (input.isKeyDown("w")) dy -= 1;

    const dir = new Vector(dx, dy).normalize();

    rect.x += dir.x * speed * tk.deltaTime;
    rect.y += dir.y * speed * tk.deltaTime;
  });
}

init();
