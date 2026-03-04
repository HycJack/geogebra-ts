import { Construction } from '../Construction';
import { GeoElementBase } from './GeoElements';
import { GeoPoint } from './GeoPoint';
import { Path, PathParameter } from '../Path';

/**
 * 圆类
 * 实现了 Path 接口
 */
export class GeoCircle extends GeoElementBase implements Path {
  private center: GeoPoint;
  private radius: number;

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param center 圆心
   * @param radius 半径
   */
  constructor(construction: Construction, center: GeoPoint, radius: number = 1) {
    super(construction);
    this.center = center;
    this.radius = radius;
    
    // 自动分配标签
    const label = construction.generateLabel('circle');
    this.setLabel(label);
    construction.addGeoElement(this);
  }

  /**
   * 设置圆心和半径
   * @param center 圆心
   * @param radius 半径
   */
  setCoords(center: GeoPoint, radius: number): void {
    this.center = center;
    this.radius = radius;
    this.notifyUpdate();
  }

  /**
   * 从三点创建圆
   * @param p1 点1
   * @param p2 点2
   * @param p3 点3
   */
  setFromThreePoints(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: Construction): void {
    // 计算圆心：三角形的外心
    const x1 = p1.getX();
    const y1 = p1.getY();
    const x2 = p2.getX();
    const y2 = p2.getY();
    const x3 = p3.getX();
    const y3 = p3.getY();

    const a = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
    const b = (x1 * x1 + y1 * y1) * (y3 - y2) + (x2 * x2 + y2 * y2) * (y1 - y3) + (x3 * x3 + y3 * y3) * (y2 - y1);
    const c = (x1 * x1 + y1 * y1) * (x2 - x3) + (x2 * x2 + y2 * y2) * (x3 - x1) + (x3 * x3 + y3 * y3) * (x1 - x2);
    // d 用于外接圆半径计算，保留公式完整性
    void ((x1 * x1 + y1 * y1) * (x3 * y2 - x2 * y3) + (x2 * x2 + y2 * y2) * (x1 * y3 - x3 * y1) + (x3 * x3 + y3 * y3) * (x2 * y1 - x1 * y2));

    if (Math.abs(a) < 1e-10) {
      return; // 三点共线
    }

    const centerX = -b / (2 * a);
    const centerY = -c / (2 * a);
    this.center = new GeoPoint(construction, centerX, centerY);
    this.radius = Math.sqrt((centerX - x1) * (centerX - x1) + (centerY - y1) * (centerY - y1));
  }

  /**
   * 获取圆心
   * @returns 圆心
   */
  getCenter(): GeoPoint {
    return this.center;
  }

  /**
   * 获取半径
   * @returns 半径
   */
  getRadius(): number {
    return this.radius;
  }

  /**
   * 计算面积
   * @returns 面积
   */
  getArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  /**
   * 计算周长
   * @returns 周长
   */
  getCircumference(): number {
    return 2 * Math.PI * this.radius;
  }

  /**
   * 检查点是否在圆内
   * @param point 点
   * @returns 是否在圆内
   */
  contains(point: GeoPoint): boolean {
    const dx = point.getX() - this.center.getX();
    const dy = point.getY() - this.center.getY();
    const distanceSq = dx * dx + dy * dy;
    return distanceSq <= this.radius * this.radius + 1e-10;
  }

  // ========== Path 接口实现 ==========

  isPath(): true {
    return true;
  }

  getPathType(): string {
    return 'circle';
  }

  isClosedPath(): boolean {
    return true;
  }

  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    const dx = x - this.center.getX();
    const dy = y - this.center.getY();
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.abs(distance - this.radius) < tolerance;
  }

  pointChanged(point: any): void {
    const dx = point.x - this.center.getX();
    const dy = point.y - this.center.getY();
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 1e-10) {
      // 如果点在圆心，默认放到右侧
      point.x = this.center.getX() + this.radius;
      point.y = this.center.getY();
      return;
    }
    
    // 将点投影到圆周上
    const scale = this.radius / distance;
    point.x = this.center.getX() + dx * scale;
    point.y = this.center.getY() + dy * scale;
  }

  pathChanged(_point: any): void {
    // 圆本身变化时的处理
  }

  getPathParameterForPoint(x: number, y: number): PathParameter {
    const dx = x - this.center.getX();
    const dy = y - this.center.getY();
    let angle = Math.atan2(dy, dx);
    if (angle < 0) {
      angle += 2 * Math.PI;
    }
    const param = new PathParameter();
    param.t = angle / (2 * Math.PI);
    // 移除PathType设置，使用字符串类型的pathType
    return param;
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    const angle = param.t * 2 * Math.PI;
    return {
      x: this.center.getX() + this.radius * Math.cos(angle),
      y: this.center.getY() + this.radius * Math.sin(angle)
    };
  }

  getMinParameter(): number {
    return 0;
  }

  getMaxParameter(): number {
    return 1;
  }

  /**
   * 获取路径长度（圆周长）
   * @returns 周长
   */
  getPathLength(): number {
    return this.getCircumference();
  }

  /**
   * 获取路径上某点的切线方向
   * @param t 路径参数
   * @returns 切线向量
   */
  getTangentDirection(t: number): { x: number; y: number } {
    const angle = t * 2 * Math.PI;
    // 圆的切线方向是垂直于半径的方向
    return { x: -Math.sin(angle), y: Math.cos(angle) };
  }
}