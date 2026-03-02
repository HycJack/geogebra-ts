import { GeoPoint, GeoLine } from '../../types/GeoElements';

/**
 * 垂线和平行线算法
 * 提供垂足、平行线、垂线等计算方法
 */
export class LineAlgorithms {

  /**
   * 计算点到直线的垂足
   * @param point 点
   * @param line 直线
   * @param construction 构造管理器
   * @returns 垂足点
   */
  static footOfPerpendicular(point: GeoPoint, line: GeoLine, construction: any): GeoPoint {
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
   * 过一点作直线的平行线
   * @param point 点
   * @param line 直线
   * @param construction 构造管理器
   * @returns 平行线
   */
  static parallelLine(point: GeoPoint, line: GeoLine, construction: any): GeoLine {
    const a = line.getA();
    const b = line.getB();
    const c = -(a * point.getX() + b * point.getY());
    
    const newLine = new GeoLine(construction);
    newLine.setCoords(a, b, c);
    return newLine;
  }

  /**
   * 过一点作直线的垂线
   * @param point 点
   * @param line 直线
   * @param construction 构造管理器
   * @returns 垂线
   */
  static perpendicularLineToLine(point: GeoPoint, line: GeoLine, construction: any): GeoLine {
    const a = line.getA();
    const b = line.getB();
    const c = -(b * point.getX() - a * point.getY());
    
    const newLine = new GeoLine(construction);
    newLine.setCoords(-b, a, c);
    return newLine;
  }
}
