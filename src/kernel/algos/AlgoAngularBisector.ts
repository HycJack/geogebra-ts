/**
 * 角平分线算法
 * 对应 Java 版本的 AlgoAngularBisector
 */

import { AlgoElement } from './AlgoElement';
// import type { IGeoElement } from '../geos/GeoElement';
import type { Construction } from '../Construction';
// import { GeoVec3D, CoordUtils } from '../arithmetic/GeoVec3D';

export interface LineResult {
  a: number;
  b: number;
  c: number;
  defined: boolean;
}

export class AlgoAngularBisectorLines extends AlgoElement {
  private line1: { a: number; b: number; c: number };
  private line2: { a: number; b: number; c: number };
  private bisector1: LineResult;
  private bisector2: LineResult;

  constructor(
    construction: Construction,
    line1: { a: number; b: number; c: number },
    line2: { a: number; b: number; c: number }
  ) {
    super(construction);
    this.line1 = line1;
    this.line2 = line2;
    this.bisector1 = { a: 0, b: 0, c: 0, defined: false };
    this.bisector2 = { a: 0, b: 0, c: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { a: a1, b: b1, c: c1 } = this.line1;
    const { a: a2, b: b2, c: c2 } = this.line2;

    const norm1 = Math.sqrt(a1 * a1 + b1 * b1);
    const norm2 = Math.sqrt(a2 * a2 + b2 * b2);

    if (norm1 < 1e-10 || norm2 < 1e-10) {
      this.bisector1 = { a: 0, b: 0, c: 0, defined: false };
      this.bisector2 = { a: 0, b: 0, c: 0, defined: false };
      return;
    }

    const n1a = a1 / norm1;
    const n1b = b1 / norm1;
    const n1c = c1 / norm1;
    const n2a = a2 / norm2;
    const n2b = b2 / norm2;
    const n2c = c2 / norm2;

    this.bisector1 = {
      a: n1a + n2a,
      b: n1b + n2b,
      c: n1c + n2c,
      defined: true,
    };

    this.bisector2 = {
      a: n1a - n2a,
      b: n1b - n2b,
      c: n1c - n2c,
      defined: true,
    };
  }

  getBisector1(): LineResult {
    return this.bisector1;
  }

  getBisector2(): LineResult {
    return this.bisector2;
  }

  getBisectors(): [LineResult, LineResult] {
    return [this.bisector1, this.bisector2];
  }
}

export class AlgoAngularBisectorPoints extends AlgoElement {
  private vertex: { x: number; y: number };
  private point1: { x: number; y: number };
  private point2: { x: number; y: number };
  private bisector: LineResult;

  constructor(
    construction: Construction,
    vertex: { x: number; y: number },
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ) {
    super(construction);
    this.vertex = vertex;
    this.point1 = point1;
    this.point2 = point2;
    this.bisector = { a: 0, b: 0, c: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { x: vx, y: vy } = this.vertex;
    const { x: x1, y: y1 } = this.point1;
    const { x: x2, y: y2 } = this.point2;

    const dx1 = x1 - vx;
    const dy1 = y1 - vy;
    const dx2 = x2 - vx;
    const dy2 = y2 - vy;

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (len1 < 1e-10 || len2 < 1e-10) {
      this.bisector = { a: 0, b: 0, c: 0, defined: false };
      return;
    }

    const nx1 = dx1 / len1;
    const ny1 = dy1 / len1;
    const nx2 = dx2 / len2;
    const ny2 = dy2 / len2;

    const bx = nx1 + nx2;
    const by = ny1 + ny2;

    const blen = Math.sqrt(bx * bx + by * by);
    if (blen < 1e-10) {
      this.bisector = {
        a: -ny1,
        b: nx1,
        c: ny1 * vx - nx1 * vy,
        defined: true,
      };
    } else {
      const nbx = bx / blen;
      const nby = by / blen;
      
      this.bisector = {
        a: -nby,
        b: nbx,
        c: nby * vx - nbx * vy,
        defined: true,
      };
    }
  }

  getBisector(): LineResult {
    return this.bisector;
  }
}

export class AlgoPerpendicularBisector extends AlgoElement {
  private p1: { x: number; y: number };
  private p2: { x: number; y: number };
  private bisector: LineResult;

  constructor(
    construction: Construction,
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) {
    super(construction);
    this.p1 = p1;
    this.p2 = p2;
    this.bisector = { a: 0, b: 0, c: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { x: x1, y: y1 } = this.p1;
    const { x: x2, y: y2 } = this.p2;

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) {
      this.bisector = { a: 0, b: 0, c: 0, defined: false };
      return;
    }

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    this.bisector = {
      a: dx,
      b: dy,
      c: -(dx * mx + dy * my),
      defined: true,
    };
  }

  getBisector(): LineResult {
    return this.bisector;
  }
}
