/**
 * 函数元素
 * 对应 Java 版本的 GeoFunction
 */

import { GeoElementBase } from './GeoElement';

export type FunctionType = 'explicit' | 'parametric' | 'implicit' | 'polar';

export interface GeoFunctionStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  labelVisible: boolean;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}

export interface GeoFunctionElement extends GeoElementBase {
  type: 'function';
  functionType: FunctionType;
  expression: string;
  domain?: {
    min: number;
    max: number;
  };
  style: GeoFunctionStyle;
}

export interface ExplicitFunction extends GeoFunctionElement {
  functionType: 'explicit';
  evaluate: (x: number) => number;
}

export interface ParametricFunction extends GeoFunctionElement {
  functionType: 'parametric';
  evaluateX: (t: number) => number;
  evaluateY: (t: number) => number;
  parameterDomain: {
    min: number;
    max: number;
  };
}

export interface PolarFunction extends GeoFunctionElement {
  functionType: 'polar';
  evaluate: (theta: number) => number;
  thetaDomain: {
    min: number;
    max: number;
  };
}

export class GeoFunction {
  static createExplicit(
    expression: string,
    evaluator?: (x: number) => number
  ): Partial<ExplicitFunction> {
    return {
      type: 'function',
      functionType: 'explicit',
      expression,
      evaluate: evaluator || ((x: number) => this.evaluateExpression(expression, x)),
    };
  }

  static createParametric(
    expressionX: string,
    expressionY: string,
    tMin: number = 0,
    tMax: number = 2 * Math.PI
  ): Partial<ParametricFunction> {
    return {
      type: 'function',
      functionType: 'parametric',
      expression: `x(t) = ${expressionX}, y(t) = ${expressionY}`,
      evaluateX: (t: number) => this.evaluateExpression(expressionX, t),
      evaluateY: (t: number) => this.evaluateExpression(expressionY, t),
      parameterDomain: { min: tMin, max: tMax },
    };
  }

  static createPolar(
    expression: string,
    thetaMin: number = 0,
    thetaMax: number = 2 * Math.PI
  ): Partial<PolarFunction> {
    return {
      type: 'function',
      functionType: 'polar',
      expression,
      evaluate: (theta: number) => this.evaluateExpression(expression, theta),
      thetaDomain: { min: thetaMin, max: thetaMax },
    };
  }

  private static evaluateExpression(expression: string, variable: number): number {
    try {
      const sanitized = expression
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/log/g, 'Math.log')
        .replace(/ln/g, 'Math.log')
        .replace(/exp/g, 'Math.exp')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e(?![xp])/gi, 'Math.E')
        .replace(/\^/g, '**');

