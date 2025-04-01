import * as Zen from "./zen";

import { Filter, GlProgram, Sprite, Texture } from "pixi.js";
import { WorldOrigin, ScreenOrigin } from "./pixi";
import { Viewport } from "./viewport";

const o = Zen.getResource<ScreenOrigin>(ScreenOrigin)!;
const vp = Zen.getResource<Viewport>(Viewport)!;
const time = Zen.getResource<Zen.Time>(Zen.Time)!;

import gridVert from "./shaders/grid.vert?raw";
import gridFrag from "./shaders/grid.frag?raw";
const gridFilter = new Filter({
  glProgram: new GlProgram({ vertex: gridVert, fragment: gridFrag }),
  resources: {
    metadata: {
      worldPos: {
        value: { x: -o.container.x, y: -o.container.y },
        type: "vec2<f32>",
      },
      screenSize: {
        value: { x: vp.screen.x, y: vp.screen.y },
        type: "vec2<f32>",
      },
      time: {
        value: time.elapsed,
        type: "f32",
      },
    },
  },
});

const gridGfx = Sprite.from(Texture.WHITE);
gridGfx.filters = [gridFilter];
gridGfx.zIndex = -1;
o.container.addChild(gridGfx);

Zen.createSystem(
  { resources: [WorldOrigin, Viewport, Zen.Time] },
  {
    once: () => {
      const o = Zen.getResource<WorldOrigin>(WorldOrigin)!;
      const vp = Zen.getResource<Viewport>(Viewport)!;
      const time = Zen.getResource<Zen.Time>(Zen.Time)!;

      gridGfx.scale = { x: vp.screen.x, y: vp.screen.y };

      gridFilter.resources.metadata.uniforms.worldPos = {
        x: -o.container.x + vp.screen.x * 0.5,
        y: -o.container.y + vp.screen.y * 0.5,
      };

      gridFilter.resources.metadata.uniforms.screenSize = {
        x: vp.screen.x,
        y: vp.screen.y,
      };

      gridFilter.resources.metadata.uniforms.time = time.elapsed;
    },
  },
);
