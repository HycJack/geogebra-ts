/**
 * 几何元素实现
 * 对应 Java 版本的 kernel/geos 包
 */
import { ConstructionElement, Construction } from '../../types';
import { AlgoElement } from '../algos/AlgoElement';
import { IGeoElement } from './GeoElement';
import { Path, Pathable } from '../Path';
import { PathParameter } from '../PathParameter';

/**
 * 几何元素基类
 * 实现了 IGeoElement 接口
 */
export class GeoElementBase implements IGeoElement, ConstructionElement {
  label: string = '';
  private defined: boolean = true;
  private _parentAlgorithm: AlgoElement | null = null;
  private _constructionIndex: number;
  private dependents: AlgoElement[] = []; // 依赖此元素的算法列表
  protected construction: Construction;
  private _type: string = 'unknown';
  private _parentIds: string[] = [];

  /**
   * 是否为独立元素（没有父算法）
   */
  get isIndependent(): boolean {
    return this._parentAlgorithm === null;
  }

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param type 几何元素类型
   */
  constructor(construction: Construction, type: string = 'unknown') {
    this.construction = construction;
    this._constructionIndex = Math.floor(Math.random() * 1000000);
    this._type = type;
  }

  /**
   * 获取几何元素类型
   */
  get type(): string {
    return this._type;
  }

  /**
   * 设置几何元素类型
   */
  set type(value: string) {
    this._type = value;
  }

  /**
   * 获取父元素ID列表
   */
  get parentIds(): string[] {
    return this._parentIds;
  }

  /**
   * 设置父元素ID列表
   */
  set parentIds(value: string[]) {
    this._parentIds = value;
  }

  /**
   * 获取父算法
   */
  get parentAlgorithm(): AlgoElement | null {
    return this._parentAlgorithm;
  }

  /**
   * 设置父算法
   */
  set parentAlgorithm(value: AlgoElement | null) {
    this._parentAlgorithm = value;
  }

  /**
   * 获取构造索引
   * @returns 构造索引
   */
  getConstructionIndex(): number {
    return this._constructionIndex;
  }

  /**
   * 获取构造索引属性（用于接口匹配）
   */
  get constructionIndex(): number {
    return this._constructionIndex;
  }

  /**
   * 设置构造索引属性（用于接口匹配）
   */
  set constructionIndex(value: number) {
    this._constructionIndex = value;
  }

  /**
   * 检查元素是否定义
   * @returns 是否定义
   */
  isDefined(): boolean {
    return this.defined;
  }

  /**
   * 设置元素为未定义
   */
  setUndefined(): void {
    this.defined = false;
  }

  /**
   * 获取父算法
   * @returns 父算法或 null
   */
  getParentAlgorithm(): AlgoElement | null {
    return this._parentAlgorithm;
  }

  /**
   * 设置父算法
   * @param algo 父算法
   */
  setParentAlgorithm(algo: AlgoElement): void {
    this._parentAlgorithm = algo;
  }

  /**
   * 添加依赖此元素的算法
   * @param algo 依赖的算法
   */
  addDependent(algo: AlgoElement): void {
    if (!this.dependents.includes(algo)) {
      this.dependents.push(algo);
    }
  }

  /**
   * 移除依赖此元素的算法
   * @param algo 依赖的算法
   */
  removeDependent(algo: AlgoElement): void {
    const index = this.dependents.indexOf(algo);
    if (index > -1) {
      this.dependents.splice(index, 1);
    }
  }

  /**
   * 获取所有依赖此元素的算法
   * @returns 依赖算法列表
   */
  getDependents(): AlgoElement[] {
    return [...this.dependents];
  }

  /**
   * 更新依赖此元素的对象
   * 当此元素改变时，通知所有依赖它的算法进行更新
   */
  updateDependentObjects(): void {
    // 复制列表以避免在迭代过程中修改
    const deps = [...this.dependents];
    for (const dependent of deps) {
      dependent.update();
    }
  }

  /**
   * 获取标签
   * @returns 标签
   */
  getLabel(): string {
    return this.label;
  }

  /**
   * 设置标签
   * @param label 标签
   */
  setLabel(label: string): void {
    this.label = label;
  }

