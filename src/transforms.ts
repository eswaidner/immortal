import { Matrix, Vector } from "./math";
import * as Zen from "./zen";

function init() {
  Zen.defineAttribute(Transform);
}

//TODO parent/child relationships

export class Transform {
  pos: Vector;
  rot: number;
  scale: Vector;
  pivot: Vector;
  skew: Vector;

  private mat: Matrix = new Matrix();

  constructor(properties?: {
    pos?: Vector;
    rot?: number;
    scale?: Vector;
    pivot?: Vector;
    skew?: Vector;
  }) {
    this.pos = properties?.pos || new Vector();
    this.rot = properties?.rot || 0;
    this.scale = properties?.scale || new Vector(1, 1);
    this.pivot = properties?.pivot || new Vector(0.5, 0.5);
    this.skew = properties?.skew || new Vector();
  }

  trs(): Matrix {
    this.mat.setFromTRS(this.pos, this.rot, this.scale);
    return this.mat;
  }
}

init();
