import { Assets, Container, Sprite, Ticker } from "pixi.js";
import { Vector } from "./math";
import { g } from "./globals";
import { Entity } from "./state";
import { spawnUnits } from "./npcs";
import { SpriteDepth } from "./main";
import { fireFlatProjectile } from "./projectiles";
import { Hitpoints, Regenerate } from "./hitpoints";

export default async function initPlayer(): Promise<Entity> {
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
  playerEnt.set<SpriteDepth>("sprite-depth", { offset: dude.height * 0.5 });
  playerEnt.set(
    "position",
    new Vector(g.app.screen.width * 0.5, g.app.screen.height * 0.5),
  );
  playerEnt.set("camera-target", {});

  playerEnt.set<Hitpoints>("hitpoints", { hp: 100, maxHp: 100 });
  playerEnt.set<Regenerate>("regenerate", {
    rate: 5,
    maxRegenPercent: 0.75,
    delay: 5,
    elapsedDelay: 0,
  });

  g.app.ticker.add((tk) => {
    move(tk, playerEnt);
  });

  const slashTex = await Assets.load("/projectiles/slash.webp");

  window.addEventListener("click", (e) => {
    if (e.button !== 0) return;

    const slash = new Sprite(slashTex);
    slash.anchor = { x: 0, y: 0.5 };
    slash.scale = 0.4;

    const delta = g.input.pointerWorldPos.sub(
      new Vector(dude.position.x, dude.position.y),
    );

    fireFlatProjectile(
      {
        sender: playerEnt,
        speed: 10,
        direction: delta.normalized(),
        range: 75,
        hitRadius: 75,
        maxHits: 1,
        damage: 10,
        knockback: new Vector(1, 1),
        hits: 0,
        distanceTraveled: 0,
      },
      new Vector(dude.position.x, dude.position.y),
      slash as Container,
    );
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
