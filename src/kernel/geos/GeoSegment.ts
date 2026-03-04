import { Construction } from '../Construction';
import { GeoElementBase } from './GeoElements';
import { GeoPoint } from './GeoPoint';
import { Path, PathParameter } from '../Path';

/**
 * 线段类
 * 实现了 Path 接口
 */
export class GeoSegment extends GeoElementBase implements Path {
  private startPoint: GeoPoint;
  private endPoint: GeoPoint;
  private a: number = 0;
  private b: number = 0;
  private c: number = 0;

  constructor(construction: Construction, startPoint: GeoPoint, endPoint: GeoPoint) {
    super(construction);
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    
    this.computeLineEquation();
    
    const label = construction.generateLabel('segment');
    this.setLabel(label);
    construction.addGeoElement(this);
  }

  private computeLineEquation(): void {
    const x1 = this.startPoint.getX();
    const y1 = this.startPoint.getY();
    const x2 = this.endPoint.getX();
    const y2 = this.endPoint.getY();
    
    this.a = y1 - y2;
    this.b = x2 - x1;
    this.c = x1 * y2 - x2 * y1;
  }

  setCoords(a: number, b: number, c: number): void {
    this.a = a;
    this.b = b;
    this.c = c;
    this.notifyUpdate();
  }

  getA(): number { return this.a; }
  getB(): number { return this.b; }
  getC(): number { return this.c; }

  setStartPoint(point: GeoPoint): void {
    this.startPoint = point;
    this.computeLineEquation();
  }

  setEndPoint(point: GeoPoint): void {
    this.endPoint = point;
    this.computeLineEquation();
  }

  setCoord(startPoint: GeoPoint, endPoint: GeoPoint): void {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.computeLineEquation();
    this.notifyUpdate();
  }

  getStartPoint(): GeoPoint {
    return this.startPoint;
  }

  getEndPoint(): GeoPoint {
    return this.endPoint;
  }

  getLength(): number {
    const dx = this.endPoint.getX() - this.startPoint.getX();
    const dy = this.endPoint.getY() - this.startPoint.getY();
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ========== Path 接口实现 ==========

  isPath(): true {
    return true;
  }

  getPathType(): string {
    return 'segment';
  }

  isClosedPath(): boolean {
    return false;
  }

  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    // 首先检查是否在直线上
    if (Math.abs(this.a * x + this.b * y + this.c) > tolerance) {
      return false;
    }
    
    // 然后检查是否在线段的范围内
    const x1 = this.startPoint.getX();
    const y1 = this.startPoint.getY();
    const x2 = this.endPoint.getX();
    const y2 = this.endPoint.getY();
    
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    return x >= minX - tolerance && x <= maxX + tolerance && 
           y >= minY - tolerance && y <= maxY + tolerance;
  }

  pointChanged(point: any): void {
    const param = this.getPathParameterForPoint(point.x, point.y);
    const pos = this.getPointFromPathParameter(param);
    point.x = pos.x;
    point.y = pos.y;
  }

  pathChanged(_point: any): void {
    // 线段本身变化时的处理
  }

  getPathParameterForPoint(x: number, y: number): PathParameter {
    const x1 = this.startPoint.getX();
    const y1 = this.startPoint.getY();
    const x2 = this.endPoint.getX();
    const y2 = this.endPoint.getY();
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    
    const param = new PathParameter();
    if (lenSq < 1e-10) {
      param.t = 0;
    } else {
      // 投影参数
      const t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
      param.t = Math.max(0, Math.min(1, t));
    }
    // 移除PathType设置，使用字符串类型的pathType
    return param;
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    const x1 = this.startPoint.getX();
    const y1 = this.startPoint.getY();
    const x2 = this.endPoint.getX();
    const y2 = this.endPoint.getY();
    return {
      x: x1 + param.t * (x2 - x1),
      y: y1 + param.t * (y2 - y1)
    };
  }

  getMinParameter(): number {
    return 0;
  }

  getMaxParameter(): number {
    return 1;
  }

  /**
   * 获取路径长度
   * @returns 长度
   */
  getPathLength(): number {
    return this.getLength();
  }

  /**
   * 获取路径上某点的切线方向
   * @param _t 路径参数
   * @returns 切线向量
   */
  getTangentDirection(_t: number): { x: number; y: number } {
    const dx = this.endPoint.getX() - this.startPoint.getX();
    const dy = this.endPoint.getY() - this.startPoint.getY();
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-10) {
      return { x: 1, y: 0 };
    }
    return { x: dx / len, y: dy / len };
  }
}