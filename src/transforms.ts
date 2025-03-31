import { Matrix } from "pixi.js";
import { Vector } from "./math";
import * as Zen from "./zen";

function init() {
  Zen.defineAttribute(Transform);
}

//TODO coordinate system utilities
//TODO parent/child relationships

export class Transform {
  pos: Vector;
  rot: number;
  scale: Vector;
  pivot: Vector;
  skew: Vector;

  private mat: Matrix = new Matrix();

  constructor(properties?: {
    position?: Vector;
    rotation?: number;
    scale?: Vector;
    pivot?: Vector;
    skew?: Vector;
  }) {
    this.pos = properties?.position || new Vector();
    this.rot = properties?.rotation || 0;
    this.scale = properties?.scale || new Vector(1, 1);
    this.pivot = properties?.pivot || new Vector(0.5, 0.5);
    this.skew = properties?.skew || new Vector();
  }

  trs(): Matrix {
    this.mat.setTransform(
      this.pos.x,
      this.pos.y,
      this.pivot.x,
      this.pivot.y,
      this.scale.x,
      this.scale.y,
      this.rot,
      this.skew.x,
      this.skew.y,
    );

    return this.mat;
  }
}

init();
