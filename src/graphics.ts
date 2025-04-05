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

  const vp = Zen.createResource(Viewport, new Viewport(gl));
  vp.zoom = 100;

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

  setNumberProperty(name: string, value: number) {
    //TODO find and set property value
  }

  setVectorProperty(name: string, value: Vector) {
    //TODO find and set property value
  }
}

export class Viewport {
  screen: Vector = new Vector();
  zoom: number = 1;
  transform: Transform = new Transform();
  gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  //TODO screen space utilities
}

function enqueueDraw(e: Zen.Entity) {
  const d = e.getAttribute<Draw>(Draw)!;

  for (let i = 0; i < d.properties.length; i++) {
    //TODO append property data to draw group
    // d.group.propertyValues.push(d.properties[i]);
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

    //TODO set uniform values
    const vpTRS = vp.transform.trs();
    vp.gl.uniformMatrix3fv(
      group.shader.uniforms["WORLD_TO_SCREEN"].location,
      false,
      vpTRS.toArray(),
    );

    vp.gl.uniformMatrix3fv(
      group.shader.uniforms["SCREEN_TO_WORLD"].location,
      false,
      vpTRS.invert().toArray(),
    );

    vp.gl.bindBuffer(vp.gl.ARRAY_BUFFER, group.modelBuffer);
    vp.gl.bufferData(vp.gl.ARRAY_BUFFER, rectVerts, vp.gl.STATIC_DRAW);

    //TODO get data from property value array
    vp.gl.bindBuffer(vp.gl.ARRAY_BUFFER, group.instanceBuffer.buffer);
    vp.gl.bufferData(
      vp.gl.ARRAY_BUFFER,
      new Float32Array([
        ...Matrix.trs(
          new Vector(10, 15),
          2 * Math.sin(t.elapsed),
          new Vector(1, 1),
        ).toArray(),
        ...Matrix.trs(new Vector(0, 0), 0, new Vector(1, 1)).toArray(),
      ]),
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

    this.properties["TRANSFORM"] = { type: "mat3" };

    const vertSrc = vertSource(this);
    const vert = compileShader(gl, true, vertSrc);
    // console.log(vertSrc);

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

    //TODO loop over all uniforms
    this.uniforms["WORLD_TO_SCREEN"] = {
      type: "mat3",
      location: gl.getUniformLocation(program, "WORLD_TO_SCREEN")! as number,
    };

    this.uniforms["SCREEN_TO_WORLD"] = {
      type: "mat3",
      location: gl.getUniformLocation(program, "SCREEN_TO_WORLD")! as number,
    };

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

type PropertyValue = FloatValue | Vec2Value;
type UniformValue = FloatValue | Vec2Value | Mat3Value;

interface FloatValue {
  type: "float";
  value: number;
}

interface Vec2Value {
  type: "vec2";
  value: Vector;
}

interface Mat3Value {
  type: "mat3";
  value: Matrix;
}

interface Property {
  type: GLType;
}

interface Uniform {
  type: GLType;
  location: number;
}

interface Texture {}

interface TextureValue {
  tex: WebGLTexture;
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

export class DrawGroup {
  shader: Shader;
  vao: WebGLVertexArrayObject;
  modelBuffer: WebGLBuffer;
  instanceBuffer: BufferFormat;
  uniformValues: Record<string, UniformValue> = {};
  textureValues: Record<string, TextureValue> = {};

  instanceCount: number = 0;
  propertyValues: number[] = [];

  constructor(gl: WebGL2RenderingContext, shader: Shader) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const modelBuffer = rectModelBuffer(gl, shader);
    const instanceBuffer = new BufferFormat(gl, shader);
    gl.bindVertexArray(null);

    this.shader = shader;
    this.vao = vao;
    this.modelBuffer = modelBuffer;
    this.instanceBuffer = instanceBuffer;
  }

  //TODO
  setNumberUniform(name: string, value: number) {}
  setVectorUniform(name: string, value: Vector) {}
  setMatrixUniform(name: string, value: Matrix) {}
  setTexture(name: string, value: TextureValue) {}
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
    for (const [name, p] of Object.entries(shader.properties)) {
      const location = gl.getAttribLocation(shader.program, name);

      const rows = p.type === "mat3" ? 3 : 1;
      const totalElements = getPropertySize(p);
      const cols = totalElements / rows;

      // handles matrix attribute sub-fields
      for (let j = 0; j < rows; j++) {
        gl.enableVertexAttribArray(location + j);
        gl.vertexAttribDivisor(location + j, 1);

        gl.vertexAttribPointer(
          location + j,
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
    vp.transform.scale = new Vector(
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
  for (const [name, p] of Object.entries(shader.properties)) {
    if (defaultProperties.has(name)) continue;

    attributes += `in ${p.type} _${name};\n`;
    varyings += `out ${p.type} ${name};\n`;
    interpolations += `  ${name} = _${name};\n`;
  }

  const screen_pos_calc =
    shader.mode === "fullscreen"
      ? "_LOCAL_POS"
      : "(WORLD_TO_SCREEN * world).xy";

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
    vec3 world = TRANSFORM * vec3(_LOCAL_POS, 1.0);

    SCREEN_POS = ${screen_pos_calc}.xy;
    WORLD_POS = world.xy;
    LOCAL_POS = _LOCAL_POS;

    gl_Position = vec4((SCREEN_POS - 0.5) * 2.0, 0.0, 1.0);

    ${interpolations}
  }
`;
}

init();
