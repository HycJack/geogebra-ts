import { GeoPoint, GeoLine, GeoCircle } from '../../types/GeoElements';

/**
 * 切线算法
 * 提供圆外点切线、圆上点切线等计算方法
 */
export class TangentAlgorithms {

  /**
   * 计算过圆外一点的切线
   * @param point 点
   * @param circle 圆
   * @param construction 构造管理器
   * @returns 切线数组（0、1或2条）
   */
  static tangentsFromPointToCircle(point: GeoPoint, circle: GeoCircle, construction: any): GeoLine[] {
    const cx = circle.getCenter().getX();
    const cy = circle.getCenter().getY();
    const r = circle.getRadius();
    
    const px = point.getX();
    const py = point.getY();
    
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < r - 1e-10) {
      return [];
    }
    
    if (Math.abs(dist - r) < 1e-10) {
      const line = new GeoLine(construction);
      line.setCoords(dx, dy, -(dx * px + dy * py));
      return [line];
    }
    
    const a = Math.asin(r / dist);
    const angle = Math.atan2(dy, dx);
    
    const angle1 = angle + a;
    const angle2 = angle - a;
    
    const tangent1 = new GeoLine(construction);
    const tangent2 = new GeoLine(construction);
    
    const dx1 = Math.cos(angle1);
    const dy1 = Math.sin(angle1);
    const dx2 = Math.cos(angle2);
    const dy2 = Math.sin(angle2);
    
    tangent1.setCoords(-dy1, dx1, dy1 * px - dx1 * py);
    tangent2.setCoords(-dy2, dx2, dy2 * px - dx2 * py);
    
    return [tangent1, tangent2];
  }

  /**
   * 计算过圆上一点的切线
   * @param point 圆上的点
   * @param circle 圆
   * @param construction 构造管理器
   * @returns 切线
   */
  static tangentAtPointOnCircle(point: GeoPoint, circle: GeoCircle, construction: any): GeoLine {
    const cx = circle.getCenter().getX();
    const cy = circle.getCenter().getY();
    const px = point.getX();
    const py = point.getY();
    
    const dx = px - cx;
    const dy = py - cy;
    
    const line = new GeoLine(construction);
    line.setCoords(dx, dy, -(dx * px + dy * py));
    return line;
  }
}