      const func = new Function('x', `return ${sanitized}`);
      return func(variable);
    } catch {
      return NaN;
    }
  }

  static getPoints(
    evaluator: (x: number) => number,
    xMin: number,
    xMax: number,
    numPoints: number = 100
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const step = (xMax - xMin) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const x = xMin + i * step;
      const y = evaluator(x);
      if (isFinite(y)) {
        points.push({ x, y });
      }
    }

    return points;
  }

  static getParametricPoints(
    evaluateX: (t: number) => number,
    evaluateY: (t: number) => number,
    tMin: number,
    tMax: number,
    numPoints: number = 100
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const step = (tMax - tMin) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const t = tMin + i * step;
      const x = evaluateX(t);
      const y = evaluateY(t);
      if (isFinite(x) && isFinite(y)) {
        points.push({ x, y });
      }
    }

    return points;
  }

  static getPolarPoints(
    evaluator: (theta: number) => number,
    thetaMin: number,
    thetaMax: number,
    numPoints: number = 100
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const step = (thetaMax - thetaMin) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const theta = thetaMin + i * step;
      const r = evaluator(theta);
      if (isFinite(r)) {
        points.push({
          x: r * Math.cos(theta),
          y: r * Math.sin(theta),
        });
      }
    }

    return points;
  }

  static findRoots(
    evaluator: (x: number) => number,
    xMin: number,
    xMax: number,
    tolerance: number = 1e-10,
    maxIterations: number = 100
  ): number[] {
    const roots: number[] = [];
    const step = (xMax - xMin) / 1000;

    for (let x = xMin; x < xMax; x += step) {
      const y1 = evaluator(x);
      const y2 = evaluator(x + step);

      if (y1 * y2 < 0) {
        const root = this.bisection(evaluator, x, x + step, tolerance, maxIterations);
        if (root !== null && !roots.some(r => Math.abs(r - root) < tolerance)) {
          roots.push(root);
        }
      }
    }

    return roots;
  }

  private static bisection(
    f: (x: number) => number,
    a: number,
    b: number,
    tolerance: number,
    maxIterations: number
  ): number | null {
    let fa = f(a);
    let fb = f(b);

    if (fa * fb > 0) return null;

    for (let i = 0; i < maxIterations; i++) {
      const c = (a + b) / 2;
      const fc = f(c);

      if (Math.abs(fc) < tolerance || (b - a) / 2 < tolerance) {
        return c;
      }

      if (fa * fc < 0) {
        b = c;
        fb = fc;
      } else {
        a = c;
        fa = fc;
      }
    }

    return (a + b) / 2;
  }

  static findExtrema(
    evaluator: (x: number) => number,
    xMin: number,
    xMax: number,
    tolerance: number = 1e-6
  ): Array<{ x: number; y: number; type: 'min' | 'max' }> {
    const extrema: Array<{ x: number; y: number; type: 'min' | 'max' }> = [];
    const step = (xMax - xMin) / 1000;

    for (let x = xMin + step; x < xMax - step; x += step) {
      const y = evaluator(x);
      const yLeft = evaluator(x - step);
      const yRight = evaluator(x + step);

      if (yLeft < y && y > yRight) {
        extrema.push({ x, y, type: 'max' });
      } else if (yLeft > y && y < yRight) {
        extrema.push({ x, y, type: 'min' });
      }
    }

    return extrema;
  }

  static derivative(
    evaluator: (x: number) => number,
    h: number = 1e-6
  ): (x: number) => number {
    return (x: number) => {
      const y1 = evaluator(x - h);
      const y2 = evaluator(x + h);
      return (y2 - y1) / (2 * h);
    };
  }

  static integral(
    evaluator: (x: number) => number,
    xMin: number,
    xMax: number,
    numIntervals: number = 1000
  ): number {
    const h = (xMax - xMin) / numIntervals;
    let sum = 0;

    for (let i = 0; i <= numIntervals; i++) {
      const x = xMin + i * h;
      const y = evaluator(x);
      const weight = i === 0 || i === numIntervals ? 1 : i % 2 === 0 ? 2 : 4;
      sum += weight * y;
    }

    return (h / 3) * sum;
  }

  static arcLength(
    evaluator: (x: number) => number,
    xMin: number,
    xMax: number,
    numIntervals: number = 1000
  ): number {
    const h = (xMax - xMin) / numIntervals;
    let length = 0;
    const deriv = this.derivative(evaluator);

    for (let i = 0; i < numIntervals; i++) {
      const x1 = xMin + i * h;
      const x2 = xMin + (i + 1) * h;
      const dy = deriv((x1 + x2) / 2);
      length += Math.sqrt(h * h + (dy * h) * (dy * h));
    }

    return length;
  }

  static tangentLine(
    evaluator: (x: number) => number,
    x: number
  ): { a: number; b: number; c: number; point: { x: number; y: number } } {
    const y = evaluator(x);
    const slope = this.derivative(evaluator)(x);

    return {
      a: -slope,
      b: 1,
      c: slope * x - y,
      point: { x, y },
    };
  }

  static normalLine(
    evaluator: (x: number) => number,
    x: number
  ): { a: number; b: number; c: number; point: { x: number; y: number } } {
    const y = evaluator(x);
    const slope = this.derivative(evaluator)(x);
    const normalSlope = -1 / slope;

    return {
      a: -normalSlope,
      b: 1,
      c: normalSlope * x - y,
      point: { x, y },
    };
  }
}
