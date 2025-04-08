import { Matrix3, Vector2 } from "math.gl";
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

  const vp = Zen.createResource(Viewport, new Viewport(gl));
  vp.zoom = 100;

  new ResizeObserver(onResize).observe(canvas, { box: "content-box" });

  Zen.createSystem(
    { with: [Draw], resources: [Viewport] },
    { foreach: enqueueDraw, once: draw },
  );
}

export class Viewport {
  screen: Vector2 = new Vector2();
  zoom: number = 1;
  transform: Transform = new Transform();
  gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  screenToWorld(screenPos: Vector2): Vector2 {
    return new Vector2(this.transform.trs().invert().transform(screenPos));
  }

  worldToScreen(worldPos: Vector2): Vector2 {
    return new Vector2(this.transform.trs().transform(worldPos));
  }
}

function enqueueDraw(e: Zen.Entity) {
  const d = e.getAttribute<Draw>(Draw)!;

  // TRANSFORM built-in property
  // required for all non-fullscreen shaders
  const t = e.getAttribute<Transform>(Transform);
  if (d.group.shader.mode === "world" && !t) {
    console.log("ERROR: world shaders require a Transform attribute");
    return;
  }

  if (t) d.group.propertyValues.push(...t.trs());

  // add value to property data buffer
  for (const p of d.properties) {
    if (p.type === "float") d.group.propertyValues.push(p.value);
    else d.group.propertyValues.push(...p.value);
  }

  d.group.instanceCount++;
}

function draw() {
  const q = Zen.query({ with: [DrawGroup] });

  const vp = Zen.getResource<Viewport>(Viewport);
  if (!vp) return;

  const t = Zen.getResource<Zen.Time>(Zen.Time);
  if (!t) return;

  for (let i = 0; i < q.length; i++) {
    const group = q[i].getAttribute<DrawGroup>(DrawGroup)!;

    vp.gl.useProgram(group.shader.program);
    vp.gl.bindVertexArray(group.vao);

    const vpTRS = vp.transform.trs();
    group.setMatrixUniform("WORLD_TO_SCREEN", vpTRS);
    group.setMatrixUniform("SCREEN_TO_WORLD", vpTRS.invert());

    vp.gl.bindBuffer(vp.gl.ARRAY_BUFFER, group.modelBuffer);
    vp.gl.bufferData(vp.gl.ARRAY_BUFFER, rectVerts, vp.gl.STATIC_DRAW);

    //TODO get data from property value array
    vp.gl.bindBuffer(vp.gl.ARRAY_BUFFER, group.instanceBuffer.buffer);
    vp.gl.bufferData(
      vp.gl.ARRAY_BUFFER,
      new Float32Array(group.propertyValues),
      vp.gl.STATIC_DRAW,
    );

    vp.gl.drawArraysInstanced(vp.gl.TRIANGLES, 0, 6, group.instanceCount);
    vp.gl.bindVertexArray(null);

    group.instanceCount = 0;
    group.propertyValues = [];
  }
}

type ShaderMode = "world" | "fullscreen";

export class Shader {
  program: WebGLProgram;
  mode: ShaderMode;
  uniforms: Uniform[] = [];
  textures: Record<string, Texture> = {};
  properties: Property[] = [];

