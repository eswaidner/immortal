in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;

uniform sampler2D biomeMap;
uniform sampler2D surfaceMap;
uniform sampler2D waterMap;
uniform sampler2D miscMap;

void main(void) {
    vec2 uvs = vTextureCoord.xy;

    vec4 fg = texture2D(waterMap, vTextureCoord);
    // vec4 fg = vec4(vTextureCoord.xy, 0, 1);

    gl_FragColor = fg;
}
