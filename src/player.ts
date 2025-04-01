import { Assets, Sprite } from "pixi.js";
import { Input } from "./input";
import { Vector } from "./math";
import { FaceVelocity, Movement } from "./movement";
import { SceneObject } from "./pixi";
import { Transform } from "./transforms";
import * as Zen from "./zen";
import { Viewport } from "./viewport";
import { SmoothFollow } from "./camera";

async function init() {
  Zen.defineAttribute(Player);

  const playerTex = await Assets.load("./dude_1.png");
  const playerSprite = Sprite.from(playerTex);

  const playerEntity = Zen.createEntity()
    .addAttribute(Player, new Player())
    .addAttribute(Transform, new Transform())
    .addAttribute(Movement, new Movement({ decay: 0.2, mass: 1 }))
    .addAttribute(SceneObject, new SceneObject(playerSprite))
    .addAttribute(FaceVelocity, new FaceVelocity());

  Zen.createResource(PlayerEntity, new PlayerEntity(playerEntity));
  Zen.createResource(PlayerInput, new PlayerInput());

  Zen.createSystem(
    { with: [Player, Movement], resources: [PlayerInput, Input] },
    { foreach: processInput },
  );

  //TEMP
  const vp = Zen.getResource<Viewport>(Viewport);
  if (vp && vp.source) {
    const followCam = vp.source.getAttribute<SmoothFollow>(SmoothFollow);
    if (followCam) {
      followCam.target = playerEntity;
    }
  }
}

class Player {}

export class PlayerEntity {
  entity: Zen.Entity;

  constructor(e: Zen.Entity) {
    this.entity = e;
  }
}

class PlayerInput {
  //TODO move to a behavior attribute
  walkForce: number = 150;
}

function processInput(e: Zen.Entity) {
  const input = Zen.getResource<Input>(Input)!;
  const playerInput = Zen.getResource<PlayerInput>(PlayerInput)!;
  const movement = e.getAttribute<Movement>(Movement)!;

  let dx = 0;
  if (input.isKeyDown("d")) dx += 1;
  if (input.isKeyDown("a")) dx -= 1;

  let dy = 0;
  if (input.isKeyDown("s")) dy += 1;
  if (input.isKeyDown("w")) dy -= 1;

  const walkDir = new Vector(dx, dy).normalize();
  movement.force = movement.force.add(walkDir.scale(playerInput.walkForce));
}

init();
