import { Transform } from "./transforms";
import { Viewport } from "./graphics";
import * as Zen from "./zen";
import { vec2 } from "gl-matrix";

function input() {
  Zen.defineAttribute(Camera);
  Zen.defineAttribute(SmoothFollow);

  Zen.createSystem({ with: [SmoothFollow, Transform] }, { foreach: follow });

  const followAttr = new SmoothFollow({ speed: 8 });
  Zen.createEntity()
    .addAttribute(Camera, new Camera())
    .addAttribute(SmoothFollow, followAttr)
    .addAttribute(Transform, new Transform());

  Zen.createSystem(
    { with: [Camera, Transform], resources: [Viewport] },
    {
      foreach: (e, ctx) => {
        const vp = Zen.getResource<Viewport>(Viewport)!;
        const trs = e.getAttribute<Transform>(Transform)!;

        // trs.pos[0] -= 0.5 * ctx.deltaTime;
        // vp.zoom -= 0.001 * ctx.deltaTime;

        vp.transform.pos = vec2.clone(trs.pos);
        vp.transform.rot = trs.rot;
      },
    },
  );
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

  const sqDist = vec2.sqrDist(targetTrs.pos, trs.pos);

  if (sqDist > 0.005) {
    vec2.lerp(trs.pos, trs.pos, targetTrs.pos, follow.speed * ctx.deltaTime);
  }
}

input();
