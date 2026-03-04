/**
 * 更多几何算法
 * 对应 Java 版本中的各种 Algo* 类
 */

import type { Construction } from '../Construction';
import { AlgoElement } from './AlgoElement';
import type { LineResult } from './AlgoAngularBisector';

export interface PointResult {
  x: number;
  y: number;
  defined: boolean;
}

export { LineResult };

export class AlgoMidpoint extends AlgoElement {
  private point1: { x: number; y: number };
  private point2: { x: number; y: number };
  private result: PointResult;

  constructor(
    construction: Construction,
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ) {
    super(construction);
    this.point1 = point1;
    this.point2 = point2;
    this.result = { x: 0, y: 0, defined: false };
    this.compute();
  }

  compute(): void {
    this.result = {
      x: (this.point1.x + this.point2.x) / 2,
      y: (this.point1.y + this.point2.y) / 2,
      defined: true,
    };
  }

  getResult(): PointResult {
    return this.result;
  }
}

export class AlgoMidpointSegment extends AlgoElement {
  private startPoint: { x: number; y: number };
  private endPoint: { x: number; y: number };
  private result: PointResult;

  constructor(
    construction: Construction,
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number }
  ) {
    super(construction);
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.result = { x: 0, y: 0, defined: false };
    this.compute();
  }

  compute(): void {
    this.result = {
      x: (this.startPoint.x + this.endPoint.x) / 2,
      y: (this.startPoint.y + this.endPoint.y) / 2,
      defined: true,
    };
  }

  getResult(): PointResult {
    return this.result;
  }
}

export class AlgoPerpendicularLine extends AlgoElement {
  private line: { a: number; b: number; c: number };
  private throughPoint: { x: number; y: number };
  private result: LineResult;

  constructor(
    construction: Construction,
    line: { a: number; b: number; c: number },
    throughPoint: { x: number; y: number }
  ) {
    super(construction);
    this.line = line;
    this.throughPoint = throughPoint;
    this.result = { a: 0, b: 0, c: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { a, b, c: _c } = this.line;
    const { x, y } = this.throughPoint;

    const norm = a * a + b * b;
    if (norm < 1e-10) {
      this.result = { a: 0, b: 0, c: 0, defined: false };
      return;
    }

    const perpA = -b;
    const perpB = a;
    const perpC = b * x - a * y;

    this.result = {
      a: perpA,
      b: perpB,
      c: perpC,
      defined: true,
    };
  }

  getResult(): LineResult {
    return this.result;
  }
}

export class AlgoParallelLine extends AlgoElement {
  private line: { a: number; b: number; c: number };
  private throughPoint: { x: number; y: number };
  private result: LineResult;

  constructor(
    construction: Construction,
    line: { a: number; b: number; c: number },
    throughPoint: { x: number; y: number }
  ) {
    super(construction);
    this.line = line;
    this.throughPoint = throughPoint;
    this.result = { a: 0, b: 0, c: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { a, b } = this.line;
    const { x, y } = this.throughPoint;

    const norm = a * a + b * b;
    if (norm < 1e-10) {
      this.result = { a: 0, b: 0, c: 0, defined: false };
      return;
    }

    const parallelC = -(a * x + b * y);

    this.result = {
      a,
      b,
      c: parallelC,
      defined: true,
    };
  }

  getResult(): LineResult {
    return this.result;
  }
}

export class AlgoLineThroughPoint extends AlgoElement {
  private point1: { x: number; y: number };
  private point2: { x: number; y: number };
  private result: LineResult;

  constructor(
    construction: Construction,
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ) {
    super(construction);
    this.point1 = point1;
    this.point2 = point2;
    this.result = { a: 0, b: 0, c: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { x: x1, y: y1 } = this.point1;
    const { x: x2, y: y2 } = this.point2;

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) {
      this.result = { a: 0, b: 0, c: 0, defined: false };
      return;
    }

    const a = dy;
    const b = -dx;
    const c = dx * y1 - dy * x1;

    this.result = { a, b, c, defined: true };
  }

