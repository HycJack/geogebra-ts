import { GeoPoint } from '../../types/GeoElements';
import { DistanceAlgorithms } from './DistanceAlgorithms';

/**
 * 凸包算法
 * 提供 Graham 扫描法计算凸包
 */
export class ConvexHullAlgorithms {

  /**
   * Graham扫描法计算凸包
   * @param points 点集
   * @param _construction 构造管理器（未使用）
   * @returns 凸包顶点数组
   */
  static convexHull(points: GeoPoint[], _construction: any): GeoPoint[] {
    if (points.length < 3) {
      return [...points];
    }

    let start = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].getY() < points[start].getY() || 
          (points[i].getY() === points[start].getY() && points[i].getX() < points[start].getX())) {
        start = i;
      }
    }

    [points[0], points[start]] = [points[start], points[0]];
    const pivot = points[0];

    const sorted = points.slice(1).sort((a, b) => {
      const angleA = Math.atan2(a.getY() - pivot.getY(), a.getX() - pivot.getX());
      const angleB = Math.atan2(b.getY() - pivot.getY(), b.getX() - pivot.getX());
      if (angleA !== angleB) return angleA - angleB;
      return DistanceAlgorithms.distance(pivot, a) - DistanceAlgorithms.distance(pivot, b);
    });

    const hull: GeoPoint[] = [pivot];
    for (const point of sorted) {
      while (hull.length > 1) {
        const top = hull[hull.length - 1];
        const second = hull[hull.length - 2];
        const cross = (top.getX() - second.getX()) * (point.getY() - second.getY()) -
                     (top.getY() - second.getY()) * (point.getX() - second.getX());
        if (cross <= 0) {
          hull.pop();
        } else {
          break;
        }
      }
      hull.push(point);
    }

    return hull;
  }
}
