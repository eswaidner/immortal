import { Vector } from "./math";
import { Transform } from "./transforms";
import * as Zen from "./zen";

function init() {
  Zen.defineAttribute<Collider>(Collider);
}

export class Collider {
  offset: Vector;
  radius: number;

  constructor(offset: Vector, radius: number) {
    this.offset = offset;
    this.radius = radius;
  }
}

export interface Collision {
  ent: Zen.Entity;
  collider: Collider;
  colliderWorldPos: Vector;
  point: Vector;
}

export function queryPoint(
  pos: Vector,
  radius: number,
  limit: number = Infinity,
  filters?: { with?: object[]; without?: object[] },
): Collision[] {
  const q = Zen.query({
    with: [Collider, Transform, ...(filters?.with || [])],
    without: filters?.without,
  });

  const collisions: Collision[] = [];
  for (let i = 0; i < q.length; i++) {
    const e = q[i];

    const col = e.getAttribute<Collider>(Collider)!;
    const colTrs = e.getAttribute<Transform>(Transform)!;

    const colWorldPos = colTrs.pos.add(col.offset);
    const delta = colWorldPos.sub(pos);

    // if colliders overlap
    const deltaMag = delta.magnitude();
    if (deltaMag - radius - col.radius <= 0) {
      const pointOffset = deltaMag - col.radius;

      collisions.push({
        ent: e,
        collider: col,
        colliderWorldPos: colWorldPos,
        point: colWorldPos.add(delta.normalized().scale(pointOffset)), // worldspace
      });

      if (collisions.length >= limit) break;
    }
  }

  return collisions;
}

// export function queryRay(
//   pos: Vector,
//   dir: Vector,
//   dist: number,
//   radius: number,
// ): Collision[] {
//   return [];
// }

init();
