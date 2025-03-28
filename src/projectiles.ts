import { Container, Sprite } from "pixi.js";
import { g } from "./globals";
import { rad2Deg, randomRange, Vector } from "./math";
import { Entity } from "./state";

export async function initProjectiles() {
  g.state.addAttribute<FlatProjectile>("flat-projectile");
  g.state.addAttribute<BallisticProjectile>("ballistic-projectile");

  g.app.ticker.add(() => {
    updateFlatProjectiles();
    updateBallsiticProjectiles();
  });
}

export function fireFlatProjectile(
  p: FlatProjectile,
  pos: Vector,
  container: Container,
) {
  const dirAngle = -p.direction.signedAngle(new Vector(1, 0));

  const proj = g.state.addEntity();
  proj.set<Vector>("position", new Vector(pos.x, pos.y));
  proj.set<number>("rotation", dirAngle);
  proj.set<FlatProjectile>("flat-projectile", p);

  proj.set<[Container, number]>("container", [container, container.scale.x]);

  g.origin.addChild(container);
}

interface Projectile {
  sender: Entity;
  hitRadius: number;
  maxHits: number;
  damage: number;
  knockback: Vector;
}

export interface FlatProjectile extends Projectile {
  speed: number;
  direction: Vector;
  range: number;
  hitArc?: number;
  distanceTraveled: number;
}

export interface BallisticProjectile extends Projectile {
  maxHeight: number;
  flightDuration: number;
  destination: Vector;
}

function updateFlatProjectiles() {
  const q = g.state.query({
    include: ["flat-projectile", "position", "rotation"],
    optional: ["container"],
  });

  for (const e of q.entities) {
    const proj = e.attributes["flat-projectile"] as FlatProjectile;
    const pos = e.attributes["position"] as Vector;

    if (proj.distanceTraveled >= proj.range) {
      const [c, _] = e.attributes["container"];
      if (c) c.destroy();

      g.state.deleteEntity(e.entity.id);
      continue;
    }

    const delta = proj.direction.scale(proj.speed * g.app.ticker.deltaTime);

    pos.x += delta.x;
    pos.y += delta.y;

    proj.distanceTraveled += delta.magnitude();
  }
}

function updateBallsiticProjectiles() {}
