import { Application, Assets, Container } from "pixi.js";
import Input from "./input";
import State from "./state";
import { World } from "./world";

interface Globals {
  state: State;
  app: Application;
  origin: Container;
  input: Input;
  world: World;
  assets: Map<string, any>;
}

export let g: Globals;

export async function initGlobals(globals: Globals) {
  g = globals;

  g.assets.set(
    "/projectiles/slash.webp",
    await Assets.load("/projectiles/slash.webp"),
  );
}

export function setWorld(world: World) {
  g.world = world;
}
