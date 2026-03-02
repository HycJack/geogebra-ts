import { GeoPoint, GeoLine } from '../../types/GeoElements';

/**
 * 三角形相关算法
 * 提供三角形面积、重心、外心、内心、垂心等计算方法
 */
export class TriangleAlgorithms {

  /**
   * 计算三角形面积（使用海伦公式）
   * @param p1 顶点1
   * @param p2 顶点2
   * @param p3 顶点3
   * @returns 面积
   */
  static triangleArea(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint): number {
    const a = this.distance(p2, p3);
    const b = this.distance(p1, p3);
    const c = this.distance(p1, p2);
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
  }

  /**
   * 计算三角形重心
   * @param p1 顶点1
   * @param p2 顶点2
   * @param p3 顶点3
   * @param construction 构造管理器
   * @returns 重心
   */
  static triangleCentroid(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoPoint {
    const x = (p1.getX() + p2.getX() + p3.getX()) / 3;
    const y = (p1.getY() + p2.getY() + p3.getY()) / 3;
    return new GeoPoint(construction, x, y);
  }

  /**
   * 计算三角形外心
   * @param p1 顶点1
   * @param p2 顶点2
   * @param p3 顶点3
   * @param construction 构造管理器
   * @returns 外心
   */
  static triangleCircumcenter(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoPoint | null {
    const x1 = p1.getX();
    const y1 = p1.getY();
    const x2 = p2.getX();
    const y2 = p2.getY();
    const x3 = p3.getX();
    const y3 = p3.getY();

    const a = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
    if (Math.abs(a) < 1e-10) {
      return null;
    }

    const b = (x1 * x1 + y1 * y1) * (y3 - y2) + (x2 * x2 + y2 * y2) * (y1 - y3) + (x3 * x3 + y3 * y3) * (y2 - y1);
    const c = (x1 * x1 + y1 * y1) * (x2 - x3) + (x2 * x2 + y2 * y2) * (x3 - x1) + (x3 * x3 + y3 * y3) * (x1 - x2);

    const centerX = -b / (2 * a);
    const centerY = -c / (2 * a);
    return new GeoPoint(construction, centerX, centerY);
  }

  /**
   * 计算三角形内心
   * @param p1 顶点1
   * @param p2 顶点2
   * @param p3 顶点3
   * @param construction 构造管理器
   * @returns 内心
   */
  static triangleIncenter(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoPoint {
    const a = this.distance(p2, p3);
    const b = this.distance(p1, p3);
    const c = this.distance(p1, p2);
    const perimeter = a + b + c;

    const x = (a * p1.getX() + b * p2.getX() + c * p3.getX()) / perimeter;
    const y = (a * p1.getY() + b * p2.getY() + c * p3.getY()) / perimeter;
    return new GeoPoint(construction, x, y);
  }

  /**
   * 计算三角形垂心
   * @param p1 顶点1
   * @param p2 顶点2
   * @param p3 顶点3
   * @param construction 构造管理器
   * @returns 垂心
   */
  static triangleOrthocenter(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoPoint | null {
    const line1 = this.perpendicularLine(p1, p2, p3, construction);
    const line2 = this.perpendicularLine(p2, p1, p3, construction);
    
    if (!line1 || !line2) return null;
    return line1.intersect(line2, construction);
  }

  /**
   * 计算两点间距离
   * @param p1 点1
   * @param p2 点2
   * @returns 距离
   */
  private static distance(p1: GeoPoint, p2: GeoPoint): number {
    const dx = p2.getX() - p1.getX();
    const dy = p2.getY() - p1.getY();
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 创建过一点垂直于另两点连线的直线
   * @param point 点
   * @param lineStart 直线起点
   * @param lineEnd 直线终点
   * @param construction 构造管理器
   * @returns 垂线
   */
  private static perpendicularLine(point: GeoPoint, lineStart: GeoPoint, lineEnd: GeoPoint, construction: any): GeoLine | null {
    const dx = lineEnd.getX() - lineStart.getX();
    const dy = lineEnd.getY() - lineStart.getY();
    
    if (dx === 0 && dy === 0) {
      return null;
    }
    
    const perpX = -dy;
    const perpY = dx;
    
    const line = new GeoLine(construction);
    line.setFromPoints(
      point,
      new GeoPoint(construction, point.getX() + perpX, point.getY() + perpY)
    );
    
    return line;
  }
}
