import { GeoPoint, GeoLine } from '../../types/GeoElements';

/**
 * 角平分线算法
 * 提供三点角平分线、两直线角平分线等计算方法
 */
export class AngleBisectorAlgorithms {

  /**
   * 计算三点形成的角的平分线
   * @param p1 第一条边上的点
   * @param vertex 顶点
   * @param p2 第二条边上的点
   * @param construction 构造管理器
   * @returns 角平分线
   */
  static angleBisectorThreePoints(p1: GeoPoint, vertex: GeoPoint, p2: GeoPoint, construction: any): GeoLine | null {
    const v1x = p1.getX() - vertex.getX();
    const v1y = p1.getY() - vertex.getY();
    const v2x = p2.getX() - vertex.getX();
    const v2y = p2.getY() - vertex.getY();
    
    const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
    
    if (len1 < 1e-10 || len2 < 1e-10) {
      return null;
    }
    
    const ux = v1x / len1 + v2x / len2;
    const uy = v1y / len1 + v2y / len2;
    
    const bisector = new GeoLine(construction);
    bisector.setFromPoints(
      vertex,
      new GeoPoint(construction, vertex.getX() + ux, vertex.getY() + uy)
    );
    
    return bisector;
  }

  /**
   * 计算两条直线的角平分线（返回两条）
   * @param line1 直线1
   * @param line2 直线2
   * @param construction 构造管理器
   * @returns 两条角平分线
   */
  static angleBisectorTwoLines(line1: GeoLine, line2: GeoLine, construction: any): GeoLine[] {
    const a1 = line1.getA();
    const b1 = line1.getB();
    const c1 = line1.getC();
    const a2 = line2.getA();
    const b2 = line2.getB();
    const c2 = line2.getC();
    
    const len1 = Math.sqrt(a1 * a1 + b1 * b1);
    const len2 = Math.sqrt(a2 * a2 + b2 * b2);
    
    const bisector1 = new GeoLine(construction);
    const bisector2 = new GeoLine(construction);
    
    bisector1.setCoords(
      a1 / len1 + a2 / len2,
      b1 / len1 + b2 / len2,
      c1 / len1 + c2 / len2
    );
    
    bisector2.setCoords(
      a1 / len1 - a2 / len2,
      b1 / len1 - b2 / len2,
      c1 / len1 - c2 / len2
    );
    
    return [bisector1, bisector2];
  }
}
