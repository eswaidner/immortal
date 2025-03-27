import { Application, Container } from "pixi.js";
import Input from "./input";
import State from "./state";
import { World } from "./world";

interface Globals {
  state: State;
  app: Application;
  origin: Container;
  input: Input;
  world: World;
}

export let g: Globals;

export function initGlobals(globals: Globals) {
  g = globals;
}

export function setWorld(world: World) {
  g.world = world;
}
