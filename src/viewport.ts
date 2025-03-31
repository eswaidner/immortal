import { Vector } from "./math";
import { Transform } from "./transforms";
import * as Zen from "./zen";

function init() {
  Zen.defineAttribute(Camera);

  const cam = Zen.createEntity()
    .addAttribute<Camera>(Camera, new Camera())
    .addAttribute<Transform>(Transform, new Transform());

  Zen.createResource<Viewport>(Viewport, new Viewport(cam));
}

export class Camera {}

export class Viewport {
  screen: Vector = new Vector();
  source?: Zen.Entity;

  constructor(source?: Zen.Entity) {
    this.source = source;
  }

  transform(): Transform | undefined {
    return this.source?.getAttribute<Transform>(Transform);
  }

  //TODO screen space utilities
}

init();
