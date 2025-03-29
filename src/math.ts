export class Vector {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.x = x || 0;
    this.y = y || 0;
  }

  set(x: number, y: number): Vector {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v: Vector): Vector {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y);
  }

  scale(s: number): Vector {
    return new Vector(this.x * s, this.y * s);
  }

  negate(): Vector {
    return new Vector(-this.x, -this.y);
  }

  squaredMagnitude(): number {
    return this.x * this.x + this.y * this.y;
  }

  magnitude(): number {
    return Math.sqrt(this.squaredMagnitude());
  }

  normalize(): Vector {
    if (this.x === 0 && this.y === 0) return this;
    const mag = this.magnitude();

    this.x /= mag;
    this.y /= mag;

    return this;
  }

  normalized(): Vector {
    if (this.x === 0 && this.y === 0) return new Vector();
    const mag = this.magnitude();
    return new Vector(this.x / mag, (this.y /= mag));
  }

  capMagnitude(max: number): Vector {
    const sqMag = this.squaredMagnitude();
    if (sqMag < max * max || max < 0) return new Vector(this.x, this.y);

    const mag = Math.sqrt(sqMag);
    const deltaFactor = (mag - max) / mag;
    return this.scale(deltaFactor);
  }

  distance(v: Vector): number {
    return v.sub(this).magnitude();
  }

  lerp(to: Vector, t: number): Vector {
    // a + (b - a) * t
    return this.add(to.sub(this).scale(t));
  }

  randomDirection(): Vector {
    const vec = new Vector();
    vec.x = remap(Math.random(), 0, 1, -1, 1);
    vec.y = remap(Math.random(), 0, 1, -1, 1);
    return vec.normalize();
  }

  randomScale(min: number, max: number): Vector {
    return this.scale(remap(Math.random(), 0, 1, min, max));
  }

  dot(v: Vector): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vector): number {
    return this.x * v.y - this.y * v.x;
  }

  // angle between vectors (radians)
  angle(v: Vector): number {
    const mag1 = this.magnitude();
    const mag2 = v.magnitude();

    // Handle zero-length vectors
    if (mag1 === 0 || mag2 === 0) return NaN;

    const cosine = this.dot(v) / (mag1 * mag2);
    return Math.acos(cosine);
  }

  // signed angle between vectors (radians)
  signedAngle(v: Vector): number {
    const angle = this.angle(v);
    if (isNaN(angle)) return NaN;

    return this.cross(v) < 0 ? -angle : angle;
  }
}

const degToRadFactor = Math.PI / 180;
export function deg2Rad(degrees: number): number {
  return degrees * degToRadFactor;
}

const radToDegFactor = 180 / Math.PI;
export function rad2Deg(radians: number): number {
  return radians * radToDegFactor;
}

export function remap(
  x: number,
  a0: number,
  a1: number,
  b0: number,
  b1: number,
) {
  return b0 + ((b1 - b0) * (x - a0)) / (a1 - a0);
}

export function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(x, max));
}

export function randomRange(min: number, max: number) {
  return remap(Math.random(), 0, 1, min, max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
