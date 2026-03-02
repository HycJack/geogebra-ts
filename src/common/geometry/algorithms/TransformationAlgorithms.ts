import { GeoPoint, GeoLine } from '../../types/GeoElements';

/**
 * 几何变换算法
 * 提供平移、旋转、缩放、反射等几何变换方法
 */
export class TransformationAlgorithms {

  /**
   * 平移点
   * @param point 原点
   * @param dx x方向平移量
   * @param dy y方向平移量
   * @param construction 构造管理器
   * @returns 平移后的点
   */
  static translatePoint(point: GeoPoint, dx: number, dy: number, construction: any): GeoPoint {
    return new GeoPoint(construction, point.getX() + dx, point.getY() + dy);
  }

  /**
   * 旋转点
   * @param point 原点
   * @param center 旋转中心
   * @param angle 旋转角度（弧度）
   * @param construction 构造管理器
   * @returns 旋转后的点
   */
  static rotatePoint(point: GeoPoint, center: GeoPoint, angle: number, construction: any): GeoPoint {
    const dx = point.getX() - center.getX();
    const dy = point.getY() - center.getY();
    const newX = center.getX() + dx * Math.cos(angle) - dy * Math.sin(angle);
    const newY = center.getY() + dx * Math.sin(angle) + dy * Math.cos(angle);
    return new GeoPoint(construction, newX, newY);
  }

  /**
   * 缩放点
   * @param point 原点
   * @param center 缩放中心
   * @param factor 缩放因子
   * @param construction 构造管理器
   * @returns 缩放后的点
   */
  static scalePoint(point: GeoPoint, center: GeoPoint, factor: number, construction: any): GeoPoint {
    const dx = point.getX() - center.getX();
    const dy = point.getY() - center.getY();
    return new GeoPoint(construction, 
      center.getX() + dx * factor, 
      center.getY() + dy * factor
    );
  }

  /**
   * 反射点（关于直线）
   * @param point 原点
   * @param line 反射线
   * @param construction 构造管理器
   * @returns 反射后的点
   */
  static reflectPoint(point: GeoPoint, line: GeoLine, construction: any): GeoPoint {
    const projection = this.projectPointToLine(point, line, construction);
    const dx = projection.getX() - point.getX();
    const dy = projection.getY() - point.getY();
    return new GeoPoint(construction, 
      point.getX() + 2 * dx, 
      point.getY() + 2 * dy
    );
  }

  /**
   * 计算点在直线上的投影
   * @param point 点
   * @param line 直线
   * @param construction 构造管理器
   * @returns 投影点
   */
  private static projectPointToLine(point: GeoPoint, line: GeoLine, construction: any): GeoPoint {
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
}
