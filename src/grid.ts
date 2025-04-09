import * as Zen from "./zen";

import { Draw, DrawGroup, Shader } from "./graphics";

import gridSrc from "./shaders/grid.frag?raw";
const gridShader = new Shader(gridSrc, "fullscreen");

const group = new DrawGroup(gridShader);
group.zIndex = -1;

Zen.createEntity().addAttribute(DrawGroup, group);
Zen.createEntity().addAttribute(Draw, new Draw(group));