  getResult(): LineResult {
    return this.result;
  }
}

export class AlgoPerpendicularBisector extends AlgoElement {
  private point1: { x: number; y: number };
  private point2: { x: number; y: number };
  private result: LineResult;

  constructor(
    construction: Construction,
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ) {
    super(construction);
    this.point1 = point1;
    this.point2 = point2;
    this.result = { a: 0, b: 0, c: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { x: x1, y: y1 } = this.point1;
    const { x: x2, y: y2 } = this.point2;

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) {
      this.result = { a: 0, b: 0, c: 0, defined: false };
      return;
    }

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const a = dx;
    const b = dy;
    const c = -(a * midX + b * midY);

    this.result = { a, b, c, defined: true };
  }

  getResult(): LineResult {
    return this.result;
  }
}

export class AlgoDistance extends AlgoElement {
  private point1: { x: number; y: number };
  private point2: { x: number; y: number };
  private result: number;

  constructor(
    construction: Construction,
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ) {
    super(construction);
    this.point1 = point1;
    this.point2 = point2;
    this.result = 0;
    this.compute();
  }

  compute(): void {
    const dx = this.point2.x - this.point1.x;
    const dy = this.point2.y - this.point1.y;
    this.result = Math.sqrt(dx * dx + dy * dy);
  }

  getResult(): number {
    return this.result;
  }
}

export class AlgoDistancePointLine extends AlgoElement {
  private point: { x: number; y: number };
  private line: { a: number; b: number; c: number };
  private result: number;

  constructor(
    construction: Construction,
    point: { x: number; y: number },
    line: { a: number; b: number; c: number }
  ) {
    super(construction);
    this.point = point;
    this.line = line;
    this.result = 0;
    this.compute();
  }

  compute(): void {
    const { a, b, c } = this.line;
    const { x, y } = this.point;

    const norm = Math.sqrt(a * a + b * b);
    if (norm < 1e-10) {
      this.result = 0;
      return;
    }

    this.result = Math.abs(a * x + b * y + c) / norm;
  }

  getResult(): number {
    return this.result;
  }
}

export class AlgoReflectPoint extends AlgoElement {
  private point: { x: number; y: number };
  private mirrorPoint: { x: number; y: number };
  private result: PointResult;

  constructor(
    construction: Construction,
    point: { x: number; y: number },
    mirrorPoint: { x: number; y: number }
  ) {
    super(construction);
    this.point = point;
    this.mirrorPoint = mirrorPoint;
    this.result = { x: 0, y: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const dx = this.mirrorPoint.x - this.point.x;
    const dy = this.mirrorPoint.y - this.point.y;

    this.result = {
      x: this.mirrorPoint.x + dx,
      y: this.mirrorPoint.y + dy,
      defined: true,
    };
  }

  getResult(): PointResult {
    return this.result;
  }
}

export class AlgoReflectPointInLine extends AlgoElement {
  private point: { x: number; y: number };
  private line: { a: number; b: number; c: number };
  private result: PointResult;

  constructor(
    construction: Construction,
    point: { x: number; y: number },
    line: { a: number; b: number; c: number }
  ) {
    super(construction);
    this.point = point;
    this.line = line;
    this.result = { x: 0, y: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { a, b, c } = this.line;
    const { x, y } = this.point;

    const norm = a * a + b * b;
    if (norm < 1e-10) {
      this.result = { x: 0, y: 0, defined: false };
      return;
    }

    const d = (a * x + b * y + c) / norm;

    this.result = {
      x: x - 2 * a * d,
      y: y - 2 * b * d,
      defined: true,
    };
  }

  getResult(): PointResult {
    return this.result;
  }
}

export class AlgoRotatePoint extends AlgoElement {
  private point: { x: number; y: number };
  private center: { x: number; y: number };
  private angle: number;
  private result: PointResult;

