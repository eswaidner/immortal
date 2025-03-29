import { Container } from "pixi.js";
import { g } from "./globals";
import { lerp, Vector } from "./math";
import { Entity } from "./state";
import { Collision, queryPoint } from "./collisions";
import { damage } from "./hitpoints";
import { Gravity, Height, Movement } from "./movement";
import { Attack } from "./npcs";

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

export function fireBallisticProjectile(
  p: BallisticProjectile,
  pos: Vector,
  container: Container,
) {
  // const dir = p.destination.sub(pos).normalize();
  // const dirAngle = -dir.signedAngle(new Vector(1, 0));

  const proj = g.state.addEntity();
  proj.set<Vector>("position", new Vector(pos.x, pos.y));
  proj.set<Height>("height", { height: 50, shadowOffset: new Vector(0, 0) });
  proj.set<BallisticProjectile>("ballistic-projectile", p);

  proj.set<[Container, number]>("container", [container, container.scale.x]);

  g.origin.addChild(container);
}

interface Projectile {
  sender: Entity;
  hitRadius: number;
  maxHits: number;
  damage: number;
  knockback: Vector;
  hits: number;
  hitExclude: string[];
}

export interface FlatProjectile extends Projectile {
  speed: number;
  direction: Vector;
  range: number;
  distanceTraveled: number;
  hitArc?: number;
}

export interface BallisticProjectile extends Projectile {
  speed: number;
  maxRange: number;
  maxHeight: number;
  startPos: Vector;
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

    if (proj.distanceTraveled >= proj.range || proj.hits >= proj.maxHits) {
      const [c, _] = e.attributes["container"];
      if (c) c.destroy();

      g.state.deleteEntity(e.entity.id);
      continue;
    }

    const delta = proj.direction.scale(proj.speed * g.app.ticker.deltaTime);

    pos.x += delta.x;
    pos.y += delta.y;

    proj.distanceTraveled += delta.magnitude();

    const collisions = queryPoint(pos, proj.hitRadius, Infinity, [
      "invulnerable",
      "dead",
      "in-air",
      ...proj.hitExclude,
    ]);

    for (const c of collisions) {
      if (proj.hits >= proj.maxHits) break;
      proj.hits++;
      handleHit(proj as Projectile, proj.direction, c);
    }
  }
}

function updateBallsiticProjectiles() {
  const q = g.state.query({
    include: ["ballistic-projectile", "position", "height"],
    optional: ["container"],
  });

  for (const e of q.entities) {
    const proj = e.attributes["ballistic-projectile"] as BallisticProjectile;
    const pos = e.attributes["position"] as Vector;
    const height = e.attributes["height"] as Height;
    const [c, _] = e.attributes["container"] as [Container, number];

    // shorten dest if outside max range
    const d = proj.destination.sub(pos);
    const overage = d.magnitude() - proj.maxRange;
    if (overage > 0) {
      proj.destination = proj.destination.sub(d.normalize().scale(overage));
    }

    const dt = g.app.ticker.deltaTime;
    const delta = proj.destination.sub(pos);
    const totalDelta = proj.destination.sub(proj.startPos);

    // move and skip collision check if distance to dest is > min threshold
    const deltaSqMag = delta.squaredMagnitude();
    if (deltaSqMag > 30) {
      pos.copy(pos.add(delta.normalized().scale(proj.speed * dt)));

      const totalDeltaSqMag = totalDelta.squaredMagnitude();
      const t = 1 - deltaSqMag / totalDeltaSqMag;

      const rangeFactor = totalDeltaSqMag / (proj.maxRange * proj.maxRange);

      const parabola = (t: number) => (-t * t + t) * 4 * rangeFactor;

      height.height = lerp(10, proj.maxHeight, parabola(t));

      const startAngle = new Vector(1, 0).signedAngle(
        new Vector(1, proj.maxHeight * parabola(0.5) * 0.01),
      );
      let angleAdj = lerp(startAngle, -startAngle, t);
      angleAdj *= delta.normalized().dot(new Vector(1, 0));

      // set arrow visual rot
      if (c.children[0]) {
        const dirAngle = delta.normalized().signedAngle(new Vector(1, 0));
        c.children[0].rotation = dirAngle - angleAdj;
      }

      continue;
    }

    const collisions = queryPoint(pos, proj.hitRadius, Infinity, [
      "invulnerable",
      "dead",
      "in-air",
      ...proj.hitExclude,
    ]);

    for (const c of collisions) {
      if (proj.hits >= proj.maxHits) break;
      proj.hits++;
      const hitDir = delta.normalize();
      handleHit(proj as Projectile, hitDir, c);
    }

    // destroy projectile
    if (c) c.destroy();
    g.state.deleteEntity(e.entity.id);
  }
}

function handleHit(proj: Projectile, hitDir: Vector, c: Collision) {
  damage(proj.damage, c.ent);

  // knockback
  const movement = c.ent.get<Movement>("movement");
  if (movement) {
    movement.force = movement.force.add(hitDir.scale(proj.knockback.x));
  }

  // knockup
  const grav = c.ent.get<Gravity>("gravity");
  if (grav) grav.velocity += proj.knockback.y;

  // aggro enemy
  if (c.ent.get("enemy")) {
    if (!c.ent.get<Attack>("attack")) {
      c.ent.set<Attack>("attack", {
        target: proj.sender,
        minRange: 25,
        maxRange: 75,
      });
    }
  }
}
