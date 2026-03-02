import { GeoPoint, GeoSegment } from '../../types/GeoElements';

/**
 * 距离计算算法
 * 提供各种距离计算方法
 */
export class DistanceAlgorithms {

  /**
   * 计算两点间距离
   * @param p1 点1
   * @param p2 点2
   * @returns 距离
   */
  static distance(p1: GeoPoint, p2: GeoPoint): number {
    const dx = p2.getX() - p1.getX();
    const dy = p2.getY() - p1.getY();
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算点到线段的距离
   * @param point 点
   * @param segment 线段
   * @returns 距离
   */
  static distancePointToSegment(point: GeoPoint, segment: GeoSegment): number {
    const start = segment.getStartPoint();
    const end = segment.getEndPoint();
    
    const dx = end.getX() - start.getX();
    const dy = end.getY() - start.getY();
    
    if (dx === 0 && dy === 0) {
      return this.distance(point, start);
    }
    
    const t = ((point.getX() - start.getX()) * dx + (point.getY() - start.getY()) * dy) / (dx * dx + dy * dy);
    
    if (t < 0) {
      return this.distance(point, start);
    } else if (t > 1) {
      return this.distance(point, end);
    }
    
    const projectionX = start.getX() + t * dx;
    const projectionY = start.getY() + t * dy;
    const dx2 = point.getX() - projectionX;
    const dy2 = point.getY() - projectionY;
    return Math.sqrt(dx2 * dx2 + dy2 * dy2);
  }

  /**
   * 计算两线段间的最短距离
   * @param segment1 线段1
   * @param segment2 线段2
   * @returns 距离
   */
  static distanceBetweenSegments(segment1: GeoSegment, segment2: GeoSegment): number {
    if (this.segmentsIntersect(segment1, segment2)) {
      return 0;
    }
    
    const distances = [
      this.distancePointToSegment(segment1.getStartPoint(), segment2),
      this.distancePointToSegment(segment1.getEndPoint(), segment2),
      this.distancePointToSegment(segment2.getStartPoint(), segment1),
      this.distancePointToSegment(segment2.getEndPoint(), segment1)
    ];
    
    return Math.min(...distances);
  }

  /**
   * 检查两线段是否相交
   * @param segment1 线段1
   * @param segment2 线段2
   * @returns 是否相交
   */
  private static segmentsIntersect(segment1: GeoSegment, segment2: GeoSegment): boolean {
    const p1 = segment1.getStartPoint();
    const p2 = segment1.getEndPoint();
    const p3 = segment2.getStartPoint();
    const p4 = segment2.getEndPoint();
    
    const d1 = this.direction(p3, p4, p1);
    const d2 = this.direction(p3, p4, p2);
    const d3 = this.direction(p1, p2, p3);
    const d4 = this.direction(p1, p2, p4);
    
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }
    
    if (d1 === 0 && this.onSegment(p3, p4, p1)) return true;
    if (d2 === 0 && this.onSegment(p3, p4, p2)) return true;
    if (d3 === 0 && this.onSegment(p1, p2, p3)) return true;
    if (d4 === 0 && this.onSegment(p1, p2, p4)) return true;
    
    return false;
  }

  /**
   * 计算方向
   */
  private static direction(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint): number {
    return (p3.getX() - p1.getX()) * (p2.getY() - p1.getY()) -
           (p2.getX() - p1.getX()) * (p3.getY() - p1.getY());
  }

  /**
   * 检查点是否在线段上
   */
  private static onSegment(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint): boolean {
    return Math.min(p1.getX(), p2.getX()) <= p3.getX() &&
           p3.getX() <= Math.max(p1.getX(), p2.getX()) &&
           Math.min(p1.getY(), p2.getY()) <= p3.getY() &&
           p3.getY() <= Math.max(p1.getY(), p2.getY());
  }
}
