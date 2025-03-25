export class Vector {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.x = x || 0;
    this.y = y || 0;
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
}
