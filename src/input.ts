export default class Input {
  downKeys: Map<string, boolean> = new Map();

  constructor() {
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
  }

  isKeyDown(key: string): undefined | boolean {
    return this.downKeys.get(key);
  }
}
