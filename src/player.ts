import { Assets, Container, Sprite, Ticker } from "pixi.js";
import Input from "./input";
import { Vector } from "./math";
import { g } from "./globals";
import { Entity } from "./state";

export default async function initPlayer() {
  const scale = 0.45;

  const dudeTex = await Assets.load("/dude_1.png");
  const dude = new Sprite(dudeTex);
  dude.anchor = 0.5;
  dude.scale = scale;
  dude.position = { x: g.app.screen.width * 0.5, y: g.app.screen.height * 0.5 };
  g.app.stage.addChild(dude);

  const db = g.state.getDatabase("main");
  const playerEnt = db.addEntity();
  playerEnt.set("direction", new Vector());
  playerEnt.set("face-direction", {});
  playerEnt.set("container", [dude as Container, scale]);

  g.app.ticker.add((tk) => {
    move(tk, dude, playerEnt, g.input);
  });
}

function move(tk: Ticker, player: Sprite, playerEnt: Entity, input: Input) {
  const speed = 10;

  let dx = 0;
  if (input.isKeyDown("d")) dx += 1;
  if (input.isKeyDown("a")) dx -= 1;

  let dy = 0;
  if (input.isKeyDown("s")) dy += 1;
  if (input.isKeyDown("w")) dy -= 1;

  const dir = new Vector(dx, dy).normalize();
  playerEnt.set("direction", dir);

  player.x += dir.x * speed * tk.deltaTime;
  player.y += dir.y * speed * tk.deltaTime;
}
