import { Position } from "@pixi/layout";
import { g } from "./globals";
import { Vector } from "./math";

export function initMovement() {
  g.state.addAttribute<Movement>("movement");

  g.app.ticker.add(() => {
    updateMovement();
  });
}

export interface Movement {
  force: Vector;
  velocity: Vector;
  decay: number;
  mass: number;
  maxSpeed?: number;
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
