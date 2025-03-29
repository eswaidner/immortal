import { Assets, Container, Sprite, Ticker } from "pixi.js";
import { Vector } from "./math";
import { g } from "./globals";
import { Entity } from "./state";
import { spawnUnits } from "./npcs";
import { SpriteDepth } from "./main";
import { fireFlatProjectile } from "./projectiles";
import { Hitpoints, Regenerate } from "./hitpoints";
import { Collider } from "./collisions";
import { Gravity, Height, Movement } from "./movement";

export default async function initPlayer(): Promise<Entity> {
  g.state.addAttribute<PlayerMovement>("player-movement");

  const scale = 0.45;

  const dudeTex = await Assets.load("/dude_1.png");
  const dude = new Sprite(dudeTex);
  dude.anchor = 0.5;
  dude.scale = scale;
  g.origin.addChild(dude);

  const playerEnt = g.state.addEntity();
  playerEnt.set("player", {});
  playerEnt.set("friend", {});
  playerEnt.set("direction", new Vector());
  playerEnt.set("face-direction", {});
  playerEnt.set("container", [dude as Container, scale]);
  playerEnt.set<SpriteDepth>("sprite-depth", { offset: dude.height * 0.5 });
  playerEnt.set(
    "position",
    new Vector(g.app.screen.width * 0.5, g.app.screen.height * 0.5),
  );
  playerEnt.set<Height>("height", {
    height: 0,
    shadowOffset: new Vector(2, 23),
  });
  playerEnt.set<Gravity>("gravity", { velocity: 0, decay: 2 });
  playerEnt.set("camera-target", {});
  playerEnt.set<Collider>("collider", {
    offset: new Vector(),
    radius: dude.x * 0.5,
  });

  playerEnt.set<Hitpoints>("hitpoints", { hp: 100, maxHp: 100 });
  playerEnt.set<Regenerate>("regenerate", {
    rate: 5,
    maxRegenPercent: 0.75,
    delay: 5,
    elapsedDelay: 0,
  });

  playerEnt.set<Movement>("movement", {
    force: new Vector(),
    velocity: new Vector(),
    decay: 0.15,
    mass: 1,
  });

  playerEnt.set<PlayerMovement>("player-movement", {
    walkForce: 45,
    dashForce: 1250,
    dashCooldown: 1,
    dashCooldownElapsed: 1,
  });

  g.app.ticker.add((tk) => {
    updatePlayerMovement();
  });

  const slashTex = await Assets.load("/projectiles/slash.webp");

  window.addEventListener("click", (e) => {
    if (e.button !== 0) return;
    if (playerEnt.get("dead")) return;
    if (playerEnt.get("in-air")) return;

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
        knockback: new Vector(100, 1),
        hits: 0,
        distanceTraveled: 0,
        hitExclude: ["friend"],
      },
      new Vector(dude.position.x, dude.position.y),
      slash as Container,
    );
  });

  spawnUnits(playerEnt, 10);

  return playerEnt;
}

interface PlayerMovement {
  walkForce: number;
  dashForce: number;
  dashCooldown: number;
  dashCooldownElapsed: number;
}

function updatePlayerMovement() {
  const q = g.state.query({
    include: ["player-movement", "movement", "gravity"],
    exclude: ["dead"],
    optional: ["in-air"],
  });

  for (const e of q.entities) {
    const playerMvmt = e.attributes["player-movement"] as PlayerMovement;
    const movement = e.attributes["movement"] as Movement;
    const grav = e.attributes["gravity"] as Gravity;

    // WALK
    let dx = 0;
    if (g.input.isKeyDown("d")) dx += 1;
    if (g.input.isKeyDown("a")) dx -= 1;

    let dy = 0;
    if (g.input.isKeyDown("s")) dy += 1;
    if (g.input.isKeyDown("w")) dy -= 1;

    const grounded = !e.attributes["in-air"];

    const walkDir = new Vector(dx, dy).normalize();
    const walkForce = playerMvmt.walkForce * (!grounded ? 0.4 : 1);
    movement.force = movement.force.add(walkDir.scale(walkForce));

    // DASH
    if (playerMvmt.dashCooldownElapsed >= playerMvmt.dashCooldown) {
      if (g.input.wasKeyPressed(" ") && grounded) {
        const dashDir = new Vector(dx, dy).normalize();
        movement.force = movement.force.add(
          dashDir.scale(playerMvmt.dashForce),
        );

        // JUMP
        // grav.velocity = playerMvmt.dashForce * 0.05;

        playerMvmt.dashCooldownElapsed = 0;
      }
    } else {
      playerMvmt.dashCooldownElapsed += g.app.ticker.deltaMS * 0.001;
    }
  }
}
