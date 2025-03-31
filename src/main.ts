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
import { Graphics } from "pixi.js";
import { SceneObject } from "./pixi";
import { Transform } from "./transforms";

Zen.start();

const gfx = new Graphics().rect(0, 0, 100, 100).fill(0xffffff);

Zen.createEntity()
  .addAttribute<Transform>(Transform, new Transform({}))
  .addAttribute<SceneObject>(SceneObject, new SceneObject(gfx));
