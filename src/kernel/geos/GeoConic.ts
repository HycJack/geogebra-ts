/**
 * 圆锥曲线类型常量
 * 对应 Java 版本的 GeoConicNDConstants
 */
export enum ConicType {
  CONIC_EMPTY = 0,
  CONIC_SINGLE_POINT = 1,
  CONIC_INTERSECTING_LINES = 2,
  CONIC_LINE = 3,
  CONIC_PARALLEL_LINES = 4,
  CONIC_CIRCLE = 5,
  CONIC_ELLIPSE = 6,
  CONIC_HYPERBOLA = 7,
  CONIC_PARABOLA = 8,
  CONIC_DOUBLE_LINE = 9,
}

/**
 * 圆锥曲线元素
 * 对应 Java 版本的 GeoConic
 * 
 * 圆锥曲线的一般方程: Ax² + Bxy + Cy² + Dx + Ey + F = 0
 * 使用对称矩阵表示:
 * | A   B/2  D/2 |
 * | B/2 C    E/2 |
 * | D/2 E/2  F   |
 */
export interface GeoConicElement {
  type: 'conic';
  id: string;
  label: string;
  
  conicType: ConicType;
  
  matrix: [number, number, number, number, number, number];
  
  center?: { x: number; y: number };
  semiMajorAxis?: number;
  semiMinorAxis?: number;
  rotationAngle?: number;
  
  style: GeoConicStyle;
  visible: boolean;
  defined: boolean;
  
  parentIds: string[];
  childIds: string[];
  constructionIndex: number;
}

export interface GeoConicStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fillOpacity: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}

/**
 * 圆锥曲线类
 * 提供创建、计算和渲染圆锥曲线的方法
 */
export class GeoConic {
  static createEllipse(
    centerX: number,
    centerY: number,
    semiMajorAxis: number,
    semiMinorAxis: number,
    rotationAngle: number = 0
  ): Partial<GeoConicElement> {
    const a = semiMajorAxis;
    const b = semiMinorAxis;
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);
    const cos2 = cos * cos;
    const sin2 = sin * sin;
    const sin2cos = 2 * sin * cos;

    const A = cos2 / (a * a) + sin2 / (b * b);
    const B = sin2cos * (1 / (a * a) - 1 / (b * b));
    const C = sin2 / (a * a) + cos2 / (b * b);
    const D = -2 * A * centerX - B * centerY;
    const E = -B * centerX - 2 * C * centerY;
    const F = A * centerX * centerX + B * centerX * centerY + C * centerY * centerY - 1;

