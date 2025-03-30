import { Container, Graphics } from "pixi.js";
import { Vector } from "./math";
import { Dead } from "./hitpoints";
import * as Zen from "./zen";

export function initMovement() {
  Zen.defineAttribute(FaceVelocity);
  Zen.defineAttribute(Movement);
  Zen.defineAttribute(Airborne);
  Zen.defineAttribute(Gravity);
  Zen.defineAttribute<Height>(Height, {
    onRemove: (h) => h.shadow?.destroy(),
  });

  g.app.ticker.add(() => {
    updateMovement();
    updateHeight();
  });
}

export class Airborne {}
export class FaceVelocity {}

export class Movement {
  force: Vector;
  decay: number;
  mass: number;
  velocity: Vector = new Vector();
  maxSpeed?: number;

  constructor(force: Vector, decay: number, mass: number) {
    this.force = force;
    this.decay = decay;
    this.mass = mass;
  }
}

export class Height {
  height: number = 0;
  shadowOffset: Vector;
  shadow?: Graphics;

  constructor(shadowOffset: Vector) {
    this.shadowOffset = shadowOffset;
  }
}

export class Gravity {
  decay: number;
  velocity: number = 0;

  constructor(decay: number) {
    this.decay = decay;
  }
}

function updateMovement() {
  const q = Zen.query({ include: [Movement, Position] });
  const numEntities = q.length;

  for (let i = 0; i < numEntities; i++) {
    const e = q[i];

    const movement = e.getAttribute<Movement>(Movement)!;
    const pos = e.getAttribute<Position>(Position)!;

    const accel = movement.force.scale(1 / movement.mass);
    const decel = movement.velocity.scale(movement.decay);

    movement.velocity = movement.velocity
      .add(accel)
      .sub(decel)
      .capMagnitude(movement.maxSpeed || Infinity);

    // apply velocity
    const dt = g.app.ticker.deltaMS * 0.001;
    pos.pos.x += movement.velocity.x * dt;
    pos.pos.y += movement.velocity.y * dt;

    movement.force.set(0, 0);
  }
}

function updateHeight() {
  const q = Zen.query({
    include: [Height, Position, Container],
  });
  const numEntities = q.length;

  for (let i = 0; i < numEntities; i++) {
    const e = q[i];
    const height = e.getAttribute<Height>(Height)!;
    const pos = e.getAttribute<Position>(Position)!;
    const so = e.getAttribute<SceneObject>(SceneObject)!;

    height.height = Math.max(height.height, 0);

    if (!height.shadow) {
      const shadow = new Graphics()
        .ellipse(0, 0, so.container.width * 0.5, so.container.width * 0.2)
        .fill(0x202020);

      shadow.zIndex = -Infinity;
      shadow.alpha = 0.1;

      g.origin.addChild(shadow);

      height.shadow = shadow;
    }

    const scaleSign = Math.sign(so.container.scale.x);
    height.shadow.x = pos.pos.x + height.shadowOffset.x * scaleSign;
    height.shadow.y = pos.pos.y + height.shadowOffset.y;
    so.container.pivot.y = height.height;

    height.shadow.scale = 1 + height.height * 0.001;
    height.shadow.alpha = 0.1 + height.height * 0.0004;

    if (height.height > 0) e.addAttribute(Airborne, {});
    else e.removeAttribute(Airborne);

    const grav = e.getAttribute<Gravity>(Gravity);
    if (grav) {
      const dt = g.app.ticker.deltaMS * 0.001;

      grav.velocity -= grav.velocity * grav.decay * dt;
      grav.velocity = grav.velocity - 65 * dt;
      height.height += grav.velocity;

      if (height.height <= 0) {
        height.height = 0;
        grav.velocity = 0;
      }
    }

    if (e.getAttribute(Dead)) {
      height.height = 0;
      height.shadow.visible = false;
    } else {
      height.shadow.visible = true;
    }
  }
}
