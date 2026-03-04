import { Construction } from '../Construction';
import { GeoElementBase } from './GeoElements';
import { GeoPoint } from './GeoPoint';
import { Path, PathParameter } from '../Path';

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
    super(construction);
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
    const n = this.vertices.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const x1 = this.vertices[i].getX();
      const y1 = this.vertices[i].getY();
      const x2 = this.vertices[j].getX();
      const y2 = this.vertices[j].getY();
      
      // 计算点到线段的距离
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len < 1e-10) {
        // 线段长度为0，检查点是否与端点重合
        const dist = Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
        if (dist < tolerance) return true;
        continue;
      }
      
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (len * len)));
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
      
      if (dist < tolerance) return true;
    }
    return false;
  }

  pointChanged(point: any): void {
    const param = this.getPathParameterForPoint(point.x, point.y);
    const pos = this.getPointFromPathParameter(param);
    point.x = pos.x;
    point.y = pos.y;
  }

  pathChanged(_point: any): void {
    // 多边形本身变化时的处理
  }

  getPathParameterForPoint(x: number, y: number): PathParameter {
    // 找到最近的边上的位置
    const perimeter = this.getPerimeter();
    if (perimeter < 1e-10) {
      const param = new PathParameter();
      param.t = 0;
      // 移除PathType设置，使用字符串类型的pathType
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
    
    const param = new PathParameter();
    param.t = closestT;
    // 移除PathType设置，使用字符串类型的pathType
    return param;
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    const perimeter = this.getPerimeter();
    if (perimeter < 1e-10) {
      return { x: this.vertices[0].getX(), y: this.vertices[0].getY() };
    }
    
    const targetDist = param.t * perimeter;
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
    const param1 = new PathParameter();
    param1.t = t;
    // 移除PathType设置，使用字符串类型的pathType
    const pos = this.getPointFromPathParameter(param1);
    const delta = 0.001;
    const param2 = new PathParameter();
    param2.t = (t + delta) % 1;
    // 移除PathType设置，使用字符串类型的pathType
    const pos2 = this.getPointFromPathParameter(param2);
    
    const dx = pos2.x - pos.x;
    const dy = pos2.y - pos.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len < 1e-10) {
      return { x: 1, y: 0 };
    }
    
    return { x: dx / len, y: dy / len };
  }
}