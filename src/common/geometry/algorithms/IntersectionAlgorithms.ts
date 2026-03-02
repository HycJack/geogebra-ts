import { GeoPoint, GeoLine, GeoSegment, GeoCircle } from '../../types/GeoElements';

/**
 * 交点算法
 * 提供直线与圆、两圆、两线段的交点计算方法
 */
export class IntersectionAlgorithms {

  /**
   * 计算直线与圆的交点
   * @param line 直线
   * @param circle 圆
   * @param construction 构造管理器
   * @returns 交点数组（0、1或2个点）
   */
  static intersectLineCircle(line: GeoLine, circle: GeoCircle, construction: any): GeoPoint[] {
    const a = line.getA();
    const b = line.getB();
    const c = line.getC();
    
    const cx = circle.getCenter().getX();
    const cy = circle.getCenter().getY();
    const r = circle.getRadius();
    
    const denominator = a * a + b * b;
    const x0 = -(a * c) / denominator;
    const y0 = -(b * c) / denominator;
    
    const distToCenter = Math.sqrt((x0 - cx) * (x0 - cx) + (y0 - cy) * (y0 - cy));
    
    if (distToCenter > r + 1e-10) {
      return [];
    }
    
    if (Math.abs(distToCenter - r) < 1e-10) {
      return [new GeoPoint(construction, x0, y0)];
    }
    
    const dt = Math.sqrt(r * r - distToCenter * distToCenter);
    const scale = dt / Math.sqrt(denominator);
    
    const p1 = new GeoPoint(construction, x0 + b * scale, y0 - a * scale);
    const p2 = new GeoPoint(construction, x0 - b * scale, y0 + a * scale);
    
    return [p1, p2];
  }

  /**
   * 计算两圆的交点
   * @param circle1 圆1
   * @param circle2 圆2
   * @param construction 构造管理器
   * @returns 交点数组（0、1或2个点）
   */
  static intersectCircleCircle(circle1: GeoCircle, circle2: GeoCircle, construction: any): GeoPoint[] {
    const c1x = circle1.getCenter().getX();
    const c1y = circle1.getCenter().getY();
    const r1 = circle1.getRadius();
    
    const c2x = circle2.getCenter().getX();
    const c2y = circle2.getCenter().getY();
    const r2 = circle2.getRadius();
    
    const dx = c2x - c1x;
    const dy = c2y - c1y;
    const d = Math.sqrt(dx * dx + dy * dy);
    
    if (d > r1 + r2 + 1e-10 || d < Math.abs(r1 - r2) - 1e-10) {
      return [];
    }
    
    if (d < 1e-10 && Math.abs(r1 - r2) < 1e-10) {
      return [];
    }
    
    if (Math.abs(d - (r1 + r2)) < 1e-10 || Math.abs(d - Math.abs(r1 - r2)) < 1e-10) {
      const t = r1 / d;
      const x = c1x + t * dx;
      const y = c1y + t * dy;
      return [new GeoPoint(construction, x, y)];
    }
    
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);
    
    const px = c1x + a * dx / d;
    const py = c1y + a * dy / d;
    
    const p1 = new GeoPoint(construction, px + h * dy / d, py - h * dx / d);
    const p2 = new GeoPoint(construction, px - h * dy / d, py + h * dx / d);
    
    return [p1, p2];
  }

  /**
   * 计算两线段的交点
   * @param segment1 线段1
   * @param segment2 线段2
   * @param construction 构造管理器
   * @returns 交点或 null
   */
  static intersectSegments(segment1: GeoSegment, segment2: GeoSegment, construction: any): GeoPoint | null {
    const p1 = segment1.getStartPoint();
    const p2 = segment1.getEndPoint();
    const p3 = segment2.getStartPoint();
    const p4 = segment2.getEndPoint();
    
    const x1 = p1.getX();
    const y1 = p1.getY();
    const x2 = p2.getX();
    const y2 = p2.getY();
    const x3 = p3.getX();
    const y3 = p3.getY();
    const x4 = p4.getX();
    const y4 = p4.getY();
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    
    if (Math.abs(denom) < 1e-10) {
      return null;
    }
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      const x = x1 + t * (x2 - x1);
      const y = y1 + t * (y2 - y1);
      return new GeoPoint(construction, x, y);
    }
    
    return null;
  }
}
