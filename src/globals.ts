import { Application, Container } from "pixi.js";
import Input from "./input";
import State from "./state";

interface Globals {
  state: State;
  app: Application;
  world: Container;
  input: Input;
}

export let g: Globals;

export function initGlobals(globals: Globals) {
  g = globals;
}
