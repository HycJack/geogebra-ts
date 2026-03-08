import { Construction } from '../Construction';
import { GeoElementBase } from './GeoElements';
import { GeoPoint } from './GeoPoint';
import { Path, PathParameter } from '../Path';

/**
 * 直线类
 * 实现了 Path 接口
 */
export class GeoLine extends GeoElementBase implements Path {
  private a: number;
  private b: number;
  private c: number;

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param a 直线方程系数 a
   * @param b 直线方程系数 b
   * @param c 直线方程系数 c
   */
  constructor(construction: Construction, a: number = 1, b: number = -1, c: number = 0) {
    super(construction);
    this.a = a;
    this.b = b;
    this.c = c;
    
    // 自动分配标签
    const label = construction.generateLabel('line');
    this.setLabel(label);
    construction.addGeoElement(this);
  }

  /**
   * 设置直线方程
   * @param a 直线方程系数 a
   * @param b 直线方程系数 b
   * @param c 直线方程系数 c
   */
  setCoords(a: number, b: number, c: number): void {
    this.a = a;
    this.b = b;
    this.c = c;
    this.notifyUpdate();
  }

  /**
   * 从两点创建直线
   * @param p1 点1
   * @param p2 点2
   */
  setFromPoints(p1: GeoPoint, p2: GeoPoint): void {
    const x1 = p1.getX();
    const y1 = p1.getY();
    const x2 = p2.getX();
    const y2 = p2.getY();
    
    this.a = y1 - y2;
    this.b = x2 - x1;
    this.c = x1 * y2 - x2 * y1;
  }

  /**
   * 获取系数 a
   * @returns 系数 a
   */
  getA(): number {
    return this.a;
  }

  /**
   * 获取系数 b
   * @returns 系数 b
   */
  getB(): number {
    return this.b;
  }

  /**
   * 获取系数 c
   * @returns 系数 c
   */
  getC(): number {
    return this.c;
  }

  /**
   * 计算点到直线的距离
   * @param point 点
   * @returns 距离
   */
  distance(point: GeoPoint): number {
    const x = point.getX();
    const y = point.getY();
    return Math.abs(this.a * x + this.b * y + this.c) / Math.sqrt(this.a * this.a + this.b * this.b);
  }

  /**
   * 计算与另一条直线的交点
   * @param other 另一条直线
   * @returns 交点或 null
   */
  intersect(other: GeoLine, construction: Construction): GeoPoint | null {
    const det = this.a * other.b - other.a * this.b;
    if (Math.abs(det) < 1e-10) {
      return null; // 平行
    }
    
    const x = (this.b * other.c - other.b * this.c) / det;
    const y = (other.a * this.c - this.a * other.c) / det;
    return new GeoPoint(construction, x, y);
  }

  // ========== Path 接口实现 ==========

  isPath(): true {
    return true;
  }

  getPathType(): string {
    return 'line';
  }

  isClosedPath(): boolean {
    return false;
  }

  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    return Math.abs(this.a * x + this.b * y + this.c) < tolerance;
  }

  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    const x = point.getX();
    const y = point.getY();
    
    // 直线方程: ax + by + c = 0
    const a = this.a, b = this.b, c = this.c;
    const denom = a * a + b * b;
    
    if (denom < 1e-10) {
      return; // 直线未定义
    }
    
    // 投影公式
    const xProj = (b * (b * x - a * y) - a * c) / denom;
    const yProj = (a * (-b * x + a * y) - b * c) / denom;
    
    point.setCoords(xProj, yProj);
  }

  pathChanged(_point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    // 直线本身变化时的处理
  }

  getPathParameterForPoint(x: number, y: number): PathParameter {
    // 对于无限直线，返回投影位置
    const param = new PathParameter();
    if (Math.abs(this.b) > 1e-10) {
      param.t = x / 100;
    } else {
      param.t = y / 100;
    }
    // 移除PathType设置，使用字符串类型的pathType
    return param;
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    // 对于无限直线，我们使用一个参考点加上方向向量
    // 这里简化处理：返回直线上的一点
    if (Math.abs(this.b) > 1e-10) {
      // 不是垂直线
      const x = param.t * 100; // 使用100作为缩放因子
      const y = -(this.a * x + this.c) / this.b;
      return { x, y };
    } else {
      // 垂直线
      const x = -this.c / this.a;
      const y = param.t * 100;
      return { x, y };
    }
  }

  getMinParameter(): number {
    return -Infinity;
  }

  getMaxParameter(): number {
    return Infinity;
  }

  /**
   * 获取路径上某点的切线方向
   * @param _t 路径参数
   * @returns 切线向量
   */
  getTangentDirection(_t: number): { x: number; y: number } {
    // 直线的方向向量是 (-b, a) 或 (b, -a)
    const len = Math.sqrt(this.a * this.a + this.b * this.b);
    if (len < 1e-10) {
      return { x: 1, y: 0 };
    }
    return { x: -this.b / len, y: this.a / len };
  }
}