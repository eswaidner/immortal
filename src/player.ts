import { Assets, Container, Sprite, Ticker } from "pixi.js";
import { Vector } from "./math";
import { g } from "./globals";
import { Entity } from "./state";
import { spawnUnits } from "./npcs";

export default async function initPlayer(): Promise<Entity> {
  g.state.addAttribute<{}>("player");

  const scale = 0.45;

  const dudeTex = await Assets.load("/dude_1.png");
  const dude = new Sprite(dudeTex);
  dude.anchor = 0.5;
  dude.scale = scale;
  g.origin.addChild(dude);

  const playerEnt = g.state.addEntity();
  playerEnt.set("player", {});
  playerEnt.set("direction", new Vector());
  playerEnt.set("face-direction", {});
  playerEnt.set("container", [dude as Container, scale]);
  playerEnt.set(
    "position",
    new Vector(g.app.screen.width * 0.5, g.app.screen.height * 0.5),
  );
  playerEnt.set("camera-target", {});

  g.app.ticker.add((tk) => {
    move(tk, playerEnt);
  });

  spawnUnits(playerEnt, 10);

  return playerEnt;
}

function move(tk: Ticker, playerEnt: Entity) {
  const speed = 6.5;

  let dx = 0;
  if (g.input.isKeyDown("d")) dx += 1;
  if (g.input.isKeyDown("a")) dx -= 1;

  let dy = 0;
  if (g.input.isKeyDown("s")) dy += 1;
  if (g.input.isKeyDown("w")) dy -= 1;

  const dir = new Vector(dx, dy).normalize();
  playerEnt.set("direction", dir);

  const pos = playerEnt.get("position") as Vector;

  pos.x += dir.x * speed * tk.deltaTime;
  pos.y += dir.y * speed * tk.deltaTime;

  playerEnt.set("position", pos);
}
