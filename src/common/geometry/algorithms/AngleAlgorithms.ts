import { GeoPoint } from '../../types/GeoElements';

/**
 * 角度计算算法
 * 提供各种角度计算方法
 */
export class AngleAlgorithms {

  /**
   * 计算两点之间的角度（相对于 x 轴）
   * @param p1 起点
   * @param p2 终点
   * @returns 角度（弧度）
   */
  static angleBetweenPoints(p1: GeoPoint, p2: GeoPoint): number {
    const dx = p2.getX() - p1.getX();
    const dy = p2.getY() - p1.getY();
    return Math.atan2(dy, dx);
  }

  /**
   * 计算三点形成的角度（以 middle 为顶点）
   * @param p1 第一个点
   * @param middle 顶点
   * @param p2 第二个点
   * @returns 角度（弧度）
   */
  static angleBetweenThreePoints(p1: GeoPoint, middle: GeoPoint, p2: GeoPoint): number {
    const angle1 = this.angleBetweenPoints(middle, p1);
    const angle2 = this.angleBetweenPoints(middle, p2);
    let angle = Math.abs(angle2 - angle1);
    if (angle > Math.PI) {
      angle = 2 * Math.PI - angle;
    }
    return angle;
  }

  /**
   * 将弧度转换为角度
   * @param radians 弧度
   * @returns 角度
   */
  static toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  /**
   * 将角度转换为弧度
   * @param degrees 角度
   * @returns 弧度
   */
  static toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }
}
