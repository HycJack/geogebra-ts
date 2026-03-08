import { PathParameter } from '../Path';

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

    // const [p1, p2, p3, p4, p5] = points;
    
    // const _det = (m: number[][]) => {
    //   return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    //        - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    //        + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    // };

    // const x1 = p1.x, y1 = p1.y;
    // const x2 = p2.x, y2 = p2.y;
    // const x3 = p3.x, y3 = p3.y;
    // const x4 = p4.x, y4 = p4.y;
    // const x5 = p5.x, y5 = p5.y;

    // const _m1 = [
    //   [x2*x2, x2*y2, y2*y2, x2, y2, 1],
    //   [x3*x3, x3*y3, y3*y3, x3, y3, 1],
    //   [x4*x4, x4*y4, y4*y4, x4, y4, 1],
    //   [x5*x5, x5*y5, y5*y5, x5, y5, 1],
    // ];

    // const _m2 = [
    //   [x1*x1, x1*y1, y1*y1, x1, y1, 1],
    //   [x3*x3, x3*y3, y3*y3, x3, y3, 1],
    //   [x4*x4, x4*y4, y4*y4, x4, y4, 1],
    //   [x5*x5, x5*y5, y5*y5, x5, y5, 1],
    // ];

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
    const [A, C, _, B, D, E] = matrix;
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

  // ========== Path 接口实现 ==========

  /**
   * 检查是否为路径
   * @returns 总是返回true
   */
  static isPath(): true {
    return true;
  }

  /**
   * 获取路径类型
   * @returns 路径类型，返回'conic'
   */
  static getPathType(): string {
    return 'conic';
  }

  /**
   * 检查是否为闭合路径
   * @param matrix 圆锥曲线的矩阵
   * @returns 是否为闭合路径
   */
  static isClosedPath(matrix: [number, number, number, number, number, number]): boolean {
    const type = this.classifyConic(matrix);
    return type === ConicType.CONIC_CIRCLE || type === ConicType.CONIC_ELLIPSE;
  }

  /**
   * 检查点是否在路径上
   * @param matrix 圆锥曲线的矩阵
   * @param x x坐标
   * @param y y坐标
   * @param tolerance 容差
   * @returns 是否在路径上
   */
  static isOnPath(
    matrix: [number, number, number, number, number, number],
    x: number,
    y: number,
    tolerance: number = 1e-6
  ): boolean {
    return this.isPointOnConic(matrix, x, y, tolerance);
  }

  /**
   * 处理点在路径上的变化
   * 对于圆，将点投影到圆周上
   * @param matrix 圆锥曲线的矩阵
   * @param point 点对象
   */
  static pointChanged(
    matrix: [number, number, number, number, number, number],
    point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }
  ): void {
    const type = this.classifyConic(matrix);
    
    if (type === ConicType.CONIC_CIRCLE) {
      // 对于圆，将点投影到圆周上
      const center = this.getCenter(matrix);
      if (!center) return;
      
      const x = point.getX();
      const y = point.getY();
      const dx = x - center.x;
      const dy = y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 获取半径
      const axes = this.getAxesLengths(matrix);
      if (!axes) return;
      const radius = axes.major;
      
      if (distance < 1e-10) {
        // 如果点在圆心，默认放到右侧
        point.setCoords(center.x + radius, center.y);
        return;
      }
      
      // 将点投影到圆周上
      const scale = radius / distance;
      const newX = center.x + dx * scale;
      const newY = center.y + dy * scale;
      point.setCoords(newX, newY);
    } else if (type === ConicType.CONIC_ELLIPSE) {
      // 对于椭圆，将点投影到椭圆上
      const center = this.getCenter(matrix);
      if (!center) return;
      
      const axes = this.getAxesLengths(matrix);
      if (!axes) return;
      
      const a = axes.major;
      // const b = axes.minor;
      
      const x = point.getX();
      const y = point.getY();
      
      // 将点转换到椭圆的局部坐标系
      const angle = this.getRotationAngle(matrix);
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);
      
      const dx = x - center.x;
      const dy = y - center.y;
      
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      
      // 计算点在椭圆上的投影（简化版）
      const distance = Math.sqrt(localX * localX + localY * localY);
      if (distance < 1e-10) {
        point.setCoords(center.x + a, center.y);
        return;
      }
      
      // 简化处理：使用圆的投影方法
      const scale = a / distance;
      const newLocalX = localX * scale;
      const newLocalY = localY * scale;
      
      // 转换回全局坐标系
      const newX = center.x + (newLocalX * cos + newLocalY * sin);
      const newY = center.y + (-newLocalX * sin + newLocalY * cos);
      
      point.setCoords(newX, newY);
    }
  }

  /**
   * 处理路径本身的变化
   * @param _matrix 圆锥曲线的矩阵
   * @param _point 点对象
   */
  static pathChanged(
    _matrix: [number, number, number, number, number, number],
    _point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }
  ): void {
    // 圆锥曲线本身变化时的处理
  }

  /**
   * 获取点在路径上的参数
   * 对于圆，使用角度作为参数
   * @param matrix 圆锥曲线的矩阵
   * @param x x坐标
   * @param y y坐标
   * @returns 路径参数
   */
  static getPathParameterForPoint(
    matrix: [number, number, number, number, number, number],
    x: number,
    y: number
  ): PathParameter {
    const type = this.classifyConic(matrix);
    
    if (type === ConicType.CONIC_CIRCLE) {
      // 对于圆，计算点相对于圆心的角度
      const center = this.getCenter(matrix);
      if (!center) return new PathParameter(0);
      
      const dx = x - center.x;
      const dy = y - center.y;
      let angle = Math.atan2(dy, dx);
      
      // 将角度转换为[0, 2π)范围
      if (angle < 0) {
        angle += 2 * Math.PI;
      }
      
      // 创建路径参数，将角度归一化到[0, 1)范围
      return new PathParameter(angle / (2 * Math.PI));
    }
    
    // 对于其他类型，返回0
    return new PathParameter(0);
  }

  /**
   * 根据路径参数获取点
   * @param matrix 圆锥曲线的矩阵
   * @param param 路径参数
   * @returns 点坐标
   */
  static getPointFromPathParameter(
    matrix: [number, number, number, number, number, number],
    param: PathParameter
  ): { x: number; y: number } {
    const type = this.classifyConic(matrix);
    
    if (type === ConicType.CONIC_CIRCLE) {
      // 对于圆，将参数转换为角度
      const center = this.getCenter(matrix);
      if (!center) return { x: 0, y: 0 };
      
      const axes = this.getAxesLengths(matrix);
      if (!axes) return { x: 0, y: 0 };
      
      const radius = axes.major;
      const angle = param.t * 2 * Math.PI;
      
      // 计算点坐标
      return {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      };
    }
    
    // 对于其他类型，返回原点
    return { x: 0, y: 0 };
  }

  /**
   * 获取路径参数的最小值
   * @returns 最小值，返回0
   */
  static getMinParameter(): number {
    return 0;
  }

  /**
   * 获取路径参数的最大值
   * @returns 最大值，返回1
   */
  static getMaxParameter(): number {
    return 1;
  }
}
