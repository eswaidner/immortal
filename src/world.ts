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

  //TODO load surface textures

  const biomeMap = (await biomeMapPromise) as Texture;
  const surfaceMap = await surfaceMapPromise;
  const waterMap = await waterMapPromise;
  const miscMap = await miscMapPromise;

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
  world.scale = 256;

  world.filters = [
    new Filter({
      glProgram: new GlProgram({ fragment, vertex }),
      resources: {
        biomeMap: biomeMap.source,
        surfaceMap: surfaceMap.source,
        waterMap: waterMap.source,
        miscMap: miscMap.source,
      },
    }),
  ];

  g.app.stage.addChildAt(world, 0);
}