  /**
   * 更新方法
   * 子类可以重写此方法来实现特定的更新逻辑
   */
  update(): void {
    // 子类可以重写此方法
  }

  /**
   * 通知构造管理器此元素已更新
   */
  notifyUpdate(): void {
    this.updateDependentObjects();
  }
}

/**
 * 点类
 * 实现了 Pathable 接口，可以被约束到路径上
 */
export class GeoPoint extends GeoElementBase implements Pathable {
  private x: number;
  private y: number;
  private z: number;
  private path: Path | null = null;
  private pathParam: PathParameter = new PathParameter(0);

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param x x 坐标
   * @param y y 坐标
   * @param z z 坐标（齐次坐标）
   */
  constructor(construction: Construction, x: number = 0, y: number = 0, z: number = 1) {
    super(construction, 'point');
    this.x = x;
    this.y = y;
    this.z = z;
    
    // 自动分配标签
    const label = construction.generateLabel('point');
    this.setLabel(label);
    construction.addGeoElement(this);
  }

  /**
   * 设置坐标
   * @param x x 坐标
   * @param y y 坐标
   * @param z z 坐标（齐次坐标）
   */
  setCoords(x: number, y: number, z: number = 1): void {
    this.x = x;
    this.y = y;
    this.z = z;
    // 坐标改变时通知依赖者
    this.notifyUpdate();
  }

  /**
   * 获取 x 坐标
   * @returns x 坐标
   */
  getX(): number {
    return this.x / this.z;
  }

  /**
   * 获取 y 坐标
   * @returns y 坐标
   */
  getY(): number {
    return this.y / this.z;
  }

  /**
   * 获取齐次 x 坐标
   * @returns 齐次 x 坐标
   */
  getInhomX(): number {
    return this.x;
  }

  /**
   * 获取齐次 y 坐标
   * @returns 齐次 y 坐标
   */
  getInhomY(): number {
    return this.y;
  }

  /**
   * 获取齐次 z 坐标
   * @returns 齐次 z 坐标
   */
  getInhomZ(): number {
    return this.z;
  }

  /**
   * 检查点是否与另一个点相同
   * @param other 另一个点
   * @returns 是否相同
   */
  equals(other: GeoPoint): boolean {
    return Math.abs(this.x - other.x) < 1e-10 && 
           Math.abs(this.y - other.y) < 1e-10 && 
           Math.abs(this.z - other.z) < 1e-10;
  }

  // ========== Pathable 接口实现 ==========

  /**
   * 获取路径
   * @returns 当前约束的路径或null
   */
  getPath(): Path | null {
    return this.path;
  }

  /**
   * 设置路径
   * @param path 要约束到的路径
   */
  setPath(path: Path | null): void {
    this.path = path;
    if (path) {
      // 将当前点投影到路径上
      const param = path.getPathParameterForPoint(this.getX(), this.getY());
      const pos = path.getPointFromPathParameter(param);
      this.setCoords(pos.x, pos.y);
    }
  }

  /**
   * 获取路径参数
   * @returns 路径参数
   */
  getPathParameter(): PathParameter {
    if (this.path) {
      this.pathParam = this.path.getPathParameterForPoint(this.getX(), this.getY());
    }
    return this.pathParam;
  }

  /**
   * 设置路径参数
   * @param param 路径参数
   */
  setPathParameter(param: PathParameter): void {
    this.pathParam = param;
    if (this.path) {
      const pos = this.path.getPointFromPathParameter(param);
      this.setCoords(pos.x, pos.y);
    }
  }

  /**
   * 是否被约束到路径
   * @returns 是否有路径约束
   */
  hasPath(): boolean {
    return this.path !== null;
  }

  /**
   * 移除路径约束
   */
  removePath(): void {
    this.path = null;
    this.pathParam = new PathParameter(0);
  }