  constructor(
    construction: Construction,
    point: { x: number; y: number },
    center: { x: number; y: number },
    angle: number
  ) {
    super(construction);
    this.point = point;
    this.center = center;
    this.angle = angle;
    this.result = { x: 0, y: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    const dx = this.point.x - this.center.x;
    const dy = this.point.y - this.center.y;

    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    this.result = {
      x: this.center.x + rx,
      y: this.center.y + ry,
      defined: true,
    };
  }

  getResult(): PointResult {
    return this.result;
  }
}

export class AlgoDilate extends AlgoElement {
  private point: { x: number; y: number };
  private center: { x: number; y: number };
  private ratio: number;
  private result: PointResult;

  constructor(
    construction: Construction,
    point: { x: number; y: number },
    center: { x: number; y: number },
    ratio: number
  ) {
    super(construction);
    this.point = point;
    this.center = center;
    this.ratio = ratio;
    this.result = { x: 0, y: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const dx = this.point.x - this.center.x;
    const dy = this.point.y - this.center.y;

    this.result = {
      x: this.center.x + this.ratio * dx,
      y: this.center.y + this.ratio * dy,
      defined: true,
    };
  }

  getResult(): PointResult {
    return this.result;
  }
}

export class AlgoTranslate extends AlgoElement {
  private point: { x: number; y: number };
  private vector: { x: number; y: number };
  private result: PointResult;

  constructor(
    construction: Construction,
    point: { x: number; y: number },
    vector: { x: number; y: number }
  ) {
    super(construction);
    this.point = point;
    this.vector = vector;
    this.result = { x: 0, y: 0, defined: false };
    this.compute();
  }

  compute(): void {
    this.result = {
      x: this.point.x + this.vector.x,
      y: this.point.y + this.vector.y,
      defined: true,
    };
  }

  getResult(): PointResult {
    return this.result;
  }
}

export class AlgoSlope extends AlgoElement {
  private line: { a: number; b: number; c: number };
  private result: number;

  constructor(
    construction: Construction,
    line: { a: number; b: number; c: number }
  ) {
    super(construction);
    this.line = line;
    this.result = 0;
    this.compute();
  }

  compute(): void {
    const { a, b } = this.line;

    if (Math.abs(b) < 1e-10) {
      this.result = Infinity;
      return;
    }

    this.result = -a / b;
  }

  getResult(): number {
    return this.result;
  }
}

export class AlgoAreaPolygon extends AlgoElement {
  private vertices: Array<{ x: number; y: number }>;
  private result: number;

  constructor(
    construction: Construction,
    vertices: Array<{ x: number; y: number }>
  ) {
    super(construction);
    this.vertices = vertices;
    this.result = 0;
    this.compute();
  }

  compute(): void {
    if (this.vertices.length < 3) {
      this.result = 0;
      return;
    }

    let area = 0;
    const n = this.vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += this.vertices[i].x * this.vertices[j].y;
      area -= this.vertices[j].x * this.vertices[i].y;
    }

    this.result = Math.abs(area) / 2;
  }

  getResult(): number {
    return this.result;
  }
}

export class AlgoPerimeterPolygon extends AlgoElement {
  private vertices: Array<{ x: number; y: number }>;
  private result: number;

  constructor(
    construction: Construction,
    vertices: Array<{ x: number; y: number }>
  ) {
    super(construction);
    this.vertices = vertices;
    this.result = 0;
    this.compute();
  }

  compute(): void {
    if (this.vertices.length < 2) {
      this.result = 0;
      return;
    }

    let perimeter = 0;
    const n = this.vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = this.vertices[j].x - this.vertices[i].x;
      const dy = this.vertices[j].y - this.vertices[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    this.result = perimeter;
  }

  getResult(): number {
    return this.result;
  }
}
