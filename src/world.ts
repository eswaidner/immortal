import { Assets, Filter, GlProgram, Sprite, Texture } from "pixi.js";
import vertex from "./shaders/world.vert?raw";
import fragment from "./shaders/world.frag?raw";
import { g } from "./globals";

export default async function initWorld() {
  //TODO use manifest and bundles instead
  const biomeMapPromise = Assets.load("/world/biome_map.webp");
  const surfaceMapPromise = Assets.load("/world/surface_map.webp");
  const waterMapPromise = Assets.load("/world/water_map.webp");
  const miscMapPromise = Assets.load("/world/misc_map.webp");
  const perlinNoisePromise = Assets.load("/world/perlin_noise.png");

  //TODO load surface textures

  const biomeMap = (await biomeMapPromise) as Texture;
  const surfaceMap = (await surfaceMapPromise) as Texture;
  const waterMap = (await waterMapPromise) as Texture;
  const miscMap = (await miscMapPromise) as Texture;
  const perlinNoise = (await perlinNoisePromise) as Texture;

  miscMap.source.addressMode = "repeat";
  perlinNoise.source.addressMode = "repeat";

  // get pixel data for biomes
  // const biomeMapSprite = Sprite.from(biomeMap);
  // const biomePixels = app.renderer.extract.pixels({
  //   resolution: 1,
  //   target: biomeMapSprite,
  // });

  const world = Sprite.from(Texture.WHITE);
  world.position = {
    x: g.app.screen.width * 0.5,
    y: g.app.screen.height * 0.5,
  };

  world.anchor = 0.5;
  world.width = g.app.screen.width;
  world.height = g.app.screen.height;

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

  world.filters = [worldFilter];

  g.app.stage.addChildAt(world, 0);

  g.app.ticker.add((tk) => {
    const wpos = g.origin.position;
    worldFilter.resources.metadata.uniforms.worldPos = wpos;
    worldFilter.resources.metadata.uniforms.screenSize = {
      x: g.app.screen.width,
      y: g.app.screen.height,
    };
    worldFilter.resources.metadata.uniforms.time = tk.lastTime;
  });
}
