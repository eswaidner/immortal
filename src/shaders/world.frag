precision highp float;

in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;

uniform vec2 worldPos;
uniform vec2 screenSize;
uniform float time;

uniform sampler2D biomeMap;
uniform sampler2D surfaceMap;
uniform sampler2D waterMap;
uniform sampler2D miscMap;
uniform sampler2D perlinNoise;

float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

vec3 splat(vec3 weights, vec3 c0, vec3 c1, vec3 c2) {
    return mix(mix(c0.xyz, c1.xyz, weights.y), c2.xyz, weights.z);
}

vec3 splatStep(vec3 weights, vec3 heights, vec3 c0, vec3 c1, vec3 c2) {
    //TODO smoothstep for height application
    float maxXY = max(weights.x, weights.y);
    float maxXYZ = step(maxXY + 0.05, weights.z);

    maxXY = step(0.5, maxXY);

    return mix(mix(c0.xyz, c1.xyz, 1.0 - maxXY), c2.xyz, maxXYZ);
}

float grid(float size, float thickness, vec2 pos) {
    vec2 grid = 1.0 - step(thickness, fract(pos * size));
    float mask = 1.0 - min(grid.x + grid.y, 1.0);
    return mask;
}

// const float tileSize = 2.0;
const float tileSize = 75.0;
const float worldTextureSize = 512.0;
const float halfWorldSize = worldTextureSize * tileSize * 0.5;
const float cloudSize = 7.0;
const vec2 cloudDir = vec2(-0.00001, 0.000005);
const float cloudShadow = 0.1;

const float noiseScale = 120.0;
const float waterNoiseScale = 80.0;
const float waterNoiseBias = 0.2;
const vec2 noiseDir = vec2(-0.0001, 0.0);

void main(void) {
    vec2 offsetWorldPos = -worldPos + (screenSize * vTextureCoord) - screenSize * 0.5;

    vec2 worldCoord = vec2(
            map(offsetWorldPos.x, -halfWorldSize, halfWorldSize, 0.0, 1.0),
            map(offsetWorldPos.y, -halfWorldSize, halfWorldSize, 0.0, 1.0)
        );

    vec4 biome = texture2D(biomeMap, worldCoord);
    vec4 surface = texture2D(surfaceMap, worldCoord);
    vec4 water = texture2D(waterMap, worldCoord);
    vec4 misc = texture2D(miscMap, worldCoord);

    vec4 perlin = texture2D(perlinNoise, worldCoord * noiseScale);
    vec4 perlin_offset = texture2D(perlinNoise, worldCoord * waterNoiseScale + noiseDir * time);

    vec2 cloudOffset = cloudDir * time;
    vec4 clouds = texture2D(miscMap, (worldCoord + cloudOffset) * cloudSize);

    vec3 surf1Col_b0 = vec3(1.0, 0.85, 0.6);
    vec3 surf2Col_b0 = vec3(0.196, 0.451, 0.161);
    vec3 surf3Col_b0 = vec3(0.988, 0.871, 0.663);

    vec3 surf1Col_b1 = vec3(1.0, 0.85, 0.6);
    vec3 surf2Col_b1 = vec3(0.196, 0.451, 0.161);
    vec3 surf3Col_b1 = vec3(0.196, 0.451, 0.161);

    vec3 surf1Col_b2 = vec3(1.0, 0.85, 0.6);
    vec3 surf2Col_b2 = vec3(0.196, 0.451, 0.161);
    vec3 surf3Col_b2 = vec3(0.42, 0.612, 0.349);

    vec3 surface1Color = splatStep(biome.xyz, vec3(0.0), surf1Col_b0, surf1Col_b1, surf1Col_b2);
    vec3 surface2Color = splatStep(biome.xyz, vec3(0.0), surf2Col_b0, surf2Col_b1, surf2Col_b2);
    vec3 surface3Color = splatStep(biome.xyz, vec3(0.0), surf3Col_b0, surf3Col_b1, surf3Col_b2);

    //TODO surface texture samples

    vec3 surfColor = splatStep(surface.xyz, perlin.xyz, surface1Color, surface2Color, surface3Color);
    vec3 waterColor = mix(vec3(0.086, 0.235, 0.4) * 0.7, vec3(0.122, 0.314, 0.529), (1.0 - water.z + perlin_offset.x * waterNoiseBias));
    surfColor = mix(surfColor, waterColor, 0.8 * step(0.1, water.z - perlin_offset.x * waterNoiseBias));

    // GRIDS
    float tileGrid = 1.0 - grid(1.0, 0.025, worldCoord.xy * worldTextureSize);
    float chunkGrid = 1.0 - grid(1.0 / 16.0, 0.005, worldCoord.xy * worldTextureSize);

    // vec4 fg = vec4(vTextureCoord, 0.0, 1.0);

    vec4 fg = vec4(surfColor - (max(tileGrid, chunkGrid) * 0.025), 1.0);

    if (worldCoord.x < 0.0 || worldCoord.y < 0.0) fg = vec4(0, 0, 0, 1);
    if (worldCoord.x > 1.0 || worldCoord.y > 1.0) fg = vec4(0, 0, 0, 1);

    gl_FragColor = fg;
}
