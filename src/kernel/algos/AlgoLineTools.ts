/**
 * 垂线和平行线算法
 * 对应 Java 版本的 AlgoLinePointLine（平行线）和垂线算法
 */

import { AlgoElement } from './AlgoElement';
import type { Construction } from '../Construction';

export interface LineResult {
  a: number;
  b: number;
  c: number;
  defined: boolean;
}

/**
 * 平行线算法
 * 通过给定点，创建与给定直线平行的直线
 */
export class AlgoParallelLine extends AlgoElement {
  private point: { x: number; y: number };
  private line: { a: number; b: number; c: number };
  private result: LineResult;

  constructor(
    construction: Construction,
    point: { x: number; y: number },
    line: { a: number; b: number; c: number }
  ) {
    super(construction);
    this.point = point;
    this.line = line;
    this.result = { a: 0, b: 0, c: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { x: px, y: py } = this.point;
    const { a: la, b: lb, c: _ } = this.line;

    const norm = Math.sqrt(la * la + lb * lb);
    if (norm < 1e-10) {
      this.result = { a: 0, b: 0, c: 0, defined: false };
      return;
    }

    const na = la / norm;
    const nb = lb / norm;
    // const nc = lc / norm;

    this.result = {
      a: na,
      b: nb,
      c: -(na * px + nb * py),
      defined: true,
    };
  }

  getResult(): LineResult {
    return this.result;
  }
}

/**
 * 垂线算法
 * 通过给定点，创建与给定直线垂直的直线
 */
export class AlgoPerpendicularLine extends AlgoElement {
  private point: { x: number; y: number };
  private line: { a: number; b: number; c: number };
  private result: LineResult;

  constructor(
    construction: Construction,
    point: { x: number; y: number },
    line: { a: number; b: number; c: number }
  ) {
    super(construction);
    this.point = point;
    this.line = line;
    this.result = { a: 0, b: 0, c: 0, defined: false };
    this.compute();
  }

  compute(): void {
    const { x: px, y: py } = this.point;
    const { a: la, b: lb, c: _ } = this.line;

    const norm = Math.sqrt(la * la + lb * lb);
    if (norm < 1e-10) {
      this.result = { a: 0, b: 0, c: 0, defined: false };
      return;
    }

    const na = la / norm;
    const nb = lb / norm;
    // const nc = lc / norm;

    this.result = {
      a: -nb,
      b: na,
      c: nb * px - na * py,
      defined: true,
    };
  }

  getResult(): LineResult {
    return this.result;
  }
}

/**
 * 通过两点创建垂线
 * 创建通过第一个点，且与连接两点的直线垂直的直线
 */
export class AlgoPerpendicularLineTwoPoints extends AlgoElement {
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

    this.result = {
      a: -dy,
      b: dx,
      c: dy * x1 - dx * y1,
      defined: true,
    };
  }

  getResult(): LineResult {
    return this.result;
  }
}
