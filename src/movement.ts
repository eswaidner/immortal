import { Graphics } from "pixi.js";
import { Vector } from "./math";
// import { Dead } from "./hitpoints";
import * as Zen from "./zen";
import { Transform } from "./transforms";
import { Origin, SceneObject } from "./pixi";

function init() {
  Zen.defineAttribute(FaceVelocity);
  Zen.defineAttribute(Movement);
  Zen.defineAttribute(Airborne);
  Zen.defineAttribute(Gravity);
  Zen.defineAttribute<Height>(Height, {
    onRemove: (h) => h.shadow?.destroy(),
  });

  Zen.createSystem({ with: [Movement, Transform] }, { foreach: move });
  Zen.createSystem(
    { with: [Height, Transform, SceneObject], resources: [Origin] },
    { foreach: updateHeight },
  );
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

function move(e: Zen.Entity, ctx: Zen.SystemContext) {
  const movement = e.getAttribute<Movement>(Movement)!;
  const trs = e.getAttribute<Transform>(Transform)!;

  const accel = movement.force.scale(1 / movement.mass);
  const decel = movement.velocity.scale(movement.decay);

  movement.velocity = movement.velocity
    .add(accel)
    .sub(decel)
    .capMagnitude(movement.maxSpeed || Infinity);

  // apply velocity
  trs.pos = trs.pos.add(movement.velocity.scale(ctx.deltaTime));

  movement.force.set(0, 0);
}

function updateHeight(e: Zen.Entity, ctx: Zen.SystemContext) {
  const height = e.getAttribute<Height>(Height)!;
  const trs = e.getAttribute<Transform>(Transform)!;
  const so = e.getAttribute<SceneObject>(SceneObject)!;

  height.height = Math.max(height.height, 0);

  if (!height.shadow) {
    const shadow = new Graphics()
      .ellipse(0, 0, so.container.width * 0.5, so.container.width * 0.2)
      .fill(0x202020);

    shadow.zIndex = -Infinity;
    shadow.alpha = 0.1;

    Zen.getResource<Origin>(Origin)?.container.addChild(shadow);

    height.shadow = shadow;
  }

  const scaleSign = Math.sign(so.container.scale.x);
  height.shadow.x = trs.pos.x + height.shadowOffset.x * scaleSign;
  height.shadow.y = trs.pos.y + height.shadowOffset.y;
  so.container.pivot.y = height.height;

  height.shadow.scale = 1 + height.height * 0.001;
  height.shadow.alpha = 0.1 + height.height * 0.0004;

  if (height.height > 0) e.addAttribute(Airborne, {});
  else e.removeAttribute(Airborne);

  const grav = e.getAttribute<Gravity>(Gravity);
  if (grav) {
    grav.velocity -= grav.velocity * grav.decay * ctx.deltaTime;
    grav.velocity = grav.velocity - 65 * ctx.deltaTime;
    height.height += grav.velocity;

    if (height.height <= 0) {
      height.height = 0;
      grav.velocity = 0;
    }
  }

  // if (e.getAttribute(Dead)) {
  //   height.height = 0;
  //   height.shadow.visible = false;
  // } else {
  //   height.shadow.visible = true;
  // }
}

init();
