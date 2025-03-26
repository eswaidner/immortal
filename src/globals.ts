import { Application } from "pixi.js";
import Input from "./input";
import State from "./state";

interface Globals {
  state: State;
  app: Application;
  input: Input;
}

export let g: Globals;

export function initGlobals(globals: Globals) {
  g = globals;
}
