/**
 * 交点算法
 * 对应 Java 版本的 AlgoIntersect 系列
 */

import { AlgoElement } from './AlgoElement';
import type { Construction } from '../Construction';
import { GeoVec3D, CoordUtils } from '../arithmetic/GeoVec3D';

export interface IntersectionPoint {
  x: number;
  y: number;
  defined: boolean;
}

export class AlgoIntersect extends AlgoElement {
  protected intersectionPoints: IntersectionPoint[] = [];

  constructor(construction: Construction) {
    super(construction);
  }

  compute(): void {
  }

  getIntersectionPoints(): IntersectionPoint[] {
    return this.intersectionPoints;
  }

  protected addIntersectionPoint(x: number, y: number, defined: boolean = true): void {
    this.intersectionPoints.push({ x, y, defined });
  }

  protected clearIntersectionPoints(): void {
    this.intersectionPoints = [];
  }
}

export class AlgoIntersectLines extends AlgoIntersect {
  private line1: { a: number; b: number; c: number };
  private line2: { a: number; b: number; c: number };

  constructor(
    construction: Construction,
    line1: { a: number; b: number; c: number },
    line2: { a: number; b: number; c: number }
  ) {
    super(construction);
    this.line1 = line1;
    this.line2 = line2;
    this.compute();
  }

  compute(): void {
    this.clearIntersectionPoints();
    
    const l1 = new GeoVec3D(this.line1.a, this.line1.b, this.line1.c);
    const l2 = new GeoVec3D(this.line2.a, this.line2.b, this.line2.c);
    
    const intersection = CoordUtils.lineIntersection(l1, l2);
    
    if (intersection.isDefined()) {
      this.addIntersectionPoint(intersection.getX(), intersection.getY());
    }
  }
}

export class AlgoIntersectLineCircle extends AlgoIntersect {
  private line: { a: number; b: number; c: number };
  private circle: { cx: number; cy: number; r: number };

  constructor(
    construction: Construction,
    line: { a: number; b: number; c: number },
    circle: { cx: number; cy: number; r: number }
  ) {
    super(construction);
    this.line = line;
    this.circle = circle;
    this.compute();
  }

  compute(): void {
    this.clearIntersectionPoints();
    
    const { a, b, c } = this.line;
    const { cx, cy, r } = this.circle;
    
    const normalizedA = a / Math.sqrt(a * a + b * b);
    const normalizedB = b / Math.sqrt(a * a + b * b);
    const normalizedC = c / Math.sqrt(a * a + b * b);
    
    const d = normalizedA * cx + normalizedB * cy + normalizedC;
    
    if (Math.abs(d) > r) {
      return;
    }
    
    const h = Math.sqrt(r * r - d * d);
    
    const px = cx - d * normalizedA;
    const py = cy - d * normalizedB;
    
    if (Math.abs(h) < 1e-10) {
      this.addIntersectionPoint(px, py);
    } else {
      this.addIntersectionPoint(px + h * normalizedB, py - h * normalizedA);
      this.addIntersectionPoint(px - h * normalizedB, py + h * normalizedA);
    }
  }
}

export class AlgoIntersectCircles extends AlgoIntersect {
  private circle1: { cx: number; cy: number; r: number };
  private circle2: { cx: number; cy: number; r: number };

  constructor(
    construction: Construction,
    circle1: { cx: number; cy: number; r: number },
    circle2: { cx: number; cy: number; r: number }
  ) {
    super(construction);
    this.circle1 = circle1;
    this.circle2 = circle2;
    this.compute();
  }

  compute(): void {
    this.clearIntersectionPoints();
    
    const { cx: x1, cy: y1, r: r1 } = this.circle1;
    const { cx: x2, cy: y2, r: r2 } = this.circle2;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy);
    
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
      return;
    }
    
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);
    
    const px = x1 + a * dx / d;
    const py = y1 + a * dy / d;
    
    if (Math.abs(h) < 1e-10) {
      this.addIntersectionPoint(px, py);
    } else {
      this.addIntersectionPoint(px + h * dy / d, py - h * dx / d);
      this.addIntersectionPoint(px - h * dy / d, py + h * dx / d);
    }
  }
}

