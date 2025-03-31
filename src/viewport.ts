import { Vector } from "./math";
import { Transform } from "./transforms";
import * as Zen from "./zen";

//TODO screenspace utilities

function init() {
  Zen.defineAttribute(Camera);

  const cam = Zen.createEntity()
    .addAttribute<Camera>(Camera, new Camera())
    .addAttribute<Transform>(Transform, new Transform());

  Zen.createResource<Viewport>(Viewport, new Viewport(cam));
}

export class Camera {}

export class Viewport {
  source?: Zen.Entity;

  //TODO screen params, utilities, etc.

  constructor(source?: Zen.Entity) {
    this.source = source;
  }

  transform(): Transform | undefined {
    return this.source?.getAttribute<Transform>(Transform);
  }
}

init();
