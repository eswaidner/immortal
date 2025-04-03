import { Vector } from "./math";
import { Transform } from "./transforms";
import * as Zen from "./zen";

async function init() {
  const canvas = document.querySelector("#zen-app")! as HTMLCanvasElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("failed to get webgl2 context");

  gl.clearColor(0.07, 0.07, 0.07, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  Zen.createResource(Viewport, new Viewport(gl));

  new ResizeObserver(onResize).observe(canvas, { box: "content-box" });

  Zen.createSystem(
    { with: [], resources: [Viewport] },
    { foreach: enqueueDraw, once: render },
  );
}

export class Draw {
  group: RenderGroup;
  properties: Record<string, PropertyValue>;

  constructor(group: RenderGroup, properties: Record<string, PropertyValue>) {
    this.group = group;
    this.properties = properties;
  }
}

export class Viewport {
  screen: Vector = new Vector();
  transform: Transform = new Transform();
  gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  //TODO screen space utilities
}

function enqueueDraw(e: Zen.Entity, ctx: Zen.SystemContext) {
  //TODO add to instance group
}

function render(ctx: Zen.SystemContext) {
  //TODO dispatch instanced draw calls
}

type ShaderMode = "world" | "fullscreen";

export class Shader {
  program: WebGLProgram;
  mode: ShaderMode;
  uniforms: Record<string, Uniform>;
  textures: Record<string, Texture>;
  properties: Record<string, Property>;

  constructor(
    source: string,
    mode: ShaderMode,
    options?: {
      properties?: Record<string, Property>;
      uniforms?: Record<string, Uniform>;
      textures?: Record<string, Texture>;
    },
  ) {
    const gl = Zen.getResource<Viewport>(Viewport)?.gl;
    if (!gl) throw new Error("failed to get renderer");

    //TODO generate worldspace or fullscreen vertex shader from template
    //TODO generate attribute passthroughs to fragment shader
    const vert = compileShader(gl, true, "//TODO");

    // no preprocessing
    const frag = compileShader(gl, false, source);

    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (!success) {
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      throw new Error("failed to create gl program");
    }

    this.program = program;
    this.mode = mode;
    this.uniforms = options?.uniforms || {};
    this.textures = options?.textures || {};
    this.properties = options?.properties || {};
  }
}

function compileShader(
  gl: WebGL2RenderingContext,
  vert: boolean,
  source: string,
): WebGLShader {
  let shader = gl.createShader(vert ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER)!;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  throw new Error(`failed to create shader`);
}

interface Property {
  name: string;
  location: number;
  size: number;
  stride: number;
  offset: number;
  //TODO type
}

interface PropertyValue {
  //TODO type
}

interface Uniform {
  name: string;
  location: number;
  //TODO type
}

interface Texture {
  name: string;
  tex: WebGLTexture;
}

export class RenderGroup {
  shader: Shader;
  vao: WebGLVertexArrayObject;
  //TODO should always just be 1x1 rect vertex positions
  // modelBuffer: BufferHandle;
  instanceBuffer: BufferHandle;

  constructor(gl: WebGL2RenderingContext, shader: Shader) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    // const modelBuffer = new BufferHandle(gl, modelAttrs, 0);
    const instanceBuffer = new BufferHandle(gl, shader.properties, 1);
    gl.bindVertexArray(null);

    this.shader = shader;
    this.vao = vao;
    // this.modelBuffer = modelBuffer;
    this.instanceBuffer = instanceBuffer;
  }

  setUniform() {}
}

export class BufferHandle {
  buffer: WebGLBuffer;
  stride: number;

  constructor(
    gl: WebGL2RenderingContext,
    props: Record<string, Property>,
    divisor = 0,
  ) {
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);

    let stride = 0;

    // set up attributes
    for (const a of Object.values(props)) {
      gl.enableVertexAttribArray(a.location);

      if (divisor > 0) gl.vertexAttribDivisor(a.location, divisor);

      gl.vertexAttribPointer(
        a.location,
        a.size, // can be 1-4 (components)
        gl.FLOAT, // 32-bit float
        false, // do not normalize
        a.stride, // move forward size * sizeof(type) each iteration to get the next position
        a.offset, // start at the beginning of the buffer
      );

      stride += a.size;
    }

    this.buffer = buf;
    this.stride = stride;
  }
}

// adapted from WebGl2Fundementals
// https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
function onResize(entries: ResizeObserverEntry[]) {
  for (const entry of entries) {
    const vp = Zen.getResource<Viewport>(Viewport);
    if (!vp || entry.target !== vp.gl.canvas) continue;

    const size = entry.devicePixelContentBoxSize[0];
    const displayWidth = Math.round(size.inlineSize);
    const displayHeight = Math.round(size.blockSize);

    vp.screen.x = displayWidth;
    vp.screen.y = displayHeight;

    const needResize =
      vp.gl.canvas.width !== displayWidth ||
      vp.gl.canvas.height !== displayHeight;

    if (needResize) {
      vp.gl.viewport(0, 0, displayWidth, displayHeight);
      // TODO render to avoid flashes
    }
  }
}

function buildVertSource(renderGroup: RenderGroup, mode: ShaderMode): string {
  let attributes = "";
  let varyings = "";
  let interpolations = "";

  const clip_space_calc =
    mode === "fullscreen"
      ? "LOCAL_POSITION"
      : "WORLD_TO_SCREEN * VERTEX_POSITION";

  return `#version 300 es
  uniform mat3 WORLD_TO_SCREEN;
  uniform mat3 SCREEN_TO_WORLD;

  in vec3 VERTEX_POSITION;
  in vec3 LOCAL_POSITION;
  ${attributes}

  out vec2 SCREEN_POS;
  out vec2 WORLD_POS;
  out vec2 LOCAL_POS;
  ${varyings}

  void main() {
    gl_Position = ${clip_space_calc};

    SCREEN_POS  = VERTEX_POSITION;
    WORLD_POS   = SCREEN_TO_WORLD * VERTEX_POSITION;
    LOCAL_POS   = LOCAL_POSITION;
    ${interpolations}
  }
`;
}

init();
