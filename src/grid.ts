import * as Zen from "./zen";

import { Draw, DrawGroup, Shader, Viewport } from "./graphics";

const vp = Zen.getResource<Viewport>(Viewport)!;

import gridSrc from "./shaders/grid.frag?raw";
const gridShader = new Shader(gridSrc, "world", {
  properties: { test: "float" },
  uniforms: {},
});

const group = new DrawGroup(vp.gl, gridShader);
Zen.createEntity().addAttribute(DrawGroup, group);
Zen.createEntity().addAttribute(Draw, new Draw(group, []));
Zen.createEntity().addAttribute(Draw, new Draw(group, []));
