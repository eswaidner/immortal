import { Vector } from "./math";
import * as Zen from "./zen";

function init() {
  Zen.defineAttribute(Transform);
}

//TODO coordinate system utilities

export class Transform {
  //TODO 3x3 TRS matrix instead?
  pos: Vector;
  rot: number;
  scale: Vector;

  constructor(pos: Vector, rot: number, scale: Vector) {
    this.pos = pos;
    this.rot = rot;
    this.scale = scale;
  }
}

init();
