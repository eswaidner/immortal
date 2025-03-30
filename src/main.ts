import "./style.css";

// must manually import application modules
// that don't depend on other included modules
import "./transforms";
import * as Zen from "./zen";

//TODO temp, Zen should handle game loop internally
function update(dt: number) {
  requestAnimationFrame(update);
  Zen.update(dt);
}

requestAnimationFrame(update);
