import { GeoPoint, GeoCircle } from '../../types/GeoElements';

/**
 * 共线性和共圆性检测算法
 */
export class CollinearityAlgorithms {

  /**
   * 检查三点是否共线
   * @param p1 点1
   * @param p2 点2
   * @param p3 点3
   * @returns 是否共线
   */
  static areCollinear(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint): boolean {
    const area = Math.abs(
      (p2.getX() - p1.getX()) * (p3.getY() - p1.getY()) -
      (p3.getX() - p1.getX()) * (p2.getY() - p1.getY())
    );
    return area < 1e-10;
  }

  /**
   * 检查四点是否共圆
   * @param p1 点1
   * @param p2 点2
   * @param p3 点3
   * @param p4 点4
   * @returns 是否共圆
   */
  static areConcyclic(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, p4: GeoPoint): boolean {
    const circle = new GeoCircle(null as any, p1, 0);
    circle.setFromThreePoints(p1, p2, p3, null as any);
    
    const center = circle.getCenter();
    const radius = circle.getRadius();
    
    const dx = p4.getX() - center.getX();
    const dy = p4.getY() - center.getY();
    const distToCenter = Math.sqrt(dx * dx + dy * dy);
    return Math.abs(distToCenter - radius) < 1e-10;
  }
}
