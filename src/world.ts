import {
  Assets,
  Container,
  Filter,
  GlProgram,
  Graphics,
  Sprite,
  Texture,
} from "pixi.js";
import vertex from "./shaders/world.vert?raw";
import fragment from "./shaders/world.frag?raw";
import { g } from "./globals";
import { Region, regions } from "./regions";
import { Zone, zones } from "./zones";
import { clamp, Vector } from "./math";
import { Entity } from "./state";
import { SpriteDepth } from "./main";
import { Follow, Roam, Speed } from "./npcs";

export class World {
  chunks: Chunk[][] = [];
  loadedChunks: Map<number, Chunk> = new Map();
  tileDataMap: Uint8ClampedArray;

  tileSize = 75; // pixels
  chunkSize = 16; // tiles
  mapSize = 512; // tiles

  constructor(tileDataMap: Uint8ClampedArray) {
    this.tileDataMap = tileDataMap;

    const mapSizeChunks = this.mapSize / this.chunkSize;

    // spawn chunks
    for (let y = 0; y < mapSizeChunks; y++) {
      this.chunks.push([]);
      for (let x = 0; x < mapSizeChunks; x++) {
        this.chunks[y].push(new Chunk(new Vector(x, y), this));
      }
    }

    g.app.ticker.add(() => {
      const playerQ = g.state.query({ include: ["player", "position"] });
      const player = playerQ.entities[0];
      if (!player) return;

      const playerPos = player.attributes["position"] as Vector;

      const tilePos = g.world.worldToTile(playerPos.x, playerPos.y);
      const chunkPos = g.world.tileToChunk(tilePos.x, tilePos.y);

      const hcpx = 0.5 * this.chunkSize * this.tileSize;
      const xChunks = Math.floor(Math.ceil(g.app.screen.width / hcpx) * 0.5);
      const yChunks = Math.floor(Math.ceil(g.app.screen.height / hcpx) * 0.5);

      const maxChunk = this.mapSize / this.chunkSize - 1;

      const minChunkX = Math.max(chunkPos.x - xChunks, 0);
      const minChunkY = Math.max(chunkPos.y - yChunks, 0);
      const maxChunkX = Math.min(chunkPos.x + xChunks, maxChunk);
      const maxChunkY = Math.min(chunkPos.y + yChunks, maxChunk);

      const chunksToUnload = [];

      for (let c of this.loadedChunks.values()) {
        if (
          c.pos.x < minChunkX ||
          c.pos.y < minChunkY ||
          c.pos.x > maxChunkX ||
          c.pos.y > maxChunkY
        ) {
          chunksToUnload.push(c);
        }
      }

      for (const chunk of chunksToUnload) {
        chunk.unload();
      }

      for (let y = minChunkY; y <= maxChunkY; y++) {
        for (let x = minChunkX; x <= maxChunkX; x++) {
          this.chunks[y][x].load();
        }
      }
    });
  }

  getTileData(x: number, y: number): TileData {
    const zoneId = this.tileDataMap[this.getTileIndex(x, y) * 4];
    const regionId = this.tileDataMap[this.getTileIndex(x, y) * 4 + 1];

    return {
      zoneId,
      regionId,
      zone: zones[zoneId],
      region: regions[regionId],
    };
  }

  getTileIndex(x: number, y: number): number {
    return y * this.mapSize + x;
  }

  worldToTile(x: number, y: number): { x: number; y: number } {
    const halfMapSizePx = this.mapSize * this.tileSize * 0.5;
    const offset = {
      x: 0.5 * g.app.screen.width,
      y: 0.5 * g.app.screen.height,
    };

    return {
      x: clamp(
        Math.floor((x + halfMapSizePx - offset.x) / this.tileSize),
        0,
        this.mapSize - 1,
      ),
      y: clamp(
        Math.floor((y + halfMapSizePx - offset.y) / this.tileSize),
        0,
        this.mapSize - 1,
      ),
    };
  }

  tileToChunk(x: number, y: number): { x: number; y: number } {
    return {
      x: clamp(Math.floor(x / this.chunkSize), 0, this.mapSize - 1),
      y: clamp(Math.floor(y / this.chunkSize), 0, this.mapSize - 1),
    };
  }
}

interface TileData {
  zoneId: number;
  regionId: number;
  zone: Zone;
  region: Region;
}

class Chunk {
  world: World;
  pos: Vector;
  border: Graphics;
  props: Container[] = [];
  entIds: number[] = [];

  constructor(pos: Vector, world: World) {
    this.world = world;
    this.pos = pos;

    const chunkPx = this.world.chunkSize * this.world.tileSize;
    this.border = new Graphics()
      .rect(0, 0, chunkPx, chunkPx)
      .stroke({ width: 2, color: "#101010" });

    this.border.position = {
      x: 0.5 * g.app.screen.width + (this.pos.x - 16) * chunkPx,
      y: 0.5 * g.app.screen.height + (this.pos.y - 16) * chunkPx,
    };

    this.border.tint = 0xff0000;

    // BORDER VISUALIZATION FOR DEBUGGING
    // g.origin.addChild(this.border);
  }

