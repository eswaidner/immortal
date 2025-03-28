import { g } from "./globals";
import { Vector } from "./math";
import { Entity } from "./state";

export function initCollisions() {
  g.state.addAttribute<Collider>("collider");
}

export function queryPoint(
  pos: Vector,
  radius: number,
  limit: number = Infinity,
  exclude?: string[],
): Collision[] {
  const q = g.state.query({ include: ["collider", "position"], exclude });

  const collisions: Collision[] = [];
  for (const e of q.entities) {
    const col = e.attributes["collider"] as Collider;
    const colPos = e.attributes["position"] as Vector;

    const colWorldPos = colPos.add(col.offset);
    const delta = colWorldPos.sub(pos);

    // if colliders overlap
    const deltaMag = delta.magnitude();
    if (deltaMag - radius - col.radius <= 0) {
      const pointOffset = deltaMag - col.radius;

      collisions.push({
        ent: e.entity,
        collider: col,
        colliderWorldPos: colWorldPos,
        point: colWorldPos.add(delta.normalized().scale(pointOffset)), // worldspace
      });

      if (collisions.length >= limit) break;
    }
  }

  return collisions;
}

export function queryRay(
  pos: Vector,
  dir: Vector,
  dist: number,
  radius: number,
): Collision[] {
  return [];
}

export interface Collider {
  offset: Vector;
  radius: number;
}

export interface Collision {
  ent: Entity;
  collider: Collider;
  colliderWorldPos: Vector;
  point: Vector;
}
