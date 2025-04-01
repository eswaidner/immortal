import { Vector } from "./math";
import { Transform } from "./transforms";
import { Viewport } from "./viewport";
import * as Zen from "./zen";

function input() {
  Zen.defineAttribute(Camera);
  Zen.defineAttribute(SmoothFollow);

  Zen.createSystem({ with: [SmoothFollow, Transform] }, { foreach: follow });

  const followAttr = new SmoothFollow({ speed: 1 });
  const cam = Zen.createEntity()
    .addAttribute(Camera, new Camera())
    .addAttribute(SmoothFollow, followAttr)
    .addAttribute(Transform, new Transform());

  //TEMP
  const vp = Zen.getResource<Viewport>(Viewport);
  if (vp) vp.source = cam;
}

export class Camera {}

export class SmoothFollow {
  speed: number;
  target?: Zen.Entity;

  constructor(options: { speed: number }) {
    this.speed = options.speed;
  }
}

function follow(e: Zen.Entity, ctx: Zen.SystemContext) {
  const follow = e.getAttribute<SmoothFollow>(SmoothFollow)!;
  const trs = e.getAttribute<Transform>(Transform)!;

  if (!follow.target) return;

  const targetTrs = follow.target.getAttribute<Transform>(Transform);
  if (!targetTrs) return;

  const sqDist = targetTrs.pos.sub(trs.pos).squaredMagnitude();

  if (sqDist > 5) {
    trs.pos = trs.pos.lerp(targetTrs.pos, follow.speed * ctx.deltaTime);
  }
}

input();
