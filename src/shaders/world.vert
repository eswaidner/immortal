in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    // vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    vec2 position = aPosition * 2048.0;

    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = aPosition;
}
