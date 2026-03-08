/**
 * 点创建管理器
 * 处理点的创建和吸附逻辑
 * 对应Java版本中的EuclidianController相关功能
 */
import { Construction } from './Construction';
import { GeoPoint } from './geos/GeoPoint';
import { Path } from './Path';
import { Hits } from './Hits';
import { SnapController } from './SnapController';

/**
 * 点创建管理器类
 */
export class PointCreationManager {
  private construction: Construction;

  /**
   * 构造函数
   * @param construction 构造管理器
   */
  constructor(construction: Construction) {
    this.construction = construction;
  }

  /**
   * 创建新点
   * @param x x坐标
   * @param y y坐标
   * @param hits 命中对象列表
   * @param onPathPossible 是否允许吸附到路径
   * @returns 创建的点或null
   */
  createNewPoint(x: number, y: number, hits: Hits, onPathPossible: boolean = true): GeoPoint | null {
    if (hits.containsGeoPoint()) {
      // 如果点击到了已有点，返回该点
      return hits.getFirstGeoPoint() || null;
    }

    let path: Path | null = null;
    let point: GeoPoint;

    if (onPathPossible) {
      // 处理点的吸附
      const snapResult = SnapController.processSnap(x, y, hits);
      x = snapResult.point.x;
      y = snapResult.point.y;
      path = snapResult.path;
    }

    // 创建新点
    point = new GeoPoint(this.construction, x, y);

    // 如果吸附到了路径，设置路径约束
    if (path) {
      point.setPath(path);
    }

    return point;
  }

  /**
   * 更新点的位置
   * @param point 点
   * @param x 目标x坐标
   * @param y 目标y坐标
   * @param hits 命中对象列表
   */
  updatePoint(point: GeoPoint, x: number, y: number, hits: Hits): void {
    if (point.hasPath()) {
      // 如果点已经被约束到路径，使用路径的pointChanged方法
      point.updateCoords(x, y);
    } else {
      // 否则尝试吸附到新的路径
      const snapResult = SnapController.processSnap(x, y, hits);
      point.setCoords(snapResult.point.x, snapResult.point.y);
      if (snapResult.path) {
        point.setPath(snapResult.path);
      }
    }
  }

  /**
   * 处理点的拖动
   * @param point 点
   * @param currentX 当前x坐标
   * @param currentY 当前y坐标
   * @param hits 命中对象列表
   */
  handlePointDrag(point: GeoPoint, currentX: number, currentY: number, hits: Hits): void {
    this.updatePoint(point, currentX, currentY, hits);
  }
}
