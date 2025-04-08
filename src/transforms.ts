import { Matrix3, Vector2 } from "math.gl";
import * as Zen from "./zen";

function init() {
  Zen.defineAttribute(Transform);
}

//TODO parent/child relationships

export class Transform {
  pos: Vector2;
  rot: number;
  scale: Vector2;
  pivot: Vector2;

  constructor(properties?: {
    pos?: Vector2;
    rot?: number;
    scale?: Vector2;
    pivot?: Vector2;
  }) {
    this.pos = properties?.pos || new Vector2();
    this.rot = properties?.rot || 0;
    this.scale = properties?.scale || new Vector2(1, 1);
    this.pivot = properties?.pivot || new Vector2(0, 0);
  }

  trs(): Matrix3 {
    const p = new Matrix3().translate(this.pos.clone().add(this.pivot));

    const m = new Matrix3();
    m.multiplyRight(p);
    m.scale(this.scale);
    m.rotate(this.rot);
    m.translate(this.pos);
    m.multiplyRight(p.invert());

    return m;
  }
}

init();