  /**
   * 当点被拖动时更新坐标
   * 如果有路径约束，会限制在路径上
   * @param x 目标x坐标
   * @param y 目标y坐标
   */
  updateCoords(x: number, y: number): void {
    if (this.path) {
      // 先设置坐标
      this.x = x;
      this.y = y;
      this.z = 1;
      // 然后让路径限制它
      const pointElement = { x, y } as any;
      this.path.pointChanged(pointElement);
      this.setCoords(pointElement.x, pointElement.y);
    } else {
      this.setCoords(x, y);
    }
  }
}

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
    super(construction, 'segment');
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

  /**
   * 获取路径上的点
   * @param t 路径参数 [0, 1]
   * @returns 点坐标
   */
  getPointOnPath(t: number): { x: number; y: number } {
    const x1 = this.startPoint.getX();
    const y1 = this.startPoint.getY();
    const x2 = this.endPoint.getX();
    const y2 = this.endPoint.getY();
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  /**
   * 获取点在路径上的参数
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @returns 路径参数
   */
  getPathParameter(x: number, y: number): PathParameter {
    const x1 = this.startPoint.getX();
    const y1 = this.startPoint.getY();
    const x2 = this.endPoint.getX();
    const y2 = this.endPoint.getY();
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq < 1e-10) {
      const param = new PathParameter(0);
      return param;
    }
    
    // 投影参数
    const t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
    const param = new PathParameter(Math.max(0, Math.min(1, t)));
    return param;
  }

  /**
   * 当点被拖动时，限制其在线段上
   * @param point 需要约束的点
   */
  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    const param = this.getPathParameter(point.getX(), point.getY());
    const pos = this.getPointOnPath(param.t);
    point.setCoords(pos.x, pos.y);
  }

  /**
   * 获取路径参数（Path接口方法）
   * @param x x坐标
   * @param y y坐标
   * @returns 路径参数
   */
  getPathParameterForPoint(x: number, y: number): PathParameter {
    return this.getPathParameter(x, y);
  }

  /**
   * 根据路径参数获取点（Path接口方法）
   * @param param 路径参数
   * @returns 点坐标
   */
  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    return this.getPointOnPath(param.t);
  }

  /**
   * 路径改变时的处理
   * @param point 点
   */
  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    // 线段改变时，点的位置可能需要重新计算
    this.pointChanged(point);
  }

  /**
   * 线段不是闭合路径
   * @returns false
   */
  isClosedPath(): boolean {
    return false;
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

  /**
   * 检查点是否在路径上
   * @param x x坐标
   * @param y y坐标
   * @param tolerance 容差
   * @returns 是否在路径上
   */
  isOnPath(x: number, y: number, tolerance: number = 1e-10): boolean {
    // 首先检查是否在线段所在的直线上
    const lineDistance = Math.abs(this.a * x + this.b * y + this.c) / Math.sqrt(this.a * this.a + this.b * this.b);
    if (lineDistance > tolerance) {
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
    
    return x >= minX - tolerance && x <= maxX + tolerance && y >= minY - tolerance && y <= maxY + tolerance;
  }

  /**
   * 获取路径类型
   * @returns 路径类型
   */
  getPathType(): string {
    return 'segment';
  }

  /**
   * 获取最小参数
   * @returns 最小参数
   */
  getMinParameter(): number {
    return 0;
  }

  /**
   * 获取最大参数
   * @returns 最大参数
   */
  getMaxParameter(): number {
    return 1;
  }

  /**
   * 检查是否是路径
   * @returns true
   */
  isPath(): true {
    return true;
  }
}

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
    super(construction, 'line');
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

  /**
   * 获取路径上的点
   * @param t 路径参数
   * @returns 点坐标
   */
  getPointOnPath(t: number): { x: number; y: number } {
    // 对于无限直线，我们使用一个参考点加上方向向量
    // 这里简化处理：返回直线上的一点
    if (Math.abs(this.b) > 1e-10) {
      // 不是垂直线
      const x = t * 100; // 使用100作为缩放因子
      const y = -(this.a * x + this.c) / this.b;
      return { x, y };
    } else {
      // 垂直线
      const x = -this.c / this.a;
      const y = t * 100;
      return { x, y };
    }
  }

  /**
   * 获取点在路径上的参数
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @returns 路径参数
   */
  getPathParameter(x: number, y: number): PathParameter {
    // 对于无限直线，返回投影位置
    if (Math.abs(this.b) > 1e-10) {
      const param = new PathParameter(x / 100);
      return param;
    } else {
      const param = new PathParameter(y / 100);
      return param;
    }
  }

  /**
   * 当点被拖动时，限制其在直线上
   * 计算点到直线的投影
   * @param point 需要约束的点
   */
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

  /**
   * 获取路径参数
   * @param x x坐标
   * @param y y坐标
   * @returns 路径参数
   */
  getPathParameterForPoint(x: number, y: number): PathParameter {
    // 对于无限直线，返回投影位置
    if (Math.abs(this.b) > 1e-10) {
      const param = new PathParameter(x / 100);
      return param;
    } else {
      const param = new PathParameter(y / 100);
      return param;
    }
  }

  /**
   * 根据路径参数获取点
   * @param param 路径参数
   * @returns 点坐标
   */
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

  /**
   * 检查点是否在路径上
   * @param x x坐标
   * @param y y坐标
   * @param tolerance 容差
   * @returns 是否在路径上
   */
  isOnPath(x: number, y: number, tolerance: number = 1e-10): boolean {
    const distance = Math.abs(this.a * x + this.b * y + this.c) / Math.sqrt(this.a * this.a + this.b * this.b);
    return distance < tolerance;
  }

  /**
   * 路径改变时的处理
   * @param point 点
   */
  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    // 直线改变时，点的位置可能需要重新计算
    this.pointChanged(point);
  }

  /**
   * 获取路径类型
   * @returns 路径类型
   */
  getPathType(): string {
    return 'line';
  }

  /**
   * 获取最小参数
   * @returns 最小参数
   */
  getMinParameter(): number {
    return -Infinity;
  }

  /**
   * 获取最大参数
   * @returns 最大参数
   */
  getMaxParameter(): number {
    return Infinity;
  }

  /**
   * 检查是否是路径
   * @returns true
   */
  isPath(): true {
    return true;
  }

  /**
   * 直线不是闭合路径
   * @returns false
   */
  isClosedPath(): boolean {
    return false;
  }

  /**
   * 获取路径长度（无限直线返回一个很大的数）
   * @returns 长度
   */
  getPathLength(): number {
    return Number.MAX_VALUE;
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
    super(construction, 'circle');
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

  /**
   * 实现Path接口
   */
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
    const dist = Math.sqrt((x - this.center.getX()) ** 2 + (y - this.center.getY()) ** 2);
    return Math.abs(dist - this.radius) < tolerance;
  }

  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    this.pointChanged(point);
  }

  /**
   * 获取路径上的点
   * @param t 路径参数 [0, 1]，0和1对应同一个点（闭合）
   * @returns 点坐标
   */
  getPointOnPath(t: number): { x: number; y: number } {
    const angle = t * 2 * Math.PI;
    return {
      x: this.center.getX() + this.radius * Math.cos(angle),
      y: this.center.getY() + this.radius * Math.sin(angle)
    };
  }

  /**
   * 获取点在路径上的参数
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @returns 路径参数
   */
  getPathParameter(x: number, y: number): PathParameter {
    const dx = x - this.center.getX();
    const dy = y - this.center.getY();
    let angle = Math.atan2(dy, dx);
    if (angle < 0) {
      angle += 2 * Math.PI;
    }
    const param = new PathParameter(angle / (2 * Math.PI));
    return param;
  }

  /**
   * 实现Path接口的方法
   */
  getPathParameterForPoint(x: number, y: number): PathParameter {
    return this.getPathParameter(x, y);
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    return this.getPointOnPath(param.t);
  }

  getMinParameter(): number {
    return 0;
  }

  getMaxParameter(): number {
    return 1;
  }

  /**
   * 当点被拖动时，限制其在圆周上
   * @param point 需要约束的点
   */
  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    const dx = point.getX() - this.center.getX();
    const dy = point.getY() - this.center.getY();
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 1e-10) {
      // 如果点在圆心，默认放到右侧
      point.setCoords(this.center.getX() + this.radius, this.center.getY());
      return;
    }
    
    // 将点投影到圆周上
    const scale = this.radius / distance;
    const xNew = this.center.getX() + dx * scale;
    const yNew = this.center.getY() + dy * scale;
    
    point.setCoords(xNew, yNew);
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

