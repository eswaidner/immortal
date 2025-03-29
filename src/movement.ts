import { Container, Graphics, Sprite } from "pixi.js";
import { g } from "./globals";
import { Vector } from "./math";

export function initMovement() {
  g.state.addAttribute<Movement>("movement");
  g.state.addAttribute<Height>("height");
  g.state.addAttribute("in-air");
  g.state.addAttribute<Gravity>("gravity");

  g.app.ticker.add(() => {
    updateMovement();
    updateHeight();
  });
}

export interface Movement {
  force: Vector;
  velocity: Vector;
  decay: number;
  mass: number;
  maxSpeed?: number;
}

export interface Height {
  height: number;
  shadowOffset: Vector;
  shadow?: Graphics;
}

export interface Gravity {
  velocity: number;
  decay: number;
}

function updateMovement() {
  const q = g.state.query({ include: ["movement", "position"] });

  for (const e of q.entities) {
    const movement = e.attributes["movement"] as Movement;
    const pos = e.attributes["position"] as Vector;

    const accel = movement.force.scale(1 / movement.mass);
    const decel = movement.velocity.scale(movement.decay);

    movement.velocity = movement.velocity
      .add(accel)
      .sub(decel)
      .capMagnitude(movement.maxSpeed || Infinity);

    // apply velocity
    const dt = g.app.ticker.deltaMS * 0.001;
    pos.x += movement.velocity.x * dt;
    pos.y += movement.velocity.y * dt;

    movement.force.set(0, 0);
  }
}

function updateHeight() {
  const q = g.state.query({
    include: ["height", "position", "container"],
    optional: ["dead", "gravity"],
  });

  for (const e of q.entities) {
    const height = e.attributes["height"] as Height;
    const pos = e.attributes["position"] as Vector;
    const [c, _] = e.attributes["container"] as [Container, number];

    if (!height.shadow) {
      const shadow = new Graphics()
        .ellipse(0, 0, c.width * 0.5, c.width * 0.2)
        .fill(0x202020);

      shadow.zIndex = -Infinity;
      shadow.alpha = 0.1;

      g.origin.addChild(shadow);

      height.shadow = shadow;
    }

    height.shadow.x = pos.x + height.shadowOffset.x * Math.sign(c.scale.x);
    height.shadow.y = pos.y + height.shadowOffset.y;
    c.pivot.y = height.height;

    height.shadow.scale = 1 + height.height * 0.001;
    height.shadow.alpha = 0.1 + height.height * 0.0004;

    if (height.height > 0) e.entity.set("in-air", {});
    else e.entity.delete("in-air");

    const grav = e.attributes["gravity"] as Gravity;
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

    if (e.attributes["dead"]) {
      height.height = 0;
      height.shadow.visible = false;
    } else {
      height.shadow.visible = true;
    }
  }
}
