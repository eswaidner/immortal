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
import "./camera";
import "./player";

Zen.start();