/**
 * 多边形类
 * 实现了 Path 接口（多边形的边界）
 */
export class GeoPolygon extends GeoElementBase implements Path {
  private vertices: GeoPoint[];

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param vertices 顶点数组
   */
  constructor(construction: Construction, vertices: GeoPoint[]) {
    super(construction, 'polygon');
    this.vertices = vertices;
    
    // 自动分配标签
    const label = construction.generateLabel('polygon');
    this.setLabel(label);
    construction.addGeoElement(this);
  }

  /**
   * 设置顶点
   * @param vertices 顶点数组
   */
  setVertices(vertices: GeoPoint[]): void {
    this.vertices = vertices;
    this.notifyUpdate();
  }

  /**
   * 获取顶点
   * @returns 顶点数组
   */
  getVertices(): GeoPoint[] {
    return this.vertices;
  }

  /**
   * 计算面积
   * @returns 面积
   */
  getArea(): number {
    let area = 0;
    const n = this.vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const xi = this.vertices[i].getX();
      const yi = this.vertices[i].getY();
      const xj = this.vertices[j].getX();
      const yj = this.vertices[j].getY();
      area += xi * yj - xj * yi;
    }
    return Math.abs(area) / 2;
  }

  /**
   * 计算周长
   * @returns 周长
   */
  getPerimeter(): number {
    let perimeter = 0;
    const n = this.vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = this.vertices[j].getX() - this.vertices[i].getX();
      const dy = this.vertices[j].getY() - this.vertices[i].getY();
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
  }

  /**
   * 检查点是否在多边形内
   * @param point 点
   * @returns 是否在多边形内
   */
  contains(point: GeoPoint): boolean {
    let inside = false;
    const x = point.getX();
    const y = point.getY();
    const n = this.vertices.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.vertices[i].getX();
      const yi = this.vertices[i].getY();
      const xj = this.vertices[j].getX();
      const yj = this.vertices[j].getY();
      
      const intersect = ((yi > y) != (yj > y)) && 
                      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  // ========== Path 接口实现 ==========

  /**
   * 实现Path接口
   */
  isPath(): true {
    return true;
  }

  getPathType(): string {
    return 'polygon';
  }

  isClosedPath(): boolean {
    return true;
  }

  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    // 检查点是否在多边形的任何边上
    const n = this.vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const x1 = this.vertices[i].getX();
      const y1 = this.vertices[i].getY();
      const x2 = this.vertices[j].getX();
      const y2 = this.vertices[j].getY();
      
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len < 1e-10) {
        continue;
      }
      
      // 计算点到线段的投影
      const t = ((x - x1) * dx + (y - y1) * dy) / (len * len);
      const tClamped = Math.max(0, Math.min(1, t));
      const projX = x1 + tClamped * dx;
      const projY = y1 + tClamped * dy;
      const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
      
      if (dist < tolerance) {
        return true;
      }
    }
    
    return false;
  }

  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    const param = this.getPathParameterForPoint(point.getX(), point.getY());
    const pos = this.getPointFromPathParameter(param);
    point.setCoords(pos.x, pos.y);
  }

  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    this.pointChanged(point);
  }

  /**
   * 获取路径上的点（多边形边界）
   * @param t 路径参数 [0, 1]
   * @returns 点坐标
   */
  getPointOnPath(t: number): { x: number; y: number } {
    const perimeter = this.getPerimeter();
    if (perimeter < 1e-10) {
      return { x: this.vertices[0].getX(), y: this.vertices[0].getY() };
    }
    
    const targetDist = t * perimeter;
    let currentDist = 0;
    const n = this.vertices.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = this.vertices[j].getX() - this.vertices[i].getX();
      const dy = this.vertices[j].getY() - this.vertices[i].getY();
      const segLen = Math.sqrt(dx * dx + dy * dy);
      
      if (currentDist + segLen >= targetDist) {
        const segT = (targetDist - currentDist) / segLen;
        return {
          x: this.vertices[i].getX() + segT * dx,
          y: this.vertices[i].getY() + segT * dy
        };
      }
      currentDist += segLen;
    }
    
    // 返回第一个点
    return { x: this.vertices[0].getX(), y: this.vertices[0].getY() };
  }

  /**
   * 获取点在路径上的参数
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @returns 路径参数
   */
  getPathParameter(x: number, y: number): PathParameter {
    // 找到最近的边上的位置
    const perimeter = this.getPerimeter();
    if (perimeter < 1e-10) {
      const param = new PathParameter(0);
      return param;
    }
    
    let minDist = Number.MAX_VALUE;
    let closestT = 0;
    let currentDist = 0;
    const n = this.vertices.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const x1 = this.vertices[i].getX();
      const y1 = this.vertices[i].getY();
      const x2 = this.vertices[j].getX();
      const y2 = this.vertices[j].getY();
      
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      
      if (lenSq < 1e-10) continue;
      
      // 投影参数
      let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
      
      if (dist < minDist) {
        minDist = dist;
        const segLen = Math.sqrt(lenSq);
        closestT = (currentDist + t * segLen) / perimeter;
      }
      currentDist += Math.sqrt(lenSq);
    }
    
    const param = new PathParameter(closestT);
    return param;
  }

  /**
   * 实现Path接口的方法
   */
  getPathParameterForPoint(x: number, y: number): PathParameter {
    return this.getPathParameter(x, y);
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    return this.getPointOnPath(param.t);
  }

  getMinParameter(): number {
    return 0;
  }

  getMaxParameter(): number {
    return 1;
  }



  /**
   * 获取路径长度（周长）
   * @returns 周长
   */
  getPathLength(): number {
    return this.getPerimeter();
  }

  /**
   * 获取路径上某点的切线方向
   * @param t 路径参数
   * @returns 切线向量
   */
  getTangentDirection(t: number): { x: number; y: number } {
    const pos = this.getPointOnPath(t);
    const delta = 0.001;
    const pos2 = this.getPointOnPath((t + delta) % 1);
    
    const dx = pos2.x - pos.x;
    const dy = pos2.y - pos.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len < 1e-10) {
      return { x: 1, y: 0 };
    }
    
    return { x: dx / len, y: dy / len };
  }
}

