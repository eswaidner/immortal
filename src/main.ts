import "./style.css";
import { Application, Container, Text } from "pixi.js";
import Input from "./input";
import initWorld, { World } from "./world";
import initPlayer from "./player";
import initCamera from "./camera";
import State from "./state";
import { g, initGlobals, setWorld } from "./globals";
import { Vector } from "./math";
import { initNpcs } from "./npcs";

async function init() {
  initGlobals({
    app: new Application(),
    origin: new Container(),
    state: new State(),
    input: new Input(),
    world: undefined as unknown as World, // temp
  });

  g.app.stage.addChild(g.origin);

  g.state.addAttribute<Vector>("direction");
  g.state.addAttribute<{}>("face-direction");
  g.state.addAttribute<[Container, number]>("container");
  g.state.addAttribute<[Container, number]>("world-positioned");
  g.state.addAttribute<{}>("player");

  const appHolder = document.querySelector("#app")!;

  await g.app.init({
    resizeTo: appHolder as HTMLElement,
    backgroundColor: "#304025",
    antialias: true,
    roundPixels: false,
    autoDensity: true,
    resolution: 1 * window.devicePixelRatio,
  });

  g.app.ticker.maxFPS = 0;

  appHolder.appendChild(g.app.canvas);

  setWorld(await initWorld());

  initCamera();
  initNpcs();
  const player = await initPlayer();

  const txt = new Text({
    text: `Immortal`,
    style: { fill: "#ffffff", fontSize: 18 },
  });

  g.app.stage.addChild(txt);

  g.app.ticker.add((tk) => {
    updateWorldOriginPosition();
    faceDirection();
    updatePositions();

    const playerPos = player.get<Vector>("position")!;

    const tilePos = g.world.worldToTile(playerPos.x, playerPos.y);
    const tile = g.world.getTileData(tilePos.x, tilePos.y);
    const chunkPos = g.world.tileToChunk(tilePos.x, tilePos.y);
    const worldPosConverted = g.world.chunks[chunkPos.y][chunkPos.x].worldPos(
      tilePos.x - chunkPos.x * g.world.chunkSize,
      tilePos.y - chunkPos.y * g.world.chunkSize,
    );

    txt.text = `Immortal
Resolution: ${g.app.canvas.width}x${g.app.canvas.height}
FPS: ${g.app.ticker.FPS.toFixed(0)}
Pos: (${playerPos.x.toFixed(2)}, ${playerPos.y.toFixed(2)})
Pos (Converted): ${worldPosConverted.x}, ${worldPosConverted.y}
Tile: ${tilePos.x}, ${tilePos.y}
Chunk: ${chunkPos.x}, ${chunkPos.y}
Region: ${tile.region ? tile.region.name : "undefined"} (${tile.regionId})
Zone: ${tile.zone ? tile.zone.name : "undefined"} (${tile.zoneId})
`;
  });
}

function faceDirection() {
  const q = g.state.query({
    include: ["face-direction", "direction", "container"],
  });

  for (let ent of q.entities) {
    const dir = ent.attributes["direction"] as Vector;
    const [c, scale] = ent.attributes["container"] as [Container, number];

    if (dir.x !== 0) {
      c.scale.x = dir.x > 0 ? scale : -scale;
    }
  }
}

function updateWorldOriginPosition() {
  const camPos = g.state.query({ include: ["camera", "position"] }).entities[0]
    .attributes["position"] as Vector;

  g.origin.x = -camPos.x;
  g.origin.y = -camPos.y;
}

function updatePositions() {
  const q = g.state.query({ include: ["position", "container"] });

  for (let i = 0; i < q.entities.length; i++) {
    const e = q.entities[i];

    const pos = e.attributes["position"] as Vector;
    const [c, _] = e.attributes["container"] as [Container, number];

    c.x = pos.x;
    c.y = pos.y;
  }
}

init();
