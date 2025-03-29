import { g } from "./globals";
import { Vector } from "./math";

export default class Input {
  downKeys: Set<string> = new Set();
  keyPressesPrev: Set<string> = new Set();
  keyReleasesPrev: Set<string> = new Set();
  keyPressesNext: Set<string> = new Set();
  keyReleasesNext: Set<string> = new Set();
  pointerScreenPos: Vector = new Vector();
  pointerWorldPos: Vector = new Vector();

  constructor() {}

  init() {
    window.onkeydown = (e) => {
      const k = e.key.toLowerCase();

      // prevents repeating keydown events from messing up key press state
      if (!this.downKeys.has(k)) {
        this.keyPressesNext.add(k);
        this.downKeys.add(k);
      }
    };

    window.onkeyup = (e) => {
      const k = e.key.toLowerCase();
      this.downKeys.delete(k);
      this.keyReleasesNext.add(k);
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

    g.app.ticker.add(() => {
      //guarantee each key state gets a full frame to be processed before removal
      this.keyPressesPrev.clear();
      this.keyReleasesPrev.clear();
      const kpp = this.keyPressesPrev;
      const krp = this.keyReleasesPrev;
      this.keyPressesPrev = this.keyPressesNext;
      this.keyReleasesPrev = this.keyReleasesNext;
      this.keyPressesNext = kpp;
      this.keyReleasesNext = krp;
    });
  }

  updatePointerWorldPos() {
    this.pointerWorldPos.x = this.pointerScreenPos.x - g.origin.x;
    this.pointerWorldPos.y = this.pointerScreenPos.y - g.origin.y;
  }

  isKeyDown(key: string): boolean {
    return this.downKeys.has(key);
  }

  wasKeyPressed(key: string): boolean {
    return this.keyPressesPrev.has(key);
  }

  wasKeyReleased(key: string): boolean {
    return this.keyReleasesPrev.has(key);
  }
}
