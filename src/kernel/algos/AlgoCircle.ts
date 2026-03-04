/**
 * 圆相关算法
 * 对应 Java 版本的 AlgoCircle 系列
 */

import { AlgoElement } from './AlgoElement';
import type { Construction } from '../Construction';

export interface CircleResult {
  cx: number;
  cy: number;
  r: number;
  defined: boolean;
}

export class AlgoCircleThreePoints extends AlgoElement {
  private p1: { x: number; y: number };
  private p2: { x: number; y: number };
  private p3: { x: number; y: number };
  private result: CircleResult;

  constructor(
    construction: Construction,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ) {
    super(construction);
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.result = { cx: 0, cy: 0, r: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { x: x1, y: y1 } = this.p1;
    const { x: x2, y: y2 } = this.p2;
    const { x: x3, y: y3 } = this.p3;

    const ax = x2 - x1;
    const ay = y2 - y1;
    const bx = x3 - x1;
    const by = y3 - y1;

    const m = 2 * (ax * by - ay * bx);

    if (Math.abs(m) < 1e-10) {
      this.result = { cx: 0, cy: 0, r: 0, defined: false };
      return;
    }

    const cx = x1 + ((ax * ax + ay * ay) * by - (bx * bx + by * by) * ay) / m;
    const cy = y1 + ((bx * bx + by * by) * ax - (ax * ax + ay * ay) * bx) / m;

    const r = Math.sqrt((cx - x1) * (cx - x1) + (cy - y1) * (cy - y1));

    this.result = { cx, cy, r, defined: true };
  }

  getResult(): CircleResult {
    return this.result;
  }

  getCenter(): { x: number; y: number } | null {
    if (!this.result.defined) return null;
    return { x: this.result.cx, y: this.result.cy };
  }

  getRadius(): number {
    return this.result.r;
  }
}

export class AlgoCircleTwoPoints extends AlgoElement {
  private center: { x: number; y: number };
  private point: { x: number; y: number };
  private result: CircleResult;

  constructor(
    construction: Construction,
    center: { x: number; y: number },
    point: { x: number; y: number }
  ) {
    super(construction);
    this.center = center;
    this.point = point;
    this.result = { cx: 0, cy: 0, r: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { x: cx, y: cy } = this.center;
    const { x: px, y: py } = this.point;

    const r = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));

    this.result = { cx, cy, r, defined: true };
  }

  getResult(): CircleResult {
    return this.result;
  }
}

export class AlgoCirclePointRadius extends AlgoElement {
  private center: { x: number; y: number };
  private radius: number;
  private result: CircleResult;

  constructor(
    construction: Construction,
    center: { x: number; y: number },
    radius: number
  ) {
    super(construction);
    this.center = center;
    this.radius = radius;
    this.result = { cx: 0, cy: 0, r: 0, defined: false };
    this.compute();
  }

  compute(): void {
    if (this.radius < 0) {
      this.result = { cx: 0, cy: 0, r: 0, defined: false };
      return;
    }

    this.result = {
      cx: this.center.x,
      cy: this.center.y,
      r: this.radius,
      defined: true,
    };
  }

  getResult(): CircleResult {
    return this.result;
  }
}

export class AlgoCircleDiameter extends AlgoElement {
  private p1: { x: number; y: number };
  private p2: { x: number; y: number };
  private result: CircleResult;

  constructor(
    construction: Construction,
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) {
    super(construction);
    this.p1 = p1;
    this.p2 = p2;
    this.result = { cx: 0, cy: 0, r: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const cx = (this.p1.x + this.p2.x) / 2;
    const cy = (this.p1.y + this.p2.y) / 2;
    const r = Math.sqrt(
      (this.p2.x - this.p1.x) * (this.p2.x - this.p1.x) +
      (this.p2.y - this.p1.y) * (this.p2.y - this.p1.y)
    ) / 2;

    this.result = { cx, cy, r, defined: true };
  }

  getResult(): CircleResult {
    return this.result;
  }
}
