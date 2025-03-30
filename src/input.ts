import { Vector } from "./math";
import { Origin } from "./pixi";
import * as Zen from "./zen";

function init() {
  Zen.createResource<Input>(Input, new Input());

  Zen.createSystem({ resources: [Input, Origin] }, { once: updateInput });
}

function updateInput() {
  const input = Zen.getResource<Input>(Input)!;
  const origin = Zen.getResource<Origin>(Origin)!;

  if (!input.initialized) initInput(input, origin);

  //guarantee each key state gets a full frame to be processed before removal
  input.keyPressesPrev.clear();
  input.keyReleasesPrev.clear();
  const kpp = input.keyPressesPrev;
  const krp = input.keyReleasesPrev;
  input.keyPressesPrev = input.keyPressesNext;
  input.keyReleasesPrev = input.keyReleasesNext;
  input.keyPressesNext = kpp;
  input.keyReleasesNext = krp;
}

function initInput(input: Input, origin: Origin) {
  window.onkeydown = (e) => {
    const k = e.key.toLowerCase();

    // prevents repeating keydown events from messing up key press state
    if (!input.downKeys.has(k)) {
      input.keyPressesNext.add(k);
      input.downKeys.add(k);
    }
  };

  window.onkeyup = (e) => {
    const k = e.key.toLowerCase();
    input.downKeys.delete(k);
    input.keyReleasesNext.add(k);
  };

  // reset key downs when window is hidden
  // prevents keys 'sticking' down when window/tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") input.downKeys.clear();
  });

  origin.container.eventMode = "dynamic";
  origin.container.on("globalpointermove", (e) => {
    input.pointerScreenPos.x = e.global.x;
    input.pointerScreenPos.y = e.global.y;

    input.syncPointerWorldPos();
  });

  input.initialized = true;
}

export class Input {
  initialized: boolean = false;
  downKeys: Set<string> = new Set();
  keyPressesPrev: Set<string> = new Set();
  keyReleasesPrev: Set<string> = new Set();
  keyPressesNext: Set<string> = new Set();
  keyReleasesNext: Set<string> = new Set();
  pointerScreenPos: Vector = new Vector();
  pointerWorldPos: Vector = new Vector();

  isKeyDown(key: string): boolean {
    return this.downKeys.has(key);
  }

  wasKeyPressed(key: string): boolean {
    return this.keyPressesPrev.has(key);
  }

  wasKeyReleased(key: string): boolean {
    return this.keyReleasesPrev.has(key);
  }

  syncPointerWorldPos() {
    //TODO use viewport to get cursor world pos
    // this.pointerWorldPos.x = this.pointerScreenPos.x - g.origin.x;
    // this.pointerWorldPos.y = this.pointerScreenPos.y - g.origin.y;
  }
}

init();