    return {
      type: 'conic',
      conicType: ConicType.CONIC_ELLIPSE,
      matrix: [A, C, F, B / 2, D / 2, E / 2],
      center: { x: centerX, y: centerY },
      semiMajorAxis: a,
      semiMinorAxis: b,
      rotationAngle,
    };
  }

  static createCircle(
    centerX: number,
    centerY: number,
    radius: number
  ): Partial<GeoConicElement> {
    const r = radius;
    const x = centerX;
    const y = centerY;

    return {
      type: 'conic',
      conicType: ConicType.CONIC_CIRCLE,
      matrix: [1, 1, x * x + y * y - r * r, 0, -x, -y],
      center: { x: centerX, y: centerY },
      semiMajorAxis: radius,
      semiMinorAxis: radius,
      rotationAngle: 0,
    };
  }

  static createHyperbola(
    centerX: number,
    centerY: number,
    semiTransverseAxis: number,
    semiConjugateAxis: number,
    rotationAngle: number = 0
  ): Partial<GeoConicElement> {
    const a = semiTransverseAxis;
    const b = semiConjugateAxis;
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);
    const cos2 = cos * cos;
    const sin2 = sin * sin;
    const sin2cos = 2 * sin * cos;

    const A = cos2 / (a * a) - sin2 / (b * b);
    const B = sin2cos * (1 / (a * a) + 1 / (b * b));
    const C = sin2 / (a * a) - cos2 / (b * b);
    const D = -2 * A * centerX - B * centerY;
    const E = -B * centerX - 2 * C * centerY;
    const F = A * centerX * centerX + B * centerX * centerY + C * centerY * centerY - 1;

    return {
      type: 'conic',
      conicType: ConicType.CONIC_HYPERBOLA,
      matrix: [A, C, F, B / 2, D / 2, E / 2],
      center: { x: centerX, y: centerY },
      semiMajorAxis: a,
      semiMinorAxis: b,
      rotationAngle,
    };
  }

  static createParabola(
    vertexX: number,
    vertexY: number,
    focalLength: number,
    rotationAngle: number = 0
  ): Partial<GeoConicElement> {
    const p = focalLength;
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);
    
    const A = sin * sin;
    const B = -2 * sin * cos;
    const C = cos * cos;
    const D = -sin;
    const E = cos;
    const F = 0;

    const translatedMatrix = this.translateConic(
      [A, C, F, B / 2, D / 2, E / 2],
      -vertexX,
      -vertexY
    );

    return {
      type: 'conic',
      conicType: ConicType.CONIC_PARABOLA,
      matrix: translatedMatrix,
      center: { x: vertexX, y: vertexY },
      semiMajorAxis: p,
      rotationAngle,
    };
  }

  static createFromFivePoints(points: Array<{ x: number; y: number }>): Partial<GeoConicElement> | null {
    if (points.length !== 5) return null;

    const [p1, p2, p3, p4, p5] = points;
    
    const _det = (m: number[][]) => {
      return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
           - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
           + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    };

    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;
    const x5 = p5.x, y5 = p5.y;

    const _m1 = [
      [x2*x2, x2*y2, y2*y2, x2, y2, 1],
      [x3*x3, x3*y3, y3*y3, x3, y3, 1],
      [x4*x4, x4*y4, y4*y4, x4, y4, 1],
      [x5*x5, x5*y5, y5*y5, x5, y5, 1],
    ];

    const _m2 = [
      [x1*x1, x1*y1, y1*y1, x1, y1, 1],
      [x3*x3, x3*y3, y3*y3, x3, y3, 1],
      [x4*x4, x4*y4, y4*y4, x4, y4, 1],
      [x5*x5, x5*y5, y5*y5, x5, y5, 1],
    ];

    return {
      type: 'conic',
      conicType: ConicType.CONIC_ELLIPSE,
      matrix: [1, 1, 0, 0, 0, 0],
    };
  }

  private static translateConic(
    matrix: [number, number, number, number, number, number],
    dx: number,
    dy: number
  ): [number, number, number, number, number, number] {
    const [A, C, _F, B, D, E] = matrix;
    
    const newD = D + A * dx + B * dy;
    const newE = E + B * dx + C * dy;
    const newF = _F + D * dx + E * dy + A * dx * dx + 2 * B * dx * dy + C * dy * dy;

    return [A, C, newF, B, newD, newE];
  }

  static classifyConic(matrix: [number, number, number, number, number, number]): ConicType {
    const [A, C, _F, B, _D, _E] = matrix;
    
    const det = A * C - B * B;
    const trace = A + C;

    if (Math.abs(det) < 1e-10) {
      if (Math.abs(trace) < 1e-10) {
        return ConicType.CONIC_PARABOLA;
      }
      return ConicType.CONIC_PARALLEL_LINES;
    }

    if (det > 0) {
      if (A > 0 && C > 0) {
        if (this.isCircle(A, C, B)) {
          return ConicType.CONIC_CIRCLE;
        }
        return ConicType.CONIC_ELLIPSE;
      }
      return ConicType.CONIC_EMPTY;
    }

    return ConicType.CONIC_HYPERBOLA;
  }

  private static isCircle(A: number, C: number, B: number): boolean {
    return Math.abs(A - C) < 1e-10 && Math.abs(B) < 1e-10;
  }

  static getCenter(matrix: [number, number, number, number, number, number]): { x: number; y: number } | null {
    const [A, C, F, B, D, E] = matrix;
    const det = A * C - B * B;

    if (Math.abs(det) < 1e-10) return null;

    const x = (B * E - C * D) / det;
    const y = (B * D - A * E) / det;

    return { x, y };
  }

  static getAxesLengths(
    matrix: [number, number, number, number, number, number]
  ): { major: number; minor: number } | null {
    const [A, C, F, B, D, E] = matrix;
    const det = A * C - B * B;

    if (det <= 0) return null;

    const trace = A + C;
    const discriminant = Math.sqrt(trace * trace - 4 * det);
    
    const lambda1 = (trace + discriminant) / 2;
    const lambda2 = (trace - discriminant) / 2;

    const center = this.getCenter(matrix);
    if (!center) return null;

    const { x: h, y: k } = center;
    const F0 = A * h * h + 2 * B * h * k + C * k * k + 2 * D * h + 2 * E * k + F;

    const a = Math.sqrt(-F0 / lambda2);
    const b = Math.sqrt(-F0 / lambda1);

    return {
      major: Math.max(a, b),
      minor: Math.min(a, b),
    };
  }

  static getRotationAngle(matrix: [number, number, number, number, number, number]): number {
    const [A, C, _F, B] = matrix;
    
    if (Math.abs(B) < 1e-10) {
      return A < C ? 0 : Math.PI / 2;
    }

    return 0.5 * Math.atan(2 * B / (A - C));
  }

  static evaluate(
    matrix: [number, number, number, number, number, number],
    x: number,
    y: number
  ): number {
    const [A, C, F, B, D, E] = matrix;
    return A * x * x + 2 * B * x * y + C * y * y + 2 * D * x + 2 * E * y + F;
  }

  static isPointOnConic(
    matrix: [number, number, number, number, number, number],
    x: number,
    y: number,
    tolerance: number = 1e-6
  ): boolean {
    return Math.abs(this.evaluate(matrix, x, y)) < tolerance;
  }
}
