import "./style.css";
import * as Zen from "./zen";

// must manually import application modules
// that don't depend on other included modules
import "./transforms";
import "./graphics";
// import "./input";
// import "./movement";
import "./grid";
import { Draw, DrawGroup, Shader, Viewport } from "./graphics";
import { Transform } from "./transforms";
import { Vector2 } from "math.gl";
// import "./hitpoints";
// import "./collisions";
// import "./camera";
// import "./player";

Zen.start();

const t = Zen.getResource<Zen.Time>(Zen.Time)!;

//TEMP test graphics
const shader = new Shader(
  `#version 300 es
precision highp float;

out vec4 color;
void main() {
  color = vec4(1.0, 1.0, 1.0, 1.0);
}
`,
  "world",
);

const g = new DrawGroup(shader);
Zen.createEntity().addAttribute(DrawGroup, g);
Zen.createEntity()
  .addAttribute(Draw, new Draw(g))
  .addAttribute(
    Transform,
    new Transform({
      pos: new Vector2(2, 4),
      rot: 6,
      pivot: new Vector2(0.5, 0.5),
    }),
  );
