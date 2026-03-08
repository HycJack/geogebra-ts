import { Construction } from '../Construction';
import { GeoElementBase } from './GeoElements';
import { Path, Pathable, PathParameter } from '../Path';

/**
 * 点类
 * 实现了 Pathable 接口，可以被约束到路径上
 */
export class GeoPoint extends GeoElementBase implements Pathable {
  private x: number;
  private y: number;
  private z: number;
  private path: Path | null = null;
  private pathParam: PathParameter = new PathParameter(0);

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param x x 坐标
   * @param y y 坐标
   * @param z z 坐标（齐次坐标）
   */
  constructor(construction: Construction, x: number = 0, y: number = 0, z: number = 1) {
    super(construction);
    this.x = x;
    this.y = y;
    this.z = z;
    
    // 自动分配标签
    const label = construction.generateLabel('point');
    this.setLabel(label);
    construction.addGeoElement(this);
  }

  /**
   * 设置坐标
   * @param x x 坐标
   * @param y y 坐标
   * @param z z 坐标（齐次坐标）
   */
  setCoords(x: number, y: number, z: number = 1): void {
    this.x = x;
    this.y = y;
    this.z = z;
    // 坐标改变时通知依赖者
    this.notifyUpdate();
  }

  /**
   * 获取 x 坐标
   * @returns x 坐标
   */
  getX(): number {
    return this.x / this.z;
  }

  /**
   * 获取 y 坐标
   * @returns y 坐标
   */
  getY(): number {
    return this.y / this.z;
  }

  /**
   * 获取齐次 x 坐标
   * @returns 齐次 x 坐标
   */
  getInhomX(): number {
    return this.x;
  }

  /**
   * 获取齐次 y 坐标
   * @returns 齐次 y 坐标
   */
  getInhomY(): number {
    return this.y;
  }

  /**
   * 获取齐次 z 坐标
   * @returns 齐次 z 坐标
   */
  getInhomZ(): number {
    return this.z;
  }

  /**
   * 检查点是否与另一个点相同
   * @param other 另一个点
   * @returns 是否相同
   */
  equals(other: GeoPoint): boolean {
    return Math.abs(this.x - other.x) < 1e-10 && 
           Math.abs(this.y - other.y) < 1e-10 && 
           Math.abs(this.z - other.z) < 1e-10;
  }

  // ========== Pathable 接口实现 ==========

  /**
   * 获取路径
   * @returns 当前约束的路径或null
   */
  getPath(): Path | null {
    return this.path;
  }

  /**
   * 设置路径
   * @param path 要约束到的路径
   */
  setPath(path: Path | null): void {
    this.path = path;
    if (path) {
      // 将当前点投影到路径上
      const param = path.getPathParameterForPoint(this.getX(), this.getY());
      const pos = path.getPointFromPathParameter(param);
      this.setCoords(pos.x, pos.y);
    }
  }

  /**
   * 获取路径参数
   * @returns 路径参数
   */
  getPathParameter(): PathParameter {
    if (this.path) {
      this.pathParam = this.path.getPathParameterForPoint(this.getX(), this.getY());
    }
    return this.pathParam;
  }

  /**
   * 设置路径参数
   * @param param 路径参数
   */
  setPathParameter(param: PathParameter): void {
    this.pathParam = param;
    if (this.path) {
      const pos = this.path.getPointFromPathParameter(param);
      this.setCoords(pos.x, pos.y);
    }
  }

  /**
   * 是否被约束到路径
   * @returns 是否有路径约束
   */
  hasPath(): boolean {
    return this.path !== null;
  }

  /**
   * 移除路径约束
   */
  removePath(): void {
    this.path = null;
    this.pathParam = new PathParameter(0);
  }

  /**
   * 当点被拖动时更新坐标
   * 如果有路径约束，会限制在路径上
   * @param x 目标x坐标
   * @param y 目标y坐标
   */
  updateCoords(x: number, y: number): void {
    if (this.path) {
      // 先设置临时坐标
      const tempPoint = {
        getX: () => x,
        getY: () => y,
        setCoords: (newX: number, newY: number) => {
          this.setCoords(newX, newY);
        }
      };
      // 让路径限制它
      this.path.pointChanged(tempPoint);
    } else {
      this.setCoords(x, y);
    }
  }
}