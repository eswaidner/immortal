#version 300 es
precision highp float;

in vec2 SCREEN_POS;
in vec2 WORLD_POS;
in vec2 LOCAL_POS;

out vec4 fragColor;

uniform vec2 worldPos;
uniform vec2 screenSize;

float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float grid(float size, float thickness, vec2 pos) {
    vec2 grid = 1.0 - step(thickness, fract(pos * size));
    float mask = 1.0 - min(grid.x + grid.y, 1.0);
    return mask;
}

const float tileSize = 75.0;
const float worldTextureSize = 512.0;
const float halfWorldSize = worldTextureSize * tileSize * 0.5;

void main(void) {
    vec2 offsetWorldPos = -worldPos + (screenSize * LOCAL_POS) - screenSize * 0.5;

    vec2 worldCoord = vec2(
            map(offsetWorldPos.x, -halfWorldSize, halfWorldSize, 0.0, 1.0),
            map(offsetWorldPos.y, -halfWorldSize, halfWorldSize, 0.0, 1.0)
        );

    // GRIDS
    float tileGrid = 1.0 - grid(1.0, 0.025, worldCoord.xy * worldTextureSize);
    float chunkGrid = 1.0 - grid(1.0 / 16.0, 0.005, worldCoord.xy * worldTextureSize);
    // vec4 fg = vec4(max(tileGrid, chunkGrid) * 0.125);

    vec4 fg = vec4(LOCAL_POS, 0.0, 1.0);

    // if (worldCoord.x < 0.0 || worldCoord.y < 0.0) fg = vec4(0, 0, 0, 1);
    // if (worldCoord.x > 1.0 || worldCoord.y > 1.0) fg = vec4(0, 0, 0, 1);

    fragColor = fg;
}
