import "./style.css";
import * as Zen from "./zen";

// must manually import application modules
// that don't depend on other included modules
import "./pixi";
import "./transforms";
import "./viewport";
import "./input";
import "./movement";
import "./hitpoints";
import "./collisions";
import "./grid";
import { Graphics } from "pixi.js";
import { Transform } from "./transforms";
import { SceneObject } from "./pixi";

Zen.start();

const gfx = new Graphics().rect(0, 0, 100, 100).fill(0xffffff);

Zen.createEntity()
  .addAttribute<Transform>(Transform, new Transform({}))
  .addAttribute<SceneObject>(SceneObject, new SceneObject(gfx));