/**
 * 向量类
 */
export class GeoVector extends GeoElementBase {
  private x: number;
  private y: number;

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param x x 分量
   * @param y y 分量
   */
  constructor(construction: Construction, x: number = 0, y: number = 0) {
    super(construction);
    this.x = x;
    this.y = y;
    
    // 自动分配标签
    const label = construction.generateLabel('vector');
    this.setLabel(label);
    construction.addGeoElement(this);
  }

  /**
   * 从两点创建向量
   * @param start 起点
   * @param end 终点
   */
  setFromPoints(start: GeoPoint, end: GeoPoint): void {
    this.x = end.getX() - start.getX();
    this.y = end.getY() - start.getY();
  }

  /**
   * 设置分量
   * @param x x 分量
   * @param y y 分量
   */
  setCoords(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.notifyUpdate();
  }

  /**
   * 获取 x 分量
   * @returns x 分量
   */
  getX(): number {
    return this.x;
  }

  /**
   * 获取 y 分量
   * @returns y 分量
   */
  getY(): number {
    return this.y;
  }

  /**
   * 计算长度
   * @returns 长度
   */
  getLength(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 计算单位向量
   * @returns 单位向量
   */
  normalize(construction: Construction): GeoVector {
    const length = this.getLength();
    if (length < 1e-10) {
      return new GeoVector(construction, 0, 0);
    }
    return new GeoVector(construction, this.x / length, this.y / length);
  }

  /**
   * 向量加法
   * @param other 另一个向量
   * @returns 和向量
   */
  add(other: GeoVector, construction: Construction): GeoVector {
    return new GeoVector(construction, this.x + other.x, this.y + other.y);
  }

  /**
   * 向量减法
   * @param other 另一个向量
   * @returns 差向量
   */
  subtract(other: GeoVector, construction: Construction): GeoVector {
    return new GeoVector(construction, this.x - other.x, this.y - other.y);
  }

  /**
   * 向量点积
   * @param other 另一个向量
   * @returns 点积
   */
  dot(other: GeoVector): number {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * 向量叉积
   * @param other 另一个向量
   * @returns 叉积
   */
  cross(other: GeoVector): number {
    return this.x * other.y - this.y * other.x;
  }

  /**
   * 向量缩放
   * @param scalar 标量
   * @returns 缩放后的向量
   */
  scale(scalar: number, construction: Construction): GeoVector {
    return new GeoVector(construction, this.x * scalar, this.y * scalar);
  }
}