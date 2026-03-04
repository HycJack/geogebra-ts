/**
 * 齐次坐标向量类
 * 对应 Java 版本的 kernel/arithmetic/GeoVec3D
 */

export class GeoVec3D {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 1
  ) {}

  setCoords(x: number, y: number, z: number = 1): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  isDefined(): boolean {
    return !isNaN(this.x) && !isNaN(this.y) && !isNaN(this.z) && this.z !== 0;
  }

  setUndefined(): void {
    this.x = NaN;
    this.y = NaN;
    this.z = NaN;
  }

  getInhomX(): number {
    return this.x / this.z;
  }

  getInhomY(): number {
    return this.y / this.z;
  }

  getX(): number {
    return this.getInhomX();
  }

  getY(): number {
    return this.getInhomY();
  }

  static cross(u: GeoVec3D, v: GeoVec3D, result?: GeoVec3D): GeoVec3D {
    const r = result || new GeoVec3D();
    r.setCoords(
      u.y * v.z - u.z * v.y,
      u.z * v.x - u.x * v.z,
      u.x * v.y - u.y * v.x
    );
    return r;
  }

  static crossNew(u: GeoVec3D, v: GeoVec3D): GeoVec3D {
    return GeoVec3D.cross(u, v);
  }

  isEqual(other: GeoVec3D, tolerance: number = 1e-10): boolean {
    if (!this.isDefined() || !other.isDefined()) return false;
    const dx = this.getX() - other.getX();
    const dy = this.getY() - other.getY();
    return dx * dx + dy * dy < tolerance * tolerance;
  }

  copy(): GeoVec3D {
    return new GeoVec3D(this.x, this.y, this.z);
  }

  setFrom(other: GeoVec3D): void {
    this.x = other.x;
    this.y = other.y;
    this.z = other.z;
  }

  length(): number {
    if (this.z === 0) {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    const x = this.getInhomX();
    const y = this.getInhomY();
    return Math.sqrt(x * x + y * y);
  }

  normalize(): GeoVec3D {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  dot(other: GeoVec3D): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  distance(other: GeoVec3D): number {
    if (!this.isDefined() || !other.isDefined()) return Infinity;
    const dx = this.getX() - other.getX();
    const dy = this.getY() - other.getY();
    return Math.sqrt(dx * dx + dy * dy);
  }

  static fromInhomCoords(x: number, y: number): GeoVec3D {
    return new GeoVec3D(x, y, 1);
  }

  static fromLine(a: number, b: number, c: number): GeoVec3D {
    return new GeoVec3D(a, b, c);
  }

  isFinite(): boolean {
    return this.z !== 0;
  }

  isInfinite(): boolean {
    return this.z === 0 && (this.x !== 0 || this.y !== 0);
  }
}

/**
 * 坐标运算工具类
 */
export class CoordUtils {
  static lineThroughPoints(p1: GeoVec3D, p2: GeoVec3D): GeoVec3D {
    return GeoVec3D.cross(p1, p2);
  }

  static lineIntersection(l1: GeoVec3D, l2: GeoVec3D): GeoVec3D {
    return GeoVec3D.cross(l1, l2);
  }

  static pointToLineDistance(point: GeoVec3D, line: GeoVec3D): number {
    const numerator = Math.abs(
      line.x * point.x + line.y * point.y + line.z * point.z
    );
    const denominator = Math.sqrt(line.x * line.x + line.y * line.y);
    return denominator > 0 ? numerator / denominator / Math.abs(point.z) : 0;
  }

  static projectPointOnLine(point: GeoVec3D, line: GeoVec3D): GeoVec3D {
    const a = line.x;
    const b = line.y;
    const c = line.z;
    const x = point.getInhomX();
    const y = point.getInhomY();
    
    const norm = a * a + b * b;
    if (norm < 1e-10) return point.copy();
    
    const d = (a * x + b * y + c) / norm;
    return GeoVec3D.fromInhomCoords(x - a * d, y - b * d);
  }

  static perpendicularLineThroughPoint(line: GeoVec3D, point: GeoVec3D): GeoVec3D {
    const a = line.x;
    const b = line.y;
    const x = point.getInhomX();
    const y = point.getInhomY();
    
    return GeoVec3D.fromLine(b, -a, a * y - b * x);
  }

  static parallelLineThroughPoint(line: GeoVec3D, point: GeoVec3D): GeoVec3D {
    const a = line.x;
    const b = line.y;
    const x = point.getInhomX();
    const y = point.getInhomY();
    
    return GeoVec3D.fromLine(a, b, -(a * x + b * y));
  }

  static midpoint(p1: GeoVec3D, p2: GeoVec3D): GeoVec3D {
    const x = (p1.getInhomX() + p2.getInhomX()) / 2;
    const y = (p1.getInhomY() + p2.getInhomY()) / 2;
    return GeoVec3D.fromInhomCoords(x, y);
  }

  static angleBisector(l1: GeoVec3D, l2: GeoVec3D): [GeoVec3D, GeoVec3D] {
    const norm1 = Math.sqrt(l1.x * l1.x + l1.y * l1.y);
    const norm2 = Math.sqrt(l2.x * l2.x + l2.y * l2.y);
    
    if (norm1 < 1e-10 || norm2 < 1e-10) {
      return [new GeoVec3D(), new GeoVec3D()];
    }
    
    const n1x = l1.x / norm1;
    const n1y = l1.y / norm1;
    const n1z = l1.z / norm1;
    const n2x = l2.x / norm2;
    const n2y = l2.y / norm2;
    const n2z = l2.z / norm2;
    
    const b1 = new GeoVec3D(n1x + n2x, n1y + n2y, n1z + n2z);
    const b2 = new GeoVec3D(n1x - n2x, n1y - n2y, n1z - n2z);
    
    return [b1, b2];
  }
}
