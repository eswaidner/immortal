import { Assets, Filter, GlProgram, Graphics, Sprite, Texture } from "pixi.js";
import vertex from "./shaders/world.vert?raw";
import fragment from "./shaders/world.frag?raw";
import { g } from "./globals";
import { Region, regions } from "./regions";
import { Zone, zones } from "./zones";
import { clamp } from "./math";

export class World {
  chunks: Chunk[][];
  tileDataMap: Uint8ClampedArray;

  tileSize = 75; // pixels
  chunkSize = 16; // tiles
  mapSize = 512; // tiles

  constructor(tileDataMap: Uint8ClampedArray) {
    this.chunks = []; //TODO populate chunks
    this.tileDataMap = tileDataMap;

    const chunkPx = this.chunkSize * this.tileSize;
    const chunkGfx = new Graphics()
      .rect(0, 0, chunkPx, chunkPx)
      .stroke({ width: 2, color: "#FFFFFF" });

    // chunkGfx.pivot = chunkPx * 0.5;
    chunkGfx.position = {
      x: 0.5 * g.app.screen.width,
      y: 0.5 * g.app.screen.height,
    };

    g.origin.addChild(chunkGfx);

    g.app.ticker.add(() => {});
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

interface Chunk {}

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