export class AlgoIntersectLineConic extends AlgoIntersect {
  private line: { a: number; b: number; c: number };
  private conicMatrix: [number, number, number, number, number, number];

  constructor(
    construction: Construction,
    line: { a: number; b: number; c: number },
    conicMatrix: [number, number, number, number, number, number]
  ) {
    super(construction);
    this.line = line;
    this.conicMatrix = conicMatrix;
    this.compute();
  }

  compute(): void {
    this.clearIntersectionPoints();
    
    const [A, C, F, B, D, E] = this.conicMatrix;
    const { a, b, c } = this.line;
    
    if (Math.abs(a) > Math.abs(b)) {
      const m = -b / a;
      const k = -c / a;
      
      const alpha = A + 2 * B * m + C * m * m;
      const beta = 2 * A * k + 2 * B * (m * k) + 2 * C * m * k + 2 * D + 2 * E * m;
      const gamma = A * k * k + 2 * B * k * k + C * k * k + 2 * D * k + 2 * E * k + F;
      
      const discriminant = beta * beta - 4 * alpha * gamma;
      
      if (discriminant < 0) return;
      
      if (Math.abs(discriminant) < 1e-10) {
        const y = -beta / (2 * alpha);
        const x = m * y + k;
        this.addIntersectionPoint(x, y);
      } else {
        const sqrtD = Math.sqrt(discriminant);
        const y1 = (-beta + sqrtD) / (2 * alpha);
        const y2 = (-beta - sqrtD) / (2 * alpha);
        this.addIntersectionPoint(m * y1 + k, y1);
        this.addIntersectionPoint(m * y2 + k, y2);
      }
    } else {
      const m = -a / b;
      const k = -c / b;
      
      const alpha = A * m * m + 2 * B * m + C;
      const beta = 2 * A * m * k + 2 * B * k + 2 * C * k + 2 * D * m + 2 * E;
      const gamma = A * k * k + 2 * B * k + C * k * k + 2 * D * k + 2 * E * k + F;
      
      const discriminant = beta * beta - 4 * alpha * gamma;
      
      if (discriminant < 0) return;
      
      if (Math.abs(discriminant) < 1e-10) {
        const x = -beta / (2 * alpha);
        const y = m * x + k;
        this.addIntersectionPoint(x, y);
      } else {
        const sqrtD = Math.sqrt(discriminant);
        const x1 = (-beta + sqrtD) / (2 * alpha);
        const x2 = (-beta - sqrtD) / (2 * alpha);
        this.addIntersectionPoint(x1, m * x1 + k);
        this.addIntersectionPoint(x2, m * x2 + k);
      }
    }
  }
}

export class AlgoIntersectConics extends AlgoIntersect {
  // private conic1: [number, number, number, number, number, number];
  // private conic2: [number, number, number, number, number, number];

  constructor(
    construction: Construction,
    // conic1: [number, number, number, number, number, number],
    // conic2: [number, number, number, number, number, number]
  ) {
    super(construction);
    // this.conic1 = conic1;
    // this.conic2 = conic2;
    this.compute();
  }

  compute(): void {
    this.clearIntersectionPoints();
    
    // const [A1, C1, F1, B1, D1, E1] = this.conic1;
    // const [A2, C2, F2, B2, D2, E2] = this.conic2;
    
    // const lambda = 0.5;
    // const _A = A1 + lambda * (A2 - A1);
    // const _B = B1 + lambda * (B2 - B1);
    // const _C = C1 + lambda * (C2 - C1);
    // const _D = D1 + lambda * (D2 - D1);
    // const _E = E1 + lambda * (E2 - E1);
    // const _F = F1 + lambda * (F2 - F1);
    
    // TODO: 使用计算出的系数求解交点
    this.addIntersectionPoint(0, 0, false);
  }
}