  load() {
    if (this.world.loadedChunks.has(this.index())) return;
    this.world.loadedChunks.set(this.index(), this);

    this.border.tint = 0xffffff;

    const tileCount = this.world.chunkSize * this.world.chunkSize;
    for (let i = 0; i < tileCount; i++) {
      const x = i % this.world.chunkSize;
      const y = Math.floor(i / this.world.chunkSize);

      const tile = this.world.getTileData(
        x + this.pos.x * this.world.chunkSize,
        y + this.pos.y * this.world.chunkSize,
      );

      if (tile.zone.name === "Forrest") {
        spawnTileProp(x, y, 0.65, "/tree_1.webp", this, (e, s) => {
          //TODO configure
        });
      } else if (tile.zone.name === "Arid") {
        if (Math.random() > 0.99) {
          spawnTileProp(x, y, 0.35, "/boar.webp", this, (e, s) => {
            //TODO configure
            e.set<Roam>("roam", {
              pos: new Vector(s.x, s.y),
              range: 200,
              minWaitTime: 0.75,
              maxWaitTime: 2,
              elapsedWait: 0,
            });

            e.set<Speed>("speed", { speed: 0.03 });
            e.set("face-direction", {});
            e.set("beast", {});
          });
        }
      }
    }
  }

  unload() {
    if (!this.world.loadedChunks.has(this.index())) return;
    this.world.loadedChunks.delete(this.index());

    for (let e of this.entIds) {
      g.state.deleteEntity(e);
    }

    for (let i = this.props.length; i >= 0; i--) {
      const prop = this.props.pop();
      prop?.destroy();
    }

    this.border.tint = 0xff0000;
  }

  index(): number {
    return (
      this.pos.x + (this.world.mapSize / this.world.chunkSize) * this.pos.y
    );
  }

  worldPos(x: number, y: number): Vector {
    const halfMapSizePx = this.world.mapSize * this.world.tileSize * 0.5;
    const offset = this.pos.scale(this.world.chunkSize * this.world.tileSize);

    return new Vector(
      x * this.world.tileSize +
        offset.x -
        halfMapSizePx +
        g.app.screen.width * 0.5,
      y * this.world.tileSize +
        offset.y -
        halfMapSizePx +
        g.app.screen.height * 0.5,
    );
  }
}

async function spawnTileProp(
  x: number,
  y: number,
  scale: number,
  url: string,
  chunk: Chunk,
  onSpawn?: (e: Entity, s: Sprite) => void,
) {
  const ent = g.state.addEntity();

  const prop = new Sprite(await Assets.load(url));
  const worldPos = chunk.worldPos(x, y);
  prop.x = worldPos.x + 0.5 * chunk.world.tileSize;
  prop.y = worldPos.y + 0.5 * chunk.world.tileSize;
  prop.anchor = 0.5;
  prop.scale = scale;

  ent.set<SpriteDepth>("sprite-depth", { offset: prop.height * 0.5 });
  ent.set("container", [prop as Container, scale]);
  ent.set<Vector>("position", new Vector(prop.x, prop.y));

  chunk.props.push(prop as Container);
  chunk.entIds.push(ent.id);

  g.origin.addChild(prop);

  if (onSpawn) onSpawn(ent, prop);
}

// gets pixel data for tile data map
async function getTileDataMapPixels(): Promise<Uint8ClampedArray> {
  const dataMap = (await Assets.load("/world/data_map.webp")) as Texture;
  const dataPixels = g.app.renderer.extract.pixels({
    resolution: 1,
    target: Sprite.from(dataMap),
  });

  return dataPixels.pixels;
}

export default async function initWorld(): Promise<World> {
  const world = new World(await getTileDataMapPixels());

  //TODO use manifest and bundles instead
  const biomeMapPromise = Assets.load("/world/biome_map.webp");
  const surfaceMapPromise = Assets.load("/world/surface_map.webp");
  const waterMapPromise = Assets.load("/world/water_map.webp");
  const miscMapPromise = Assets.load("/world/misc_map.webp");
  const perlinNoisePromise = Assets.load("/world/perlin_noise.png");

  //TODO load surface atlas

  const biomeMap = (await biomeMapPromise) as Texture;
  const surfaceMap = (await surfaceMapPromise) as Texture;
  const waterMap = (await waterMapPromise) as Texture;
  const miscMap = (await miscMapPromise) as Texture;
  const perlinNoise = (await perlinNoisePromise) as Texture;

  miscMap.source.addressMode = "repeat";
  perlinNoise.source.addressMode = "repeat";

  // get pixel data for biomes
  // const biomeMapSprite = Sprite.from(biomeMap);
  // const biomePixels = g.app.renderer.extract.pixels({
  //   resolution: 1,
  //   target: biomeMapSprite,
  // });

  const terrain = Sprite.from(Texture.WHITE);
  terrain.position = {
    x: g.app.screen.width * 0.5,
    y: g.app.screen.height * 0.5,
  };

  terrain.anchor = 0.5;
  terrain.width = g.app.screen.width;
  terrain.height = g.app.screen.height;

  const worldPos = g.origin.position;

  const worldFilter = new Filter({
    glProgram: new GlProgram({ fragment, vertex }),
    resources: {
      metadata: {
        worldPos: {
          value: { x: worldPos.x, y: worldPos.y },
          type: "vec2<f32>",
        },
        screenSize: {
          value: { x: g.app.screen.width, y: g.app.screen.height },
          type: "vec2<f32>",
        },
        time: {
          value: 0,
          type: "f32",
        },
      },
      biomeMap: biomeMap.source,
      surfaceMap: surfaceMap.source,
      waterMap: waterMap.source,
      miscMap: miscMap.source,
      perlinNoise: perlinNoise.source,
    },
  });

  terrain.filters = [worldFilter];

  g.app.stage.addChildAt(terrain, 0);

  g.app.ticker.add((tk) => {
    const wpos = g.origin.position;
    worldFilter.resources.metadata.uniforms.worldPos = wpos;
    worldFilter.resources.metadata.uniforms.screenSize = {
      x: g.app.screen.width,
      y: g.app.screen.height,
    };
    worldFilter.resources.metadata.uniforms.time = tk.lastTime;
  });

  return world;
}
