import * as Zen from "./zen";

import { Draw, RenderGroup, Shader, Viewport } from "./graphics";

const vp = Zen.getResource<Viewport>(Viewport)!;

import gridSrc from "./shaders/grid.frag?raw";
const gridShader = new Shader(gridSrc, "fullscreen");

const group = new RenderGroup(vp.gl, gridShader);
Zen.createEntity().addAttribute(Draw, new Draw(group, {}));