  constructor(
    source: string,
    mode: ShaderMode,
    options?: {
      properties?: Record<string, GLType>;
      uniforms?: Record<string, GLType>;
      textures?: Record<string, Texture>; //TODO sampler settings
    },
  ) {
    const gl = Zen.getResource<Viewport>(Viewport)?.gl;
    if (!gl) throw new Error("failed to get renderer");

    this.mode = mode;
    this.textures = options?.textures || {};

    // add uniforms
    this.uniforms.push({ name: "WORLD_TO_SCREEN", type: "mat3", location: 0 });
    this.uniforms.push({ name: "SCREEN_TO_WORLD", type: "mat3", location: 0 });
    for (const [name, type] of Object.entries(options?.uniforms || {})) {
      this.uniforms.push({ name, type, location: 0 });
    }

    // add properties
    this.properties.push({ name: "TRANSFORM", type: "mat3", location: 0 });
    for (const [name, type] of Object.entries(options?.properties || {})) {
      this.properties.push({ name, type, location: 0 });
    }

    const vertSrc = vertSource(this);
    // console.log(vertSrc);

    const vert = compileShader(gl, true, vertSrc);
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

    // get uniform locations
    for (const u of this.uniforms) {
      u.location = gl.getUniformLocation(program, u.name)!;
    }

    //TODO get texture sampler locations

    // get property locations
    for (const p of this.properties) {
      p.location = gl.getAttribLocation(program, p.name)!;
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

type GLType = "float" | "vec2" | "mat3";
type GLValue = FloatValue | Vec2Value | Mat3Value;

interface FloatValue {
  type: "float";
  value: number;
}

interface Vec2Value {
  type: "vec2";
  value: Vector2;
}

interface Mat3Value {
  type: "mat3";
  value: Matrix3;
}

interface Property {
  name: string;
  type: GLType;
  location: number;
}

interface Uniform {
  name: string;
  type: GLType;
  location: WebGLUniformLocation;
}

interface Texture {
  name: string;
  tex: WebGLTexture;
  //TODO sampler settings
}

function getPropertySize(p: Property): number {
  switch (p.type) {
    case "float":
      return 1;
    case "vec2":
      return 2;
    case "mat3":
      return 9;
  }
}

export class Draw {
  group: DrawGroup;
  properties: GLValue[] = [];

  constructor(group: DrawGroup) {
    this.group = group;
  }

  setNumberProperty(name: string, value: number): Draw {
    return this.setProperty(name, { type: "float", value });
  }

  setVectorProperty(name: string, value: Vector2): Draw {
    return this.setProperty(name, { type: "vec2", value });
  }

  setMatrixProperty(name: string, value: Matrix3): Draw {
    return this.setProperty(name, { type: "mat3", value });
  }

  private setProperty(name: string, value: GLValue): Draw {
    const idx = this.group.shader.properties.findIndex((p) => p.name === name);
    if (idx < 0) {
      console.log(`WARNING: undefined property '${name}'`);
      return this;
    }

    this.properties[idx] = value;
    return this;
  }
}

export class DrawGroup {
  gl: WebGL2RenderingContext;
  shader: Shader;
  vao: WebGLVertexArrayObject;
  modelBuffer: WebGLBuffer;
  instanceBuffer: BufferFormat;
  textureValues: Record<string, Texture> = {};
  instanceCount: number = 0;
  propertyValues: number[] = [];

  constructor(shader: Shader) {
    const gl = Zen.getResource<Viewport>(Viewport)?.gl;
    if (!gl) throw new Error("failed to get renderer");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const modelBuffer = rectModelBuffer(gl, shader);
    const instanceBuffer = new BufferFormat(gl, shader);
    gl.bindVertexArray(null);

    this.gl = gl;
    this.shader = shader;
    this.vao = vao;
    this.modelBuffer = modelBuffer;
    this.instanceBuffer = instanceBuffer;
  }

  setNumberUniform(name: string, value: number): DrawGroup {
    this.setUniform(name, { type: "float", value });
    return this;
  }

  setVectorUniform(name: string, value: Vector2): DrawGroup {
    this.setUniform(name, { type: "vec2", value });
    return this;
  }

  setMatrixUniform(name: string, value: Matrix3): DrawGroup {
    this.setUniform(name, { type: "mat3", value });
    return this;
  }

  private setUniform(name: string, value: GLValue) {
    const u = this.shader.uniforms.find((u) => u.name === name);
    if (!u) {
      console.log(`WARNING: undefined uniform '${name}'`);
      return this;
    }

    switch (value.type) {
      case "float":
        this.gl.uniform1f(u.location, value.value);
        break;
      case "vec2":
        this.gl.uniform2fv(u.location, value.value);
        break;
      case "mat3":
        this.gl.uniformMatrix3fv(u.location, false, value.value);
        break;
    }
  }

  setTexture(name: string, value: Texture): DrawGroup {
    //TODO
    return this;
  }
}

export class BufferFormat {
  buffer: WebGLBuffer;
  stride: number;

  constructor(gl: WebGL2RenderingContext, shader: Shader) {
    let buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);

    // number of f32s per instance
    let stride = 0;

    // set up attributes
    for (const p of Object.values(shader.properties)) {
      if (p.location < 0) continue;

      const rows = p.type === "mat3" ? 3 : 1;
      const totalElements = getPropertySize(p);
      const cols = totalElements / rows;

      // handles matrix attribute sub-fields
      for (let j = 0; j < rows; j++) {
        gl.enableVertexAttribArray(p.location + j);
        gl.vertexAttribDivisor(p.location + j, 1);

        gl.vertexAttribPointer(
          p.location + j,
          cols, // can be 1-4 (elements)
          gl.FLOAT, // 32-bit float
          false, // do not normalize
          totalElements * 4, // size * sizeof(type)
          stride * 4, // buffer byte offset
        );

        stride += cols;
      }
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
    vp.transform.scale = new Vector2(
      vp.zoom / vp.screen.x,
      vp.zoom / vp.screen.y,
    );

    const needResize =
      vp.gl.canvas.width !== displayWidth ||
      vp.gl.canvas.height !== displayHeight;

    if (needResize) {
      vp.gl.canvas.width = displayWidth;
      vp.gl.canvas.height = displayHeight;
      vp.gl.viewport(0, 0, displayWidth, displayHeight);
    }
  }
}

const rectVerts = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1]);

function rectModelBuffer(
  gl: WebGL2RenderingContext,
  shader: Shader,
): WebGLBuffer {
  let buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);

