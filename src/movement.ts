import { Container, Graphics, Sprite } from "pixi.js";
import { g } from "./globals";
import { Vector } from "./math";

export function initMovement() {
  g.state.addAttribute<Movement>("movement");
  g.state.addAttribute<Height>("height");

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
  velocity?: number;
  shadow?: Graphics;
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
    optional: ["dead"],
  });

  for (const e of q.entities) {
    const height = e.attributes["height"] as Height;
    const pos = e.attributes["position"] as Vector;
    const [c, _] = e.attributes["container"] as [Container, number];

    if (!height.shadow) {
      const shadow = new Graphics()
        .ellipse(
          pos.x + height.shadowOffset.x,
          pos.y + height.shadowOffset.y,
          20,
          10,
        )
        .fill(0x202020);

      shadow.pivot = {
        x: g.app.screen.width * 0.5,
        y: g.app.screen.height * 0.5,
      };
      shadow.zIndex = -Infinity;
      shadow.alpha = 0.2;

      g.origin.addChild(shadow);

      height.shadow = shadow;
    }

    height.shadow.x = pos.x + height.shadowOffset.x * Math.sign(c.scale.x);
    height.shadow.y = pos.y + height.shadowOffset.y;
    c.pivot.y = height.height;

    height.shadow.visible = !e.attributes["dead"];
  }
}
