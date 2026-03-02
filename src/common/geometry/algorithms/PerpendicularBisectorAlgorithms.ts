import { GeoPoint, GeoLine } from '../../types/GeoElements';

/**
 * 中垂线算法
 * 提供中垂线计算方法
 */
export class PerpendicularBisectorAlgorithms {

  /**
   * 计算两点的中垂线
   * @param p1 点1
   * @param p2 点2
   * @param construction 构造管理器
   * @returns 中垂线
   */
  static perpendicularBisector(p1: GeoPoint, p2: GeoPoint, construction: any): GeoLine | null {
    const x1 = p1.getX();
    const y1 = p1.getY();
    const x2 = p2.getX();
    const y2 = p2.getY();
    
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    if (dx === 0 && dy === 0) {
      return null;
    }
    
    const line = new GeoLine(construction);
    line.setFromPoints(
      new GeoPoint(construction, midX, midY),
      new GeoPoint(construction, midX - dy, midY + dx)
    );
    
    return line;
  }
}
