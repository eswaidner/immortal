import { Assets, Container, Sprite, Texture } from "pixi.js";
import { g } from "./globals";
import { randomRange, Vector } from "./math";
import { Entity } from "./state";
import { SpriteDepth } from "./main";
import { fireBallisticProjectile } from "./projectiles";
import { Height } from "./movement";

export async function initNpcs() {
  g.state.addAttribute<Unit>("unit");
  g.state.addAttribute<{}>("beast");
  g.state.addAttribute<Attack>("attack");
  g.state.addAttribute<Follow>("follow");
  g.state.addAttribute<Roam>("roam");
  g.state.addAttribute<AutoAttack>("auto-attack");
  g.state.addAttribute<Speed>("speed");
  g.state.addAttribute<{}>("friend");
  g.state.addAttribute<{}>("neutral");
  g.state.addAttribute<{}>("enemy");

  Assets.load("./dude_1.png");
  Assets.load("./boar.webp");
  Assets.load("./tree_1.webp");

  g.app.ticker.add(() => {
    updateFollow();
    updateRoam();
    updateAttack();
    updateBeastAggro();
    updateUnitAggro();
    updateAutoAttack();
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
  unit.set("friend", {});
  unit.set<Vector>(
    "position",
    new Vector(g.app.screen.width * 0.5, g.app.screen.height * 0.5).add(offset),
  );

  unit.set<Height>("height", {
    height: 0,
    shadowOffset: new Vector(2, 18),
  });

  unit.set<Follow>("follow", {
    target: owner,
    range: 200,
    randomness: 150,
  });

  unit.set<Speed>("speed", { speed: 0.03 + Math.random() * -0.015 });

  unit.set<Vector>("direction", new Vector(1, 0));
  unit.set<{}>("face-direction", {});

  const unitTex = (await Assets.load("./dude_1.png")) as Texture;
  const unitSprite = Sprite.from(unitTex);
  unitSprite.anchor = 0.5;

  const scale = 0.35;
  unitSprite.scale = scale;

  unit.set<SpriteDepth>("sprite-depth", { offset: unitSprite.height * 0.5 });

  g.origin.addChild(unitSprite);
  unit.set<[Container, number]>("container", [unitSprite, scale]);

  unit.set<AutoAttack>("auto-attack", {
    cooldown: 2,
    elapsedCooldown: 2,
    range: 350,
    attack: (sender, target) => {
      const arrowTex = g.assets.get("./projectiles/arrow.webp");
      const senderPos = sender.get<Vector>("position");
      const targetPos = target.get<Vector>("position");

      if (!arrowTex || !senderPos || !targetPos) return;

      const arrow = new Sprite(arrowTex);
      arrow.anchor = { x: 0.5, y: 0.5 };
      arrow.scale = 0.45;

      const arrowWrapper = new Container();
      arrowWrapper.addChild(arrow);

      const dest = new Vector().copy(targetPos);
      const startPos = new Vector(senderPos.x, senderPos.y);
      fireBallisticProjectile(
        {
          maxRange: 350,
          maxHeight: 550,
          startPos: startPos,
          destination: dest,
          sender: sender,
          speed: 12,
          hitRadius: 15,
          maxHits: 1,
          damage: 5,
          knockback: new Vector(100, 1),
          hits: 0,
          hitExclude: ["friend"],
        },
        startPos,
        arrowWrapper as Container,
      );
    },
  });
}

interface Unit {
  owner: Entity;
}

export interface Follow {
  target: Entity;
  targetPos?: Vector;
  range: number;
  randomness: number;
}

export interface Roam {
  pos: Vector;
  range: number;
  minWaitTime: number;
  maxWaitTime: number;
  destPos?: Vector;
  waitFor?: number;
  elapsedWait: number;
}

// todo rename to Charge
export interface Attack {
  target: Entity;
  minRange: number; // want to stay at least this far away
  maxRange: number; // want to get at least this close
}

export interface AutoAttack {
  cooldown: number;
  elapsedCooldown: number;
  range: number;
  attack: (sender: Entity, target: Entity) => void;
}

export interface Speed {
  speed: number;
}

function updateFollow() {
  const q = g.state.query({
    include: ["follow", "position", "speed"],
    exclude: ["attack", "dead"], // attack takes priority over follow
  });

  for (const e of q.entities) {
    const follow = e.attributes["follow"] as Follow;
    const pos = e.attributes["position"] as Vector;
    const speed = e.attributes["speed"] as Speed;

    const tPos = follow.target.get("position") as Vector;
    const tPosDist = pos.distance(tPos);

    if (!follow.targetPos) {
      if (tPosDist > follow.range) {
        follow.targetPos = tPos.add(
          new Vector().randomDirection().randomScale(0, follow.randomness),
        );
      }
    } else {
      const newPos = pos.lerp(
        follow.targetPos,
        speed.speed * g.app.ticker.deltaTime,
      );

      e.entity.set("position", newPos);
      e.entity.set("direction", follow.targetPos.sub(pos).normalize());

      const dist = pos.distance(follow.targetPos);
      if (dist < follow.range) follow.targetPos = undefined;
    }
  }
}

function updateRoam() {
  const q = g.state.query({
    include: ["roam", "position", "speed"],
    exclude: ["attack", "follow", "dead"], // attack and follow take priority over roam
  });

  for (const e of q.entities) {
    const roam = e.attributes["roam"] as Roam;
    const pos = e.attributes["position"] as Vector;
    const speed = e.attributes["speed"] as Speed;

    if (roam.waitFor !== undefined) {
      roam.elapsedWait += g.app.ticker.deltaMS * 0.001;

      if (roam.elapsedWait >= roam.waitFor) {
        roam.waitFor = undefined;
      } else {
        continue;
      }
    }

    if (!roam.destPos) {
      roam.destPos = roam.pos.add(
        new Vector().randomDirection().randomScale(0.1, roam.range),
      );
    }

    const newPos = pos.lerp(roam.destPos, speed.speed * g.app.ticker.deltaTime);

    e.entity.set("position", newPos);
    e.entity.set("direction", roam.destPos.sub(pos).normalized());

    const dist = pos.distance(roam.destPos);

    // destination reached
    if (dist < 1) {
      roam.destPos = undefined;
      roam.waitFor = randomRange(roam.minWaitTime, roam.minWaitTime);
      roam.elapsedWait = 0;
    }
  }
}

function updateAttack() {
  const q = g.state.query({
    include: ["attack", "position", "speed"],
    exclude: ["dead"],
  });

  for (const e of q.entities) {
    const attack = e.attributes["attack"] as Attack;
    const pos = e.attributes["position"] as Vector;
    const speed = e.attributes["speed"] as Speed;

    // break aggro target died
    if (attack.target.get("dead")) {
      e.entity.delete("attack");
      continue;
    }

    // target must have position attribute
    const targetPos = attack.target.get<Vector>("position");
    if (targetPos === undefined) continue;

    const targetDelta = targetPos.sub(pos);
    const targetDist = targetDelta.magnitude();

    let newPos = new Vector(pos.x, pos.y);

    if (targetDist > attack.maxRange) {
      // move closer
      newPos = pos.lerp(targetPos, speed.speed * g.app.ticker.deltaTime);
    } else if (targetDist < attack.minRange) {
      // move away
      const dir = targetDelta.negate();
      newPos = pos.lerp(pos.sub(dir), speed.speed * g.app.ticker.deltaTime);
    }

    e.entity.set("position", newPos);
    e.entity.set("direction", targetDelta.normalized());
  }
}

function updateBeastAggro() {
  const beastQ = g.state.query({
    include: ["beast", "position"],
    exclude: ["attack", "dead"],
  });

  const playerQ = g.state.query({
    include: ["player", "position"],
    exclude: ["dead"],
  });

  if (!playerQ.entities[0]) return;

  const player = playerQ.entities[0];
  const playerPos = player.attributes["position"] as Vector;

  for (const e of beastQ.entities) {
    const pos = e.attributes["position"] as Vector;

    if (pos.distance(playerPos) < 300) {
      e.entity.set<Attack>("attack", {
        target: player.entity,
        minRange: 60,
        maxRange: 75,
      });
    }
  }
}

function updateUnitAggro() {
  const unitQ = g.state.query({
    include: ["unit", "position"],
    exclude: ["attack", "dead"],
  });

  const enemyQ = g.state.query({
    include: ["beast", "position"],
    exclude: ["dead"],
  });

  if (!enemyQ.entities[0]) return;

  for (const e of unitQ.entities) {
    const pos = e.attributes["position"] as Vector;

    for (const enemy of enemyQ.entities) {
      const enemyPos = enemy.entity.get<Vector>("position");
      if (!enemyPos) continue;

      if (pos.distance(enemyPos) < 175) {
        e.entity.set<Attack>("attack", {
          target: enemy.entity,
          minRange: 150,
          maxRange: 300,
        });
      }
    }
  }
}

function updateAutoAttack() {
  const q = g.state.query({
    include: ["attack", "auto-attack", "position"],
    exclude: ["dead"],
  });

  for (const e of q.entities) {
    const attack = e.attributes["attack"] as Attack;
    const auto = e.attributes["auto-attack"] as AutoAttack;
    const pos = e.attributes["position"] as Vector;

    // cooldown
    auto.elapsedCooldown += g.app.ticker.deltaMS * 0.001;
    if (auto.elapsedCooldown < auto.cooldown) continue;

    const targetPos = attack.target.get<Vector>("position");
    if (!targetPos) continue;

    const delta = targetPos.sub(pos);

    // range
    if (delta.squaredMagnitude() > auto.range * auto.range) continue;

    auto.attack(e.entity, attack.target);

    auto.elapsedCooldown = 0;
  }
}
