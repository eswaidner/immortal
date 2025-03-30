import { Container } from "pixi.js";
import { Transform } from "./transforms";
import * as Zen from "./zen";

function init() {
  Zen.defineAttribute(SceneObject);

  Zen.createSystem({ include: [Transform, SceneObject] }, syncTransforms);
}

export class SceneObject {
  container: Container;

  constructor(container: Container) {
    this.container = container;
  }
}

// TODO ignore locally positioned containers
function syncTransforms(e: Zen.Entity) {
  const trs = e.getAttribute<Transform>(Transform)!;
  const so = e.getAttribute<SceneObject>(SceneObject)!;

  so.container.x = trs.pos.x;
  so.container.y = trs.pos.y;
  so.container.rotation = trs.rot;
  so.container.scale.x = trs.scale.x;
  so.container.scale.y = trs.scale.y;
}

init();