  const location = gl.getAttribLocation(shader.program, "_LOCAL_POS");
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

  return buf;
}

const defaultProperties = new Set([
  "TRANSFORM",
  "SCREEN_POS",
  "WORLD_POS",
  "LOCAL_POS",
]);

function vertSource(shader: Shader): string {
  let attributes = "";
  let varyings = "";
  let interpolations = "";

  // serialize attributes, varyings, and interpolations
  for (const p of shader.properties) {
    if (defaultProperties.has(p.name)) continue;

    attributes += `in ${p.type} _${p.name};\n`;
    varyings += `out ${p.type} ${p.name};\n`;
    interpolations += `${p.name} = _${p.name};\n`;
  }

  const screen_pos_calc =
    shader.mode === "fullscreen"
      ? "_LOCAL_POS"
      : "(WORLD_TO_SCREEN * world).xy";

  const world_pos_calc =
    shader.mode === "fullscreen"
      ? "SCREEN_TO_WORLD * vec3(_LOCAL_POS, 1.0)"
      : "TRANSFORM * vec3(_LOCAL_POS, 1.0)";

  return `#version 300 es
  uniform mat3 WORLD_TO_SCREEN;
  uniform mat3 SCREEN_TO_WORLD;

  in vec2 _LOCAL_POS; // per-vertex
  in mat3 TRANSFORM;  // per-instance
  ${attributes}

  out vec2 SCREEN_POS;
  out vec2 WORLD_POS;
  out vec2 LOCAL_POS;
  ${varyings}

  void main() {
    vec3 world = ${world_pos_calc};

    SCREEN_POS = ${screen_pos_calc}.xy;
    WORLD_POS = world.xy;
    LOCAL_POS = _LOCAL_POS;

    gl_Position = vec4((SCREEN_POS - 0.5) * 2.0, 0.0, 1.0);

    ${interpolations}
  }
`;
}

init();
