import { Vector } from "./math";
import { Transform } from "./transforms";
import * as Zen from "./zen";

//TODO screenspace utilities

function init() {
  Zen.defineAttribute(Viewport);

  Zen.createEntity("viewport")
    .addAttribute<Viewport>(Viewport, {})
    .addAttribute<Transform>(Transform, {
      pos: new Vector(),
      rot: 0,
      scale: new Vector(1, 1),
    });
}

export class Viewport {}

init();
