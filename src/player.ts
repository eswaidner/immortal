import { Application, Assets, Sprite, Ticker } from "pixi.js";
import Input from "./input";
import { Vector } from "./math";

export default async function initPlayer(app: Application, input: Input) {
  const scale = 0.45;

  const dudeTex = await Assets.load("/dude_1.png");
  const dude = new Sprite(dudeTex);
  dude.anchor = 0.5;
  dude.scale = scale;
  dude.position = { x: app.screen.width * 0.5, y: app.screen.height * 0.5 };
  app.stage.addChild(dude);

  app.ticker.add((tk) => {
    move(tk, dude, input, scale);
  });
}

function move(tk: Ticker, player: Sprite, input: Input, scale: number) {
  const speed = 10;

  let dx = 0;
  if (input.isKeyDown("d")) dx += 1;
  if (input.isKeyDown("a")) dx -= 1;

  let dy = 0;
  if (input.isKeyDown("s")) dy += 1;
  if (input.isKeyDown("w")) dy -= 1;

  const dir = new Vector(dx, dy).normalize();

  if (dir.x !== 0) {
    player.scale.x = dir.x > 0 ? scale : -scale;
  }

  player.x += dir.x * speed * tk.deltaTime;
  player.y += dir.y * speed * tk.deltaTime;
}
