import { g } from "./globals";
import { Vector } from "./math";

export default class Input {
  downKeys: Map<string, boolean> = new Map();
  pointerScreenPos: Vector = new Vector();
  pointerWorldPos: Vector = new Vector();

  constructor() {}

  init() {
    window.onkeydown = (e) => {
      this.downKeys.set(e.key.toLowerCase(), true);
    };

    window.onkeyup = (e) => {
      this.downKeys.set(e.key.toLowerCase(), false);
    };

    // reset key downs when window is hidden
    // prevents keys 'sticking' down when window/tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.downKeys.clear();
    });

    g.app.stage.on("globalpointermove", (e) => {
      this.pointerScreenPos.x = e.global.x;
      this.pointerScreenPos.y = e.global.y;

      this.updatePointerWorldPos();
    });

    g.app.stage.eventMode = "static";
  }

  updatePointerWorldPos() {
    this.pointerWorldPos.x = this.pointerScreenPos.x - g.origin.x;
    this.pointerWorldPos.y = this.pointerScreenPos.y - g.origin.y;
  }

  isKeyDown(key: string): undefined | boolean {
    return this.downKeys.get(key);
  }
}
