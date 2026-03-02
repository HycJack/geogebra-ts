import { GeoPoint, GeoCircle } from '../../types/GeoElements';
import { TriangleAlgorithms } from './TriangleAlgorithms';
import { DistanceAlgorithms } from './DistanceAlgorithms';

/**
 * 圆相关算法
 * 提供内切圆、外接圆等计算方法
 */
export class CircleAlgorithms {

  /**
   * 计算三角形的内切圆
   * @param p1 顶点1
   * @param p2 顶点2
   * @param p3 顶点3
   * @param construction 构造管理器
   * @returns 内切圆
   */
  static incircle(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoCircle | null {
    const incenter = TriangleAlgorithms.triangleIncenter(p1, p2, p3, construction);
    
    const a = DistanceAlgorithms.distance(p2, p3);
    const b = DistanceAlgorithms.distance(p1, p3);
    const c = DistanceAlgorithms.distance(p1, p2);
    const s = (a + b + c) / 2;
    
    const area = TriangleAlgorithms.triangleArea(p1, p2, p3);
    const radius = area / s;
    
    return new GeoCircle(construction, incenter, radius);
  }

  /**
   * 计算三角形的外接圆
   * @param p1 顶点1
   * @param p2 顶点2
   * @param p3 顶点3
   * @param construction 构造管理器
   * @returns 外接圆
   */
  static circumcircle(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoCircle | null {
    const circumcenter = TriangleAlgorithms.triangleCircumcenter(p1, p2, p3, construction);
    if (!circumcenter) return null;
    
    const radius = DistanceAlgorithms.distance(circumcenter, p1);
    return new GeoCircle(construction, circumcenter, radius);
  }

  /**
   * 过三点创建圆
   * @param p1 点1
   * @param p2 点2
   * @param p3 点3
   * @param construction 构造管理器
   * @returns 圆
   */
  static circleThroughThreePoints(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoCircle | null {
    return this.circumcircle(p1, p2, p3, construction);
  }
}
