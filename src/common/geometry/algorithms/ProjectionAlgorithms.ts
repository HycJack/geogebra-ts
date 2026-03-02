import { GeoPoint, GeoLine, GeoSegment } from '../../types/GeoElements';

/**
 * 投影算法
 * 提供点到直线、点到线段的投影计算方法
 */
export class ProjectionAlgorithms {

  /**
   * 计算点在直线上的投影
   * @param point 点
   * @param line 直线
   * @param construction 构造管理器
   * @returns 投影点
   */
  static projectPointToLine(point: GeoPoint, line: GeoLine, construction: any): GeoPoint {
    const a = line.getA();
    const b = line.getB();
    const c = line.getC();
    
    const x0 = point.getX();
    const y0 = point.getY();
    
    const denominator = a * a + b * b;
    const x = (b * (b * x0 - a * y0) - a * c) / denominator;
    const y = (a * (-b * x0 + a * y0) - b * c) / denominator;
    
    return new GeoPoint(construction, x, y);
  }

  /**
   * 计算点在线段上的投影
   * @param point 点
   * @param segment 线段
   * @param construction 构造管理器
   * @returns 投影点（可能在线段外）
   */
  static projectPointToSegment(point: GeoPoint, segment: GeoSegment, construction: any): GeoPoint {
    const start = segment.getStartPoint();
    const end = segment.getEndPoint();
    
    const dx = end.getX() - start.getX();
    const dy = end.getY() - start.getY();
    
    if (dx === 0 && dy === 0) {
      return new GeoPoint(construction, start.getX(), start.getY());
    }
    
    const t = ((point.getX() - start.getX()) * dx + (point.getY() - start.getY()) * dy) / (dx * dx + dy * dy);
    const clampedT = Math.max(0, Math.min(1, t));
    
    const x = start.getX() + clampedT * dx;
    const y = start.getY() + clampedT * dy;
    
    return new GeoPoint(construction, x, y);
  }

  /**
   * 创建过一点垂直于另两点连线的直线
   * @param point 点
   * @param lineStart 直线起点
   * @param lineEnd 直线终点
   * @param construction 构造管理器
   * @returns 垂线
   */
  static perpendicularLine(point: GeoPoint, lineStart: GeoPoint, lineEnd: GeoPoint, construction: any): GeoLine | null {
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
