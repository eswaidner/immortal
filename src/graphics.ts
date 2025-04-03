import { Matrix, Vector } from "./math";
import { Transform } from "./transforms";
import * as Zen from "./zen";

async function init() {
  Zen.defineAttribute(Draw);
  Zen.defineAttribute(DrawGroup);

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
    { with: [Draw], resources: [Viewport] },
    { foreach: enqueueDraw, once: draw },
  );
}

export class Draw {
  group: DrawGroup;
  properties: PropertyValue[];

  constructor(group: DrawGroup, properties: PropertyValue[]) {
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
  const d = e.getAttribute<Draw>(Draw)!;

  for (let i = 0; i < d.properties.length; i++) {
    //TODO append property data to draw group
    // d.group.propertyValues.push(d.properties[i]);
  }
}

function draw(ctx: Zen.SystemContext) {
  const q = Zen.query({ with: [DrawGroup], resources: [Viewport] });
  for (let i = 0; i < q.length; i++) {
    //TODO dispatch instanced draw calls
    //TODO clear draw group property data
  }
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

    this.mode = mode;
    this.uniforms = options?.uniforms || {};
    this.textures = options?.textures || {};
    this.properties = options?.properties || {};

    //TODO generate worldspace or fullscreen vertex shader from template
    //TODO generate attribute passthroughs to fragment shader
    const vert = compileShader(gl, true, vertSource(this));

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

type GLType = GLPropertyType | "mat2";
type GLPropertyType = "float" | "vec2";

type PropertyValue = number | Vector;
type UniformValue = number | Vector | Matrix;

interface Property {
  type: GLPropertyType;
}

interface Uniform {
  type: GLType;
}

interface Texture {
  tex: WebGLTexture;
}

function getPropertySize(p: Property): number {
  return p.type === "float" ? 1 : 2;
}

export class DrawGroup {
  shader: Shader;
  vao: WebGLVertexArrayObject;
  //TODO should always just be 1x1 rect vertex positions, attr locations may change
  // modelBuffer: BufferHandle;
  instanceBuffer: BufferFormat;
  uniformValues: Record<string, UniformValue> = {};
  propertyValues: number[] = [];

  constructor(gl: WebGL2RenderingContext, shader: Shader) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    // const modelBuffer = new BufferHandle(gl, modelAttrs, 0);
    const instanceBuffer = new BufferFormat(gl, shader, 1);
    gl.bindVertexArray(null);

    this.shader = shader;
    this.vao = vao;
    // this.modelBuffer = modelBuffer;
    this.instanceBuffer = instanceBuffer;
  }

  setUniform() {}
}

export class BufferFormat {
  buffer: WebGLBuffer;
  stride: number;

  constructor(gl: WebGL2RenderingContext, shader: Shader, divisor = 0) {
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);

    // number of f32s per instance
    let stride = 0;

    // set up attributes
    for (const [name, p] of Object.entries(shader.properties)) {
      const location = gl.getAttribLocation(shader.program, name);
      const size = getPropertySize(p);

      gl.enableVertexAttribArray(location);

      if (divisor > 0) gl.vertexAttribDivisor(location, divisor);

      gl.vertexAttribPointer(
        location,
        size, // can be 1-4 (components)
        gl.FLOAT, // 32-bit float
        false, // do not normalize
        0, // size * sizeof(type), auto-calculated
        stride * 4, // buffer byte offset
      );

      stride += size;
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
    }
  }
}

function vertSource(shader: Shader): string {
  let attributes = "";
  let varyings = "";
  let interpolations = "";

  // serialize attributes, varyings, and interpolations
  for (const [name, p] of Object.entries(shader.properties)) {
    attributes += `in ${p.type} _${name};\n`;
    varyings += `out ${p.type} ${name};\n`;
    interpolations += `  ${name} = _${name};\n`;
  }

  const clip_space_calc =
    shader.mode === "fullscreen"
      ? "vec4(LOCAL_POSITION, 0.0, 1.0)"
      : "vec4((WORLD_TO_SCREEN * vec3(VERTEX_POSITION, 1.0)).xy, 0.0, 1.0)";

  return `#version 300 es
  uniform mat3 WORLD_TO_SCREEN;
  uniform mat3 SCREEN_TO_WORLD;

  in vec2 VERTEX_POSITION;
  in vec2 LOCAL_POSITION;
  ${attributes}

  out vec2 SCREEN_POS;
  out vec2 WORLD_POS;
  out vec2 LOCAL_POS;
  ${varyings}

  void main() {
    gl_Position = ${clip_space_calc};
    ${interpolations}
  }
`;
}

init();
