import { Assets, Container, Sprite, Texture } from "pixi.js";
import { g } from "./globals";
import { Vector } from "./math";
import { Entity } from "./state";
import { SpriteDepth } from "./main";

export async function initNpcs() {
  g.state.addAttribute<Unit>("unit");
  g.state.addAttribute<Follow>("follow");

  Assets.load("/dude_1.png");
  Assets.load("/boar.webp");
  Assets.load("/tree_1.webp");

  g.app.ticker.add(() => {
    updateFollow();
  });
}

export function spawnUnits(owner: Entity, qty: number) {
  for (let i = 0; i < qty; i++) {
    spawnUnit(owner);
  }
}

async function spawnUnit(owner: Entity) {
  const offset = new Vector().randomDirection().randomScale(50, 100);

  const unit = g.state.addEntity();
  unit.set<Unit>("unit", { owner });
  unit.set<Vector>(
    "position",
    new Vector(g.app.screen.width * 0.5, g.app.screen.height * 0.5).add(offset),
  );

  unit.set<Follow>("follow", {
    target: owner,
    range: 200,
    randomness: 150,
    speed: 0.03 + Math.random() * -0.015,
  });

  unit.set<Vector>("direction", new Vector(1, 0));
  unit.set<{}>("face-direction", {});

  const unitTex = (await Assets.load("/dude_1.png")) as Texture;
  const unitSprite = Sprite.from(unitTex);
  unitSprite.anchor = 0.5;

  const scale = 0.35;
  unitSprite.scale = scale;

  unit.set<SpriteDepth>("sprite-depth", { offset: unitSprite.height * 0.5 });

  g.origin.addChild(unitSprite);
  unit.set<[Container, number]>("container", [unitSprite, scale]);
}

interface Unit {
  owner: Entity;
}

interface Follow {
  target: Entity;
  targetPos?: Vector;
  range: number;
  randomness: number;
  speed: number;
}

function updateFollow() {
  const q = g.state.query({ include: ["follow", "position", "direction"] });

  for (const e of q.entities) {
    const follow = e.attributes["follow"] as Follow;
    const pos = e.attributes["position"] as Vector;

    if (!follow.targetPos) {
      const tPos = follow.target.get("position") as Vector;
      const tPosDist = pos.distance(tPos);

      if (tPosDist > follow.range) {
        follow.targetPos = tPos.add(
          new Vector().randomDirection().randomScale(0, follow.randomness),
        );
      }
    } else {
      const newPos = pos.lerp(
        follow.targetPos,
        follow.speed * g.app.ticker.deltaTime,
      );

      e.entity.set("position", newPos);
      e.entity.set("direction", follow.targetPos.sub(pos).normalized());

      const dist = pos.distance(follow.targetPos);
      if (dist < follow.range) follow.targetPos = undefined;
    }
  }
}

function updateRoam() {}

function updateAttack() {}
