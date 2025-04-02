import { Vector } from "./math";
import { Transform } from "./transforms";
import * as Zen from "./zen";

async function init() {
  const canvas = document.querySelector("#zen-app")! as HTMLCanvasElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("failed to get webgl2 context");

  Zen.createResource(Renderer, new Renderer(gl));
  Zen.createResource(Viewport, new Viewport());

  new ResizeObserver(onResize).observe(canvas, { box: "content-box" });

  Zen.createSystem(
    { with: [], resources: [Renderer, Viewport] },
    { foreach: enqueueDraw, once: render },
  );
}

export class Draw {}

export class Renderer {
  gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }
}

export class Viewport {
  screen: Vector = new Vector();
  transform: Transform = new Transform();

  //TODO screen space utilities
}

function enqueueDraw(e: Zen.Entity, ctx: Zen.SystemContext) {
  //TODO assemble instanced draw calls
}

function render(ctx: Zen.SystemContext) {
  //TODO dispatch instanced draw calls
}

export class VertexShader {
  shader: WebGLShader;

  constructor(source: string) {
    const gl = Zen.getResource<Renderer>(Renderer)?.gl;
    if (!gl) throw new Error("failed to get renderer");

    this.shader = createShader(gl, true, source)!;
  }
}

export class FragmentShader {
  shader: WebGLShader;

  constructor(source: string) {
    const gl = Zen.getResource<Renderer>(Renderer)?.gl;
    if (!gl) throw new Error("failed to get renderer");

    this.shader = createShader(gl, false, source);
  }
}

function createShader(
  gl: WebGL2RenderingContext,
  vert: boolean,
  source: string,
): WebGLShader {
  const type = vert ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
  let shader = gl.createShader(type)!;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  throw new Error(`failed to create ${vert ? "vertex" : "fragment"} shader`);
}

export class GraphicsProgram {
  program: WebGLProgram;

  constructor(vert: VertexShader, frag: FragmentShader) {
    const gl = Zen.getResource<Renderer>(Renderer)?.gl;
    if (!gl) throw new Error("failed to get renderer");

    var program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (!success) {
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      throw new Error("failed to create gl program");
    }

    this.program = program;
  }
}

interface Attribute {
  name: string;
  location: number;
  size: number;
  stride: number;
  offset: number;
}

interface Uniform {
  name: string;
  location: number;
  //TODO type
}

export class DrawContext {
  vao: WebGLVertexArrayObject;
  modelBuffer: Buffer;
  instanceBuffer: Buffer;
  uniforms: Uniform[];

  constructor(
    gl: WebGL2RenderingContext,
    modelAttrs: Attribute[],
    instanceAttrs: Attribute[],
    uniforms: Uniform[] = [],
  ) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const modelBuffer = new Buffer(gl, modelAttrs, 0);
    const instanceBuffer = new Buffer(gl, instanceAttrs, 1);
    gl.bindVertexArray(null);

    this.vao = vao;
    this.modelBuffer = modelBuffer;
    this.instanceBuffer = instanceBuffer;
    this.uniforms = uniforms;
  }
}

export class Buffer {
  buffer: WebGLBuffer;
  stride: number;

  constructor(gl: WebGL2RenderingContext, attrs: Attribute[], divisor = 0) {
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);

    let stride = 0;

    // set up attributes
    for (const a of attrs) {
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
    const r = Zen.getResource<Renderer>(Renderer);
    const vp = Zen.getResource<Viewport>(Viewport);
    if (!r || !vp || entry.target !== r.gl.canvas) continue;

    const size = entry.devicePixelContentBoxSize[0];
    const displayWidth = Math.round(size.inlineSize);
    const displayHeight = Math.round(size.blockSize);

    vp.screen.x = displayWidth;
    vp.screen.y = displayHeight;

    const needResize =
      r.gl.canvas.width !== displayWidth ||
      r.gl.canvas.height !== displayHeight;

    if (needResize) {
      r.gl.viewport(0, 0, displayWidth, displayHeight);
      // TODO render to avoid flashes
    }
  }
}

init();
