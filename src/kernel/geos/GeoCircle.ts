import { Construction } from '../Construction';
import { GeoElementBase } from './GeoElements';
import { GeoPoint } from './GeoPoint';
import { Path, PathParameter } from '../Path';

/**
 * 点坐标接口
 * 表示二维平面上的点坐标
 */
export interface PointCoordinates {
  x: number; // x坐标
  y: number; // y坐标
}

/**
 * 向量接口
 * 表示二维平面上的向量
 */
export interface Vector {
  x: number; // x分量
  y: number; // y分量
}

/**
 * 圆类
 * 实现了 Path 接口，提供圆的基本操作和几何计算
 */
export class GeoCircle extends GeoElementBase implements Path {
  // 核心属性
  private center: GeoPoint; // 圆心
  private radius: number;   // 半径
  
  // 缓存属性，用于优化性能
  private cachedArea: number | null = null;          // 缓存的面积
  private cachedCircumference: number | null = null; // 缓存的周长

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param center 圆心
   * @param radius 半径，默认值为1
   */
  constructor(construction: Construction, center: GeoPoint, radius: number = 1) {
    super(construction);
    
    // 参数验证
    if (!construction) {
      throw new Error('Construction cannot be null or undefined');
    }
    if (!center) {
      throw new Error('Center point cannot be null or undefined');
    }
    if (typeof radius !== 'number' || isNaN(radius)) {
      throw new Error('Radius must be a valid number');
    }
    if (radius < 0) {
      throw new Error('Radius must be non-negative');
    }
    
    this.center = center;
    this.radius = radius;
    
    // 自动分配标签
    const label = construction.generateLabel('circle');
    this.setLabel(label);
    construction.addGeoElement(this);
  }

  // ========== 辅助方法 ==========

  /**
   * 清除缓存
   * 当圆的属性发生变化时调用，确保缓存的计算结果失效
   */
  private clearCache(): void {
    this.cachedArea = null;
    this.cachedCircumference = null;
  }

  // ========== 属性设置与获取 ==========

  /**
   * 设置圆心和半径
   * @param center 圆心
   * @param radius 半径
   */
  setCircleCoords(center: GeoPoint, radius: number): void {
    // 参数验证
    if (!center) {
      throw new Error('Center point cannot be null or undefined');
    }
    if (typeof radius !== 'number' || isNaN(radius)) {
      throw new Error('Radius must be a valid number');
    }
    if (radius < 0) {
      throw new Error('Radius must be non-negative');
    }
    
    this.center = center;
    this.radius = radius;
    this.clearCache();
    this.notifyUpdate();
  }

  /**
   * 设置坐标（兼容接口）
   * @param _x x坐标
   * @param _y y坐标
   * @param _z z坐标
   */
  setCoords(_x: number, _y: number, _z?: number): void {
    // 对于圆，这个方法不适用，保留接口兼容性
  }

  /**
   * 从三点创建圆
   * @param p1 点1
   * @param p2 点2
   * @param p3 点3
   * @param construction 构造管理器
   */
  setFromThreePoints(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: Construction): void {
    // 参数验证
    if (!p1 || !p2 || !p3) {
      throw new Error('All points must be provided');
    }
    if (!construction) {
      throw new Error('Construction cannot be null or undefined');
    }
    
    // 计算圆心：三角形的外心
    const x1 = p1.getX();
    const y1 = p1.getY();
    const x2 = p2.getX();
    const y2 = p2.getY();
    const x3 = p3.getX();
    const y3 = p3.getY();

    // 计算外心坐标的系数
    const a = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
    const b = (x1 * x1 + y1 * y1) * (y3 - y2) + (x2 * x2 + y2 * y2) * (y1 - y3) + (x3 * x3 + y3 * y3) * (y2 - y1);
    const c = (x1 * x1 + y1 * y1) * (x2 - x3) + (x2 * x2 + y2 * y2) * (x3 - x1) + (x3 * x3 + y3 * y3) * (x1 - x2);

    // 检查三点是否共线
    if (Math.abs(a) < 1e-10) {
      throw new Error('Three points are collinear, cannot form a circle');
    }

    // 计算圆心坐标和半径
    const centerX = -b / (2 * a);
    const centerY = -c / (2 * a);
    this.center = new GeoPoint(construction, centerX, centerY);
    this.radius = Math.sqrt((centerX - x1) * (centerX - x1) + (centerY - y1) * (centerY - y1));
    this.clearCache();
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

  // ========== 几何计算 ==========

  /**
   * 计算面积
   * @returns 面积
   */
  getArea(): number {
    if (this.cachedArea === null) {
      this.cachedArea = Math.PI * this.radius * this.radius;
    }
    return this.cachedArea;
  }

  /**
   * 计算周长
   * @returns 周长
   */
  getCircumference(): number {
    if (this.cachedCircumference === null) {
      this.cachedCircumference = 2 * Math.PI * this.radius;
    }
    return this.cachedCircumference;
  }

  /**
   * 检查点是否在圆内
   * @param point 点
   * @returns 是否在圆内
   */
  contains(point: GeoPoint): boolean {
    // 计算点到圆心的距离的平方
    const dx = point.getX() - this.center.getX();
    const dy = point.getY() - this.center.getY();
    const distanceSq = dx * dx + dy * dy;
    
    // 检查距离是否小于等于半径（考虑浮点误差）
    return distanceSq <= this.radius * this.radius + 1e-10;
  }

  // ========== Path 接口实现 ==========

  /**
   * 检查是否为路径
   * @returns 总是返回true
   */
  isPath(): true {
    return true;
  }

  /**
   * 获取路径类型
   * @returns 路径类型，返回'circle'
   */
  getPathType(): string {
    return 'circle';
  }

  /**
   * 检查是否为闭合路径
   * @returns 总是返回true，因为圆是闭合路径
   */
  isClosedPath(): boolean {
    return true;
  }

  /**
   * 检查点是否在路径上（圆周上）
   * @param x x坐标
   * @param y y坐标
   * @param tolerance 容差，默认值为1e-6
   * @returns 是否在路径上
   */
  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    // 计算点到圆心的距离
    const dx = x - this.center.getX();
    const dy = y - this.center.getY();
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 检查距离是否接近半径
    return Math.abs(distance - this.radius) < tolerance;
  }

  /**
   * 处理点在路径上的变化
   * @param point 点对象
   */
  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    // 计算点到圆心的距离
    const x = point.getX();
    const y = point.getY();
    const dx = x - this.center.getX();
    const dy = y - this.center.getY();
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 如果点在圆心，默认放到右侧
    if (distance < 1e-10) {
      point.setCoords(this.center.getX() + this.radius, this.center.getY());
      return;
    }
    
    // 将点投影到圆周上
    const scale = this.radius / distance;
    const newX = this.center.getX() + dx * scale;
    const newY = this.center.getY() + dy * scale;
    point.setCoords(newX, newY);
  }

  /**
   * 处理路径本身的变化
   * @param point 点对象
   */
  pathChanged(_point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    // 路径变化时的处理
    this.notifyUpdate();
  }

  /**
   * 获取点在路径上的参数
   * @param x x坐标
   * @param y y坐标
   * @returns 路径参数
   */
  getPathParameterForPoint(x: number, y: number): PathParameter {
    // 计算点相对于圆心的角度
    const dx = x - this.center.getX();
    const dy = y - this.center.getY();
    let angle = Math.atan2(dy, dx);
    
    // 将角度转换为[0, 2π)范围
    if (angle < 0) {
      angle += 2 * Math.PI;
    }
    
    // 创建路径参数，将角度归一化到[0, 1)范围
    const param = new PathParameter();
    param.t = angle / (2 * Math.PI);
    return param;
  }

  /**
   * 根据路径参数获取点
   * @param param 路径参数
   * @returns 点坐标
   */
  getPointFromPathParameter(param: PathParameter): PointCoordinates {
    // 将参数转换为角度
    const angle = param.t * 2 * Math.PI;
    
    // 计算点坐标
    return {
      x: this.center.getX() + this.radius * Math.cos(angle),
      y: this.center.getY() + this.radius * Math.sin(angle)
    };
  }

  /**
   * 获取路径参数的最小值
   * @returns 最小值，返回0
   */
  getMinParameter(): number {
    return 0;
  }

  /**
   * 获取路径参数的最大值
   * @returns 最大值，返回1
   */
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
  getTangentDirection(t: number): Vector {
    // 将参数转换为角度
    const angle = t * 2 * Math.PI;
    
    // 圆的切线方向是垂直于半径的方向
    return { x: -Math.sin(angle), y: Math.cos(angle) };
  }

  // ========== 几何变换 ==========

  /**
   * 平移圆
   * @param dx x方向平移量
   * @param dy y方向平移量
   */
  translate(dx: number, dy: number): void {
    // 参数验证
    if (typeof dx !== 'number' || isNaN(dx)) {
      throw new Error('dx must be a valid number');
    }
    if (typeof dy !== 'number' || isNaN(dy)) {
      throw new Error('dy must be a valid number');
    }
    
    // 平移圆心
    const newX = this.center.getX() + dx;
    const newY = this.center.getY() + dy;
    this.center = new GeoPoint(this.construction, newX, newY);
    this.clearCache();
    this.notifyUpdate();
  }

  /**
   * 绕指定点旋转圆
   * @param angle 旋转角度（弧度）
   * @param pivot 旋转中心点
   */
  rotate(angle: number, pivot: GeoPoint): void {
    // 参数验证
    if (typeof angle !== 'number' || isNaN(angle)) {
      throw new Error('Angle must be a valid number');
    }
    if (!pivot) {
      throw new Error('Pivot point cannot be null or undefined');
    }
    
    // 计算旋转后的圆心坐标
    const cx = this.center.getX();
    const cy = this.center.getY();
    const px = pivot.getX();
    const py = pivot.getY();
    
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    
    const newX = px + (cx - px) * cosAngle - (cy - py) * sinAngle;
    const newY = py + (cx - px) * sinAngle + (cy - py) * cosAngle;
    
    this.center = new GeoPoint(this.construction, newX, newY);
    this.clearCache();
    this.notifyUpdate();
  }

  /**
   * 以指定点为中心缩放圆
   * @param scale 缩放比例
   * @param center 缩放中心点
   */
  scale(scale: number, center: GeoPoint): void {
    // 参数验证
    if (typeof scale !== 'number' || isNaN(scale)) {
      throw new Error('Scale must be a valid number');
    }
    if (scale <= 0) {
      throw new Error('Scale must be positive');
    }
    if (!center) {
      throw new Error('Center point cannot be null or undefined');
    }
    
    // 计算缩放后的半径
    const newRadius = this.radius * scale;
    
    // 计算缩放后的圆心坐标
    const cx = this.center.getX();
    const cy = this.center.getY();
    const px = center.getX();
    const py = center.getY();
    
    const newX = px + (cx - px) * scale;
    const newY = py + (cy - py) * scale;
    
    this.center = new GeoPoint(this.construction, newX, newY);
    this.radius = newRadius;
    this.clearCache();
    this.notifyUpdate();
  }

  // ========== 辅助方法 ==========

  /**
   * 获取圆的标准方程
   * @returns 标准方程字符串
   */
  getStandardEquation(): string {
    const cx = this.center.getX();
    const cy = this.center.getY();
    const r = this.radius;
    return `(x - ${cx.toFixed(2)})² + (y - ${cy.toFixed(2)})² = ${(r * r).toFixed(2)}`;
  }

  /**
   * 检查圆是否与另一个圆相交
   * @param other 另一个圆
   * @returns 是否相交
   */
  intersects(other: GeoCircle): boolean {
    // 参数验证
    if (!other) {
      throw new Error('Other circle cannot be null or undefined');
    }
    
    // 计算两圆心之间的距离
    const dx = this.center.getX() - other.getCenter().getX();
    const dy = this.center.getY() - other.getCenter().getY();
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 计算半径之和和半径之差的绝对值
    const sumRadius = this.radius + other.getRadius();
    const diffRadius = Math.abs(this.radius - other.getRadius());
    
    // 两圆相交的条件：|r1 - r2| < d < r1 + r2
    return distance < sumRadius && distance > diffRadius;
  }

  /**
   * 检查圆是否与另一个圆相切
   * @param other 另一个圆
   * @returns 是否相切
   */
  isTangentTo(other: GeoCircle): boolean {
    // 参数验证
    if (!other) {
      throw new Error('Other circle cannot be null or undefined');
    }
    
    // 计算两圆心之间的距离
    const dx = this.center.getX() - other.getCenter().getX();
    const dy = this.center.getY() - other.getCenter().getY();
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 计算半径之和和半径之差的绝对值
    const sumRadius = this.radius + other.getRadius();
    const diffRadius = Math.abs(this.radius - other.getRadius());
    
    // 两圆相切的条件：d == r1 + r2 或 d == |r1 - r2|
    return Math.abs(distance - sumRadius) < 1e-10 || Math.abs(distance - diffRadius) < 1e-10;
  }

  /**
   * 计算圆与另一个圆的交点
   * @param other 另一个圆
   * @returns 交点数组，如果没有交点则返回空数组
   */
  getIntersectionPoints(other: GeoCircle): PointCoordinates[] {
    // 参数验证
    if (!other) {
      throw new Error('Other circle cannot be null or undefined');
    }
    
    // 计算两圆心之间的距离和向量
    const dx = other.getCenter().getX() - this.center.getX();
    const dy = other.getCenter().getY() - this.center.getY();
    const distance = Math.sqrt(dx * dx + dy * dy);
    const r1 = this.radius;
    const r2 = other.getRadius();
    
    // 检查是否有交点
    if (distance > r1 + r2 || distance < Math.abs(r1 - r2)) {
      return [];
    }
    
    // 检查是否重合
    if (distance < 1e-10 && Math.abs(r1 - r2) < 1e-10) {
      return [];
    }
    
    // 计算交点
    const a = (r1 * r1 - r2 * r2 + distance * distance) / (2 * distance);
    const h = Math.sqrt(r1 * r1 - a * a);
    
    const xm = this.center.getX() + a * dx / distance;
    const ym = this.center.getY() + a * dy / distance;
    
    const xs1 = xm + h * dy / distance;
    const ys1 = ym - h * dx / distance;
    const xs2 = xm - h * dy / distance;
    const ys2 = ym + h * dx / distance;
    
    return [
      { x: xs1, y: ys1 },
      { x: xs2, y: ys2 }
    ];
  }
}


